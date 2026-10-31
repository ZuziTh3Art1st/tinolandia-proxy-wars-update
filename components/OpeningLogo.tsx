"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

export function OpeningLogo() {
  const [visible, setVisible] = useState(false);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    setVisible(true);
    const fade = window.setTimeout(() => setLeaving(true), 1650);
    const remove = window.setTimeout(() => setVisible(false), 2150);
    return () => {
      window.clearTimeout(fade);
      window.clearTimeout(remove);
    };
  }, []);

  if (!visible) return null;

  return (
    <div aria-hidden="true" className={`pointer-events-none fixed inset-0 z-[100] grid place-items-center bg-[#f3f4f2] transition-opacity duration-500 ${leaving ? "opacity-0" : "opacity-100"}`}>
      <div className={`transition-transform duration-700 ${leaving ? "-translate-y-2 scale-95" : "translate-y-0 scale-100"}`}>
        <Image src="/brand/tinolandia-logo.png" alt="Buzuzi Tinolandia Proxy Wars, based in Cape Town" width={563} height={748} priority className="opening-mark h-72 w-56 object-contain sm:h-80 sm:w-60" />
      </div>
    </div>
  );
}
