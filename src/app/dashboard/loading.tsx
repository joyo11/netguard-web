// Skeleton shown during server-render of /dashboard. Matches the v3
// layout shape so the page doesn't visually jump when real content swaps in.

import { SideNav } from "@/components/side-nav";
import { MobileBar } from "@/components/mobile-bar";
import { Aurora } from "@/components/v3";

export default function DashboardLoading() {
  return (
    <div className="relative flex min-h-screen bg-pitch font-display text-cream antialiased">
      <Aurora className="!h-[420px] opacity-50" />
      <SideNav active="dashboard" />
      <main className="ng-scroll relative z-10 flex flex-1 flex-col overflow-y-auto">
        <MobileBar active="dashboard" />
        <div className="mx-auto w-full max-w-[1100px] px-5 py-7 sm:px-8 sm:py-9">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-2">
              <Block w="w-44" h="h-7" />
              <Block w="w-64" h="h-4" />
            </div>
            <div className="flex items-center gap-2.5">
              <Block w="w-36" h="h-9" rounded="rounded-full" />
              <Block w="w-9" h="h-9" rounded="rounded-lg" />
              <Block w="w-36" h="h-9" rounded="rounded-lg" />
              <Block w="w-9" h="h-9" rounded="rounded-full" />
            </div>
          </div>

          {/* Status banner skeleton */}
          <div className="mt-7 rounded-2xl border border-cream/[0.05] bg-cream/[0.015] p-5">
            <div className="flex items-center gap-3.5">
              <Block w="w-11" h="h-11" rounded="rounded-xl" />
              <div className="flex-1 space-y-2">
                <Block w="w-48" h="h-4" />
                <Block w="w-32" h="h-3" />
              </div>
              <div className="hidden gap-7 sm:flex">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="space-y-2 text-right">
                    <Block w="w-10" h="h-6" />
                    <Block w="w-16" h="h-3" />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Table skeleton */}
          <div className="mt-6 overflow-hidden rounded-2xl border border-cream/[0.05] bg-cream/[0.01]">
            <div className="flex items-center justify-between px-5 py-4">
              <Block w="w-28" h="h-5" />
              <Block w="w-20" h="h-4" />
            </div>
            <div className="border-y border-cream/[0.05]" />
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="flex items-center gap-3 border-b border-cream/[0.04] px-5 py-3.5"
                style={{ opacity: 1 - i * 0.06 }}
              >
                <Block w="w-12" h="h-3" />
                <div className="flex-1 space-y-1.5">
                  <Block w="w-32" h="h-3.5" />
                  <Block w="w-24" h="h-2.5" />
                </div>
                <Block w="w-44" h="h-3.5" />
                <Block w="w-10" h="h-3" />
                <Block w="w-12" h="h-3" />
                <Block w="w-16" h="h-5" rounded="rounded-full" />
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}

function Block({
  w,
  h,
  rounded = "rounded",
}: {
  w: string;
  h: string;
  rounded?: string;
}) {
  return <span className={`block ${w} ${h} ${rounded} ng-shimmer bg-cream/[0.06]`} />;
}
