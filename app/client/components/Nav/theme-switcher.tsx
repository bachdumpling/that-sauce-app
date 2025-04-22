"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { SunIcon, MoonIcon, ComputerIcon } from "lucide-react";
const ThemeSwitcher = () => {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();

  // useEffect only runs on the client, so now we can safely show the UI
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <div className="bg-muted rounded-full p-1 flex items-center w-fit">
      <button
        onClick={(e) => {
          e.stopPropagation();
          setTheme("light");
        }}
        className={`p-2 rounded-full ${
          theme === "light" ? "bg-white text-black" : "text-muted-foreground"
        }`}
        aria-label="Light theme"
      >
        <SunIcon className="w-4 h-4" />
      </button>

      <button
        onClick={(e) => {
          e.stopPropagation();
          setTheme("dark");
        }}
        className={`p-2 rounded-full ${
          theme === "dark" ? "bg-white text-black" : "text-muted-foreground"
        }`}
        aria-label="Dark theme"
      >
        <MoonIcon className="w-4 h-4" />
      </button>

      <button
        onClick={(e) => {
          e.stopPropagation();
          setTheme("system");
        }}
        className={`p-2 rounded-full ${
          theme === "system" ? "bg-white text-black" : "text-muted-foreground"
        }`}
        aria-label="System theme"
      >
        <ComputerIcon className="w-4 h-4" />
      </button>
    </div>
  );
};

export { ThemeSwitcher };
