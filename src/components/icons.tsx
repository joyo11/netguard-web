// Shared icon set — single source of truth so every screen renders identical glyphs.
import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement> & { className?: string };

export function Shield({ className }: IconProps) {
  return (
    <svg viewBox="0 0 28 28" className={className} fill="none">
      <path
        d="M14 2.5l9 3.2v7.1c0 5.6-3.8 9.9-9 12.2-5.2-2.3-9-6.6-9-12.2V5.7l9-3.2z"
        fill="rgba(61,220,151,0.1)"
        stroke="#3DDC97"
        strokeWidth="1.4"
      />
      <path
        d="M9.6 14.2l3 3 5.4-6"
        stroke="#3DDC97"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function ShieldCheck({ className }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" className={className} fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="M10 1.8l6.5 2.3v5c0 4-2.7 7.1-6.5 8.7C6.2 16.2 3.5 13.1 3.5 9.1v-5L10 1.8z" />
      <path d="M7 9.8l2.2 2.2L13.2 7.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function Check({ className }: IconProps) {
  return (
    <svg viewBox="0 0 16 16" className={className} fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 8.5l3.5 3.5L13 4.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function Cross({ className }: IconProps) {
  return (
    <svg viewBox="0 0 16 16" className={className} fill="none" stroke="currentColor" strokeWidth="1.7">
      <path d="M4 4l8 8M12 4l-8 8" strokeLinecap="round" />
    </svg>
  );
}

export function Close({ className }: IconProps) {
  return (
    <svg viewBox="0 0 16 16" className={className} fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="M4 4l8 8M12 4l-8 8" strokeLinecap="round" />
    </svg>
  );
}

export function Copy({ className }: IconProps) {
  return (
    <svg viewBox="0 0 16 16" className={className} fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="5.5" y="5.5" width="8" height="8" rx="1.8" />
      <path d="M10.5 5.5V4a1.5 1.5 0 0 0-1.5-1.5H4A1.5 1.5 0 0 0 2.5 4v5A1.5 1.5 0 0 0 4 10.5h1.5" />
    </svg>
  );
}

export function Download({ className }: IconProps) {
  return (
    <svg viewBox="0 0 16 16" className={className} fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M8 2.5v8M5 7.5l3 3 3-3M3 13h10" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function Grid({ className }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" className={className} fill="none" stroke="currentColor" strokeWidth="1.6">
      <rect x="2.5" y="2.5" width="6" height="6" rx="1.5" />
      <rect x="11.5" y="2.5" width="6" height="6" rx="1.5" />
      <rect x="2.5" y="11.5" width="6" height="6" rx="1.5" />
      <rect x="11.5" y="11.5" width="6" height="6" rx="1.5" />
    </svg>
  );
}

export function Gear({ className }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" className={className} fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="10" cy="10" r="2.6" />
      <path d="M10 1.8v2.3M10 15.9v2.3M18.2 10h-2.3M4.1 10H1.8M15.8 4.2l-1.6 1.6M5.8 14.2l-1.6 1.6M15.8 15.8l-1.6-1.6M5.8 5.8L4.2 4.2" />
    </svg>
  );
}

export function Spark({ className }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" className={className} fill="currentColor">
      <path d="M10 1.6l1.7 4.9 4.9 1.7-4.9 1.7L10 14.8 8.3 9.9 3.4 8.2l4.9-1.7L10 1.6z" />
    </svg>
  );
}

export function Expand({ className }: IconProps) {
  return (
    <svg viewBox="0 0 16 16" className={className} fill="none" stroke="currentColor" strokeWidth="1.6">
      <path
        d="M6 2.5H2.5V6M10 2.5h3.5V6M6 13.5H2.5V10M10 13.5h3.5V10"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function ChevRight({ className }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" className={className} fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="M8 5l5 5-5 5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function ArrowUpRight({ className }: IconProps) {
  return (
    <svg viewBox="0 0 16 16" className={className} fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M5 11l6-6M6 5h5v5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function Paperclip({ className }: IconProps) {
  return (
    <svg viewBox="0 0 16 16" className={className} fill="none" stroke="currentColor" strokeWidth="1.5">
      <path
        d="M11.5 7.5l-4.2 4.2a2.3 2.3 0 0 1-3.3-3.3l5-5a1.6 1.6 0 0 1 2.3 2.3l-5 5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function Send({ className }: IconProps) {
  return (
    <svg viewBox="0 0 16 16" className={className} fill="none" stroke="currentColor" strokeWidth="1.7">
      <path d="M3 8h9M8 4l4 4-4 4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function Collapse({ className }: IconProps) {
  return (
    <svg viewBox="0 0 16 16" className={className} fill="none" stroke="currentColor" strokeWidth="1.6">
      <path
        d="M10 2.5h3.5V6M6 13.5H2.5V10M13.5 2.5L9.5 6.5M2.5 13.5l4-4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function Dot({ className }: IconProps) {
  return (
    <svg viewBox="0 0 8 8" className={className} fill="currentColor">
      <circle cx="4" cy="4" r="4" />
    </svg>
  );
}

export function Filter({ className }: IconProps) {
  return (
    <svg viewBox="0 0 16 16" className={className} fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M2.5 4h11M4.5 8h7M6.5 12h3" strokeLinecap="round" />
    </svg>
  );
}

export function FeedIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 22 22" className={className} fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="M3 6h16M3 11h16M3 16h10" strokeLinecap="round" />
      <circle cx="18" cy="16" r="1.4" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function ChatIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 22 22" className={className} fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="M3.5 5.5h15v9h-8l-4 3v-3h-3v-9z" strokeLinejoin="round" />
      <path d="M7 9h8M7 11.5h5" strokeLinecap="round" />
    </svg>
  );
}

export function ShieldFeatureIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 22 22" className={className} fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="M11 2.5l7 2.5v5.4c0 4.3-2.9 7.6-7 9.1-4.1-1.5-7-4.8-7-9.1V5L11 2.5z" />
      <path d="M7.8 11l2.2 2.2 4.2-4.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
