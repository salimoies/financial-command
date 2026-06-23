import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageShell, GlassCard, NumInput, TxtInput, Btn } from "../components/ui-kit";
import { useStore } from "../lib/store";
import { X, Plus } from "lucide-react";

export const Route = createFileRoute("/settings")({
  head: () => ({ meta: [{ title: "الإعدادات" }] }),
  component: SettingsPage,
});

function SettingsPage() {
  const { state, set } = useStore();
  const [s, setS] = useState({
    hourlyRate: String(state.settings.hourlyRate),
    monthlyHours: String(state.settings.monthlyHours),
    efPercent: String(state.settings.efPercent),
    efGoal: String(state.settings.efGoal),
  });
  const [newCat, setNewCat] = useState("");
  const [saved, setSaved] = useState(false);

  const save = () => {
    set((st) => ({
      ...st,
      settings: {
        ...st.settings,
        hourlyRate: parseFloat(s.hourlyRate) || 0,
        monthlyHours: parseFloat(s.monthlyHours) || 0,
        efPercent: Math.min(100, Math.max(0, parseFloat(s.efPercent) || 0)),
        efGoal: parseFloat(s.efGoal) || 0,
      },
    }));
    setSaved(true); setTimeout(() => setSaved(false), 1500);
  };

  const addCat = () => {
    if (!newCat.trim()) return;
    set((st) => ({ ...st, settings: { ...st.settings, categories: [...st.settings.categories, newCat.trim()] } }));
    setNewCat("");
  };
  const removeCat = (c: string) => set((st) => ({ ...st, settings: { ...st.settings, categories: st.settings.categories.filter((x) => x !== c) } }));

  const resetBalance = () => {
    if (!confirm("إعادة ضبط الرصيد إلى 0؟")) return;
    set((st) => ({ ...st, balance: 0 }));
  };
  const wipeAll = () => {
    if (!confirm("مسح كل البيانات نهائياً؟")) return;
    localStorage.removeItem("fcc.state.v1");
    location.reload();
  };

  return (
    <PageShell title="الإعدادات" subtitle="تخصيص حسابات التطبيق">
      <GlassCard>
        <h3 className="font-bold mb-3">الراتب والعمل</h3>
        <label className="text-xs text-muted-foreground">أجر الساعة (€)</label>
        <NumInput value={s.hourlyRate} onChange={(e) => setS({ ...s, hourlyRate: e.target.value })} />
        <label className="text-xs text-muted-foreground mt-3 block">الساعات الشهرية المتوقعة</label>
        <NumInput value={s.monthlyHours} onChange={(e) => setS({ ...s, monthlyHours: e.target.value })} />
      </GlassCard>

      <GlassCard>
        <h3 className="font-bold mb-3">صندوق الطوارئ</h3>
        <label className="text-xs text-muted-foreground">النسبة من الراتب (%)</label>
        <NumInput value={s.efPercent} onChange={(e) => setS({ ...s, efPercent: e.target.value })} />
        <label className="text-xs text-muted-foreground mt-3 block">الهدف (€)</label>
        <NumInput value={s.efGoal} onChange={(e) => setS({ ...s, efGoal: e.target.value })} />
      </GlassCard>

      <GlassCard>
        <h3 className="font-bold mb-3">فئات المصاريف</h3>
        <div className="flex flex-wrap gap-2 mb-3">
          {state.settings.categories.map((c) => (
            <span key={c} className="inline-flex items-center gap-1 bg-secondary rounded-full px-3 py-1 text-xs">
              {c}
              <button onClick={() => removeCat(c)}><X className="h-3 w-3 text-muted-foreground" /></button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <TxtInput placeholder="فئة جديدة" value={newCat} onChange={(e) => setNewCat(e.target.value)} />
          <Btn onClick={addCat}><Plus className="h-4 w-4" /></Btn>
        </div>
      </GlassCard>

      <Btn className="w-full" onClick={save}>{saved ? "تم الحفظ ✓" : "حفظ الإعدادات"}</Btn>

      <GlassCard className="border border-destructive/30">
        <h3 className="font-bold mb-3 text-destructive">منطقة الخطر</h3>
        <div className="space-y-2">
          <Btn variant="secondary" className="w-full" onClick={resetBalance}>إعادة ضبط الرصيد</Btn>
          <Btn variant="danger" className="w-full" onClick={wipeAll}>مسح كل البيانات</Btn>
        </div>
      </GlassCard>
    </PageShell>
  );
}
