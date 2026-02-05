"use client";

import { useEffect, useState } from "react";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronsLeft, ChevronsRight, Menu, X } from "lucide-react";

import { cn } from "@/lib/utils";
import { NAV_ITEMS } from "@/lib/navigation";
import { ResetOnReload } from "@/components/layout/ResetOnReload";

export function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    const stored = window.localStorage.getItem("academic.sidebarCollapsed");
    if (stored) {
      setSidebarCollapsed(stored === "true");
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem("academic.sidebarCollapsed", String(sidebarCollapsed));
  }, [sidebarCollapsed]);

  return (
    <ResetOnReload>
      <div className="h-screen overflow-hidden bg-slate-50">
        <div className="flex h-full lg:flex">
          <aside
            className={cn(
              "fixed inset-y-0 left-0 z-30 flex h-screen w-64 flex-col overflow-hidden border-r border-slate-200 bg-white py-6 shadow-sm transition-transform lg:static lg:translate-x-0 lg:shadow-none",
              sidebarCollapsed ? "lg:w-20" : "lg:w-64",
              sidebarOpen ? "translate-x-0" : "-translate-x-full",
            )}
          >
            <div className={cn("flex items-center justify-between px-4", sidebarCollapsed ? "lg:px-3" : "lg:px-4")}>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-600 text-sm font-semibold text-white">
                  AO
                </div>
                <div className={cn(sidebarCollapsed ? "lg:hidden" : "")}>
                  <p className="text-xs font-semibold tracking-[0.24em] text-emerald-600 uppercase">AcademicOS</p>
                  <p className="text-lg font-semibold text-slate-900">Management Suite</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSidebarOpen(false)}
                  className="rounded-lg border border-slate-200 p-2 text-slate-500 hover:bg-slate-100 lg:hidden"
                  aria-label="Close sidebar"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            <nav className={cn("mt-8 flex flex-1 flex-col gap-1 px-4", sidebarCollapsed ? "lg:px-3" : "lg:px-4")}>
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const isActive = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setSidebarOpen(false)}
                    title={item.label}
                    className={cn(
                      "flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition",
                      isActive
                        ? "bg-emerald-50 text-emerald-700"
                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
                      sidebarCollapsed ? "lg:justify-center lg:px-2" : "",
                    )}
                  >
                    <span
                      className={cn(
                        "flex h-8 w-8 items-center justify-center rounded-lg",
                        isActive ? "bg-white" : "bg-slate-100",
                      )}
                    >
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className={cn(sidebarCollapsed ? "lg:hidden" : "")}>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </aside>

          {sidebarOpen && (
            <button
              type="button"
              className="fixed inset-0 z-20 bg-slate-900/40 lg:hidden"
              onClick={() => setSidebarOpen(false)}
              aria-label="Close navigation overlay"
            />
          )}

          <div className="flex min-h-screen flex-1 flex-col">
            <header className="z-10 border-b border-slate-200 bg-white/90 backdrop-blur">
              <div className="flex items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setSidebarOpen(true)}
                    className="rounded-lg border border-slate-200 p-2 text-slate-500 hover:bg-slate-100 lg:hidden"
                    aria-label="Open sidebar"
                  >
                    <Menu className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setSidebarCollapsed((prev) => !prev)}
                    className="hidden rounded-lg border border-slate-200 p-2 text-slate-500 hover:bg-slate-100 lg:inline-flex"
                    aria-label="Toggle sidebar"
                  >
                    {sidebarCollapsed ? <ChevronsRight className="h-4 w-4" /> : <ChevronsLeft className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            </header>
            <main className="flex-1 overflow-y-auto px-4 py-6 sm:px-6 lg:px-8">{children}</main>
          </div>
        </div>
      </div>
    </ResetOnReload>
  );
}
