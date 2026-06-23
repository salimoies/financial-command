import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageShell, GlassCard, NumInput, TxtInput, Btn } from "../components/ui-kit";
import { useStore, addTxn, uid, type Installment, type Debt, type LongTermDebt, type FixedExpense } from "../lib/store";
import { fmtEUR, fmtDate, daysUntilDueDay, daysBetween, todayISO, nextDueDate } from "../lib/format";
import { Trash2, CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/commitments")({
  head: () => ({ meta: [{ title: "الالتزامات" }] }),
  component: CommitmentsPage,
});

const TABS = ["الأقساط", "الديون", "ديون طويلة الأمد", "مصاريف ثابتة"] as const;

function CommitmentsPage() {
  const [tab, setTab] = useState(0);
  return (
    <PageShell title="الالتزامات" subtitle="إدارة كل ديونك ومصاريفك">
      <div className="glass rounded-2xl p-1 grid grid-cols-4 gap-1">
        {TABS.map((t, i) => (
          <button key={t} onClick={() => setTab(i)} className={`text-[11px] font-semibold py-2 rounded-xl transition ${tab === i ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}>
            {t}
          </button>
        ))}
      </div>
      {tab === 0 && <InstallmentsTab />}
      {tab === 1 && <DebtsTab />}
      {tab === 2 && <LongTermTab />}
      {tab === 3 && <FixedTab />}
    </PageShell>
  );
}

function InstallmentsTab() {
  const { state, set } = useStore();
  const [f, setF] = useState({ name: "", total: "", remaining: "", payment: "", dueDay: "1" });
  const add = () => {
    if (!f.name || !f.payment) return;
    const item: Installment = { id: uid(), name: f.name, total: +f.total || 0, remaining: +f.remaining || +f.total || 0, payment: +f.payment, dueDay: Math.min(31, Math.max(1, +f.dueDay || 1)) };
    set((s) => ({ ...s, installments: [item, ...s.installments] }));
    setF({ name: "", total: "", remaining: "", payment: "", dueDay: "1" });
  };
  const pay = (i: Installment) => {
    set((s) => {
      const newRem = Math.max(0, i.remaining - i.payment);
      const next = { ...s, balance: s.balance - i.payment, installments: s.installments.map((x) => x.id === i.id ? { ...x, remaining: newRem } : x) };
      return addTxn(next, { type: "installment", amount: -i.payment, label: `قسط: ${i.name}` });
    });
  };
  const del = (id: string) => set((s) => ({ ...s, installments: s.installments.filter((x) => x.id !== id) }));

  return (
    <>
      <GlassCard>
        <h3 className="font-bold mb-3">قسط جديد</h3>
        <div className="space-y-2">
          <TxtInput placeholder="الاسم" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
          <div className="grid grid-cols-2 gap-2">
            <NumInput placeholder="المبلغ الإجمالي" value={f.total} onChange={(e) => setF({ ...f, total: e.target.value })} />
            <NumInput placeholder="المتبقي" value={f.remaining} onChange={(e) => setF({ ...f, remaining: e.target.value })} />
            <NumInput placeholder="مبلغ القسط" value={f.payment} onChange={(e) => setF({ ...f, payment: e.target.value })} />
            <NumInput placeholder="يوم الاستحقاق (1-31)" value={f.dueDay} onChange={(e) => setF({ ...f, dueDay: e.target.value })} />
          </div>
          <Btn className="w-full" onClick={add}>إضافة قسط</Btn>
        </div>
      </GlassCard>

      {state.installments.map((i) => {
        const days = daysUntilDueDay(i.dueDay);
        const overdue = days <= 0;
        const remPayments = i.payment > 0 ? Math.ceil(i.remaining / i.payment) : 0;
        return (
          <GlassCard key={i.id} className={overdue ? "border border-destructive/50" : ""}>
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="font-bold truncate">{i.name}</p>
                <p className={`num text-xs mt-0.5 ${overdue ? "text-destructive" : "text-muted-foreground"}`}>
                  {overdue ? `متأخر ${Math.abs(days)} يوم` : `خلال ${days} يوم`} · يوم {i.dueDay}
                </p>
              </div>
              <button onClick={() => del(i.id)} className="text-muted-foreground hover:text-destructive p-1"><Trash2 className="h-4 w-4" /></button>
            </div>
            <div className="grid grid-cols-3 gap-2 mt-3 text-center">
              <div><p className="text-[10px] text-muted-foreground">القسط</p><p className="num text-sm font-bold">{fmtEUR(i.payment)}</p></div>
              <div><p className="text-[10px] text-muted-foreground">المتبقي</p><p className="num text-sm font-bold">{fmtEUR(i.remaining)}</p></div>
              <div><p className="text-[10px] text-muted-foreground">دفعات متبقية</p><p className="num text-sm font-bold">{remPayments}</p></div>
            </div>
            <Btn variant="success" className="w-full mt-3" onClick={() => pay(i)}>دفع القسط</Btn>
          </GlassCard>
        );
      })}
    </>
  );
}

function DebtsTab() {
  const { state, set } = useStore();
  const [f, setF] = useState({ name: "", amount: "", person: "", dueDate: todayISO(), notes: "" });
  const add = () => {
    if (!f.name || !f.amount) return;
    const d: Debt = { id: uid(), name: f.name, amount: +f.amount, person: f.person, dueDate: f.dueDate, notes: f.notes };
    set((s) => ({ ...s, debts: [d, ...s.debts] }));
    setF({ name: "", amount: "", person: "", dueDate: todayISO(), notes: "" });
  };
  const pay = (d: Debt) => set((s) => addTxn({ ...s, balance: s.balance - d.amount, debts: s.debts.map((x) => x.id === d.id ? { ...x, paid: true } : x) }, { type: "debt", amount: -d.amount, label: `سداد دين: ${d.name}` }));
  const del = (id: string) => set((s) => ({ ...s, debts: s.debts.filter((x) => x.id !== id) }));

  // include overdue installments synthetically
  const overdueInst = state.installments.filter((i) => daysUntilDueDay(i.dueDay) <= 0);

  return (
    <>
      <GlassCard>
        <h3 className="font-bold mb-3">دين جديد</h3>
        <div className="space-y-2">
          <TxtInput placeholder="الاسم" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
          <NumInput placeholder="المبلغ" value={f.amount} onChange={(e) => setF({ ...f, amount: e.target.value })} />
          <TxtInput placeholder="الشخص / الجهة" value={f.person} onChange={(e) => setF({ ...f, person: e.target.value })} />
          <TxtInput type="date" value={f.dueDate} onChange={(e) => setF({ ...f, dueDate: e.target.value })} />
          <TxtInput placeholder="ملاحظات" value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} />
          <Btn className="w-full" onClick={add}>إضافة دين</Btn>
        </div>
      </GlassCard>

      {overdueInst.length > 0 && (
        <GlassCard className="border border-destructive/40">
          <p className="text-xs font-bold text-destructive mb-2">أقساط متأخرة (تظهر هنا تلقائياً)</p>
          {overdueInst.map((i) => (
            <div key={i.id} className="flex justify-between text-sm py-1.5">
              <span>{i.name}</span><span className="num font-bold text-destructive">{fmtEUR(i.payment)}</span>
            </div>
          ))}
        </GlassCard>
      )}

      {state.debts.filter((d) => !d.paid).map((d) => {
        const od = daysBetween(d.dueDate, todayISO());
        return (
          <GlassCard key={d.id} className={od > 0 ? "border border-destructive/50" : ""}>
            <div className="flex items-start justify-between">
              <div className="min-w-0">
                <p className="font-bold">{d.name}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{d.person || "—"}</p>
                <p className={`num text-xs mt-0.5 ${od > 0 ? "text-destructive font-semibold" : "text-muted-foreground"}`}>
                  {od > 0 ? `متأخر ${od} يوم` : `استحقاق ${fmtDate(d.dueDate)}`}
                </p>
                {d.notes && <p className="text-xs text-muted-foreground mt-1">{d.notes}</p>}
              </div>
              <div className="text-end">
                <p className="num text-lg font-bold text-destructive">{fmtEUR(d.amount)}</p>
              </div>
            </div>
            <div className="flex gap-2 mt-3">
              <Btn variant="success" className="flex-1" onClick={() => pay(d)}>سداد</Btn>
              <Btn variant="ghost" onClick={() => del(d.id)}><Trash2 className="h-4 w-4" /></Btn>
            </div>
          </GlassCard>
        );
      })}
    </>
  );
}

function LongTermTab() {
  const { state, set } = useStore();
  const [f, setF] = useState({ name: "", total: "", remaining: "", payment: "", frequency: "monthly" as "weekly" | "monthly", nextDate: todayISO() });
  const add = () => {
    if (!f.name || !f.payment) return;
    const d: LongTermDebt = { id: uid(), name: f.name, total: +f.total || 0, remaining: +f.remaining || +f.total || 0, payment: +f.payment, frequency: f.frequency, nextDate: f.nextDate };
    set((s) => ({ ...s, longTerm: [d, ...s.longTerm] }));
    setF({ name: "", total: "", remaining: "", payment: "", frequency: "monthly", nextDate: todayISO() });
  };
  const pay = (d: LongTermDebt) => {
    set((s) => {
      const newRem = Math.max(0, d.remaining - d.payment);
      const nd = new Date(d.nextDate);
      if (d.frequency === "weekly") nd.setDate(nd.getDate() + 7); else nd.setMonth(nd.getMonth() + 1);
      const next = { ...s, balance: s.balance - d.payment, longTerm: s.longTerm.map((x) => x.id === d.id ? { ...x, remaining: newRem, nextDate: nd.toISOString().slice(0, 10) } : x) };
      return addTxn(next, { type: "longterm", amount: -d.payment, label: `دفعة دين طويل: ${d.name}` });
    });
  };
  const del = (id: string) => set((s) => ({ ...s, longTerm: s.longTerm.filter((x) => x.id !== id) }));

  return (
    <>
      <GlassCard>
        <h3 className="font-bold mb-3">دين طويل الأمد جديد</h3>
        <div className="space-y-2">
          <TxtInput placeholder="الاسم" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
          <div className="grid grid-cols-2 gap-2">
            <NumInput placeholder="الإجمالي" value={f.total} onChange={(e) => setF({ ...f, total: e.target.value })} />
            <NumInput placeholder="المتبقي" value={f.remaining} onChange={(e) => setF({ ...f, remaining: e.target.value })} />
            <NumInput placeholder="مبلغ الدفعة" value={f.payment} onChange={(e) => setF({ ...f, payment: e.target.value })} />
            <select value={f.frequency} onChange={(e) => setF({ ...f, frequency: e.target.value as any })} className="bg-input/40 border border-border rounded-xl px-3 py-2.5 text-sm">
              <option value="monthly">شهري</option>
              <option value="weekly">أسبوعي</option>
            </select>
          </div>
          <TxtInput type="date" value={f.nextDate} onChange={(e) => setF({ ...f, nextDate: e.target.value })} />
          <Btn className="w-full" onClick={add}>إضافة</Btn>
        </div>
      </GlassCard>

      {state.longTerm.map((d) => {
        const remPayments = d.payment > 0 ? Math.ceil(d.remaining / d.payment) : 0;
        const days = daysBetween(todayISO(), d.nextDate);
        return (
          <GlassCard key={d.id}>
            <div className="flex justify-between">
              <div>
                <p className="font-bold">{d.name}</p>
                <p className="num text-xs text-muted-foreground mt-0.5">{d.frequency === "monthly" ? "شهري" : "أسبوعي"} · {days} يوم</p>
              </div>
              <button onClick={() => del(d.id)} className="text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
            </div>
            <div className="grid grid-cols-3 gap-2 mt-3 text-center">
              <div><p className="text-[10px] text-muted-foreground">الدفعة</p><p className="num text-sm font-bold">{fmtEUR(d.payment)}</p></div>
              <div><p className="text-[10px] text-muted-foreground">المتبقي</p><p className="num text-sm font-bold">{fmtEUR(d.remaining)}</p></div>
              <div><p className="text-[10px] text-muted-foreground">دفعات متبقية</p><p className="num text-sm font-bold">{remPayments}</p></div>
            </div>
            <Btn variant="success" className="w-full mt-3" onClick={() => pay(d)}><CheckCircle2 className="inline h-4 w-4 ms-1" /> تم السداد</Btn>
          </GlassCard>
        );
      })}
    </>
  );
}

function FixedTab() {
  const { state, set } = useStore();
  const [f, setF] = useState({ name: "", amount: "", frequency: "monthly" as "weekly" | "monthly" | "yearly", dueDate: todayISO(), notes: "" });
  const add = () => {
    if (!f.name || !f.amount) return;
    const x: FixedExpense = { id: uid(), name: f.name, amount: +f.amount, frequency: f.frequency, dueDate: f.dueDate, notes: f.notes };
    set((s) => ({ ...s, fixed: [x, ...s.fixed] }));
    setF({ name: "", amount: "", frequency: "monthly", dueDate: todayISO(), notes: "" });
  };
  const pay = (x: FixedExpense) => {
    set((s) => {
      const nd = new Date(x.dueDate);
      if (x.frequency === "weekly") nd.setDate(nd.getDate() + 7);
      else if (x.frequency === "monthly") nd.setMonth(nd.getMonth() + 1);
      else nd.setFullYear(nd.getFullYear() + 1);
      const next = { ...s, balance: s.balance - x.amount, fixed: s.fixed.map((y) => y.id === x.id ? { ...y, dueDate: nd.toISOString().slice(0, 10) } : y) };
      return addTxn(next, { type: "fixed", amount: -x.amount, label: `مصروف ثابت: ${x.name}` });
    });
  };
  const del = (id: string) => set((s) => ({ ...s, fixed: s.fixed.filter((x) => x.id !== id) }));

  return (
    <>
      <GlassCard>
        <h3 className="font-bold mb-3">مصروف ثابت جديد</h3>
        <div className="space-y-2">
          <TxtInput placeholder="الاسم (إيجار، إنترنت...)" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
          <NumInput placeholder="المبلغ" value={f.amount} onChange={(e) => setF({ ...f, amount: e.target.value })} />
          <select value={f.frequency} onChange={(e) => setF({ ...f, frequency: e.target.value as any })} className="w-full bg-input/40 border border-border rounded-xl px-3 py-2.5 text-sm">
            <option value="weekly">أسبوعي</option>
            <option value="monthly">شهري</option>
            <option value="yearly">سنوي</option>
          </select>
          <TxtInput type="date" value={f.dueDate} onChange={(e) => setF({ ...f, dueDate: e.target.value })} />
          <TxtInput placeholder="ملاحظات" value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} />
          <Btn className="w-full" onClick={add}>إضافة</Btn>
        </div>
      </GlassCard>

      {state.fixed.map((x) => {
        const days = daysBetween(todayISO(), x.dueDate);
        return (
          <GlassCard key={x.id}>
            <div className="flex justify-between">
              <div>
                <p className="font-bold">{x.name}</p>
                <p className="num text-xs text-muted-foreground mt-0.5">
                  {x.frequency === "weekly" ? "أسبوعي" : x.frequency === "monthly" ? "شهري" : "سنوي"} · {days >= 0 ? `خلال ${days} يوم` : `متأخر ${-days} يوم`}
                </p>
                {x.notes && <p className="text-xs text-muted-foreground mt-1">{x.notes}</p>}
              </div>
              <p className="num text-lg font-bold">{fmtEUR(x.amount)}</p>
            </div>
            <div className="flex gap-2 mt-3">
              <Btn variant="success" className="flex-1" onClick={() => pay(x)}>دفع</Btn>
              <Btn variant="ghost" onClick={() => del(x.id)}><Trash2 className="h-4 w-4" /></Btn>
            </div>
          </GlassCard>
        );
      })}
    </>
  );
}
