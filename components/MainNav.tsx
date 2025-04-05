"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { 
  BookOpen, 
  GraduationCap, 
  BarChart, 
  Users, 
  BookMarked,
  HelpCircle 
} from "lucide-react";

const mainNavItems = [
  {
    title: "Study Resources",
    href: "/resources",
    icon: BookOpen
  },
  {
    title: "Practice Tests",
    href: "/practice-tests",
    icon: GraduationCap
  },
  {
    title: "Progress Tracking",
    href: "/progress",
    icon: BarChart
  },
  {
    title: "Study Groups",
    href: "/study-groups",
    icon: Users
  },
  {
    title: "My Library",
    href: "/library",
    icon: BookMarked
  },
  {
    title: "Help Center",
    href: "/help",
    icon: HelpCircle
  }
];

export function MainNav() {
  const pathname = usePathname();

  return (
    <nav className="flex items-center space-x-4 lg:space-x-6">
      {mainNavItems.map((item) => {
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center text-sm font-medium transition-colors hover:text-primary",
              pathname === item.href
                ? "text-primary"
                : "text-muted-foreground"
            )}
          >
            <Icon className="h-4 w-4 mr-2" />
            {item.title}
          </Link>
        );
      })}
    </nav>
  );
} 