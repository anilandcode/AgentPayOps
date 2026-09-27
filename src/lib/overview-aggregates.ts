import type { Transaction } from "./sample-data";

export function buildOverviewAggregates(transactions: Transaction[], now = new Date()) {
  const days = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - 6 + index));
    return { date: date.toISOString().slice(0, 10), count: 0 };
  });
  const byDate = new Map(days.map(day => [day.date, day]));
  for (const transaction of transactions) {
    const date = new Date(transaction.createdAt);
    if (!Number.isNaN(date.getTime())) {
      const day = byDate.get(date.toISOString().slice(0, 10));
      if (day) day.count += 1;
    }
  }
  return {
    spendReviewed: transactions.reduce((sum, item) => sum + item.amount, 0),
    blockedSpend: transactions.filter(item => item.status === "blocked").reduce((sum, item) => sum + item.amount, 0),
    pendingReview: transactions.filter(item => item.status === "escalated").length,
    humanDecisions: transactions.filter(item => Boolean(item.decidedBy)).length,
    decisionCounts: Object.fromEntries(["approved", "escalated", "blocked", "released"].map(status => [status, transactions.filter(item => item.status === status).length])),
    activity: days,
  };
}
