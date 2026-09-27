import { createServerSupabaseClient } from "@/lib/supabase-server";
import { beginAgentRun, failAgentRun, getActivePolicies, getTransactionsForPolicyEvaluation, saveAgentRun } from "@/lib/persistence";
import { evaluatePayment } from "@/lib/policy-engine";
import { assessPaymentRisk } from "@/lib/jev-risk";
import { jevEnabled } from "@/lib/jev-client";
import { withinDemoLimit } from "@/lib/demo-rate-limit";
import { buildFallbackMemo, type FinanceMemo } from "@/lib/finance-memo";
import { askCommandCode, extractJsonObject } from "@/lib/cmd-llm";
import type { DemoScenario, Decision } from "@/lib/sample-data";
export const maxDuration=90;
const scenarios:DemoScenario[]=[
 {id:"clean",name:"Clean purchase",description:"Small allowlisted purchase",invoiceId:"DEMO-CLEAN-001",vendorName:"Clearbit Sample",amount:300,category:"lead-enrichment",expectedDecision:"approved"},
 {id:"rules",name:"Rules escalation",description:"Cloud spend above approval threshold",invoiceId:"DEMO-CLOUD-001",vendorName:"Metro Cloud Brokers",amount:12600,category:"cloud-credits",expectedDecision:"escalated"},
 {id:"jev",name:"Jev fraud review",description:"Changed wire details on an allowlisted purchase",invoiceId:"DEMO-JEV-001",vendorName:"Veritas Risk Graph",amount:180,category:"vendor-risk-data",expectedDecision:"escalated",context:"New wire instructions from a lookalike email domain. Urgent request to bypass verification. Bank account differs from prior record."},
 {id:"duplicate",name:"Duplicate purchase",description:"Repeat the clean purchase",invoiceId:"DEMO-CLEAN-001",vendorName:"Clearbit Sample",amount:300,category:"lead-enrichment",expectedDecision:"blocked"},
 {id:"blocked-vendor",name:"Blocked vendor",description:"Vendor is on the policy blocklist",invoiceId:"DEMO-BLOCK-001",vendorName:"Apex Enrichment API",amount:0.18,category:"lead-enrichment",expectedDecision:"blocked"},
];
export async function GET(){const supabase=createServerSupabaseClient();if(!supabase)return Response.json({source:"unavailable",runs:[],error:"Demo database is not configured."},{status:503});const {data,error}=await supabase.from("demo_v2_agent_runs").select("id,scenario_id,invoice_id,status,decision,payload,created_at,completed_at").order("created_at",{ascending:false}).limit(30);if(error)return Response.json({error:error.message},{status:503});return Response.json({source:"supabase",runs:data});}
type Progress = {name:string;state:string};
async function runRequest(request:Request,emit?:(step:Progress)=>void){if(!withinDemoLimit(request,"run",12))return Response.json({error:"Demo rate limit reached. Try again in a minute."},{status:429});let body:{scenarioId?:string;custom?:Partial<DemoScenario>};try{body=await request.json()}catch{return Response.json({error:"Invalid JSON."},{status:400})}
 let scenario=scenarios.find(item=>item.id===body.scenarioId);
 if(!scenario&&body.scenarioId)return Response.json({error:"Unknown scenario."},{status:400});
 if(!scenario&&body.custom){const c=body.custom;if(typeof c.vendorName!=="string"||c.vendorName.length<2||c.vendorName.length>100||typeof c.category!=="string"||c.category.length<2||c.category.length>60||typeof c.amount!=="number"||!Number.isFinite(c.amount)||c.amount<=0||c.amount>50000||typeof c.invoiceId!=="string"||c.invoiceId.length<2||c.invoiceId.length>80)return Response.json({error:"Check invoice ID, vendor, category, and an amount from 0.01 to 50,000."},{status:400});scenario={id:"custom",name:"Edited invoice",description:"Visitor edited invoice fields",invoiceId:c.invoiceId,vendorName:c.vendorName,amount:c.amount,category:c.category,expectedDecision:"pending",context:typeof c.context==="string"?c.context.slice(0,2000):undefined};}
 if(!scenario)return Response.json({error:"Choose a scenario or provide edited invoice fields."},{status:400});
 const runId=crypto.randomUUID(),start=Date.now();try{await beginAgentRun(runId,scenario.id,scenario.invoiceId);
 const [history,policies]=await Promise.all([getTransactionsForPolicyEvaluation(),getActivePolicies()]);
 const evaluation=evaluatePayment({vendorName:scenario.vendorName,amount:scenario.amount,category:scenario.category,invoiceId:scenario.invoiceId,existingTransactions:history,policySet:policies});
 emit?.({name:"Policy floor",state:"completed"});
 const policyDecision=evaluation.decision;let jev:Awaited<ReturnType<typeof assessPaymentRisk>>=null;let aiState="skipped by policy";
 if(policyDecision==="approved"){const jevConfigured=jevEnabled();jev=await assessPaymentRisk({vendorName:scenario.vendorName,amount:scenario.amount,category:scenario.category,invoiceId:scenario.invoiceId,policyReason:evaluation.reason,context:scenario.context});aiState=jev?"completed":jevConfigured?"failed":"unavailable";if(jev?.escalate){evaluation.decision="escalated";evaluation.reason=`Jev risk review requested a human decision (suspicious ${jev.suspicious.toFixed(2)}, review ${jev.humanReview.toFixed(2)}).`;evaluation.checks.push({label:"Jev risk review",passed:false});}}
 emit?.({name:"Jev review",state:aiState});
 const fallback=buildFallbackMemo({vendorName:scenario.vendorName,amount:scenario.amount,category:scenario.category,invoiceId:scenario.invoiceId,decision:evaluation.decision,reason:evaluation.reason,checks:evaluation.checks});
 let memo:FinanceMemo=fallback;let memoState="unavailable";const memoStart=Date.now();const answer=await askCommandCode(`Explain this simulated finance decision in JSON with headline, summary, riskLevel, nextAction and evidence. All amounts are EUR. Use policy approved, human review, blocked, and simulated payment precisely; no dollars, USD, real settlement, or claims of provider checks not in the evidence: ${JSON.stringify({scenario,evaluation})}`,"agent-reasoning",{timeoutMs:12000,maxModels:1});if(answer){const parsed=extractJsonObject(answer.text) as Partial<FinanceMemo>|null;const consistent=parsed&&typeof parsed.headline==="string"&&typeof parsed.summary==="string"&&Array.isArray(parsed.evidence)&&!/(?:\$|\bUSD\b|\bdollars?\b)/i.test(`${parsed.headline} ${parsed.summary}`);if(consistent&&parsed){memo={...fallback,source:`command-code:${answer.model}`,headline:parsed.headline!.slice(0,180),summary:parsed.summary!.slice(0,900),evidence:parsed.evidence!.filter((v):v is string=>typeof v==="string").slice(0,8),latencyMs:Date.now()-memoStart};memoState="completed";}else memoState="failed";}else if(process.env.CMD_API_KEY&&process.env.CMD_LLM_MODE!=="off")memoState="failed";
 emit?.({name:"Finance memo",state:memoState});
 const completedAt=new Date().toISOString();const payment={status:evaluation.decision as Decision,paymentIssued:evaluation.decision==="approved",x402Reference:evaluation.decision==="approved"?`simulated-x402-${crypto.randomUUID().slice(0,8)}`:undefined,evaluation};
 emit?.({name:"Simulated payment",state:payment.paymentIssued?"completed":"skipped by policy"});
 const result={scenario,payment,memo,report:null,completedAt,policyDecision,jev,aiState,memoState,latencyMs:Date.now()-start,simulatedPayment:true,steps:[{name:"Policy floor",state:"completed"},{name:"Jev review",state:aiState},{name:"Finance memo",state:memoState},{name:"Simulated payment",state:payment.paymentIssued?"completed":"skipped by policy"},{name:"Shared audit",state:"completed"}]};
 const saved=await saveAgentRun(result,runId);if("error" in saved&&saved.error)throw new Error(saved.error);emit?.({name:"Shared audit",state:"completed"});return Response.json({source:"supabase",runId,result});
 }catch(error){await failAgentRun(runId);return Response.json({source:"unavailable",error:error instanceof Error?error.message:"Run failed."},{status:503});}}

export async function POST(request:Request){
 if(request.headers.get("accept")!=="text/event-stream")return runRequest(request);
 const encoder=new TextEncoder();
 const stream=new ReadableStream<Uint8Array>({async start(controller){
  const send=(event:Record<string,unknown>)=>controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
  try {const response=await runRequest(request,step=>send({type:"step",step}));send({type:"result",status:response.status,body:await response.json()});}
  catch(error){send({type:"result",status:503,body:{source:"unavailable",error:error instanceof Error?error.message:"Run failed."}});}
  finally{controller.close();}
 }});
 return new Response(stream,{headers:{"content-type":"text/event-stream; charset=utf-8","cache-control":"no-cache, no-transform","x-accel-buffering":"no"}});
}
