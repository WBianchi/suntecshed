"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useSidebar } from "@/contexts/sidebar-context";
import { FiChevronLeft, FiChevronDown, FiChevronRight } from "react-icons/fi";
import { adminMenuItems as menuItems, type AdminSubItem as SubItem } from "@/lib/admin-menu";

export function AdminSidebar({ onNavigate }: { onNavigate?: () => void } = {}) {
  const pathname = usePathname();
  const { collapsed, setCollapsed, hovered, setHovered, isExpanded } = useSidebar();
  const [openMenus, setOpenMenus] = useState<string[]>([]);
  const showFull = isExpanded;

  const toggleMenu = (label: string) => {
    setOpenMenus((prev) =>
      prev.includes(label) ? prev.filter((m) => m !== label) : [...prev, label]
    );
  };

  const isActive = (href?: string) => href && pathname === href;
  const isChildActive = (children?: SubItem[]) =>
    children?.some((c) => pathname.startsWith(c.href));

  return (
    <aside
      onMouseEnter={() => collapsed && setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={cn(
        "fixed left-0 top-0 z-30 flex h-screen flex-col border-r border-gray-100 bg-white transition-all duration-300",
        showFull ? "w-[260px]" : "w-[72px]"
      )}
    >
      {/* Logo */}
      <div className="flex h-16 items-center justify-between border-b border-gray-100 px-4">
        {showFull ? (
          <Link href="/admin" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary text-sm font-bold text-white">
              H
            </div>
            <div className="leading-tight overflow-hidden whitespace-nowrap">
              <p className="text-sm font-bold text-gray-900">Suntecshed</p>
              <p className="text-[10px] text-gray-400">Admin Panel</p>
            </div>
          </Link>
        ) : (
          <Link href="/admin" className="mx-auto flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-sm font-bold text-white">
            H
          </Link>
        )}
      </div>

      {/* Menu */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 scrollbar-thin">
        <ul className="space-y-1">
          {menuItems.map((item) => {
            const hasChildren = !!item.children;
            const isOpen = openMenus.includes(item.label);
            const active = isActive(item.href);
            const childActive = isChildActive(item.children);

            return (
              <li key={item.label}>
                {hasChildren ? (
                  <>
                    <button
                      onClick={() => showFull && toggleMenu(item.label)}
                      className={cn(
                        "group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
                        childActive
                          ? "bg-primary/5 text-primary"
                          : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                      )}
                    >
                      <item.icon className={cn("h-[18px] w-[18px] shrink-0", childActive && "text-primary")} />
                      {showFull && (
                        <>
                          <span className="flex-1 text-left">{item.label}</span>
                          {item.badge && (
                            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-bold text-white">
                              {item.badge}
                            </span>
                          )}
                          <FiChevronDown
                            className={cn(
                              "h-3.5 w-3.5 text-gray-400 transition-transform duration-200",
                              isOpen && "rotate-180"
                            )}
                          />
                        </>
                      )}
                    </button>
                    {showFull && isOpen && (
                      <ul className="mt-1 space-y-0.5 pl-4">
                        {item.children!.map((child) => (
                          <li key={child.href}>
                            <Link
                              href={child.href}
                              onClick={onNavigate}
                              className={cn(
                                "flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] transition-all",
                                pathname.startsWith(child.href)
                                  ? "bg-primary/10 font-semibold text-primary"
                                  : "text-gray-500 hover:bg-gray-50 hover:text-gray-700"
                              )}
                            >
                              <child.icon className="h-3.5 w-3.5 shrink-0" />
                              {child.label}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    )}
                  </>
                ) : (
                  <Link
                    href={item.href!}
                    onClick={onNavigate}
                    className={cn(
                      "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
                      active
                        ? "bg-primary/10 font-semibold text-primary"
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    )}
                  >
                    <item.icon className={cn("h-[18px] w-[18px] shrink-0", active && "text-primary")} />
                    {showFull && <span>{item.label}</span>}
                  </Link>
                )}
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Collapse Toggle */}
      <div className="border-t border-gray-100 p-3">
        <button
          onClick={() => { setCollapsed(!collapsed); setHovered(false); }}
          className="flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-medium text-gray-400 transition-all hover:bg-gray-50 hover:text-gray-600"
        >
          {collapsed && !hovered ? (
            <FiChevronRight className="h-4 w-4" />
          ) : (
            <>
              <FiChevronLeft className="h-4 w-4" />
              <span>Recolher menu</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
}
