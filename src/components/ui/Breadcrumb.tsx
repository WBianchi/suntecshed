"use client";

import Link from "next/link";
import { FiChevronRight, FiHome } from "react-icons/fi";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

export function Breadcrumb({ items }: BreadcrumbProps) {
  return (
    <nav className="flex items-center gap-1 overflow-hidden text-xs text-gray-500 sm:gap-1.5 sm:text-sm">
      <Link href="/" className="flex shrink-0 items-center gap-1 transition-colors hover:text-primary">
        <FiHome className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">Início</span>
      </Link>
      {items.map((item, i) => (
        <span key={i} className="flex min-w-0 items-center gap-1 sm:gap-1.5">
          <FiChevronRight className="h-3 w-3 shrink-0 text-gray-300" />
          {item.href ? (
            <Link href={item.href} className="truncate transition-colors hover:text-primary">
              {item.label}
            </Link>
          ) : (
            <span className="truncate font-medium text-gray-900">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}
