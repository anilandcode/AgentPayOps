import { getOperationsSnapshot } from "@/lib/persistence";
import { buildOverviewAggregates } from "@/lib/overview-aggregates";
export async function GET(){try{const snapshot=await getOperationsSnapshot();return Response.json({...snapshot,overview:buildOverviewAggregates(snapshot.transactions)},{headers:{"cache-control":"no-store"}})}catch(error){return Response.json({source:"unavailable",error:error instanceof Error?error.message:"Demo ledger unavailable."},{status:503})}}
