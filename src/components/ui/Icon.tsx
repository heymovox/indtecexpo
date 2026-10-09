import type { SVGProps } from "react";

export type IconName =
  | "machine"
  | "robot"
  | "chip"
  | "bolt"
  | "gauge"
  | "crane"
  | "pressure"
  | "gear"
  | "factory"
  | "service"
  | "handshake"
  | "target"
  | "network"
  | "display"
  | "link"
  | "brand"
  | "rocket"
  | "search"
  | "users"
  | "growth"
  | "phone"
  | "mail"
  | "whatsapp"
  | "map-pin"
  | "calendar"
  | "clock"
  | "arrow-right"
  | "arrow-left"
  | "chevron-down"
  | "chevron-right"
  | "download"
  | "zoom-in"
  | "zoom-out"
  | "maximize"
  | "menu"
  | "close"
  | "check"
  | "check-circle"
  | "star"
  | "building"
  | "ticket"
  | "grid"
  | "image"
  | "layers"
  | "shield"
  | "globe"
  | "quote"
  | "plus"
  | "minus"
  | "filter"
  | "external"
  | "car"
  | "list"
  | "stall"
  | "inbox"
  | "award"
  | "map"
  | "news"
  | "pen"
  | "settings"
  | "logout"
  | "refresh"
  | "eye";

