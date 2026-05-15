import { getOperationsSnapshot } from "@/lib/persistence";

export async function GET() {
  return Response.json(await getOperationsSnapshot());
}
