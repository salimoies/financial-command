import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { PageShell, GlassCard, NumInput, Btn } from "../components/ui-kit";
import { useStore, addTxn } from "../lib/store";
import { fmtEUR, daysUntilDueDay, daysBetween, todayISO } from "../lib/format";
import { Sparkles, Coffee, Cigarette, UtensilsCrossed, Bus, Plus } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [{ title: "الرئيسية — مركز القيادة المالية" }] }),
  component: HomePage,
});

const QUICK = [
  { label: "سجائر", icon: Cigarette, amount: 8 },
  { label: "قهوة", icon: Coffee, amount: 3.5 },
  { label: "طعام", icon: UtensilsCrossed, amount: 12 },
  { label: "مواصلات", icon: Bus, amount: 3 },
];

function HomePage() {
  const { state, set } = useStore();
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState(state.settings.categories[0] ?? "أخرى");

  const addExpense = (amt: number, label: string) => {
    if (!amt || amt <= 0) return;
    set((s) => addTxn({ ...s, balance: s.balance - amt }, { type: "expense", amount: -amt, label, category: label }));
    setAmount("");
  };

  const nearestInstallment = useMemo(() => {
    return [...state.installments].sort((a, b) => daysUntilDueDay(a.dueDay) - daysUntilDueDay(b.dueDay))[0];
  }, [state.installments]);

  const nearestLongTerm = useMemo(() => {
    return [...state.longTerm].sort((a, b) => daysBetween(todayISO(), a.nextDate) - daysBetween(todayISO(), b.nextDate))[0];
  }, [state.longTerm]);

  const nearestFixed = useMemo(() => {
    return [...state.fixed].sort((a, b) => daysBetween(todayISO(), a.dueDate) - daysBetween(todayISO(), b.dueDate))[0];
  }, [state.fixed]);

  // Smart advice
  const advice = useMemo(() => {
    const todayEarnings = state.work
      .filter((w) => !w.received && w.date === todayISO())
      .reduce((s, w) => s + w.hours * w.rate, 0);
    const overdueDebts = state.debts
      .filter((d) => !d.paid && daysBetween(d.dueDate, todayISO()) > 0)
      .sort((a, b) => daysBetween(b.dueDate, todayISO()) - daysBetween(a.dueDate, todayISO()));
    const top = overdueDebts[0];
    if (!top) return null;
    const rem = todayEarnings - top.amount;
    return {
      title: "نصيحة ذكية",
      income: todayEarnings,
      debt: top,
      remaining: rem,
    };
  }, [state.work, state.debts]);

  const efPercent = state.settings.efGoal > 0 ? Math.min(100, (state.emergencyFund / state.settings.efGoal) * 100) : 0;

  return (
    <PageShell title="مركز القيادة" subtitle="نظرة شاملة على وضعك المالي">
      {/* Balance */}
      <GlassCard className="text-center !p-6 animate-pulse-glow">
        <p className="text-xs uppercase tracking-widest text-muted-foreground">الرصيد الحالي</p>
        <p className="num text-5xl font-black text-gradient mt-3">{fmtEUR(state.balance)}</p>
      </GlassCard>

      {/* Quick expense */}
      <GlassCard>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold">مصروف سريع</h2>
          <Plus className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="grid grid-cols-4 gap-2 mb-3">
          {QUICK.map(({ label, icon: Icon, amount: a }) => (
            <button
              key={label}
              onClick={() => addExpense(a, label)}
              className="flex flex-col items-center gap-1 p-2.5 rounded-xl bg-secondary/50 hover:bg-secondary active:scale-95 transition"
            >
              <Icon className="h-5 w-5 text-primary" />
              <span className="text-[11px] font-medium">{label}</span>
              <span className="num text-[10px] text-muted-foreground">€{a}</span>
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <select value={category} onChange={(e) => setCategory(e.target.value)} className="bg-input/40 border border-border rounded-xl px-2 py-2 text-sm">
            {state.settings.categories.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <NumInput placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)} />
          <Btn onClick={() => addExpense(parseFloat(amount) || 0, category)}>إضافة</Btn>
        </div>
      </GlassCard>

      {/* Smart advice */}
      {advice && (
        <GlassCard className="border border-primary/30">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <h2 className="font-bold">{advice.title}</h2>
          </div>
          <div className="space-y-1.5 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">دخل متوقع اليوم</span><span className="num font-semibold">{fmtEUR(advice.income)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">أقدم دين متأخر</span><span className="num font-semibold text-destructive">{fmtEUR(advice.debt.amount)}</span></div>
            <div className="mt-2 p-2.5 rounded-xl bg-primary/10 text-foreground">
              التوصية: استخدم دخل اليوم لسداد <b>{advice.debt.name}</b>. سيتبقى لديك <span className="num font-bold">{fmtEUR(advice.remaining)}</span>.
            </div>
          </div>
        </GlassCard>
      )}

      {/* Nearest items */}
      {nearestInstallment && (
        <GlassCard>
          <p className="text-xs text-muted-foreground mb-1">أقرب قسط</p>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-bold">{nearestInstallment.name}</p>
              <p className="num text-xs text-muted-foreground mt-0.5">خلال {daysUntilDueDay(nearestInstallment.dueDay)} يوم</p>
            </div>
            <p className="num text-xl font-bold text-primary">{fmtEUR(nearestInstallment.payment)}</p>
          </div>
        </GlassCard>
      )}

      {nearestLongTerm && (
        <GlassCard>
          <p className="text-xs text-muted-foreground mb-1">أقرب دفعة دين طويل الأمد</p>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-bold">{nearestLongTerm.name}</p>
              <p className="num text-xs text-muted-foreground mt-0.5">خلال {daysBetween(todayISO(), nearestLongTerm.nextDate)} يوم</p>
            </div>
            <p className="num text-xl font-bold text-primary">{fmtEUR(nearestLongTerm.payment)}</p>
          </div>
        </GlassCard>
      )}

      {nearestFixed && (
        <GlassCard>
          <p className="text-xs text-muted-foreground mb-1">أقرب مصروف ثابت</p>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-bold">{nearestFixed.name}</p>
              <p className="num text-xs text-muted-foreground mt-0.5">خلال {daysBetween(todayISO(), nearestFixed.dueDate)} يوم</p>
            </div>
            <p className="num text-xl font-bold text-primary">{fmtEUR(nearestFixed.amount)}</p>
          </div>
        </GlassCard>
      )}

      {/* Emergency fund */}
      <GlassCard>
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-bold">صندوق الطوارئ</h2>
          <span className="num text-xs text-muted-foreground">{fmtEUR(state.emergencyFund)} / {fmtEUR(state.settings.efGoal)}</span>
        </div>
        <div className="h-2 rounded-full bg-secondary/60 overflow-hidden">
          <div className="h-full rounded-full transition-all" style={{ width: `${efPercent}%`, background: "var(--gradient-success)" }} />
        </div>
        <p className="num text-xs text-muted-foreground mt-2 text-center">{efPercent.toFixed(1)}%</p>
      </GlassCard>
    </PageShell>
  );
}
