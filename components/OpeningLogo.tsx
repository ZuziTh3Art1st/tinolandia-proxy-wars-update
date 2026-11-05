"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { GlassIconReveal } from "@/components/GlassIconReveal";

export function OpeningLogo() {
  const [visible, setVisible] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setLeaving(false);
    setVisible(true);
    const duration = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 750 : 4500;
    const fade = window.setTimeout(() => setLeaving(true), duration - 500);
    const remove = window.setTimeout(() => setVisible(false), duration);
    return () => {
      window.clearTimeout(fade);
      window.clearTimeout(remove);
    };
  }, [pathname]);

  if (!visible) return null;

  return (
    <div aria-hidden="true" className={`pointer-events-none fixed inset-0 z-[100] grid place-items-center bg-[#f3f4f2] transition-opacity duration-500 ${leaving ? "opacity-0" : "opacity-100"}`}>
      <div className={`h-[min(72svh,36rem)] w-[min(72vw,30rem)] transition-transform duration-700 ${leaving ? "-translate-y-2 scale-95" : "translate-y-0 scale-100"}`}>
        <GlassIconReveal key={pathname} logo="/brand/tinolandia-logo.png" label="Buzuzi Tinolandia Proxy Wars, based in Cape Town" look="light" background="#f3f4f2" originalColors loop={false} tileSize={600} logoScale={0.9} finalScale={0.9} className="h-full w-full" />
      </div>
    </div>
  );
}
