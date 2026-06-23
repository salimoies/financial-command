import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type Txn = {
  id: string;
  type: "salary" | "expense" | "installment" | "debt" | "longterm" | "fixed" | "ef_deposit" | "ef_withdraw";
  amount: number; // positive = inflow to balance, negative = outflow
  label: string;
  category?: string;
  date: string; // ISO datetime
};

export type WorkEntry = {
  id: string;
  date: string; // YYYY-MM-DD
  hours: number;
  rate: number; // snapshot
  received: boolean;
  receivedAt?: string;
};

export type Installment = {
  id: string;
  name: string;
  total: number;
  remaining: number;
  payment: number;
  dueDay: number; // day of month
};

export type Debt = {
  id: string;
  name: string;
  amount: number;
  person: string;
  dueDate: string; // ISO date
  notes?: string;
  paid?: boolean;
};

export type LongTermDebt = {
  id: string;
  name: string;
  total: number;
  remaining: number;
  payment: number;
  frequency: "weekly" | "monthly";
  nextDate: string; // ISO date
};

export type FixedExpense = {
  id: string;
  name: string;
  amount: number;
  frequency: "weekly" | "monthly" | "yearly";
  dueDate: string; // ISO date (next)
  notes?: string;
};

export type Settings = {
  hourlyRate: number;
  monthlyHours: number;
  efPercent: number;
  efGoal: number;
  categories: string[];
};

export type State = {
  balance: number;
  emergencyFund: number;
  settings: Settings;
  work: WorkEntry[];
  installments: Installment[];
  debts: Debt[];
  longTerm: LongTermDebt[];
  fixed: FixedExpense[];
  transactions: Txn[];
};

const KEY = "fcc.state.v1";

const defaultState: State = {
  balance: 0,
  emergencyFund: 0,
  settings: {
    hourlyRate: 15,
    monthlyHours: 160,
    efPercent: 10,
    efGoal: 5000,
    categories: ["سجائر", "قهوة", "طعام", "مواصلات", "تسوق", "ترفيه", "أخرى"],
  },
  work: [],
  installments: [],
  debts: [],
  longTerm: [],
  fixed: [],
  transactions: [],
};

const Ctx = createContext<{
  state: State;
  set: (updater: (s: State) => State) => void;
} | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<State>(defaultState);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setState({ ...defaultState, ...JSON.parse(raw) });
    } catch {}
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (loaded) localStorage.setItem(KEY, JSON.stringify(state));
  }, [state, loaded]);

  const set = (updater: (s: State) => State) => setState((s) => updater(s));
  return <Ctx.Provider value={{ state, set }}>{children}</Ctx.Provider>;
}

export const useStore = () => {
  const c = useContext(Ctx);
  if (!c) throw new Error("StoreProvider missing");
  return c;
};

export const uid = () => Math.random().toString(36).slice(2, 10);

export const addTxn = (s: State, t: Omit<Txn, "id" | "date"> & { date?: string }): State => ({
  ...s,
  transactions: [{ id: uid(), date: t.date ?? new Date().toISOString(), ...t }, ...s.transactions],
});
