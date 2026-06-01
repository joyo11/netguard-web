"use client";

// Avatar button at the foot of the side rail. Click opens a small popover
// showing the signed-in email + a sign-out form (POSTs to /auth/signout).

import { useEffect, useRef, useState } from "react";

type Placement = "rail" | "header";

export function AccountMenu({
  email,
  placement = "rail",
}: {
  email: string;
  placement?: Placement;
}) {
  const [open, setOpen] = useState(false);
  const wrap = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const onDocClick = (e: MouseEvent) => {
      if (!wrap.current?.contains(e.target as Node)) setOpen(false);
    };
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onEsc);
    };
  }, [open]);

  const initial = email ? email[0]?.toUpperCase() : "?";

  const triggerClass =
    placement === "header"
      ? "ng-focus grid h-9 w-9 place-items-center rounded-full border border-cream/10 bg-teal/15 text-[13px] font-semibold text-teal transition-transform hover:scale-105 active:scale-95"
      : "ng-focus grid h-9 w-9 place-items-center rounded-full bg-teal/15 text-[13px] font-semibold text-teal transition-transform hover:scale-105 active:scale-95";

  const menuClass =
    placement === "header"
      ? "absolute right-0 top-[44px] z-50 w-[244px] origin-top-right overflow-hidden rounded-xl border border-cream/10 bg-[#0d111a] shadow-[0_24px_60px_-20px_rgba(0,0,0,0.7)] ng-pop"
      : "absolute bottom-0 left-[54px] z-50 w-[244px] origin-bottom-left overflow-hidden rounded-xl border border-cream/10 bg-[#0d111a] shadow-[0_24px_60px_-20px_rgba(0,0,0,0.7)] ng-pop";

  return (
    <div ref={wrap} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Account"
        title={email || "Account"}
        className={triggerClass}
      >
        {initial}
      </button>

      {open && (
        <div role="menu" className={menuClass}>
          <div className="border-b border-cream/[0.06] px-4 py-3">
            <p className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-cream/35">
              Signed in as
            </p>
            <p className="mt-1 truncate text-[13.5px] text-cream/85">{email || "—"}</p>
          </div>
          <form action="/auth/signout" method="post">
            <button
              type="submit"
              className="ng-focus flex w-full items-center gap-3 px-4 py-3 text-left text-[13.5px] text-cream/80 transition-colors hover:bg-cream/[0.04]"
            >
              <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4 text-cream/55">
                <path
                  d="M14 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2v-2M10 12h11m0 0-3-3m3 3-3 3"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              Sign out
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
