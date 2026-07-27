import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  FileText,
  LayoutGrid,
  Map,
  MessageSquare,
  Code2,
  AlertTriangle,
} from "lucide-react";

export type NavItem = {
  title: string;
  href: string;
  icon: LucideIcon;
  status?: "active" | "coming";
};

export const dashboardNav: NavItem[] = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutGrid,
    status: "coming",
  },
  {
    title: "Resume Analysis",
    href: "/resume/analysis",
    icon: FileText,
    status: "active",
  },
  {
    title: "Interviews",
    href: "/interviews",
    icon: MessageSquare,
    status: "active",
  },
  {
    title: "Coding Workspace",
    href: "/coding",
    icon: Code2,
    status: "active",
  },
  {
    title: "Analytics",
    href: "/analytics",
    icon: BarChart3,
    status: "active",
  },
  {
    title: "Weakness Analysis",
    href: "/weakness",
    icon: AlertTriangle,
    status: "active",
  },
  {
    title: "Roadmaps",
    href: "/roadmaps",
    icon: Map,
    status: "active",
  },
];


export const landingFeatures = [
  {
    title: "Resume Intelligence",
    description:
      "Instant parsing with structured insights that hiring teams can scan fast.",
  },
  {
    title: "AI Interviews",
    description:
      "Adaptive questions calibrated to skill depth, role focus, and growth areas.",
  },
  {
    title: "Weakness Detection",
    description:
      "Surface gaps across projects, fundamentals, and interview readiness.",
  },
  {
    title: "Personalized Roadmaps",
    description:
      "Clear weekly goals with high-signal topics and curated practice paths.",
  },
];
