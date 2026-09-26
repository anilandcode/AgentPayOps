# JEVEVAL_SUMMARY — Jev decision-gate regression

_Drives the real assessPaymentRisk/assessInvoiceRisk; asserts decision direction, one retry per ML case (probabilistic model)._

| case | kind | outcome | detail | result |
|---|---|---|---|---|
| `jev-bec-must-escalate` | payment | escalated | susp=0.98 human=0.05 risk=high-risk | ✅ |
| `jev-clean-must-pass` | payment | released | susp=0.04 human=0.81 risk=routine | ✅ |
| `jev-signal-ordering` | payment | ordered | susp(BEC)=0.98 > susp(clean)=0.04 | ✅ |
| `jev-invoice-fraud-escalates` | invoice | escalated | fraud=0.96 severity=critical | ✅ |
| `jev-degrades-to-null` | deterministic | null | no API key -> rules-only floor | ✅ |

✅ All 5 gate checks passed.
