import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { PageShell, GlassCard } from "../components/ui-kit";
import { useStore } from "../lib/store";
import { fmtEUR, daysUntilDueDay, daysBetween, todayISO } from "../lib/format";
import { TrendingUp, TrendingDown } from "lucide-react";

export const Route = createFileRoute("/summary")({
  head: () => ({ meta: [{ title: "ملخص الشهر" }] }),
  component: SummaryPage,
});

function SummaryPage() {
  const { state } = useStore();
  const calc = useMemo(() => {
    const now = new Date();
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const daysLeft = daysBetween(todayISO(), endOfMonth.toISOString().slice(0, 10));

    const unpaidEarnings = state.work.filter((w) => !w.received).reduce((s, w) => s + w.hours * w.rate, 0);
    const installmentsDue = state.installments.filter((i) => daysUntilDueDay(i.dueDay) <= daysLeft).reduce((s, i) => s + i.payment, 0);
    const shortDebts = state.debts.filter((d) => !d.paid).reduce((s, d) => s + d.amount, 0);
    const longTermDue = state.longTerm.filter((d) => daysBetween(todayISO(), d.nextDate) <= daysLeft).reduce((s, d) => s + d.payment, 0);
    const fixedDue = state.fixed.filter((x) => daysBetween(todayISO(), x.dueDate) <= daysLeft).reduce((s, x) => s + x.amount, 0);
    const efContribution = unpaidEarnings * (state.settings.efPercent / 100);

    const available = state.balance + unpaidEarnings;
    const totalOut = installmentsDue + shortDebts + longTermDue + fixedDue + efContribution;
    const result = available - totalOut;

    return { unpaidEarnings, installmentsDue, shortDebts, longTermDue, fixedDue, efContribution, available, totalOut, result };
  }, [state]);

  const positive = calc.result >= 0;

  return (
    <PageShell title="ملخص الشهر" subtitle="توقعك المالي الواقعي">
      <GlassCard>
        <div className="space-y-1">
          <Row label="الرصيد الحالي" value={fmtEUR(state.balance)} />
          <Row label="أرباح غير مستلمة متوقعة" value={fmtEUR(calc.unpaidEarnings)} accent="success" />
          <div className="border-t border-border my-2" />
          <Row label="المال المتاح المتوقع" value={fmtEUR(calc.available)} bold />
        </div>
      </GlassCard>

      <GlassCard>
        <h3 className="font-bold mb-2 text-sm text-muted-foreground">المخصومات</h3>
        <Row label="أقساط مستحقة هذا الشهر" value={`-${fmtEUR(calc.installmentsDue)}`} accent="danger" />
        <Row label="ديون قصيرة الأمد" value={`-${fmtEUR(calc.shortDebts)}`} accent="danger" />
        <Row label="دفعات ديون طويلة" value={`-${fmtEUR(calc.longTermDue)}`} accent="danger" />
        <Row label="مصاريف ثابتة" value={`-${fmtEUR(calc.fixedDue)}`} accent="danger" />
        <Row label="مساهمة طوارئ متوقعة" value={`-${fmtEUR(calc.efContribution)}`} accent="warning" />
        <div className="border-t border-border my-2" />
        <Row label="إجمالي المخصومات" value={`-${fmtEUR(calc.totalOut)}`} bold accent="danger" />
      </GlassCard>

      <div className={`glass rounded-2xl p-6 text-center border ${positive ? "border-success/40" : "border-destructive/40"}`}>
        {positive ? (
          <>
            <TrendingUp className="h-10 w-10 mx-auto text-success mb-2" />
            <p className="text-sm font-semibold text-success">الوضع المالي صحي</p>
            <p className="text-xs text-muted-foreground mt-1">الفائض المتوقع</p>
            <p className="num text-4xl font-black text-success mt-2">{fmtEUR(calc.result)}</p>
          </>
        ) : (
          <>
            <TrendingDown className="h-10 w-10 mx-auto text-destructive mb-2" />
            <p className="text-sm font-semibold text-destructive">تحذير: عجز متوقع</p>
            <p className="num text-4xl font-black text-destructive mt-2">{fmtEUR(calc.result)}</p>
            <p className="text-xs text-muted-foreground mt-3">يوصى بتقليل المصاريف أو زيادة ساعات العمل</p>
          </>
        )}
      </div>
    </PageShell>
  );
}

function Row({ label, value, accent, bold }: { label: string; value: string; accent?: "success" | "danger" | "warning"; bold?: boolean }) {
  const cls = accent === "success" ? "text-success" : accent === "danger" ? "text-destructive" : accent === "warning" ? "text-warning" : "";
  return (
    <div className="flex justify-between py-1.5">
      <span className={`text-sm ${bold ? "font-bold" : "text-muted-foreground"}`}>{label}</span>
      <span className={`num ${bold ? "text-base font-bold" : "text-sm font-semibold"} ${cls}`}>{value}</span>
    </div>
  );
}
