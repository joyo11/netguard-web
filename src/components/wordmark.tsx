import Link from "next/link";
import { Shield } from "@/components/icons";

export function Wordmark({ size = "md" }: { size?: "sm" | "md" }) {
  const icon = size === "sm" ? "h-5 w-5" : "h-7 w-7";
  const text = size === "sm" ? "text-[13.5px]" : "text-[16px]";
  return (
    <Link
      href="/"
      className="flex items-center gap-2.5 text-ng-ink no-underline transition hover:opacity-90"
    >
      <Shield className={icon} />
      <span className={`${text} font-semibold tracking-[-0.01em]`}>NetGuard</span>
    </Link>
  );
}
