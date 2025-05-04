"use client";

import Image from "next/image";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

interface DynamicLogoProps {
  width: number;
  height: number;
  priority?: boolean;
}

export function DynamicLogo({
  width,
  height,
  priority = false,
}: DynamicLogoProps) {
  const [mounted, setMounted] = useState(false);
  const { theme } = useTheme();

  // useEffect only runs on the client, so now we can safely show the UI
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    // Return a placeholder or the default logo during server-side rendering
    return (
      <Image
        src="/thatsaucelogoheader-white.svg"
        alt="that sauce"
        width={width}
        height={height}
        priority={priority}
      />
    );
  }

  const logoSrc =
    theme === "light"
      ? "/thatsaucelogoheader-black.svg"
      : "/thatsaucelogoheader-white.svg";

  return (
    <Image
      src={logoSrc}
      alt="that sauce"
      width={width}
      height={height}
      priority={priority}
    />
  );
}
