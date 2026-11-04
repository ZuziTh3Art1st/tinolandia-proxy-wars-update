"use client";

import { usePathname } from "next/navigation";
import DoodleCrewFooter from "@/components/DoodleCrewFooter";
import { useAuth } from "@/lib/AuthContext";

export function SiteFooter() {
  const pathname = usePathname();
  const { user, loading } = useAuth();
  if (pathname === "/login" || (pathname === "/" && (loading || !user))) return null;

  return (
    <DoodleCrewFooter
      wordmark="TINOLANDIA"
      brand="BUZUZI × TINOLANDIA"
      blurb="A world of shifting borders, bold moves and rival commanders. Created by Ashley Tinotenda Buzuzi in Cape Town, South Africa."
      tagline="Draw your own line across the world. Every campaign starts with one move."
      columns={[
        {
          title: "Campaign desk",
          links: [
            { label: "Field briefing", href: "/tutorial" },
            { label: "Old campaigns", href: "/playthroughs" },
            { label: "Rival commanders", href: "/commanders" },
            { label: "Multiplayer campaigns", href: "/multiplayer" },
          ],
        },
        {
          title: "Made by Buzuzi",
          links: [
            { label: "GitHub · ZuziTh3Art1st", href: "https://github.com/ZuziTh3Art1st" },
            { label: "LinkedIn · Ashley Buzuzi", href: "https://www.linkedin.com/in/ashley-buzuzi-911a79376/" },
            { label: "Privacy & simulation notice", href: "/privacy" },
          ],
        },
      ]}
      actions={[
        { label: "Browse old campaigns", href: "/playthroughs", icon: "star", variant: "solid" },
        { label: "Meet the commanders", href: "/commanders", icon: "plane", variant: "outline" },
      ]}
      copyright="© 2026 Ashley Tinotenda Buzuzi · Proudly made in Cape Town, South Africa"
      legal={[{ label: "Privacy and simulation notice", href: "/privacy" }]}
      socials={[
        { label: "GitHub", href: "https://github.com/ZuziTh3Art1st" },
        { label: "LinkedIn", href: "https://www.linkedin.com/in/ashley-buzuzi-911a79376/" },
      ]}
      crew={[
        { kind: "bird", letter: 0, seat: "top", offset: 0.04, name: "Pip", says: "Greetings from Cape Town!" },
        { kind: "cat", letter: 4, seat: "front", offset: -0.1, name: "Mandla", says: "Ready to redraw the map?" },
        { kind: "ghost", letter: 8, seat: "behind", offset: 0, name: "Boo", says: "Your campaigns live on here." },
      ]}
      doodles={["star", "bolt", "plane", "heart", "sparkle", "spiral"]}
      doodleCount={9}
      preset="night"
      palette={{ background: "#071920", ink: "#f2eddf", accent: "#c9a45c" }}
      fontFamily="Arial Black, Impact, sans-serif"
      serifFamily="Georgia, 'Times New Roman', serif"
      height="720px"
    />
  );
}
