// Top bar shown only on mobile (md:hidden). Replaces the SideNav rail
// since 72px of fixed left chrome eats too much of a phone screen.

import Link from "next/link";
import { ChatIcon, Gear, Grid, Shield } from "@/components/icons";

const TABS: { id: "dashboard" | "settings" | "chat"; href: string; icon: typeof Grid; label: string }[] = [
  { id: "dashboard", href: "/dashboard", icon: Grid,     label: "Dashboard" },
  { id: "chat",      href: "/chat",      icon: ChatIcon, label: "Chat" },
  { id: "settings",  href: "/settings",  icon: Gear,     label: "Settings" },
];

export function MobileBar({
  active,
}: {
  active: "dashboard" | "settings" | "chat" | null;
}) {
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-white/[0.06] bg-[#0a0d13]/85 px-4 backdrop-blur-xl md:hidden">
      <Link href="/" className="flex items-center gap-2">
        <Shield className="h-6 w-6" />
        <span className="text-[14px] font-semibold tracking-[-0.01em]">NetGuard</span>
      </Link>
      <nav className="flex items-center gap-1">
        {TABS.map((t) => {
          const Icon = t.icon;
          const on = active === t.id;
          return (
            <Link
              key={t.id}
              href={t.href}
              title={t.label}
              className={
                "grid h-10 w-10 place-items-center rounded-lg transition " +
                (on
                  ? "bg-white/[0.08] text-ng-ink"
                  : "text-ng-faint hover:bg-white/[0.04] hover:text-ng-sub")
              }
            >
              <Icon className="h-[18px] w-[18px]" />
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
