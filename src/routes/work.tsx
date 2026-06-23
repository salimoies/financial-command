import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { PageShell, GlassCard, NumInput, TxtInput, Btn, StatRow } from "../components/ui-kit";
import { useStore, addTxn, uid } from "../lib/store";
import { fmtEUR, fmtDate, todayISO } from "../lib/format";

export const Route = createFileRoute("/work")({
  head: () => ({ meta: [{ title: "العمل والراتب" }] }),
  component: WorkPage,
});

function WorkPage() {
  const { state, set } = useStore();
  const [date, setDate] = useState(todayISO());
  const [hours, setHours] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const addEntry = () => {
    const h = parseFloat(hours);
    if (!h || h <= 0) return;
    set((s) => ({
      ...s,
      work: [{ id: uid(), date, hours: h, rate: s.settings.hourlyRate, received: false }, ...s.work],
    }));
    setHours("");
  };

  const now = new Date();
  const startOfWeek = new Date(now); startOfWeek.setDate(now.getDate() - now.getDay()); startOfWeek.setHours(0,0,0,0);
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const todayE = state.work.filter((w) => w.date === todayISO()).reduce((s, w) => s + w.hours * w.rate, 0);
  const weekE = state.work.filter((w) => new Date(w.date) >= startOfWeek).reduce((s, w) => s + w.hours * w.rate, 0);
  const monthE = state.work.filter((w) => new Date(w.date) >= startOfMonth).reduce((s, w) => s + w.hours * w.rate, 0);
  const monthHours = state.work.filter((w) => new Date(w.date) >= startOfMonth).reduce((s, w) => s + w.hours, 0);
  const target = state.settings.monthlyHours;
  const remaining = Math.max(0, target - monthHours);

  const unpaid = useMemo(() => state.work.filter((w) => !w.received), [state.work]);
  const selectedTotal = unpaid.filter((w) => selected.has(w.id)).reduce((s, w) => s + w.hours * w.rate, 0);

  const toggle = (id: string) => {
    setSelected((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  };

  const receiveSalary = () => {
    if (selected.size === 0) return;
    set((s) => {
      const amount = s.work.filter((w) => selected.has(w.id)).reduce((sum, w) => sum + w.hours * w.rate, 0);
      const efAdd = amount * (s.settings.efPercent / 100);
      const toBalance = amount - efAdd;
      const receivedAt = new Date().toISOString();
      let next: any = {
        ...s,
        balance: s.balance + toBalance,
        emergencyFund: s.emergencyFund + efAdd,
        work: s.work.map((w) => selected.has(w.id) ? { ...w, received: true, receivedAt } : w),
      };
      next = addTxn(next, { type: "salary", amount: toBalance, label: `استلام راتب — ${selected.size} إدخال` });
      if (efAdd > 0) next = addTxn(next, { type: "ef_deposit", amount: 0, label: `تحويل تلقائي للطوارئ (${s.settings.efPercent}%)`, category: String(efAdd) });
      return next;
    });
    setSelected(new Set());
  };

  return (
    <PageShell title="العمل والراتب" subtitle="سجّل ساعاتك واستلم راتبك">
      <GlassCard>
        <h2 className="font-bold mb-3">إضافة ساعات عمل</h2>
        <div className="space-y-2">
          <TxtInput type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          <NumInput placeholder="عدد الساعات" value={hours} onChange={(e) => setHours(e.target.value)} />
          <Btn className="w-full" onClick={addEntry}>إضافة</Btn>
        </div>
      </GlassCard>

      <GlassCard>
        <h2 className="font-bold mb-2">الأرباح</h2>
        <StatRow label="اليوم" value={fmtEUR(todayE)} accent="success" />
        <StatRow label="الأسبوع" value={fmtEUR(weekE)} accent="success" />
        <StatRow label="الشهر" value={fmtEUR(monthE)} accent="success" />
      </GlassCard>

      <GlassCard>
        <h2 className="font-bold mb-2">ساعات الشهر</h2>
        <div className="flex items-baseline gap-2">
          <span className="num text-3xl font-black text-gradient">{monthHours}</span>
          <span className="num text-muted-foreground">/ {target} ساعة</span>
        </div>
        <div className="h-2 rounded-full bg-secondary/60 overflow-hidden mt-3">
          <div className="h-full transition-all" style={{ width: `${Math.min(100, (monthHours/target)*100)}%`, background: "var(--gradient-primary)" }} />
        </div>
        <p className="num text-xs text-muted-foreground mt-2">باقي للوصول للهدف: {remaining} ساعة</p>
      </GlassCard>

      <GlassCard>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold">أرباح غير مستلمة</h2>
          <span className="num text-sm text-primary font-semibold">{fmtEUR(selectedTotal)}</span>
        </div>
        {unpaid.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">لا توجد أرباح غير مستلمة</p>
        ) : (
          <div className="space-y-2 mb-3">
            {unpaid.map((w) => (
              <label key={w.id} className={`flex items-center gap-3 p-3 rounded-xl border transition cursor-pointer ${selected.has(w.id) ? "bg-primary/10 border-primary/40" : "bg-secondary/30 border-border"}`}>
                <input type="checkbox" checked={selected.has(w.id)} onChange={() => toggle(w.id)} className="h-4 w-4 accent-primary" />
                <div className="flex-1 min-w-0">
                  <p className="num text-sm font-medium">{fmtDate(w.date)}</p>
                  <p className="num text-xs text-muted-foreground">{w.hours} ساعة × €{w.rate}</p>
                </div>
                <span className="num font-bold text-success">{fmtEUR(w.hours * w.rate)}</span>
              </label>
            ))}
          </div>
        )}
        <Btn variant="success" className="w-full" onClick={receiveSalary} disabled={selected.size === 0}>تم استلام الراتب</Btn>
      </GlassCard>
    </PageShell>
  );
}
