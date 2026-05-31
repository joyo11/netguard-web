import Link from "next/link";
import { Gear, Grid, Shield } from "@/components/icons";

type Active = "dashboard" | "settings" | null;

const ITEMS: { id: Exclude<Active, null>; href: string; icon: typeof Grid; label: string }[] = [
  { id: "dashboard", href: "/dashboard", icon: Grid, label: "Dashboard" },
  { id: "settings",  href: "/settings",  icon: Gear, label: "Settings" },
];

export function SideNav({ active }: { active: Active }) {
  return (
    <nav className="sticky top-0 z-20 hidden h-screen w-[72px] shrink-0 flex-col items-center border-r border-white/[0.06] bg-[#0a0d13]/60 py-5 backdrop-blur-xl md:flex">
      <Link
        href="/"
        title="NetGuard"
        className="grid h-10 w-10 place-items-center"
      >
        <Shield className="h-8 w-8" />
      </Link>

      <div className="mt-7 flex flex-1 flex-col gap-1.5">
        {ITEMS.map((it) => {
          const Icon = it.icon;
          const on = active === it.id;
          return (
            <Link
              key={it.id}
              href={it.href}
              title={it.label}
              className={
                "group relative grid h-11 w-11 place-items-center rounded-xl transition " +
                (on
                  ? "bg-white/[0.07] text-ng-ink"
                  : "text-ng-faint hover:bg-white/[0.04] hover:text-ng-sub")
              }
            >
              {on && (
                <span className="absolute -left-[14px] h-5 w-[3px] rounded-full bg-ng-teal" />
              )}
              <Icon className="h-[18px] w-[18px]" />
            </Link>
          );
        })}
      </div>

      <button className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-ng-teal/80 to-emerald-600 text-[12px] font-semibold text-ng-canvas">
        D
      </button>
    </nav>
  );
}
