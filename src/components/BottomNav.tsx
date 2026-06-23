import { Link, useRouterState } from "@tanstack/react-router";
import { Home, Briefcase, ListChecks, Shield, Receipt, BarChart3, Settings as SettingsIcon } from "lucide-react";

const items = [
  { to: "/", label: "الرئيسية", icon: Home },
  { to: "/work", label: "العمل", icon: Briefcase },
  { to: "/commitments", label: "الالتزامات", icon: ListChecks },
  { to: "/emergency", label: "الطوارئ", icon: Shield },
  { to: "/transactions", label: "العمليات", icon: Receipt },
  { to: "/summary", label: "ملخص", icon: BarChart3 },
  { to: "/settings", label: "الإعدادات", icon: SettingsIcon },
] as const;

export function BottomNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <nav className="fixed bottom-0 inset-x-0 z-50 px-2 pb-2 pt-1">
      <div className="glass mx-auto max-w-md rounded-2xl px-1 py-1.5 flex items-center justify-between">
        {items.map(({ to, label, icon: Icon }) => {
          const active = pathname === to;
          return (
            <Link
              key={to}
              to={to}
              className={`flex flex-col items-center justify-center gap-0.5 rounded-xl px-2 py-1.5 transition-all flex-1 ${
                active ? "bg-primary/15 text-primary" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="h-[18px] w-[18px]" />
              <span className="text-[10px] font-medium leading-none">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
