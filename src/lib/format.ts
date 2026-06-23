export const fmtEUR = (n: number) => {
  const v = Math.round(n * 100) / 100;
  const sign = v < 0 ? "-" : "";
  const abs = Math.abs(v);
  const [int, dec = "00"] = abs.toFixed(2).split(".");
  const withSep = int.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `${sign}€${withSep},${dec}`;
};

export const fmtNum = (n: number, decimals = 0) =>
  n.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });

export const fmtDate = (iso: string) => {
  const d = new Date(iso);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}.${mm}.${yyyy}`;
};

export const fmtDateTime = (iso: string) => {
  const d = new Date(iso);
  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  return `${fmtDate(iso)} ${hh}:${mi}`;
};

export const todayISO = () => new Date().toISOString().slice(0, 10);

export const daysBetween = (a: string | Date, b: string | Date) => {
  const da = new Date(a); da.setHours(0, 0, 0, 0);
  const db = new Date(b); db.setHours(0, 0, 0, 0);
  return Math.round((db.getTime() - da.getTime()) / 86400000);
};

// days until a "due day" of current/next month
export const daysUntilDueDay = (dueDay: number) => {
  const now = new Date(); now.setHours(0, 0, 0, 0);
  let target = new Date(now.getFullYear(), now.getMonth(), dueDay);
  if (target < now) target = new Date(now.getFullYear(), now.getMonth() + 1, dueDay);
  return daysBetween(now, target);
};

export const nextDueDate = (dueDay: number): string => {
  const now = new Date(); now.setHours(0, 0, 0, 0);
  let target = new Date(now.getFullYear(), now.getMonth(), dueDay);
  if (target < now) target = new Date(now.getFullYear(), now.getMonth() + 1, dueDay);
  return target.toISOString().slice(0, 10);
};
