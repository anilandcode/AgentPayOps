# EVAL_SUMMARY — AgentPayOps policy engine

_13 labeled scenarios · evaluates the real evaluatePayment()_

- **accuracy: 1.000**
- **falseApproveRate: 0.000**  (a block wrongly approved — must be 0)

**Confusion matrix** (rows = expected, cols = predicted)

| expected ↓ / pred → | approved | escalated | blocked |
|---|---:|---:|---:|
| approved | 3 | 0 | 0 |
| escalated | 0 | 4 | 0 |
| blocked | 0 | 0 | 6 |

✅ All scenarios decided as expected — 0 false-approves.