const paths: Record<IconName, React.ReactNode> = {
  machine: (
    <>
      <rect x="2.5" y="5" width="19" height="12" rx="1.5" />
      <rect x="5" y="7.5" width="8.5" height="7" />
      <path d="M17 7.5v7M14.5 17v2.5M19.5 17v2.5M2.5 19h19" />
      <path d="M7.5 10.5h3.5M7.5 12.5h2" />
    </>
  ),
  robot: (
    <>
      <rect x="9" y="2.5" width="6" height="5" rx="1" />
      <path d="M12 7.5v4M6 21v-3a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v3" />
      <path d="M12 11.5 6.5 14M12 11.5 17.5 14" />
      <circle cx="12" cy="11.5" r="1.4" />
      <path d="M4 21h16" />
      <path d="M10.5 5h3" />
    </>
  ),
  chip: (
    <>
      <rect x="7" y="7" width="10" height="10" rx="1" />
      <rect x="9.5" y="9.5" width="5" height="5" />
      <path d="M10 7V3.5M14 7V3.5M10 20.5V17M14 20.5V17M7 10H3.5M7 14H3.5M20.5 10H17M20.5 14H17" />
    </>
  ),
  bolt: (
    <>
      <path d="M13 2.5 4.5 13.5H11l-1 8 8.5-11H12l1-8Z" />
      <path d="M3 21h18" />
    </>
  ),
  gauge: (
    <>
      <path d="M3.5 17a9 9 0 1 1 17 0" />
      <path d="m12 13 4-4" />
      <circle cx="12" cy="14.5" r="1.6" />
      <path d="M3.5 17h3M17.5 17h3M12 6.5v-3" />
    </>
  ),
  crane: (
    <>
      <path d="M4 21V4h13" />
      <path d="M4 4 9 9" />
      <path d="M17 4h3M17 4v9" />
      <rect x="15" y="13" width="4" height="3" />
      <path d="M17 16v3" />
      <path d="M2 21h6M14 21h6" />
    </>
  ),
  pressure: (
    <>
      <rect x="3" y="9" width="12" height="6" rx="1" />
      <path d="M15 12h4a2 2 0 0 1 2 2v3" />
      <path d="M6 9V6.5M12 9V6.5M6 15v2.5M12 15v2.5" />
      <path d="M3 6h12" />
      <circle cx="21" cy="19" r="1.6" />
    </>
  ),
  gear: (
    <>
      <circle cx="12" cy="12" r="3.2" />
      <path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.2 5.2l2.1 2.1M16.7 16.7l2.1 2.1M18.8 5.2l-2.1 2.1M7.3 16.7l-2.1 2.1" />
      <circle cx="12" cy="12" r="8.5" />
    </>
  ),
  factory: (
    <>
      <path d="M2.5 21V10l5.5 3.5V10l5.5 3.5V10l5.5 3.5V6.5a1.5 1.5 0 0 1 1.5-1.5h1" />
      <path d="M2.5 21h19" />
      <path d="M6 17.5v-3M11 17.5v-3M16 17.5v-3" />
      <path d="M5 6V3h3v4.5" />
    </>
  ),
  service: (
    <>
      <path d="M14.7 6.3a4.5 4.5 0 0 0 6 6L21 13l-8 8-2-2 8-8-0.7-0.3a4.5 4.5 0 0 0-6-6l3 3-2 2-3-3Z" />
      <path d="M3 21l4.5-1.5L4.5 16 3 21Z" />
      <path d="m7.5 19.5-6 3" />
    </>
  ),
  handshake: (
    <>
      <path d="m11 12 2 2 3-3 4 3.5" />
      <path d="M13 14 9.5 10.5" />
      <path d="M2 9.5 6 6h4l2 1.5L14 6h4l4 3.5" />
      <path d="M2 9.5v5a3 3 0 0 0 3 3h1" />
      <path d="M22 9.5v5a3 3 0 0 1-3 3h-1" />
      <path d="M6 6v4M10 6v4" />
    </>
  ),
  target: (
    <>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="5" />
      <circle cx="12" cy="12" r="1.4" />
      <path d="M12 1v3M12 20v3M1 12h3M20 12h3" />
    </>
  ),
  network: (
    <>
      <rect x="9" y="2.5" width="6" height="5" rx="1" />
      <rect x="2.5" y="16.5" width="6" height="5" rx="1" />
      <rect x="15.5" y="16.5" width="6" height="5" rx="1" />
      <path d="M12 7.5v4M5.5 16.5v-3a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v3" />
      <path d="M12 11.5v2" />
    </>
  ),
  display: (
    <>
      <rect x="2.5" y="4" width="19" height="12.5" rx="1.5" />
      <path d="M8 20.5h8M12 16.5v4" />
      <path d="M6 8.5h6M6 11.5h4" />
      <path d="M15.5 8.5h3v4h-3z" />
    </>
  ),
  link: (
    <>
      <path d="M10 13.5a4 4 0 0 0 5.7 0l3-3a4 4 0 1 0-5.7-5.7l-1.4 1.4" />
      <path d="M14 10.5a4 4 0 0 0-5.7 0l-3 3a4 4 0 1 0 5.7 5.7l1.4-1.4" />
    </>
  ),
  brand: (
    <>
      <path d="M12 2.5 3.5 6.5v6c0 5 3.6 8.4 8.5 9.5 4.9-1.1 8.5-4.5 8.5-9.5v-6L12 2.5Z" />
      <path d="m8.5 12 2.5 2.5 4.5-4.5" />
    </>
  ),
  rocket: (
    <>
      <path d="M12 2.5c3.5 2 5.5 5.5 5.5 9.5L14 16h-4l-3.5-4c0-4 2-7.5 5.5-9.5Z" />
      <circle cx="12" cy="10" r="2" />
      <path d="M8.5 16 6 19.5 9 18M15.5 16 18 19.5 15 18" />
      <path d="M10.5 19.5c.5 1.5 1 2 1.5 2s1-.5 1.5-2" />
    </>
  ),
  search: (
    <>
      <circle cx="10.5" cy="10.5" r="6.5" />
      <path d="m15.5 15.5 5 5" />
      <path d="M7.5 10.5h6M10.5 7.5v6" />
    </>
  ),
  users: (
    <>
      <circle cx="9" cy="8" r="3.5" />
      <path d="M2.5 20a6.5 6.5 0 0 1 13 0" />
      <path d="M16 5.2a3.5 3.5 0 0 1 0 6.6" />
      <path d="M17.5 14.5A6.5 6.5 0 0 1 21.5 20" />
    </>
  ),
  growth: (
    <>
      <path d="M3 17.5 9 11l4 4 8-8" />
      <path d="M15.5 7H21v5.5" />
      <path d="M3 21h18" />
    </>
  ),
  phone: (
    <>
      <path d="M6.5 3h3l1.5 4.5-2 1.5a12 12 0 0 0 6 6l1.5-2 4.5 1.5v3A2.5 2.5 0 0 1 18.5 20 15.5 15.5 0 0 1 4 5.5 2.5 2.5 0 0 1 6.5 3Z" />
    </>
  ),
  mail: (
    <>
      <rect x="2.5" y="5" width="19" height="14" rx="1.5" />
      <path d="m3 6.5 9 6.5 9-6.5" />
    </>
  ),
  whatsapp: (
    <>
      <path d="M3.5 20.5 5 16.4A8.4 8.4 0 1 1 8.2 19.4l-4.7 1.1Z" />
      <path d="M8.8 8.4c.4-.9.8-.9 1.1-.9h.9c.3 0 .7.1.9.7l.7 1.7c.1.3 0 .6-.2.8l-.6.7c-.2.2-.2.4-.1.6a7 7 0 0 0 3.2 3c.3.1.5.1.7-.1l.7-.8c.2-.2.5-.3.8-.2l1.7.8c.5.2.7.5.7.9v.9c0 .4-.2.9-1 1.2-.7.3-1.6.4-3.6-.4a10 10 0 0 1-5.4-5.3c-.7-1.6-.6-2.6-.5-3.6Z" />
    </>
  ),
  "map-pin": (
    <>
      <path d="M12 21s7-5.6 7-11a7 7 0 1 0-14 0c0 5.4 7 11 7 11Z" />
      <circle cx="12" cy="10" r="2.6" />
    </>
  ),
  calendar: (
    <>
      <rect x="3" y="5" width="18" height="16" rx="1.5" />
      <path d="M3 9.5h18M8 3v4M16 3v4" />
      <path d="M7.5 13.5h3M13.5 13.5h3M7.5 17h3" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 6.5V12l3.5 2.5" />
    </>
  ),
  "arrow-right": <path d="M4 12h15m-6-6 6 6-6 6" />,
  "arrow-left": <path d="M20 12H5m6-6-6 6 6 6" />,
  "chevron-down": <path d="m5 8.5 7 7 7-7" />,
  "chevron-right": <path d="m8.5 5 7 7-7 7" />,
  download: (
    <>
      <path d="M12 3v12m-5-5 5 5 5-5" />
      <path d="M4 19h16" />
    </>
  ),
  "zoom-in": (
    <>
      <circle cx="10.5" cy="10.5" r="6.5" />
      <path d="m15.5 15.5 5 5M7.5 10.5h6M10.5 7.5v6" />
    </>
  ),
  "zoom-out": (
    <>
      <circle cx="10.5" cy="10.5" r="6.5" />
      <path d="m15.5 15.5 5 5M7.5 10.5h6" />
    </>
  ),
  maximize: (
    <>
      <path d="M3 9V3h6M21 9V3h-6M3 15v6h6M21 15v6h-6" />
    </>
  ),
  menu: <path d="M3 6h18M3 12h18M3 18h18" />,
  close: <path d="M5 5l14 14M19 5 5 19" />,
  check: <path d="m4 12.5 5 5L20 6.5" />,
  "check-circle": (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="m7.5 12.5 3 3 6-6" />
    </>
  ),
  star: (
    <path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9L12 3Z" />
  ),
  building: (
    <>
      <path d="M3 21V4.5A1.5 1.5 0 0 1 4.5 3h9A1.5 1.5 0 0 1 15 4.5V21" />
      <path d="M15 9h4.5A1.5 1.5 0 0 1 21 10.5V21" />
      <path d="M2.5 21h19" />
      <path d="M6.5 7h5M6.5 11h5M6.5 15h5M17.5 13h1M17.5 17h1" />
    </>
  ),
  ticket: (
    <>
      <path d="M3 8.5V6a1 1 0 0 1 1-1h16a1 1 0 0 1 1 1v2.5a2.5 2.5 0 0 0 0 7V18a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-2.5a2.5 2.5 0 0 0 0-7Z" />
      <path d="M14 5v2.5M14 11v2.5M14 16.5V19" />
    </>
  ),
  grid: (
    <>
      <rect x="3" y="3" width="7.5" height="7.5" rx="1" />
      <rect x="13.5" y="3" width="7.5" height="7.5" rx="1" />
      <rect x="3" y="13.5" width="7.5" height="7.5" rx="1" />
      <rect x="13.5" y="13.5" width="7.5" height="7.5" rx="1" />
    </>
  ),
  image: (
    <>
      <rect x="3" y="4.5" width="18" height="15" rx="1.5" />
      <circle cx="8.5" cy="9.5" r="1.8" />
      <path d="m4 17 5-5 4 4 3-2.5 4 3.5" />
    </>
  ),
  layers: (
    <>
      <path d="m12 3 9 5-9 5-9-5 9-5Z" />
      <path d="m3 13 9 5 9-5" />
      <path d="m3 17.5 9 5 9-5" />
    </>
  ),
  shield: (
    <>
      <path d="M12 2.5 4 6v6c0 5 3.4 8.4 8 9.5 4.6-1.1 8-4.5 8-9.5V6l-8-3.5Z" />
      <path d="m9 12 2.2 2.2L15.5 10" />
    </>
  ),
  globe: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18" />
      <path d="M12 3a14 14 0 0 1 0 18 14 14 0 0 1 0-18Z" />
    </>
  ),
  quote: (
    <>
      <path d="M9 6.5C6.5 8 5 10.5 5 13.5c0 2.2 1.4 3.5 3.2 3.5 1.7 0 3-1.2 3-3s-1.2-3-2.9-3c-.3 0-.6 0-.8.1" />
      <path d="M19 6.5c-2.5 1.5-4 4-4 7 0 2.2 1.4 3.5 3.2 3.5 1.7 0 3-1.2 3-3s-1.2-3-2.9-3c-.3 0-.6 0-.8.1" />
    </>
  ),
  plus: <path d="M12 5v14M5 12h14" />,
  minus: <path d="M5 12h14" />,
  filter: (
    <>
      <path d="M3 5h18l-7 8v6l-4 2v-8L3 5Z" />
    </>
  ),
  external: (
    <>
      <path d="M14 4h6v6" />
      <path d="M20 4 11 13" />
      <path d="M18 14v5a1.5 1.5 0 0 1-1.5 1.5H5A1.5 1.5 0 0 1 3.5 19V7.5A1.5 1.5 0 0 1 5 6h5" />
    </>
  ),
  car: (
    <>
      <path d="M4 16.5h16M5.5 16.5V19H8v-2.5M16 16.5V19h2.5v-2.5" />
      <path d="M3.5 16.5v-4l2-5h13l2 5v4" />
      <path d="M5.5 12.5h13" />
      <circle cx="7.5" cy="14.5" r="1" />
      <circle cx="16.5" cy="14.5" r="1" />
    </>
  ),
  list: <path d="M8 6h13M8 12h13M8 18h13M3.5 6h.01M3.5 12h.01M3.5 18h.01" />,
  stall: (
    <>
      <path d="M3 9.5 5 4h14l2 5.5" />
      <path d="M3 9.5c0 1.4 1.1 2.5 2.5 2.5S8 10.9 8 9.5c0 1.4 1.1 2.5 2.5 2.5S13 10.9 13 9.5c0 1.4 1.1 2.5 2.5 2.5S18 10.9 18 9.5c0 1.4 1.1 2.5 2.5 2.5" />
      <path d="M5 12v8h14v-8M9 20v-4.5h4V20" />
      <path d="M4 20h16" />
    </>
  ),
  inbox: (
    <>
      <path d="M3 13.5 5.6 5.3A2 2 0 0 1 7.5 4h9a2 2 0 0 1 1.9 1.3L21 13.5" />
      <path d="M3 13.5h5l1.5 3h5l1.5-3h5v6a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 19.5v-6Z" />
    </>
  ),
  award: (
    <>
      <circle cx="12" cy="9" r="5.5" />
      <path d="m8.5 13.5-1.5 7 5-2.5 5 2.5-1.5-7" />
      <path d="m12 6.5.9 1.8 2 .3-1.4 1.4.3 2-1.8-1-1.8 1 .3-2-1.4-1.4 2-.3.9-1.8Z" />
    </>
  ),
  map: (
    <>
      <path d="M9 4 3.5 6.2v13.3L9 17.3l6 2.2 5.5-2.2V4L15 6.2 9 4Z" />
      <path d="M9 4v13.3M15 6.2v13.3" />
    </>
  ),
  news: (
    <>
      <path d="M4 5.5h13.5A2.5 2.5 0 0 1 20 8v10.5a1.5 1.5 0 0 1-1.5 1.5h-14A1.5 1.5 0 0 1 3 18.5V7a1.5 1.5 0 0 1 1-1.4" />
      <path d="M17.5 9.5H20v8a1.5 1.5 0 0 1-3 0" />
      <path d="M6.5 8.5h7M6.5 12h7M6.5 15.5h4.5" />
    </>
  ),
  pen: (
    <>
      <path d="M4 20h4L20 8a2.1 2.1 0 0 0-3-3L5 17v3Z" />
      <path d="m14.5 6.5 3 3M4 17l3 3" />
    </>
  ),
  settings: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 14.5a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.2a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.2a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.9.3H10a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.2a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9V10a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.2a1.7 1.7 0 0 0-1.4 1Z" />
    </>
  ),
  logout: (
    <>
      <path d="M9 21H5.5A1.5 1.5 0 0 1 4 19.5v-15A1.5 1.5 0 0 1 5.5 3H9" />
      <path d="m15.5 16.5 4.5-4.5-4.5-4.5M20 12H9" />
    </>
  ),
  refresh: (
    <>
      <path d="M20 11.5A8 8 0 0 0 6.3 6.3L3.5 9" />
      <path d="M3.5 4.5V9H8" />
      <path d="M4 12.5a8 8 0 0 0 13.7 5.2l2.8-2.7" />
      <path d="M20.5 19.5V15H16" />
    </>
  ),
  eye: (
    <>
      <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" />
      <circle cx="12" cy="12" r="3" />
    </>
  ),
};

interface IconProps extends Omit<SVGProps<SVGSVGElement>, "name"> {
  name: IconName;
  size?: number;
  strokeWidth?: number;
}

export function Icon({
  name,
  size = 24,
  strokeWidth = 1.6,
  ...props
}: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      {paths[name] ?? paths.grid}
    </svg>
  );
}
