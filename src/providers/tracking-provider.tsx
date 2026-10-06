"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

function getSessionId(): string {
  if (typeof window === "undefined") return "";
  let sid = sessionStorage.getItem("_hze_sid");
  if (!sid) {
    sid = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    sessionStorage.setItem("_hze_sid", sid);
  }
  return sid;
}

function getUserId(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const cookie = document.cookie.split(";").find((c) => c.trim().startsWith("token="));
    if (!cookie) return null;
    const token = cookie.split("=")[1];
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.id || null;
  } catch {
    return null;
  }
}

function sendTracking(data: Record<string, any>) {
  try {
    fetch("/api/tracking", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...data,
        sessionId: getSessionId(),
        userId: getUserId(),
        referrer: typeof document !== "undefined" ? document.referrer : null,
      }),
      keepalive: true,
    });
  } catch {}
}

export function TrackingProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const startRef = useRef(Date.now());
  const lastPathRef = useRef("");

  useEffect(() => {
    if (pathname.startsWith("/admin")) return;
    if (pathname === lastPathRef.current) return;

    // Send duration of previous page
    if (lastPathRef.current) {
      const duration = Math.round((Date.now() - startRef.current) / 1000);
      if (duration > 1) {
        sendTracking({ type: "pageview", page: lastPathRef.current, duration: String(duration) });
      }
    }

    // Track new page view
    lastPathRef.current = pathname;
    startRef.current = Date.now();
    sendTracking({ type: "pageview", page: pathname });

    // Cleanup on unmount
    return () => {
      const duration = Math.round((Date.now() - startRef.current) / 1000);
      if (duration > 1 && lastPathRef.current) {
        sendTracking({ type: "pageview", page: lastPathRef.current, duration: String(duration) });
      }
    };
  }, [pathname]);

  return <>{children}</>;
}
