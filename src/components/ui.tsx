import { clsx } from "clsx";

export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight text-slate-950">{title}</h2>
        <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-600">{description}</p>
      </div>
      {action}
    </div>
  );
}

export function Panel({
  children,
  className,
  id,
  style,
}: {
  children: React.ReactNode;
  className?: string;
  id?: string;
  style?: React.CSSProperties;
}) {
  return (
    <section id={id} className={clsx("slab-panel p-6", className)} style={style}>
      {children}
    </section>
  );
}

export function StatCard({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="inset-panel px-4 py-4">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-slate-950">{value}</p>
      <p className="mt-1 text-xs text-slate-500">{hint}</p>
    </div>
  );
}

export function Badge({
  children,
  tone = "slate",
}: {
  children: React.ReactNode;
  tone?: "slate" | "teal" | "amber" | "red";
}) {
  const tones = {
    slate: "border-slate-200 bg-white/88 text-slate-700",
    teal: "border-blue-200 bg-blue-50/90 text-blue-700",
    amber: "border-amber-200 bg-amber-50/90 text-amber-700",
    red: "border-red-200 bg-red-50/90 text-red-700",
  };

  return (
    <span className={clsx("inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold", tones[tone])}>
      {children}
    </span>
  );
}

export const inputClass =
  "focus-ring w-full rounded-[20px] border border-slate-200/80 bg-white/88 px-4 py-3 text-sm text-slate-900 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] transition placeholder:text-slate-400 focus:border-blue-400";

export const buttonClass =
  "focus-ring inline-flex items-center justify-center rounded-[18px] border border-[#1560de] bg-[linear-gradient(180deg,#2f80ff_0%,#1465e8_100%)] px-5 py-3 text-sm font-semibold text-white shadow-[0_16px_32px_rgba(30,110,232,0.26)] transition hover:brightness-105 disabled:cursor-not-allowed disabled:border-slate-300 disabled:bg-slate-300 disabled:shadow-none";

export const secondaryButtonClass =
  "focus-ring inline-flex items-center justify-center rounded-[18px] border border-slate-200/80 bg-white/90 px-4 py-3 text-sm font-semibold text-slate-800 shadow-[0_10px_24px_rgba(15,23,42,0.06)] transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-60";
