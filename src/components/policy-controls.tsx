"use client";

import { Pencil, ShieldCheck, SlidersHorizontal, X } from "lucide-react";
import { useEffect, useState } from "react";
import type { Policy } from "@/lib/sample-data";

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 2,
});

function VendorList({ label, vendors }: { label: string; vendors: string[] }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="shrink-0 text-slate-500">{label}</dt>
      <dd className="text-right font-medium text-slate-700">
        {vendors.length ? vendors.join(", ") : "—"}
      </dd>
    </div>
  );
}

export function PolicyControls() {
  const [policies, setPolicies] = useState<Policy[] | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Policy | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/policies")
      .then((response) => response.json())
      .then((body: { policies?: Policy[]; error?: string }) => { if (!body.policies) throw new Error(body.error || "Policies unavailable."); setPolicies(body.policies); setSelectedId((current) => current ?? body.policies?.[0]?.id ?? null); })
      .catch(() => setError("Could not load policies."));
  }, []);

  async function save() {
    if (!draft) return;
    setSaving(true);
    setError(null);
    try {
      const response = await fetch("/api/policies", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          id: draft.id,
          expectedVersion: draft.version,
          patch: {
            name: draft.name,
            maxAmount: draft.maxAmount,
            approvalRequiredAbove: draft.approvalRequiredAbove,
            allowedVendors: draft.allowedVendors,
            blockedVendors: draft.blockedVendors,
            enabled: draft.enabled,
          },
        }),
      });
      const body = await response.json();
      if (!response.ok) {
        setError(body.error || "Could not save policy.");
        return;
      }
      setPolicies((rows) =>
        (rows ?? []).map((row) => (row.id === draft.id ? body.policy : row)),
      );
      setEditing(null);
      setDraft(null);
      window.dispatchEvent(new Event("agentpayops:updated"));
    } catch {
      setError("Could not reach the policy service.");
    } finally {
      setSaving(false);
    }
  }

  async function toggle(policy: Policy) {
    setSaving(true);
    try {
      const response = await fetch("/api/policies", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id: policy.id, expectedVersion: policy.version, patch: { enabled: !policy.enabled } }),
      });
      const body = await response.json();
      if (response.ok && body.policy) {
        window.dispatchEvent(new Event("agentpayops:updated"));
        setPolicies((rows) =>
          (rows ?? []).map((row) => (row.id === policy.id ? body.policy : row)),
        );
      } else {
        setError(body.error || "Could not update policy.");
      }
    } catch {
      setError("Could not reach the policy service.");
    } finally {
      setSaving(false);
    }
  }

  const rows = policies ?? [];

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Payment Controls
          </p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
            Finance policies for autonomous agents
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Edit thresholds and vendor lists — changes apply to the next agent
            run, no deploy needed.
          </p>
        </div>
        <SlidersHorizontal className="size-5 text-slate-500" />
      </div>

      {error ? (
        <p className="mt-4 rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {error}
        </p>
      ) : null}

      <div className="policy-layout mt-5">
        <nav className="policy-list" aria-label="Policies">{rows.map((policy) => <button key={policy.id} type="button" className={selectedId === policy.id ? "selected" : ""} aria-current={selectedId === policy.id ? "true" : undefined} onClick={() => { setSelectedId(policy.id); setEditing(null); setDraft(null); }}><strong>{policy.name}</strong><small>{policy.category} · {policy.enabled ? "Enabled" : "Disabled"}</small></button>)}</nav>
        {rows.filter((policy) => policy.id === (selectedId ?? rows[0]?.id)).map((policy) => {
          const isEditing = editing === policy.id;
          const view = isEditing && draft ? draft : policy;

          return (
            <article
              className="policy-editor rounded-lg border border-slate-200 bg-slate-50 p-4"
              key={policy.id}
            >
              <div className="flex items-start justify-between gap-3">
                {isEditing ? (
                  <input
                    className="w-full rounded-md border border-slate-300 bg-white px-2 py-1 text-sm font-semibold text-slate-950"
                    value={view.name}
                    onChange={(event) =>
                      setDraft((d) => (d ? { ...d, name: event.target.value } : d))
                    }
                  />
                ) : (
                  <h3 className="font-semibold text-slate-950">{view.name}</h3>
                )}
                <div className="flex shrink-0 items-center gap-1">
                  <button
                    aria-label={policy.enabled ? "Disable policy" : "Enable policy"}
                    className={`rounded-full px-2.5 py-1 text-xs font-semibold transition ${
                      policy.enabled
                        ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                        : "bg-slate-200 text-slate-600 hover:bg-slate-300"
                    }`}
                    disabled={saving}
                    onClick={() => toggle(policy)}
                    type="button"
                  >
                    {policy.enabled ? "On" : "Off"}
                  </button>
                  {!isEditing ? (
                    <button
                      aria-label="Edit policy"
                      className="rounded-md p-1.5 text-slate-500 transition hover:bg-slate-200 hover:text-slate-700"
                      onClick={() => {
                        setEditing(policy.id);
                        setDraft({ ...policy });
                        setError(null);
                      }}
                      type="button"
                    >
                      <Pencil className="size-3.5" />
                    </button>
                  ) : null}
                </div>
              </div>
              <p className="policy-version">Version {policy.version} · {policy.enabled ? "Enabled" : "Disabled"}</p><dl className="mt-4 space-y-3 text-sm">
                <div className="flex justify-between gap-4">
                  <dt className="text-slate-500">Category</dt>
                  <dd className="font-medium text-slate-700">{policy.category}</dd>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-slate-500">Max amount</dt>
                  <dd className="font-medium text-slate-700">
                    {isEditing ? (
                      <input
                        className="w-24 rounded-md border border-slate-300 bg-white px-2 py-1 text-right text-sm"
                        type="number"
                        value={view.maxAmount}
                        onChange={(event) =>
                          setDraft((d) =>
                            d ? { ...d, maxAmount: Number(event.target.value) } : d,
                          )
                        }
                      />
                    ) : (
                      currency.format(view.maxAmount)
                    )}
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-slate-500">Approval above</dt>
                  <dd className="font-medium text-slate-700">
                    {isEditing ? (
                      <input
                        className="w-24 rounded-md border border-slate-300 bg-white px-2 py-1 text-right text-sm"
                        type="number"
                        value={view.approvalRequiredAbove}
                        onChange={(event) =>
                          setDraft((d) =>
                            d
                              ? {
                                  ...d,
                                  approvalRequiredAbove: Number(event.target.value),
                                }
                              : d,
                          )
                        }
                      />
                    ) : (
                      currency.format(view.approvalRequiredAbove)
                    )}
                  </dd>
                </div>
                {isEditing ? (
                  <>
                    {draft && JSON.stringify(draft) !== JSON.stringify(policy) ? <span className="status-pill escalated">Unsaved changes</span> : null}
                    <div>
                      <dt className="mb-1 text-slate-500">Allowed vendors</dt>
                      <dd>
                        <input
                          className="w-full rounded-md border border-slate-300 bg-white px-2 py-1 text-sm"
                          value={view.allowedVendors.join(", ")}
                          onChange={(event) =>
                            setDraft((d) =>
                              d
                                ? {
                                    ...d,
                                    allowedVendors: event.target.value
                                      .split(",")
                                      .map((item) => item.trim())
                                      .filter(Boolean),
                                  }
                                : d,
                            )
                          }
                        />
                      </dd>
                    </div>
                    <div>
                      <dt className="mb-1 text-slate-500">Blocked vendors</dt>
                      <dd>
                        <input
                          className="w-full rounded-md border border-slate-300 bg-white px-2 py-1 text-sm"
                          value={view.blockedVendors.join(", ")}
                          onChange={(event) =>
                            setDraft((d) =>
                              d
                                ? {
                                    ...d,
                                    blockedVendors: event.target.value
                                      .split(",")
                                      .map((item) => item.trim())
                                      .filter(Boolean),
                                  }
                                : d,
                            )
                          }
                        />
                      </dd>
                    </div>
                    <div className="flex gap-2 pt-1">
                      <button
                        className="inline-flex items-center gap-1.5 rounded-md bg-slate-950 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50"
                        disabled={saving}
                        onClick={() => void save()}
                        type="button"
                      >
                        <ShieldCheck className="size-3.5" />
                        {saving ? "Saving…" : "Save policy"}
                      </button>
                      <button
                        className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-100"
                        onClick={() => {
                          setEditing(null);
                          setDraft(null);
                        }}
                        type="button"
                      >
                        <X className="size-3.5" />
                        Cancel
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <VendorList label="Allowed" vendors={policy.allowedVendors} />
                    <VendorList label="Blocked" vendors={policy.blockedVendors} />
                  </>
                )}
              </dl>
            </article>
          );
        })}
        {rows.length === 0 ? (
          <p className="text-sm text-slate-500">{error ? "Policies unavailable. Retry by reloading the page." : "Loading policies…"}</p>
        ) : null}
      </div>
    </section>
  );
}
