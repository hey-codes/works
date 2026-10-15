import type { Metadata } from "next";
import { Geist } from "next/font/google";
import localFont from "next/font/local";
import { RESUME_DATA } from "@/data/resume-data";
import "./globals.css";
import "./tailwind.css";

const fraunces = localFont({
  src: "./fonts/fraunces-latin-wght-normal.woff2",
  weight: "100 900",
  style: "normal",
  display: "swap",
  variable: "--font-fraunces",
});

const jetbrainsMono = localFont({
  src: [
    { path: "./fonts/jetbrains-mono-latin-400-normal.woff2", weight: "400", style: "normal" },
    { path: "./fonts/jetbrains-mono-latin-500-normal.woff2", weight: "500", style: "normal" },
  ],
  display: "swap",
  // The latin subset has no arrows; let them fall through to the system mono.
  adjustFontFallback: false,
  variable: "--font-jetbrains-mono",
});

const geist = Geist({
  subsets: ["latin"],
  weight: "variable",
  display: "swap",
  variable: "--font-geist",
});

const title = `${RESUME_DATA.name} · Facilities Leader`;

export const metadata: Metadata = {
  metadataBase: new URL(RESUME_DATA.personalWebsiteUrl),
  title,
  description: `${RESUME_DATA.tagline}. 13 years, 9 brands, 400+ locations.`,
  openGraph: {
    title,
    description: `${RESUME_DATA.tagline}.`,
    url: RESUME_DATA.personalWebsiteUrl,
    images: ["/og.png"],
  },
  twitter: { card: "summary_large_image" },
};

// Runs before first paint so a saved theme never flashes. With nothing saved,
// the CSS follows prefers-color-scheme on its own. data-js lets CSS hold the
// stat figures back until the count-up takes over. data-type-in marks the
// first load of a visit, the one where the hero's base line types in; set
// here, before paint, so the line is never shown and then taken back. If
// storage throws, the line is simply there.
const themeScript = `var d=document.documentElement;d.dataset.js="";try{var t=localStorage.getItem("atlas-theme");if(t==="light"||t==="dark")d.dataset.theme=t}catch(e){}try{if(!sessionStorage.getItem("atlas-typed")){sessionStorage.setItem("atlas-typed","1");d.dataset.typeIn=""}}catch(e){}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${fraunces.variable} ${jetbrainsMono.variable} ${geist.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
