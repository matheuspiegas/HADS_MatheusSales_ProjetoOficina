import "./globals.css";

import type { Metadata } from "next";
import { Aleo, Roboto, Roboto_Mono } from "next/font/google";
import Head from "next/head";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { Toaster } from "sonner";

import { ThemeProvider } from "@/components/theme-provider";

const aleoSerif = Aleo({
  variable: "--font-aleo",
  subsets: ["latin"],
  weight: ["400", "700"],
});
const roboto = Roboto({
  variable: "--font-roboto",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

const robotoMono = Roboto_Mono({
  variable: "--font-roboto-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Fabrício Sales Pintura Automotiva",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <Head>
        <meta name="apple-mobile-web-app-title" content="FSPintura" />
      </Head>
      <body
        className={`${aleoSerif.variable} ${robotoMono.variable} ${roboto.variable} antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <Toaster richColors position="top-center" closeButton />
          <NuqsAdapter>{children}</NuqsAdapter>
        </ThemeProvider>
      </body>
    </html>
  );
}
