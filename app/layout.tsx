// app/layout.tsx
import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { Providers } from './providers';  // Import the client provider
import "./globals.css";

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SpaceAge Group — Admin Control Panel",
  description: "Management dashboard and content administration portal for SpaceAge Group Vadodara.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${plusJakarta.className} antialiased`}>
        <Providers>  {/* Wrap children with providers */}
          {children}
        </Providers>
      </body>
    </html>
  );
}