import { GoogleGenerativeAI, type Part } from "@google/generative-ai";

import {
  analyzeInvoiceText,
  buildUploadedFallbackAnalysis,
} from "@/lib/invoice-analysis";

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

function isGeminiSupported(file: File) {
  return file.type.startsWith("image/") || file.type === "application/pdf";
}

async function extractWithGemini(file: File) {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

  if (!apiKey || !isGeminiSupported(file)) {
    return null;
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: process.env.GEMINI_MODEL || "gemini-2.5-flash",
    generationConfig: {
      temperature: 0.1,
    },
  });
  const data = Buffer.from(await file.arrayBuffer()).toString("base64");
  const parts: Part[] = [
    {
      text: `Extract invoice text from this document.
Return plain text only. Include these fields when visible: invoice id, vendor, amount, currency, due date, category, line items, and notes.`,
    },
    {
      inlineData: {
        data,
        mimeType: file.type,
      },
    },
  ];
  const result = await model.generateContent(parts);
  const text = result.response.text().trim();

  return text.length > 0 ? text : null;
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
  let extractionSource: "text" | "gemini" | "metadata-fallback" = "metadata-fallback";

  if (isTextLike(upload)) {
    extractedText = await upload.text();
    extractionSource = "text";
  } else {
    try {
      const geminiText = await extractWithGemini(upload);

      if (geminiText) {
        extractedText = geminiText;
        extractionSource = "gemini";
      }
    } catch {
      extractedText = "";
    }
  }

  const analysis = extractedText
    ? analyzeInvoiceText(extractedText)
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
