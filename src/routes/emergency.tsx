import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageShell, GlassCard, NumInput, Btn } from "../components/ui-kit";
import { useStore, addTxn } from "../lib/store";
import { fmtEUR } from "../lib/format";
import { Shield } from "lucide-react";

export const Route = createFileRoute("/emergency")({
  head: () => ({ meta: [{ title: "صندوق الطوارئ" }] }),
  component: EFPage,
});

function EFPage() {
  const { state, set } = useStore();
  const [amount, setAmount] = useState("");
  const pct = state.settings.efGoal > 0 ? Math.min(100, (state.emergencyFund / state.settings.efGoal) * 100) : 0;

  const deposit = () => {
    const a = parseFloat(amount); if (!a || a <= 0 || a > state.balance) return;
    set((s) => addTxn({ ...s, balance: s.balance - a, emergencyFund: s.emergencyFund + a }, { type: "ef_deposit", amount: -a, label: "إيداع يدوي للطوارئ" }));
    setAmount("");
  };
  const withdraw = () => {
    const a = parseFloat(amount); if (!a || a <= 0 || a > state.emergencyFund) return;
    set((s) => addTxn({ ...s, balance: s.balance + a, emergencyFund: s.emergencyFund - a }, { type: "ef_withdraw", amount: a, label: "سحب يدوي من الطوارئ" }));
    setAmount("");
  };

  return (
    <PageShell title="صندوق الطوارئ" subtitle="احتياطك المالي للأوقات الصعبة">
      <GlassCard className="text-center !p-6">
        <Shield className="h-8 w-8 mx-auto text-primary mb-2" />
        <p className="text-xs text-muted-foreground uppercase tracking-widest">الرصيد الحالي</p>
        <p className="num text-4xl font-black text-gradient mt-2">{fmtEUR(state.emergencyFund)}</p>
        <p className="num text-sm text-muted-foreground mt-1">الهدف: {fmtEUR(state.settings.efGoal)}</p>
        <div className="h-3 rounded-full bg-secondary/60 overflow-hidden mt-4">
          <div className="h-full transition-all" style={{ width: `${pct}%`, background: "var(--gradient-success)" }} />
        </div>
        <p className="num text-sm font-bold text-success mt-2">{pct.toFixed(1)}%</p>
      </GlassCard>

      <GlassCard>
        <p className="text-xs text-muted-foreground mb-1">المساهمة التلقائية من الراتب</p>
        <p className="num text-2xl font-bold">{state.settings.efPercent}%</p>
        <p className="text-xs text-muted-foreground mt-1">يمكن تعديلها من الإعدادات</p>
      </GlassCard>

      <GlassCard>
        <h3 className="font-bold mb-3">إيداع / سحب يدوي</h3>
        <NumInput placeholder="المبلغ" value={amount} onChange={(e) => setAmount(e.target.value)} />
        <div className="grid grid-cols-2 gap-2 mt-3">
          <Btn variant="success" onClick={deposit}>إيداع</Btn>
          <Btn variant="danger" onClick={withdraw}>سحب</Btn>
        </div>
      </GlassCard>
    </PageShell>
  );
}
