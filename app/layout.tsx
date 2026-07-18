import type { Metadata } from "next";
import Image from "next/image";
import "./globals.css";
import { suisse, aeonik } from "./fonts";

export const metadata: Metadata = {
  title: "Your Purchases — The Internet Company",
  description: "Access the digital products you've purchased from The Internet Company.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${suisse.variable} ${aeonik.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-[#F4F3EA] text-[#1a1a1a]">
        <header className="w-full px-4 sm:px-6 py-5 flex justify-center">
          <a href="https://theinternetcompany.one" className="inline-flex items-center gap-2 w-fit">
            <Image src="/tic_logo.svg" alt="The Internet Company" width={36} height={36} priority />
          </a>
        </header>
        <main className="flex-1 flex flex-col">{children}</main>
      </body>
    </html>
  );
}
