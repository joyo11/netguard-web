// Shared v3 primitives — anchored on Variant B's expressive language.
// NetGuardGlyph (shield + spark), Aurora bg field, Pill status, Toggle,
// AvatarB (the AI glyph tile).

import type { ReactNode } from "react";

export function NetGuardGlyph({
  className = "",
  strokeWidth = 1.6,
  style,
}: {
  className?: string;
  strokeWidth?: number;
  style?: React.CSSProperties;
}) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} style={style} aria-hidden="true">
      <path
        d="M12 2.6 4.6 5.5v5.9c0 4.6 3.1 8.2 7.4 9.9 4.3-1.7 7.4-5.3 7.4-9.9V5.5L12 2.6Z"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinejoin="round"
      />
      <path
        d="M12 7.7l1.05 2.7 2.7 1.05-2.7 1.05L12 15.2l-1.05-2.7-2.7-1.05 2.7-1.05L12 7.7Z"
        fill="currentColor"
      />
    </svg>
  );
}

export function Aurora({
  className = "",
  reduced = false,
}: {
  className?: string;
  reduced?: boolean;
}) {
  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}
    >
      <div
        className={`absolute -top-48 left-1/2 h-[560px] w-[840px] -translate-x-1/2 rounded-full bg-teal/[0.10] blur-[130px] ${
          !reduced ? "ng-aurora" : ""
        }`}
      />
      <div className="absolute bottom-[-200px] right-[-120px] h-[420px] w-[420px] rounded-full bg-teal/[0.05] blur-[130px]" />
    </div>
  );
}

export function AvatarB({
  size = 34,
  thinking = false,
}: {
  size?: number;
  thinking?: boolean;
}) {
  return (
    <span
      className="relative grid shrink-0 place-items-center rounded-[10px] ng-avatarB"
      style={{ width: size, height: size }}
    >
      {thinking && <span className="absolute inset-0 ng-ring" aria-hidden="true" />}
      <NetGuardGlyph
        className="text-pitch"
        style={{ width: size * 0.56, height: size * 0.56 }}
        strokeWidth={1.8}
      />
    </span>
  );
}

const STATUS = {
  safe:    { dot: "bg-teal",   text: "text-teal",   ring: "border-teal/30",   bg: "bg-teal/[0.08]",   label: "Safe"  },
  watch:   { dot: "bg-amber",  text: "text-amber",  ring: "border-amber/30",  bg: "bg-amber/[0.08]",  label: "Watch" },
  alert:   { dot: "bg-danger", text: "text-danger", ring: "border-danger/35", bg: "bg-danger/[0.10]", label: "Alert" },
  neutral: { dot: "bg-cream/40", text: "text-cream/55", ring: "border-cream/15", bg: "bg-cream/[0.05]", label: "—" },
} as const;

export type PillState = keyof typeof STATUS;

export function Pill({
  state = "safe",
  live = false,
  children,
  className = "",
}: {
  state?: PillState;
  live?: boolean;
  children?: ReactNode;
  className?: string;
}) {
  const s = STATUS[state];
  return (
    <span
      className={
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[12px] font-medium " +
        `${s.ring} ${s.bg} ${s.text} ${className}`
      }
    >
      <span className={`h-1.5 w-1.5 rounded-full ${s.dot} ${live ? "ng-livedot" : ""}`} />
      {children ?? s.label}
    </span>
  );
}

export function Toggle({
  checked,
  onChange,
  locked = false,
  label,
}: {
  checked: boolean;
  onChange?: (v: boolean) => void;
  locked?: boolean;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={locked}
      onClick={() => !locked && onChange?.(!checked)}
      className={
        "ng-focus relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors " +
        (checked ? "bg-teal" : "bg-cream/15") +
        (locked ? " cursor-not-allowed opacity-60" : "")
      }
    >
      <span
        className={
          "inline-block h-[18px] w-[18px] transform rounded-full bg-pitch shadow transition-transform " +
          (checked ? "translate-x-[22px]" : "translate-x-[3px]")
        }
      />
    </button>
  );
}

export function WordmarkV3({ size = 22, className = "" }: { size?: number; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <span
        className="grid place-items-center rounded-[8px] ng-avatarB"
        style={{ width: size + 8, height: size + 8 }}
      >
        <NetGuardGlyph
          className="text-pitch"
          style={{ width: size * 0.62, height: size * 0.62 }}
          strokeWidth={1.9}
        />
      </span>
      <span className="text-[16px] font-semibold tracking-tight text-cream">NetGuard</span>
    </span>
  );
}

/* Sprinkle of completion particles (variant B reward) */
export function Particles({ origin = "center" }: { origin?: "center" | "avatar" }) {
  const n = 7;
  const pos = origin === "avatar" ? "left-[17px] top-[17px]" : "left-1/2 top-1/2";
  return (
    <span aria-hidden="true" className={`pointer-events-none absolute ${pos}`}>
      {Array.from({ length: n }).map((_, i) => {
        const ang = (360 / n) * i + 12;
        const dist = 26 + (i % 3) * 8;
        const tx = `${Math.cos((ang * Math.PI) / 180) * dist}px`;
        const ty = `${Math.sin((ang * Math.PI) / 180) * dist}px`;
        return (
          <span
            key={i}
            className="ng-particle absolute h-1 w-1 rounded-full bg-teal"
            style={
              {
                "--tx": tx,
                "--ty": ty,
                animationDelay: `${i * 18}ms`,
              } as React.CSSProperties
            }
          />
        );
      })}
    </span>
  );
}
