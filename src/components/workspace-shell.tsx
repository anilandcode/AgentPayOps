"use client";

import { Activity, BookOpen, ChevronRight, ClipboardCheck, FileText, LayoutDashboard, Menu, Play, ScrollText, Shield, SlidersHorizontal } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { AuditEvent, Transaction } from "@/lib/sample-data";

type Snapshot = { source: "supabase" | "sample"; transactions: Transaction[]; auditEvents: AuditEvent[]; overview: {spendReviewed:number;blockedSpend:number;pendingReview:number;humanDecisions:number;decisionCounts:Record<string,number>;activity:{date:string;count:number}[]}; error?: string };
type DemoContextValue = { snapshot: Snapshot | null; loading: boolean; error: string | null; refresh: () => Promise<void>; invoiceDraft: string; setInvoiceDraft: (value: string) => void };
const DemoContext = createContext<DemoContextValue | null>(null);
export function useDemoData() { const value = useContext(DemoContext); if (!value) throw new Error("DemoData provider missing"); return value; }

const nav = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/invoices", label: "Invoice Intake", icon: FileText },
  { href: "/runs", label: "Agent Runs", icon: Play },
  { href: "/approvals", label: "Human Review", icon: ClipboardCheck },
  { href: "/policies", label: "Payment Controls", icon: SlidersHorizontal },
  { href: "/audit", label: "Audit & Transactions", icon: ScrollText },
  { href: "/architecture", label: "How It Works", icon: BookOpen },
];

export function WorkspaceShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const sidebarRef = useRef<HTMLElement>(null);
  const { error, refresh } = useDemoData();

  useEffect(() => {
    if (!menuOpen) return;
    const menuButton = menuButtonRef.current;
    sidebarRef.current?.querySelector<HTMLElement>("a")?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") { event.preventDefault(); setMenuOpen(false); return; }
      if (event.key !== "Tab") return;
      const links = [...(sidebarRef.current?.querySelectorAll<HTMLElement>("a") ?? [])];
      if (!links.length) return;
      if (event.shiftKey && document.activeElement === links[0]) { event.preventDefault(); links[links.length - 1].focus(); }
      else if (!event.shiftKey && document.activeElement === links[links.length - 1]) { event.preventDefault(); links[0].focus(); }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => { document.removeEventListener("keydown", onKeyDown); menuButton?.focus(); };
  }, [menuOpen]);
  const title = nav.find((item) => item.href === pathname)?.label || "AgentPayOps";
  return <div className="workspace">
      {menuOpen && <button className="mobile-scrim" aria-label="Close navigation" onClick={() => setMenuOpen(false)} />}
      <aside ref={sidebarRef} className={`workspace-sidebar ${menuOpen ? "is-open" : ""}`} aria-label="Primary navigation">
        <Link href="/" className="brand"><span className="brand-mark"><Shield size={22} strokeWidth={2} /></span><span className="brand-wordmark"><strong>AgentPayOps</strong><small>Finance operations</small></span></Link>
        <div className="side-caption">WORKSPACE</div>
        <nav className="side-nav">{nav.map(({href,label,icon:Icon}) => <Link key={href} href={href} onClick={() => setMenuOpen(false)} title={label} aria-current={pathname === href ? "page" : undefined} className={`side-link ${pathname === href ? "active" : ""}`}><Icon size={19} strokeWidth={1.8} /><span>{label}</span>{pathname === href && <ChevronRight className="nav-arrow" size={15} />}</Link>)}</nav>
        <div className="side-bottom"><span className="status-dot" /> Shared demo<br /><small>Payments are simulated</small></div>
      </aside>
      <div className="workspace-body">
        <header className="workspace-topbar"><div className="topbar-left"><button ref={menuButtonRef} className="mobile-menu icon-button" aria-label="Open navigation" aria-expanded={menuOpen} onClick={() => setMenuOpen(true)}><Menu size={20} /></button><span className="breadcrumb">AgentPayOps <ChevronRight size={13} /> <strong>{title}</strong></span></div><div className="topbar-right"><span className="demo-badge"><span className="status-dot" /> Shared demo · Simulated payments</span><button className="icon-button refresh-button" title="Refresh demo data" aria-label="Refresh demo data" onClick={() => void refresh()}><Activity size={18} /></button></div></header>
        <main className="workspace-main" id="main-content">{error && <div className="data-banner" role="alert">Live ledger unavailable: {error} <button onClick={() => void refresh()}>Retry</button></div>}{children}</main>
      </div>
    </div>
  ;
}

export function DemoDataProvider({ children }: { children: React.ReactNode }) {
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [invoiceDraft, setInvoiceDraftState] = useState(() => { try { return sessionStorage.getItem("agentpayops:invoice-draft") || ""; } catch { return ""; } });
  const setInvoiceDraft = useCallback((value: string) => { setInvoiceDraftState(value); try { sessionStorage.setItem("agentpayops:invoice-draft", value); } catch {} }, []);
  const refresh = useCallback(async () => {
    try {
      const response = await fetch("/api/audit", { cache: "no-store" });
      if (!response.ok) throw new Error(`Ledger request failed (${response.status})`);
      const body = (await response.json()) as Snapshot;
      if (body.error) throw new Error(body.error);
      setSnapshot(body);
      setError(null);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not load the demo ledger."); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => {
    const initial = window.setTimeout(() => void refresh(), 0);
    const timer = setInterval(() => { if (document.visibilityState === "visible") void refresh(); }, 15000);
    const onVisible = () => { if (document.visibilityState === "visible") void refresh(); };
    const onUpdated = () => void refresh();
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("agentpayops:updated", onUpdated);
    return () => { clearTimeout(initial); clearInterval(timer); document.removeEventListener("visibilitychange", onVisible); window.removeEventListener("agentpayops:updated", onUpdated); };
  }, [refresh]);
  const value = useMemo(() => ({ snapshot, loading, error, refresh, invoiceDraft, setInvoiceDraft }), [snapshot, loading, error, refresh, invoiceDraft, setInvoiceDraft]);
  return <DemoContext.Provider value={value}>{children}</DemoContext.Provider>;
}

export function StartDemoButton({ label = "Start guided demo" }: { label?: string }) {
  const router = useRouter();
  return <button className="button-primary" onClick={() => router.push("/runs?guide=1")}>{label}<ChevronRight size={17}/></button>;
}
