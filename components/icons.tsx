// Small inline stroke icons, drawn in currentColor.
const base = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

type P = { className?: string };

export const Icon = {
  leaf: (p: P) => <svg {...base} {...p}><path d="M5 19c0-8 5-14 14-14 0 9-6 14-14 14Z" /><path d="M5 19 13 11" /></svg>,
  chart: (p: P) => <svg {...base} {...p}><path d="M5 20V12M11 20V6M17 20v-9" /></svg>,
  users: (p: P) => <svg {...base} {...p}><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20c.8-3.5 3.3-5.5 6.5-5.5s5.7 2 6.5 5.5" /><path d="M16 4.5a3.5 3.5 0 0 1 0 7M18 14.8c1.9.8 3.1 2.6 3.5 5.2" /></svg>,
  shield: (p: P) => <svg {...base} {...p}><path d="M12 3 4 6v6c0 4.5 3.4 8.2 8 9 4.6-.8 8-4.5 8-9V6l-8-3Z" /><path d="m9 12 2 2 4-4" /></svg>,
  doc: (p: P) => <svg {...base} {...p}><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5Z" /><path d="M14 3v5h5M9 13h6M9 17h6" /></svg>,
  download: (p: P) => <svg {...base} {...p}><path d="M12 4v11M7 10l5 5 5-5M4 20h16" /></svg>,
  check: (p: P) => <svg {...base} {...p}><path d="m5 12 5 5 9-10" /></svg>,
  home: (p: P) => <svg {...base} {...p} fill="currentColor" stroke="none"><path d="M12 3.2 2.8 11h2.7v9h5v-5.5h3V20h5v-9h2.7L12 3.2Z" /></svg>,
  grid: (p: P) => <svg {...base} {...p} fill="currentColor" stroke="none"><rect x="3" y="3" width="7.5" height="9" rx="1.5" /><rect x="13.5" y="3" width="7.5" height="5.5" rx="1.5" /><rect x="3" y="15" width="7.5" height="6" rx="1.5" /><rect x="13.5" y="11.5" width="7.5" height="9.5" rx="1.5" /></svg>,
  scale: (p: P) => <svg {...base} {...p}><path d="M12 3v18M7 21h10M5 7h14M12 5l-7 2M12 5l7 2" /><path d="M5 7 2.5 13a3 3 0 0 0 5 0L5 7ZM19 7l-2.5 6a3 3 0 0 0 5 0L19 7Z" /></svg>,
  target: (p: P) => <svg {...base} {...p}><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="5" /><path d="M12 12 20 4M16 4h4v4" /></svg>,
  bars: (p: P) => <svg {...base} {...p} strokeWidth={2.6}><path d="M5 20v-6M12 20V6M19 20v-10" /></svg>,
  pen: (p: P) => <svg {...base} {...p}><path d="M4 20h4L19 9l-4-4L4 16v4Z" /><path d="m13.5 6.5 4 4" /></svg>,
  user: (p: P) => <svg {...base} {...p}><circle cx="12" cy="8" r="4" /><path d="M4 21c1-4 4-6 8-6s7 2 8 6" /></svg>,
  logout: (p: P) => <svg {...base} {...p}><path d="M15 4h4v16h-4M10 8l-4 4 4 4M6 12h10" /></svg>,
  globe: (p: P) => <svg {...base} {...p}><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3c2.5 2.5 3.8 5.5 3.8 9S14.5 18.5 12 21c-2.5-2.5-3.8-5.5-3.8-9S9.5 5.5 12 3Z" /></svg>,
  building: (p: P) => <svg {...base} {...p}><path d="M4 21V5l8-2v18M12 8l8 2v11M2 21h20M7 9h2M7 13h2M7 17h2M15 13h2M15 17h2" /></svg>,
  search: (p: P) => <svg {...base} {...p}><circle cx="11" cy="11" r="6.5" /><path d="m16 16 4.5 4.5" /></svg>,
  chevron: (p: P) => <svg {...base} {...p}><path d="m9 6 6 6-6 6" /></svg>,
  chevronDown: (p: P) => <svg {...base} {...p}><path d="m6 9 6 6 6-6" /></svg>,
  info: (p: P) => <svg {...base} {...p}><circle cx="12" cy="12" r="9" /><path d="M12 11v5M12 8h.01" /></svg>,
  plus: (p: P) => <svg {...base} {...p}><path d="M12 5v14M5 12h14" /></svg>,
  lock: (p: P) => <svg {...base} {...p}><rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></svg>,
  settings: (p: P) => <svg {...base} {...p}><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.6 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.6-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9c.3.6.9 1 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z" /></svg>,
};

export type IconName = keyof typeof Icon;
