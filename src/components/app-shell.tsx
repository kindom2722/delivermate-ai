import Link from "next/link";

function navClass(active: boolean) {
  return active
    ? "rounded-full bg-slate-950 px-4 py-2 text-white shadow-[0_10px_24px_rgba(15,23,42,0.18)]"
    : "rounded-full px-4 py-2 text-slate-600 transition hover:bg-white/70 hover:text-slate-950";
}

export function AppShell({
  children,
  currentPath,
}: {
  children: React.ReactNode;
  currentPath: "/" | "/knowledge";
}) {
  return (
    <div className="min-h-screen bg-transparent text-[#17181c]">
      <header className="sticky top-0 z-30 px-4 pt-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-[1480px]">
          <div className="workbench-frame float-in px-5 py-4 sm:px-6">
            <div className="relative z-[1] flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <Link href="/" className="flex items-center gap-4">
                <span className="flex h-12 w-12 items-center justify-center rounded-[18px] bg-[linear-gradient(180deg,#2e7eff_0%,#125fe0_100%)] text-sm font-semibold text-white shadow-[0_16px_32px_rgba(30,110,232,0.28)]">
                  DM
                </span>
                <span>
                  <span className="block text-base font-semibold text-slate-950">DeliverMate AI</span>
                  <span className="block text-xs tracking-[0.18em] text-slate-500">DELIVERY WORKBENCH</span>
                </span>
              </Link>

              <nav className="flex items-center gap-2 text-sm font-medium">
                <Link href="/" className={navClass(currentPath === "/")}>
                  工作台
                </Link>
                <Link href="/knowledge" className={navClass(currentPath === "/knowledge")}>
                  知识库
                </Link>
              </nav>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1480px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</main>
    </div>
  );
}
