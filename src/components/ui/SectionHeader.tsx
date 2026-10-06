"use client";

import Link from "next/link";
import { FiArrowRight } from "react-icons/fi";

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  href?: string;
  linkText?: string;
}

export function SectionHeader({ title, subtitle, href, linkText = "See all" }: SectionHeaderProps) {
  return (
    <div className="mb-6 flex items-end justify-between gap-4 sm:mb-8">
      <div className="min-w-0">
        <h2 className="text-lg font-bold text-foreground sm:text-2xl lg:text-3xl">{title}</h2>
        {subtitle && (
          <p className="mt-0.5 text-xs text-muted-foreground sm:mt-1 sm:text-sm">{subtitle}</p>
        )}
      </div>
      {href && (
        <Link
          href={href}
          className="group flex items-center gap-1.5 text-sm font-semibold text-primary transition-colors hover:text-primary/80"
        >
          {linkText}
          <FiArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
        </Link>
      )}
    </div>
  );
}
