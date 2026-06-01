// v3 NavRail — left sidebar (desktop only). Hidden on mobile; the
// MobileBar takes over.

import Link from "next/link";
import { NetGuardGlyph } from "@/components/v3";

type Active = "dashboard" | "chat" | "settings" | null;

const ITEMS: { id: Exclude<Active, null>; href: string; icon: () => React.ReactElement; label: string }[] = [
  { id: "dashboard", href: "/dashboard", icon: GridIcon, label: "Dashboard" },
  { id: "chat",      href: "/chat",      icon: ChatIcon, label: "Chat" },
  { id: "settings",  href: "/settings",  icon: GearIcon, label: "Settings" },
];

export function SideNav({ active, email = "" }: { active: Active; email?: string }) {
  return (
    <aside className="sticky top-0 z-20 hidden h-screen w-[68px] shrink-0 flex-col items-center border-r border-cream/[0.06] bg-[#0a0d13] py-5 md:flex">
      <Link
        href="/"
        title="NetGuard home"
        aria-label="NetGuard home"
        className="ng-focus grid h-10 w-10 place-items-center rounded-xl ng-avatarB"
      >
        <NetGuardGlyph className="h-5 w-5 text-pitch" strokeWidth={1.9} />
      </Link>
      <nav className="mt-7 flex flex-1 flex-col items-center gap-2">
        {ITEMS.map((it) => {
          const Icon = it.icon;
          const on = active === it.id;
          return (
            <Link
              key={it.id}
              href={it.href}
              title={it.label}
              aria-label={it.label}
              aria-current={on ? "page" : undefined}
              className={
                "ng-focus group relative grid h-11 w-11 place-items-center rounded-xl transition-colors " +
                (on
                  ? "bg-teal/[0.12] text-teal"
                  : "text-cream/40 hover:bg-cream/[0.05] hover:text-cream/80")
              }
            >
              {on && (
                <span className="absolute -left-[14px] h-5 w-[3px] rounded-full bg-teal" />
              )}
              <Icon />
            </Link>
          );
        })}
      </nav>
      <button
        className="ng-focus grid h-9 w-9 place-items-center rounded-full bg-teal/15 text-[13px] font-semibold text-teal"
        aria-label="Account"
      >
        {email ? email[0]?.toUpperCase() : "?"}
      </button>
    </aside>
  );
}

function GridIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-[20px] w-[20px]">
      <rect x="3.5" y="3.5" width="7" height="7" rx="1.6" stroke="currentColor" strokeWidth="1.6" />
      <rect x="13.5" y="3.5" width="7" height="7" rx="1.6" stroke="currentColor" strokeWidth="1.6" />
      <rect x="3.5" y="13.5" width="7" height="7" rx="1.6" stroke="currentColor" strokeWidth="1.6" />
      <rect x="13.5" y="13.5" width="7" height="7" rx="1.6" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}
function ChatIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-[20px] w-[20px]">
      <path
        d="M4 5.5h16v10H9l-4 3.5v-3.5H4v-10Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}
function GearIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-[20px] w-[20px]">
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.6" />
      <path
        d="M12 2.8v2.4M12 18.8v2.4M21.2 12h-2.4M5.2 12H2.8M18.5 5.5l-1.7 1.7M7.2 16.8l-1.7 1.7M18.5 18.5l-1.7-1.7M7.2 7.2 5.5 5.5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}
