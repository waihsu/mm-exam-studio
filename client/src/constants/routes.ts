import {
  BookOpenCheck,
  FileText,
  House,
  MessageSquareMore,
  Settings,
  User2,
} from "lucide-react";

export const userAppRoutes = {
  dashboard: "/dashboard",
  practice: "/practice",
  questionPapers: "/question-papers",
  profile: "/profile",
  support: "/support",
  settings: "/settings",
} as const;

export const primaryNavItems = [
  {
    to: userAppRoutes.dashboard,
    label: "Dashboard",
    icon: House,
    status: "live" as const,
  },
  {
    to: userAppRoutes.practice,
    label: "Practice",
    icon: BookOpenCheck,
    status: "live" as const,
  },
  {
    to: userAppRoutes.questionPapers,
    label: "Question Papers",
    icon: FileText,
    status: "live" as const,
  },
] as const;

export const accountNavItems = [
  {
    to: userAppRoutes.profile,
    label: "Profile",
    icon: User2,
    status: "live" as const,
  },
  {
    to: userAppRoutes.support,
    label: "Support",
    icon: MessageSquareMore,
    status: "live" as const,
  },
  {
    to: userAppRoutes.settings,
    label: "Settings",
    icon: Settings,
    status: "live" as const,
  },
] as const;

export const plannedNavItems = [] as const;
