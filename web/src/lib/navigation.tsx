import type { ComponentType, SVGProps } from "react";

export interface NavItem {
  label: string;
  href: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  description: string;
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

/* Icons are inlined as tiny stroke SVGs to avoid extra dependencies. */
type IconProps = SVGProps<SVGSVGElement>;
const base = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  viewBox: "0 0 24 24",
};

const GridIcon = (p: IconProps) => (
  <svg {...base} {...p}>
    <path d="M4 5.5A1.5 1.5 0 0 1 5.5 4h3A1.5 1.5 0 0 1 10 5.5v3A1.5 1.5 0 0 1 8.5 10h-3A1.5 1.5 0 0 1 4 8.5v-3ZM14 5.5A1.5 1.5 0 0 1 15.5 4h3A1.5 1.5 0 0 1 20 5.5v3A1.5 1.5 0 0 1 18.5 10h-3A1.5 1.5 0 0 1 14 8.5v-3ZM4 15.5A1.5 1.5 0 0 1 5.5 14h3A1.5 1.5 0 0 1 10 15.5v3A1.5 1.5 0 0 1 8.5 20h-3A1.5 1.5 0 0 1 4 18.5v-3ZM14 15.5A1.5 1.5 0 0 1 15.5 14h3A1.5 1.5 0 0 1 20 15.5v3A1.5 1.5 0 0 1 18.5 20h-3a1.5 1.5 0 0 1-1.5-1.5v-3Z" />
  </svg>
);

const DirectoryIcon = (p: IconProps) => (
  <svg {...base} {...p}>
    <path d="M16 19v-1a3 3 0 0 0-3-3H6a3 3 0 0 0-3 3v1M9.5 11.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7ZM17 11.5a3 3 0 1 0 0-6M21 19v-1a3 3 0 0 0-2.4-2.94" />
  </svg>
);

const AgentIcon = (p: IconProps) => (
  <svg {...base} {...p}>
    <path d="M6 20V9.5L12 4l6 5.5V20" />
    <path d="M10.5 20v-4.5h3V20M4 20h16" />
    <path d="M12 8.5v.01M9.5 11h5" />
  </svg>
);

const StoreIcon = (p: IconProps) => (
  <svg {...base} {...p}>
    <path d="M4 9.5 5.2 4h13.6L20 9.5M4 9.5v9A1.5 1.5 0 0 0 5.5 20h13a1.5 1.5 0 0 0 1.5-1.5v-9M4 9.5c0 1.2 1 2.2 2.25 2.2S8.5 10.7 8.5 9.5c0 1.2 1 2.2 2.25 2.2s2.25-1 2.25-2.2c0 1.2 1 2.2 2.25 2.2s2.25-1 2.25-2.2c0 1.2 1 2.2 2.25 2.2S20 10.7 20 9.5" />
    <path d="M9.5 20v-5h5v5" />
  </svg>
);

const ReceiptIcon = (p: IconProps) => (
  <svg {...base} {...p}>
    <path d="M6 3.5h12V21l-2.5-1.5L13 21l-2.5-1.5L8 21l-2-1.5V3.5Z" />
    <path d="M9 8h6M9 11.5h6M9 15h3.5" />
  </svg>
);

const ShieldIcon = (p: IconProps) => (
  <svg {...base} {...p}>
    <path d="M12 3.5 5 6v5.5c0 4.3 3 7.6 7 9 4-1.4 7-4.7 7-9V6l-7-2.5Z" />
    <path d="m9.3 11.8 2 2 3.4-3.9" />
  </svg>
);

export const NAV_GROUPS: NavGroup[] = [
  {
    label: "Platform",
    items: [
      {
        label: "Overview",
        href: "/",
        icon: GridIcon,
        description: "Marketplace activity and key statistics",
      },
      {
        label: "Agent Directory",
        href: "/agents",
        icon: DirectoryIcon,
        description: "Registered agents and their verification statuses",
      },
      {
        label: "My Agents",
        href: "/my-agents",
        icon: AgentIcon,
        description: "Agents owned by the connected Concordium wallet",
      },
    ],
  },
  {
    label: "Commerce",
    items: [
      {
        label: "Marketplace",
        href: "/marketplace",
        icon: StoreIcon,
        description: "Services offered by agents",
      },
      {
        label: "Transactions",
        href: "/transactions",
        icon: ReceiptIcon,
        description: "x402 payments and transaction history",
      },
    ],
  },
  {
    label: "Assurance",
    items: [
      {
        label: "Trust & Verification",
        href: "/trust",
        icon: ShieldIcon,
        description: "Concordium identity and badge verification",
      },
    ],
  },
];

export const TOPBAR_LINKS: NavItem[] = NAV_GROUPS.flatMap((g) => g.items);
