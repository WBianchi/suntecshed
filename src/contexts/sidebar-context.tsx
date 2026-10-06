"use client";

import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

interface SidebarContextType {
  collapsed: boolean;
  hovered: boolean;
  setCollapsed: (v: boolean) => void;
  setHovered: (v: boolean) => void;
  /** Whether sidebar is visually expanded (not collapsed OR hovered) */
  isExpanded: boolean;
}

const SidebarContext = createContext<SidebarContextType | null>(null);

export function SidebarProvider({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [hovered, setHovered] = useState(false);

  const isExpanded = !collapsed || hovered;

  return (
    <SidebarContext.Provider value={{ collapsed, hovered, setCollapsed, setHovered, isExpanded }}>
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  const ctx = useContext(SidebarContext);
  if (!ctx) throw new Error("useSidebar must be used within SidebarProvider");
  return ctx;
}
