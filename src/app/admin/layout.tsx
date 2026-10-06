"use client";

import { useState } from "react";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminTopbar } from "@/components/admin/AdminTopbar";
import { QueryProvider } from "@/providers/query-provider";
import { SidebarProvider, useSidebar } from "@/contexts/sidebar-context";

function AdminLayoutInner({ children }: { children: React.ReactNode }) {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const { collapsed, hovered } = useSidebar();
  const sidebarWidth = collapsed && !hovered ? "lg:pl-[72px]" : "lg:pl-[260px]";

  return (
    <div className="min-h-screen bg-gray-50/50">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <AdminSidebar />
      </div>

      {/* Mobile Sidebar Overlay */}
      {mobileSidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 bg-black/30 backdrop-blur-sm"
            onClick={() => setMobileSidebarOpen(false)}
          />
          <div className="relative z-50 h-full w-[260px]">
            <AdminSidebar onNavigate={() => setMobileSidebarOpen(false)} />
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className={`transition-all duration-300 ${sidebarWidth}`}>
        <AdminTopbar onToggleMobileSidebar={() => setMobileSidebarOpen(!mobileSidebarOpen)} />
        <main className="p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <QueryProvider>
      <SidebarProvider>
        <AdminLayoutInner>{children}</AdminLayoutInner>
      </SidebarProvider>
    </QueryProvider>
  );
}
