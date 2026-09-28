import type { Metadata } from "next";
import "@fontsource/urbanist/400.css";
import "@fontsource/urbanist/500.css";
import "@fontsource/urbanist/600.css";
import "./globals.css";
import "./olive.css";
import { DemoDataProvider } from "@/components/workspace-shell";

export const metadata: Metadata = { title: "AgentPayOps", description: "Finance controls and live demo for autonomous agent payments." };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en" className="h-full antialiased"><body><a className="skip-link" href="#main-content">Skip to content</a><DemoDataProvider>{children}</DemoDataProvider></body></html>;
}
