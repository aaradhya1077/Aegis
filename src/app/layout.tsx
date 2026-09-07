import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/provider/theme-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Aegis-Compliance | AI-Powered Regulatory Compliance for Indian Coal Mines",
  description: "Aegis-Compliance continuously cross-references mine filings against Indian regulations (Mines Act 1952, Coal Mines Regulations 2017, DGMS norms, MoEF&CC EC conditions) using NLP and a regulatory knowledge graph, producing live compliance risk scores with clause-level explainability.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning={true}>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
          <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem
            disableTransitionOnChange
          >

        {children}
          </ThemeProvider>
      </body>
    </html>
  );
}
