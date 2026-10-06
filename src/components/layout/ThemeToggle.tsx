"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { FiSun, FiMoon } from "react-icons/fi";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) return <div className="h-9 w-9" />;

  return (
    <button
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="flex items-center justify-center rounded-full p-2 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
      aria-label="Alternar tema"
    >
      {theme === "dark" ? (
        <FiSun className="h-5 w-5 text-yellow-400" />
      ) : (
        <FiMoon className="h-5 w-5" />
      )}
    </button>
  );
}
