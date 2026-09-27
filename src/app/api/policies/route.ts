import { getActivePolicies, updatePolicy } from "@/lib/persistence";

export const maxDuration = 30;

export async function GET() {
  try {
    return Response.json({ source: "supabase", policies: await getActivePolicies() }, { headers: { "cache-control": "no-store" } });
  } catch (error) {
    return Response.json({ source: "unavailable", error: error instanceof Error ? error.message : "Policies unavailable." }, { status: 503 });
  }
}

export async function PATCH(request: Request) {
  const payload = (await request.json()) as {
    id?: string;
    patch?: Record<string, unknown>;
    expectedVersion?: number;
  };

  if (!payload.id || !payload.patch || !Number.isInteger(payload.expectedVersion) || (payload.expectedVersion ?? 0) < 1) {
    return Response.json(
      { error: "id, patch, and expectedVersion are required." },
      { status: 400 },
    );
  }

  const allowed = new Set([
    "name",
    "category",
    "maxAmount",
    "approvalRequiredAbove",
    "allowedVendors",
    "blockedVendors",
    "enabled",
  ]);
  const clean: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(payload.patch)) {
    if (allowed.has(key)) clean[key] = value;
  }

  if (
    clean.maxAmount !== undefined &&
    typeof clean.maxAmount !== "number"
  ) {
    return Response.json({ error: "maxAmount must be numeric." }, { status: 400 });
  }
  if (
    clean.approvalRequiredAbove !== undefined &&
    typeof clean.approvalRequiredAbove !== "number"
  ) {
    return Response.json(
      { error: "approvalRequiredAbove must be numeric." },
      { status: 400 },
    );
  }
  if (clean.enabled !== undefined && typeof clean.enabled !== "boolean") {
    return Response.json({ error: "enabled must be boolean." }, { status: 400 });
  }

  if (clean.maxAmount !== undefined && (!Number.isFinite(clean.maxAmount) || (clean.maxAmount as number) < 0 || (clean.maxAmount as number) > 50000)) return Response.json({error:"maxAmount must be between 0 and 50,000."},{status:400});
  if (clean.approvalRequiredAbove !== undefined && (!Number.isFinite(clean.approvalRequiredAbove) || (clean.approvalRequiredAbove as number) < 0 || (clean.approvalRequiredAbove as number) > 50000)) return Response.json({error:"Approval threshold must be between 0 and 50,000."},{status:400});
  for (const key of ["allowedVendors","blockedVendors"]){const value=clean[key];if(value!==undefined&&(!Array.isArray(value)||value.length>40||value.some(v=>typeof v!=="string"||v.length<1||v.length>100)))return Response.json({error:`${key} must be a short vendor list.`},{status:400});}
  for (const key of ["name", "category"]) {
    const value = clean[key];
    if (value !== undefined && (typeof value !== "string" || value.trim().length < 2 || value.length > 100)) {
      return Response.json({ error: `${key} must be 2 to 100 characters.` }, { status: 400 });
    }
  }
  const result = await updatePolicy(payload.id, clean, payload.expectedVersion!);

  if ("error" in result && result.error) {
    return Response.json({ error: result.error, source: result.source }, { status: result.source === "unavailable" ? 503 : 409 });
  }

  return Response.json(result);
}
