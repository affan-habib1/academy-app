"use client";

import { useEffect, useState } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";

export function ResetOnReload({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let isMounted = true;
    fetch(`${API_BASE}/__reset`, { method: "POST" })
      .catch(() => null)
      .finally(() => {
        if (isMounted) {
          setReady(true);
        }
      });
    return () => {
      isMounted = false;
    };
  }, []);

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="rounded-2xl border border-slate-200 bg-white px-6 py-4 text-sm text-slate-600 shadow-sm">
          Syncing academic data...
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
