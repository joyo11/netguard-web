// Skeleton shown during server-render of /chat.

import Link from "next/link";
import { MobileBar } from "@/components/mobile-bar";
import { Aurora, AvatarB } from "@/components/v3";

export default function ChatLoading() {
  return (
    <div className="relative flex h-full min-h-screen flex-col overflow-hidden bg-pitch text-cream font-display antialiased">
      <Aurora />
      <MobileBar active="chat" />
      <header className="relative z-10 hidden items-center justify-between px-6 py-4 sm:px-8 md:flex">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="ng-focus flex items-center gap-2 rounded-lg px-2 py-1.5 text-cream/55"
          >
            <span className="block h-4 w-4 rounded ng-shimmer bg-cream/[0.06]" />
            <span className="block h-3 w-20 rounded ng-shimmer bg-cream/[0.06]" />
          </Link>
          <span className="h-5 w-px bg-cream/10" />
          <div className="flex items-center gap-3">
            <AvatarB size={30} />
            <span className="block h-4 w-24 rounded ng-shimmer bg-cream/[0.06]" />
          </div>
        </div>
        <span className="block h-7 w-40 rounded-full ng-shimmer bg-cream/[0.06]" />
      </header>
      <main className="relative z-10 flex-1 overflow-y-auto">
        <div className="mx-auto flex min-h-[60vh] w-full max-w-[720px] flex-col items-center justify-center px-5">
          <AvatarB size={62} thinking />
          <span className="mt-6 block h-6 w-[280px] max-w-full rounded ng-shimmer bg-cream/[0.06]" />
          <span className="mt-3 block h-3.5 w-[320px] max-w-full rounded ng-shimmer bg-cream/[0.06]" />
        </div>
      </main>
    </div>
  );
}
