import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PageShell, GlassCard, TxtInput } from "../components/ui-kit";
import { useStore } from "../lib/store";
import { fmtEUR, fmtDateTime } from "../lib/format";

export const Route = createFileRoute("/transactions")({
  head: () => ({ meta: [{ title: "العمليات" }] }),
  component: TxnPage,
});

const TYPE_LABELS: Record<string, string> = {
  salary: "راتب",
  expense: "مصروف",
  installment: "قسط",
  debt: "سداد دين",
  longterm: "دين طويل",
  fixed: "مصروف ثابت",
  ef_deposit: "إيداع طوارئ",
  ef_withdraw: "سحب طوارئ",
};

function TxnPage() {
  const { state } = useStore();
  const [q, setQ] = useState("");
  const [type, setType] = useState("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const filtered = useMemo(() => {
    return state.transactions.filter((t) => {
      if (type !== "all" && t.type !== type) return false;
      if (q && !t.label.includes(q)) return false;
      if (from && t.date < from) return false;
      if (to && t.date > to + "T23:59:59") return false;
      return true;
    });
  }, [state.transactions, q, type, from, to]);

  return (
    <PageShell title="العمليات" subtitle="سجل كل حركاتك المالية">
      <GlassCard>
        <TxtInput placeholder="بحث..." value={q} onChange={(e) => setQ(e.target.value)} />
        <div className="grid grid-cols-2 gap-2 mt-2">
          <select value={type} onChange={(e) => setType(e.target.value)} className="bg-input/40 border border-border rounded-xl px-3 py-2.5 text-sm">
            <option value="all">كل الأنواع</option>
            {Object.entries(TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <div className="grid grid-cols-2 gap-1">
            <TxtInput type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
            <TxtInput type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          </div>
        </div>
      </GlassCard>

      {filtered.length === 0 ? (
        <GlassCard className="text-center py-8 text-muted-foreground text-sm">لا توجد عمليات</GlassCard>
      ) : (
        <div className="space-y-2">
          {filtered.map((t) => (
            <GlassCard key={t.id} className="!p-3">
              <div className="flex justify-between items-start gap-2">
                <div className="min-w-0">
                  <p className="font-semibold text-sm truncate">{t.label}</p>
                  <p className="num text-[10px] text-muted-foreground mt-0.5">{fmtDateTime(t.date)} · {TYPE_LABELS[t.type]}</p>
                </div>
                <p className={`num text-sm font-bold ${t.amount > 0 ? "text-success" : t.amount < 0 ? "text-destructive" : "text-muted-foreground"}`}>
                  {t.amount > 0 ? "+" : ""}{fmtEUR(t.amount)}
                </p>
              </div>
            </GlassCard>
          ))}
        </div>
      )}
    </PageShell>
  );
}
