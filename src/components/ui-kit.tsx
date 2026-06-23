import type { ReactNode } from "react";

export function PageShell({ title, subtitle, children, action }: { title: string; subtitle?: string; children: ReactNode; action?: ReactNode }) {
  return (
    <div className="min-h-screen pb-28">
      <header className="px-5 pt-8 pb-4 flex items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
          {subtitle && <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>}
        </div>
        {action}
      </header>
      <main className="px-5 space-y-4">{children}</main>
    </div>
  );
}

export function GlassCard({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`glass rounded-2xl p-4 ${className}`}>{children}</div>;
}

export function StatRow({ label, value, accent }: { label: string; value: ReactNode; accent?: "success" | "danger" | "warning" }) {
  const cls = accent === "success" ? "text-success" : accent === "danger" ? "text-destructive" : accent === "warning" ? "text-warning" : "";
  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className={`num text-base font-semibold ${cls}`}>{value}</span>
    </div>
  );
}

export function NumInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      inputMode="decimal"
      dir="ltr"
      className={`num w-full bg-input/40 border border-border rounded-xl px-3 py-2.5 text-base text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring text-left ${props.className ?? ""}`}
      onChange={(e) => {
        const cleaned = e.target.value.replace(/[^\d.,]/g, "").replace(",", ".");
        e.target.value = cleaned;
        props.onChange?.(e);
      }}
    />
  );
}

export function TxtInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`w-full bg-input/40 border border-border rounded-xl px-3 py-2.5 text-base text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring ${props.className ?? ""}`}
    />
  );
}

export function Btn({
  children,
  variant = "primary",
  className = "",
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "ghost" | "success" | "danger" | "secondary" }) {
  const styles: Record<string, string> = {
    primary: "bg-primary text-primary-foreground hover:opacity-90 glow-primary",
    secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
    ghost: "bg-transparent text-foreground hover:bg-muted",
    success: "bg-success text-success-foreground hover:opacity-90",
    danger: "bg-destructive text-destructive-foreground hover:opacity-90",
  };
  return (
    <button
      {...rest}
      className={`rounded-xl px-4 py-2.5 font-semibold text-sm transition-all active:scale-[0.98] ${styles[variant]} ${className}`}
    >
      {children}
    </button>
  );
}
