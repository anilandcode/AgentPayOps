import { getActivePolicies, updatePolicy } from "@/lib/persistence";

export const maxDuration = 30;

export async function GET() {
  return Response.json({ policies: await getActivePolicies() });
}

export async function PATCH(request: Request) {
  const payload = (await request.json()) as {
    id?: string;
    patch?: Record<string, unknown>;
  };

  if (!payload.id || !payload.patch) {
    return Response.json(
      { error: "id and patch are required." },
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

  const result = await updatePolicy(payload.id, clean);

  if ("error" in result && result.error) {
    return Response.json({ error: result.error }, { status: 400 });
  }

  return Response.json(result);
}
