/**
 * AppContext — the single source of truth for auth, wallet, investments,
 * transactions, notifications and theme. Backed by localStorage so users
 * persist across reloads. All mutations are async so a later Supabase swap
 * is a drop-in.
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type Balances = { main: number; savings: number; investment: number };
export type Wallet = "main" | "savings" | "investment";

export interface User {
  id: string; // = email
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  address?: string;
  city?: string;
  country?: string;
  tier: "Starter" | "Gold" | "Legend";
  balances: Balances;
  cardBalance: number;
  hasDeposited: boolean;
  createdAt: string;
}

export type TxType =
  | "transfer" | "send" | "deposit" | "withdraw" | "external_send"
  | "vault" | "store" | "loan"
  | "trade-open" | "trade-close"
  | "invest-transfer"
  | "savings-deposit" | "savings-auto" | "savings-withdraw"
  | "goal-created" | "goal-completed"
  | "loan-submitted" | "loan-approved" | "loan-declined"
  | "loan-disbursed" | "loan-payment";

export interface Tx {
  id: string;
  ref: string;
  type: TxType;
  amount: number;
  from?: Wallet | "external";
  to?: Wallet | "external";
  status: "completed" | "pending" | "failed";
  note: string;
  at: string;
  goalId?: string;
  loanId?: string;
  tradeId?: string;
}

export interface Trade {
  id: string;
  sym: string;
  name: string;
  side: "buy" | "sell";
  qty: number;
  openPrice: number;
  openAt: string;
  status: "open" | "closed";
  closePrice?: number;
  closeAt?: string;
  pnl?: number;
  pnlPct?: number;
}

export type GoalMode = "one-time" | "manual" | "daily" | "weekly" | "monthly";
export type GoalStatus = "active" | "paused" | "completed" | "cancelled";
export interface GoalHistory {
  id: string; at: string; amount: number;
  type: "deposit" | "withdraw" | "auto" | "auto-failed";
}
export interface Goal {
  id: string;
  name: string;
  target: number;
  dueDate?: string;
  description?: string;
  saved: number;
  status: GoalStatus;
  mode: GoalMode;
  autoAmount?: number;
  lastRunAt?: string;
  createdAt: string;
  history: GoalHistory[];
}

export type LoanStatus =
  | "draft" | "submitted" | "under-review" | "additional-docs-required"
  | "approved" | "declined" | "disbursed" | "closed";

export interface DocRef { name: string; size: number; type: string; kind: string }

export interface Loan {
  id: string;
  amount: number;
  purpose: string;
  termMonths: number;
  apr: number;
  status: LoanStatus;
  reason?: string;
  submittedAt: string;
  disbursedAt?: string;
  remaining: number;
  monthlyPayment: number;
  nextPaymentAt?: string;
  payments: { at: string; amount: number }[];
  personal: Record<string, string>;
  finances: { monthlyIncome: number; monthlyExpenses: number; existingDebts: number; employment: string };
  docs: { ids: DocRef[]; income: DocRef[]; address: DocRef[]; prevAddress: DocRef[] };
  bank: { name: string; holder: string; routing: string; account: string };
}

export interface Vault {
  id: string;
  plan: "Starter" | "Growth" | "Legend";
  principal: number;
  apy: number;
  days: number;
  startAt: string;
}

export interface Notif {
  id: string;
  title: string;
  message: string;
  read: boolean;
  at: string;
}

const MOCK: User = {
  id: "user@invest.com",
  email: "user@invest.com",
  password: "password123",
  firstName: "Alex",
  lastName: "Morgan",
  tier: "Gold",
  balances: { main: 10000, savings: 1250, investment: 0 },
  cardBalance: 500,
  hasDeposited: true,
  createdAt: new Date().toISOString(),
};

const K = {
  users: "cv.users",
  session: "cv.session",
  tx: (id: string) => `cv.tx.${id}`,
  vaults: (id: string) => `cv.vaults.${id}`,
  notifs: (id: string) => `cv.notifs.${id}`,
  trades: (id: string) => `cv.trades.${id}`,
  goals: (id: string) => `cv.goals.${id}`,
  loans: (id: string) => `cv.loans.${id}`,
  theme: "cv.theme",
  cookie: "cv.cookie",
};

function loadUsers(): Record<string, User> {
  if (typeof window === "undefined") return { [MOCK.id]: MOCK };
  try {
    const raw = localStorage.getItem(K.users);
    const data = raw ? JSON.parse(raw) : {};
    if (!data[MOCK.id]) data[MOCK.id] = MOCK;
    return data;
  } catch {
    return { [MOCK.id]: MOCK };
  }
}
function saveUsers(u: Record<string, User>) {
  localStorage.setItem(K.users, JSON.stringify(u));
}
function ls<T>(k: string, fb: T): T {
  if (typeof window === "undefined") return fb;
  try {
    const raw = localStorage.getItem(k);
    return raw ? (JSON.parse(raw) as T) : fb;
  } catch {
    return fb;
  }
}

interface Ctx {
  user: User | null;
  ready: boolean;
  txs: Tx[];
  vaults: Vault[];
  notifs: Notif[];
  trades: Trade[];
  goals: Goal[];
  loans: Loan[];
  theme: "light" | "dark";
  toggleTheme: () => void;
  login: (email: string, pw: string) => Promise<User>;
  register: (data: Partial<User> & { password: string; email: string }) => Promise<User>;
  logout: () => void;
  internalTransfer: (from: Wallet, to: Wallet, amount: number) => Promise<void>;
  sendToUser: (email: string, amount: number) => Promise<void>;
  externalSend: (recipient: string, bank: string, userEmail: string, amount: number) => Promise<void>;
  deposit: (method: string, amount: number) => Promise<void>;
  requestLoan: (amount: number, email: string) => Promise<void>;
  buyVault: (plan: "Starter" | "Growth" | "Legend", amount: number) => Promise<void>;
  storePurchase: (item: string, amount: number) => Promise<void>;
  markAllNotifsRead: () => void;
  addFundsToInvest: (amount: number) => Promise<void>;
  moveInvestToMain: (amount: number) => Promise<void>;
  openTrade: (input: { sym: string; name: string; side: "buy" | "sell"; qty: number; price: number }) => Promise<void>;
  closeTrade: (id: string, currentPrice: number) => Promise<void>;
  createGoal: (input: Omit<Goal, "id" | "saved" | "status" | "createdAt" | "history"> & { initialDeposit?: number }) => Promise<Goal>;
  fundGoal: (id: string, amount: number) => Promise<void>;
  withdrawGoal: (id: string, amount: number) => Promise<void>;
  editGoal: (id: string, patch: Partial<Goal>) => Promise<void>;
  pauseGoal: (id: string) => Promise<void>;
  resumeGoal: (id: string) => Promise<void>;
  deleteGoal: (id: string) => Promise<void>;
  submitLoan: (input: Omit<Loan, "id" | "status" | "submittedAt" | "remaining" | "monthlyPayment" | "payments" | "apr">) => Promise<Loan>;
  repayLoan: (id: string, amount: number) => Promise<void>;
  payoffLoan: (id: string) => Promise<void>;
}

const AppCtx = createContext<Ctx | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);
  const [txs, setTxs] = useState<Tx[]>([]);
  const [vaults, setVaults] = useState<Vault[]>([]);
  const [notifs, setNotifs] = useState<Notif[]>([]);
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    // Theme init
    const saved = localStorage.getItem(K.theme) as "light" | "dark" | null;
    const prefers = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    const t = saved ?? prefers;
    setTheme(t);
    document.documentElement.classList.toggle("dark", t === "dark");
    // Session init
    const email = localStorage.getItem(K.session);
    if (email) {
      const u = loadUsers()[email];
      if (u) {
        setUser(u);
        setTxs(ls(K.tx(u.id), []));
        setVaults(ls(K.vaults(u.id), []));
        setNotifs(ls(K.notifs(u.id), []));
      }
    }
    setReady(true);
  }, []);

  const persistUser = useCallback((u: User) => {
    const all = loadUsers();
    all[u.id] = u;
    saveUsers(all);
    setUser({ ...u });
  }, []);

  const persistTx = useCallback((id: string, next: Tx[]) => {
    localStorage.setItem(K.tx(id), JSON.stringify(next));
    setTxs(next);
  }, []);
  const persistVaults = useCallback((id: string, next: Vault[]) => {
    localStorage.setItem(K.vaults(id), JSON.stringify(next));
    setVaults(next);
  }, []);
  const persistNotifs = useCallback((id: string, next: Notif[]) => {
    localStorage.setItem(K.notifs(id), JSON.stringify(next));
    setNotifs(next);
  }, []);

  const pushTx = (u: User, tx: Omit<Tx, "id" | "at">) => {
    const next = [{ ...tx, id: crypto.randomUUID(), at: new Date().toISOString() }, ...ls<Tx[]>(K.tx(u.id), [])];
    persistTx(u.id, next);
  };
  const pushNotif = (u: User, n: Omit<Notif, "id" | "at" | "read">) => {
    const next = [
      { ...n, id: crypto.randomUUID(), at: new Date().toISOString(), read: false },
      ...ls<Notif[]>(K.notifs(u.id), []),
    ];
    persistNotifs(u.id, next);
  };

  const toggleTheme = () => {
    const t = theme === "dark" ? "light" : "dark";
    setTheme(t);
    document.documentElement.classList.toggle("dark", t === "dark");
    localStorage.setItem(K.theme, t);
  };

  const login: Ctx["login"] = async (email, pw) => {
    const u = loadUsers()[email.toLowerCase()];
    if (!u || u.password !== pw) throw new Error("Invalid email or password");
    localStorage.setItem(K.session, u.id);
    setUser(u);
    setTxs(ls(K.tx(u.id), []));
    setVaults(ls(K.vaults(u.id), []));
    setNotifs(ls(K.notifs(u.id), []));
    return u;
  };

  const register: Ctx["register"] = async (data) => {
    const all = loadUsers();
    const email = data.email.toLowerCase();
    if (all[email]) throw new Error("An account with this email already exists");
    const u: User = {
      id: email,
      email,
      password: data.password,
      firstName: data.firstName || "",
      lastName: data.lastName || "",
      phone: data.phone,
      address: data.address,
      city: data.city,
      country: data.country,
      tier: "Starter",
      balances: { main: 0, savings: 0, investment: 0 },
      cardBalance: 0,
      hasDeposited: false,
      createdAt: new Date().toISOString(),
    };
    all[email] = u;
    saveUsers(all);
    localStorage.setItem(K.session, email);
    setUser(u);
    setTxs([]);
    setVaults([]);
    const welcome: Notif = {
      id: crypto.randomUUID(),
      title: "Welcome to CrestVest",
      message: "Deposit $100+ to unlock your $200 welcome bonus.",
      read: false,
      at: new Date().toISOString(),
    };
    persistNotifs(email, [welcome]);
    return u;
  };

  const logout = () => {
    localStorage.removeItem(K.session);
    setUser(null);
    setTxs([]);
    setVaults([]);
    setNotifs([]);
  };

  const internalTransfer: Ctx["internalTransfer"] = async (from, to, amount) => {
    if (!user) throw new Error("Not signed in");
    if (from === to) throw new Error("Choose different accounts");
    if (amount <= 0) throw new Error("Enter a valid amount");
    if (user.balances[from] < amount) throw new Error("Insufficient balance");
    const next: User = {
      ...user,
      balances: {
        ...user.balances,
        [from]: user.balances[from] - amount,
        [to]: user.balances[to] + amount,
      },
    };
    persistUser(next);
    pushTx(next, { type: "transfer", amount, from, to, status: "completed", note: `Internal ${from} → ${to}` });
  };

  const sendToUser: Ctx["sendToUser"] = async (email, amount) => {
    if (!user) throw new Error("Not signed in");
    if (amount <= 0) throw new Error("Enter a valid amount");
    if (user.balances.main < amount) throw new Error("Insufficient balance");
    const all = loadUsers();
    const recip = all[email.toLowerCase()];
    if (!recip) throw new Error("No CrestVest user with that email");
    const meNext: User = { ...user, balances: { ...user.balances, main: user.balances.main - amount } };
    const rNext: User = { ...recip, balances: { ...recip.balances, main: recip.balances.main + amount } };
    all[meNext.id] = meNext;
    all[rNext.id] = rNext;
    saveUsers(all);
    setUser({ ...meNext });
    pushTx(meNext, { type: "send", amount, from: "main", status: "completed", note: `Sent to ${email}` });
  };

  const externalSend: Ctx["externalSend"] = async (recipient, bank, userEmail, amount) => {
    if (!user) throw new Error("Not signed in");
    if (userEmail.toLowerCase() !== user.email) throw new Error("Email must match your account email");
    // Simulate: fails after 10s (caller handles the wait). Balance untouched.
    pushTx(user, {
      type: "external_send",
      amount,
      from: "main",
      to: "external",
      status: "failed",
      note: `External transfer to ${recipient} (${bank}) — cancelled`,
    });
    pushNotif(user, { title: "Transaction Failed", message: `External send of $${amount} to ${recipient} was cancelled. Contact support.` });
  };

  const deposit: Ctx["deposit"] = async (method, amount) => {
    if (!user) throw new Error("Not signed in");
    pushTx(user, {
      type: "deposit",
      amount,
      to: "main",
      status: "pending",
      note: `${method} deposit — pending verification`,
    });
    pushNotif(user, {
      title: "Deposit Received",
      message: `Your ${method} deposit is pending verification. Send proof via WhatsApp to speed up.`,
    });
  };

  const requestLoan: Ctx["requestLoan"] = async (amount, email) => {
    if (!user) throw new Error("Not signed in");
    if (email.toLowerCase() !== user.email) throw new Error("Email must match your account email");
    pushTx(user, { type: "loan", amount, status: "pending", note: `Loan application — $${amount}` });
    pushNotif(user, {
      title: "Loan Application Received",
      message: "Your loan request has been submitted. Our team will review and reach out.",
    });
  };

  const buyVault: Ctx["buyVault"] = async (plan, amount) => {
    if (!user) throw new Error("Not signed in");
    if (user.balances.investment < amount) throw new Error("Insufficient investment cash. Add funds from main balance first.");
    const days = plan === "Starter" ? 30 : plan === "Growth" ? 90 : 180;
    const apy = plan === "Starter" ? 5 : plan === "Growth" ? 8 : 12;
    const next: User = {
      ...user,
      balances: { ...user.balances, investment: user.balances.investment - amount },
    };
    persistUser(next);
    const v: Vault = { id: crypto.randomUUID(), plan, principal: amount, apy, days, startAt: new Date().toISOString() };
    persistVaults(next.id, [v, ...ls<Vault[]>(K.vaults(next.id), [])]);
    pushTx(next, { type: "vault", amount, from: "investment", status: "completed", note: `${plan} Vault (${days}d ${apy}% APY)` });
  };

  const storePurchase: Ctx["storePurchase"] = async (item, amount) => {
    if (!user) throw new Error("Not signed in");
    if (user.cardBalance < amount) throw new Error("Insufficient card balance");
    const next: User = { ...user, cardBalance: user.cardBalance - amount };
    persistUser(next);
    pushTx(next, { type: "store", amount, status: "completed", note: `Store: ${item}` });
  };

  const markAllNotifsRead = () => {
    if (!user) return;
    const next = notifs.map((n) => ({ ...n, read: true }));
    persistNotifs(user.id, next);
  };

  const addFundsToInvest: Ctx["addFundsToInvest"] = async (amount) => {
    if (!user) throw new Error("Not signed in");
    if (user.balances.main < amount) throw new Error("Insufficient main balance");
    const next: User = {
      ...user,
      balances: {
        ...user.balances,
        main: user.balances.main - amount,
        investment: user.balances.investment + amount,
      },
    };
    persistUser(next);
    pushTx(next, { type: "transfer", amount, from: "main", to: "investment", status: "completed", note: "Added funds to investment" });
  };

  const value = useMemo<Ctx>(
    () => ({
      user,
      ready,
      txs,
      vaults,
      notifs,
      theme,
      toggleTheme,
      login,
      register,
      logout,
      internalTransfer,
      sendToUser,
      externalSend,
      deposit,
      requestLoan,
      buyVault,
      storePurchase,
      markAllNotifsRead,
      addFundsToInvest,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [user, ready, txs, vaults, notifs, theme],
  );

  return <AppCtx.Provider value={value}>{children}</AppCtx.Provider>;
}

export function useApp() {
  const c = useContext(AppCtx);
  if (!c) throw new Error("useApp must be used inside AppProvider");
  return c;
}