import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/AuthContext";
import { SiteFooter } from "@/components/SiteFooter";
import { OpeningLogo } from "@/components/OpeningLogo";

export const metadata: Metadata = {
  title: "Tinolandia Proxy Wars™",
  description: "A turn-based geopolitical strategy simulation by Buzuzi, based in Cape Town.",
  icons: { icon: "/brand/tinolandia-mark.png", apple: "/brand/tinolandia-mark.png" },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <AuthProvider><OpeningLogo />{children}<SiteFooter /></AuthProvider>
      </body>
    </html>
  );
}
