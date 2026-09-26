import {
  analyzeInvoiceText,
  buildUploadedFallbackAnalysis,
} from "@/lib/invoice-analysis";
import { askCommandCodeVision } from "@/lib/cmd-llm";

export const maxDuration = 90;

const MAX_UPLOAD_BYTES = 6 * 1024 * 1024;
const TEXT_MIME_TYPES = new Set([
  "text/plain",
  "text/csv",
  "application/json",
  "application/xml",
  "text/xml",
]);

function isTextLike(file: File) {
  return TEXT_MIME_TYPES.has(file.type) || /\.(txt|csv|json|xml)$/i.test(file.name);
}

function isImage(file: File) {
  return file.type.startsWith("image/");
}

async function extractWithCommandCode(file: File) {
  if (!isImage(file)) {
    // PDF extraction needs the Provider API route with file support; the demo
    // stays honest and routes PDFs to the metadata fallback for now.
    return null;
  }

  const data = Buffer.from(await file.arrayBuffer()).toString("base64");
  const dataUrl = `data:${file.type};base64,${data}`;
  const answer = await askCommandCodeVision(
    `Extract invoice text from this document.
Return plain text only. Include these fields when visible: invoice id, vendor, amount, currency, due date, category, line items, and notes.`,
    dataUrl,
    "invoice-upload",
  );

  return answer ? answer.text.trim() || null : null;
}

export async function POST(request: Request) {
  const formData = await request.formData();
  const upload = formData.get("invoice");

  if (!(upload instanceof File)) {
    return Response.json({ error: "invoice file is required." }, { status: 400 });
  }

  if (upload.size > MAX_UPLOAD_BYTES) {
    return Response.json(
      { error: "invoice file must be 6 MB or smaller." },
      { status: 413 },
    );
  }

  let extractedText = "";
  let extractionSource: "text" | "command-code" | "metadata-fallback" = "metadata-fallback";

  if (isTextLike(upload)) {
    extractedText = await upload.text();
    extractionSource = "text";
  } else {
    try {
      const cmdText = await extractWithCommandCode(upload);

      if (cmdText) {
        extractedText = cmdText;
        extractionSource = "command-code";
      }
    } catch {
      extractedText = "";
    }
  }

  const analysis = extractedText
    ? analyzeInvoiceText(extractedText, undefined, upload.name)
    : buildUploadedFallbackAnalysis(upload.name, upload.type);

  return Response.json({
    analysis,
    extractedFrom:
      extractedText ||
      `Uploaded ${upload.name} (${upload.type || "unknown type"}, ${upload.size} bytes).`,
    extractionSource,
    fileName: upload.name,
    fileType: upload.type,
    fileSize: upload.size,
  });
}
