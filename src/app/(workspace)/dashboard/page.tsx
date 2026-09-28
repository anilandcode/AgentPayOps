"use client";
import { ArrowRight, ClipboardCheck, FileText, ShieldCheck, TrendingUp } from "lucide-react";
import Link from "next/link";
import { StartDemoButton, useDemoData } from "@/components/workspace-shell";
import type { Decision } from "@/lib/sample-data";
const money = new Intl.NumberFormat("en-US",{style:"currency",currency:"EUR",maximumFractionDigits:0});
const tones: Record<Decision,string>={approved:"approved",blocked:"blocked",escalated:"escalated",pending:"pending",released:"released"};
export default function Overview() {
 const {snapshot,loading,error}=useDemoData();
 const tx=snapshot?.transactions ?? [];
 const overview=snapshot?.overview;
 const pending=overview?.pendingReview??0;
 const metrics=[{label:"Spend reviewed",value:money.format(overview?.spendReviewed??0),note:"Across recorded payment attempts"},{label:"Blocked spend",value:money.format(overview?.blockedSpend??0),note:"Stopped by policy or reviewer"},{label:"Awaiting review",value:String(pending),note:"Needs a human decision"},{label:"Human decisions",value:String(overview?.humanDecisions??0),note:"Approvals and rejections"}];
 const activity=overview?.activity??[];
 const max=Math.max(1,...activity.map(day=>day.count));
 const points=activity.map((day,index)=>`${24+index*92},${150-day.count/max*110}`).join(" ");
 return <>
  <div className="page-heading"><div><div className="eyebrow">FINANCE CONTROL ROOM</div><h1>Every agent payment, under control.</h1><p>Watch an invoice move through policy, optional fraud review, human approval, and a shared audit record.</p></div><StartDemoButton /></div>
  {snapshot?.source==="sample"&&!error&&<div className="data-banner">Sample data is shown. Shared changes need the demo database to be connected.</div>}
  <div className="metric-grid">{metrics.map((m)=><article className="metric-card" key={m.label}><span className="metric-label">{m.label}</span><strong>{loading?"—":m.value}</strong><small>{m.note}</small></article>)}</div>
  <div className="section-grid"><section className="glass-panel"><div className="panel-row"><div><div className="eyebrow">RECORDED ACTIVITY</div><h2 className="panel-title">Payment attempts · last seven days</h2></div><TrendingUp size={20}/></div>{activity.some(day=>day.count>0)?<div className="activity-chart"><svg viewBox="0 0 600 180" preserveAspectRatio="none" role="img" aria-label={`Payment attempts over the last seven days: ${activity.map(day=>`${day.date}: ${day.count}`).join(", ")}`}><path d="M24 40 H576 M24 95 H576 M24 150 H576" className="activity-guide"/><polyline points={points} className="activity-line"/>{activity.map((day,index)=><circle key={day.date} cx={24+index*92} cy={150-day.count/max*110} r="4" className="activity-point"/>)}</svg><div className="activity-labels"><span>{activity[0]?.date}</span><span>{activity[activity.length-1]?.date}</span></div></div>:<p className="panel-copy">No payment attempts recorded in the last seven days. Start a run to create the first point.</p>}<p className="muted-note">Counts come from server-recorded demo transactions and refresh while the page is visible.</p></section>
   <section className="glass-panel"><div className="eyebrow">NEXT ACTION</div><h2 className="panel-title">Human review</h2><p className="panel-copy">{pending?`${pending} payment${pending===1?" is":"s are"} waiting for a finance decision.`:"The queue is clear. Run an escalation to see a human review."}</p><Link href="/approvals" className="button-secondary">Open review queue <ArrowRight size={17}/></Link><div className="queue-preview"><ClipboardCheck size={26}/><span>{pending} awaiting review</span></div></section></div>
  <div className="action-grid"><Link href="/invoices" className="action-card"><div className="paper-stack" aria-hidden="true"/><FileText size={23}/><h2>Review an invoice</h2><p>Try a sample or upload a document. See extracted fields, findings, and the policy outcome.</p><span className="action-arrow"><ArrowRight size={18}/></span></Link><Link href="/runs" className="action-card"><div className="paper-stack" aria-hidden="true"/><ShieldCheck size={23}/><h2>Run the agent</h2><p>Follow the live policy and eligible AI checks through simulated payment and shared audit.</p><span className="action-arrow"><ArrowRight size={18}/></span></Link></div>
  <section className="solid-panel recent-panel"><div className="panel-row"><div><div className="eyebrow">LATEST ACTIVITY</div><h2 className="panel-title">Recent decisions</h2></div><Link href="/audit" className="text-link">Full audit trail <ArrowRight size={16}/></Link></div>{loading?<p className="panel-copy">Loading recorded decisions…</p>:tx.length?<div className="recent-list">{tx.slice(0,4).map(item=><Link href={`/audit?transaction=${encodeURIComponent(item.id)}`} className="recent-row" key={item.id}><span><strong>{item.vendorName}</strong><small>{item.id} · {item.invoiceId}</small></span><span className={`status-pill ${tones[item.status]}`}>{item.status}</span><strong>{money.format(item.amount)}</strong></Link>)}</div>:<p className="panel-copy">No decisions have been recorded yet.</p>}</section>
 </>;
}
