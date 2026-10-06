"use client";

import { useEffect, useRef, useCallback } from "react";

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

async function sendEvent(data: Record<string, any>) {
  try {
    await fetch("/api/tracking", {
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

export function usePageView(page: string) {
  const startRef = useRef(Date.now());
  const sentRef = useRef(false);

  useEffect(() => {
    if (sentRef.current) return;
    sentRef.current = true;
    startRef.current = Date.now();
    sendEvent({ type: "pageview", page });

    return () => {
      const duration = Math.round((Date.now() - startRef.current) / 1000);
      if (duration > 1) {
        sendEvent({ type: "pageview", page, duration: String(duration) });
      }
    };
  }, [page]);
}

export function useProductClick() {
  return useCallback((productId: string) => {
    sendEvent({ type: "product_click", productId });
  }, []);
}

export function trackEvent(type: string, data: Record<string, any> = {}) {
  sendEvent({ type, ...data });
}
