# CrestVest Feature Expansion Plan

Scope: client-side only (localStorage, mock persistence — no Cloud yet). All new logic lives in `src/context/app-context.tsx` and route files. No backend, no real document storage, no real KYC — uploads are accepted, filenames stored, files kept in-memory as data URLs (with size cap) to preserve the mock demo flow.

---

## 1. Data model changes (`app-context.tsx`)

Extend `User.balances` to track investment sub-metrics:
- `investment` (available cash inside investment account)
- `investedPrincipal`, `totalProfit`, `totalLoss` (derived from closed trades)

New collections stored per-user in localStorage:
- `openTrades[]`: `{ id, sym, name, side: 'buy'|'sell', qty, openPrice, openAt }`
- `closedTrades[]`: `{ id, sym, side, qty, openPrice, closePrice, openAt, closeAt, pnl, pnlPct }`
- `goals[]`: `{ id, name, target, dueDate, description, saved, status: 'active'|'paused'|'completed'|'cancelled', mode: 'one-time'|'manual'|'daily'|'weekly'|'monthly', autoAmount?, lastRunAt?, createdAt, history: [{ id, at, amount, type: 'deposit'|'withdraw'|'auto'|'auto-failed' }] }`
- `loans[]`: `{ id, amount, purpose, termMonths, apr, status, submittedAt, disbursedAt?, remaining, monthlyPayment, nextPaymentAt?, payments: [{ at, amount }], docs: { ids: [], income: [], address: [], bank: {...} }, personal: {...} }`
- Transactions gain `type` values: `trade-open`, `trade-close`, `invest-transfer`, `savings-deposit`, `savings-auto`, `savings-withdraw`, `goal-created`, `goal-completed`, `loan-submitted`, `loan-approved`, `loan-disbursed`, `loan-payment`; each has `ref` (short id) and optional `goalId` / `loanId`.

New context methods: `openTrade`, `closeTrade`, `moveMainToInvest`, `moveInvestToMain`, `createGoal`, `fundGoal`, `withdrawGoal`, `pauseGoal`, `resumeGoal`, `deleteGoal`, `editGoal`, `submitLoan`, `repayLoan`. All push notifications + transactions.

Automatic savings: single `setInterval` in provider checks each active auto goal; if elapsed since `lastRunAt` >= interval and main balance sufficient → deduct + credit + record `savings-auto`; if insufficient → mark `paused-auto` (soft flag) + notify; resumes when main balance grows. On reaching target → status `completed` + notify.

---

## 2. Trading & Investment (`routes/invest.tsx`)

Rewrite so live-ticker assets are the market list. "Buy"/"Sell" now open a **position** at current price (qty=1 default, editable via prompt or inline stepper) using investment cash. Positions render in an "Open trades" table with live P&L (recomputed from ticker). Each row has a **Close** button → `closeTrade` computes pnl vs current price, adds/subtracts investment cash, moves row into "Closed trades" history table showing open/close price, pnl $, pnl %, close date.

Investment header cards: Portfolio value, Available cash, Invested principal, Total profit, Total loss, Net P&L.

Keep vaults section as-is.

Add "Move to Main" button next to "Add funds" using `moveInvestToMain`.

---

## 3. Savings (`routes/savings.tsx`)

Empty by default. Header shows total across goals. "New goal" button opens modal:
- name, target, dueDate, description, mode selector (One-time / Manual / Daily / Weekly / Monthly), autoAmount (when auto).
- One-time deposits full target from Main immediately.

Each goal card: progress bar, saved/target, %, days remaining, expected completion (mode-aware), status pill, actions (Fund, Withdraw, Edit, Pause/Resume, Delete), collapsible per-goal history.

Fund modal deducts from Main. Withdraw modal credits Main.

---

## 4. Loans (`routes/loans.tsx`)

Replace current single-form with multi-step application:
1. Personal info
2. Loan details (amount, purpose, term 6/12/24/36/60 mo, monthly income/expenses, existing debts)
3. Identity docs (upload ≥2, dropdown of accepted types)
4. Income proof (employed vs self-employed conditional list)
5. Address proof + optional previous address
6. Bank details (name, holder, routing, account)
7. Review & submit

File inputs accept images/pdfs; store as data URLs (skip if >2 MB, show warning). Duplicate-app guard: block if a loan is `submitted`/`under-review`/`approved` (not disbursed).

On submit → status `submitted`, then a `setTimeout` (8s) auto-transitions to `under-review`; a simple rule engine (income ≥ requested/term * 1.5, no active undisbursed loan, ≥2 id docs, ≥1 income doc, ≥1 address doc, bank filled) → `approved` → `disbursed` (credits Main). Otherwise `additional-docs-required` or `declined` with reason. All steps push notifications + transactions.

Loan dashboard section on same page: active loans list with remaining, APR, monthly payment, next payment, total paid, term left, status; "Make payment" (deducts Main, credits `payments[]`, decreases `remaining`), "Pay off early" button. Payment history table + "Download statement" (client-side CSV).

---

## 5. Transactions (`routes/transactions.tsx`)

Show new columns: date/time, type (labeled), amount, status, ref, related (goal/loan/account). Add type filter chips.

---

## 6. Notifications

Extend context helpers to push on: loan submit/approve/decline/disburse/payment-due (simple check), payment received, goal completed, trade closed, transfers.

---

## 7. Responsive polish

- Convert tables to responsive card lists on `<sm` (trades, loans, transactions).
- Add `min-w-0` + `truncate` to header rows per responsive-layout guidance.
- Ensure new modals use `max-h-[90vh] overflow-y-auto`.
- Bottom nav unchanged.

---

## 8. Out of scope / explicit non-goals

- No real encryption, no real KYC, no credit-bureau lookup, no admin RBAC UI — noted as mock in code comments; spec's security section is acknowledged but cannot be delivered client-only. Will flag this to the user in the final message.
- No backend/Supabase yet.

## Files touched

- `src/context/app-context.tsx` (major)
- `src/routes/invest.tsx` (major rewrite of trading section)
- `src/routes/savings.tsx` (rewrite)
- `src/routes/loans.tsx` (rewrite)
- `src/routes/transactions.tsx` (filters + new columns)
- `src/routes/notifications.tsx` (unchanged logic, benefits from new events)
- `src/routes/dashboard.tsx` (small: surface new investment metrics if referenced)

Estimated diff: ~1.5–2k lines net.
