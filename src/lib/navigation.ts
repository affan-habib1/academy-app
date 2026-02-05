import {
  LayoutDashboard,
  Users,
  BookOpen,
  GraduationCap,
  ClipboardList,
} from "lucide-react";

export const NAV_ITEMS = [
  { label: "Dashboard", href: "/", icon: LayoutDashboard },
  { label: "Students", href: "/students", icon: Users },
  { label: "Courses", href: "/courses", icon: BookOpen },
  { label: "Faculty", href: "/faculty", icon: GraduationCap },
  { label: "Reports", href: "/reports", icon: ClipboardList },
];

export const PAGE_TITLES: Record<string, string> = {
  "/": "Academic Management Dashboard",
  "/students": "Student Management",
  "/students/new": "Create Student",
  "/courses": "Course Management",
  "/courses/new": "Create Course",
  "/faculty": "Faculty Panel",
  "/reports": "Reporting & Export",
};

export function getPageTitle(pathname: string) {
  if (pathname.startsWith("/students/") && pathname.endsWith("/edit")) {
    return "Edit Student";
  }
  if (pathname.startsWith("/students/") && pathname !== "/students/new") {
    return "Student Profile";
  }
  if (pathname.startsWith("/courses/") && pathname.endsWith("/edit")) {
    return "Edit Course";
  }
  return PAGE_TITLES[pathname] ?? "Academic Management";
}
