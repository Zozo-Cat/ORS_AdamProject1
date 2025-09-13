import "./globals.css";
import type { Metadata } from "next";
import { Press_Start_2P } from "next/font/google";

const pixel = Press_Start_2P({
    subsets: ["latin"],
    weight: "400",
    variable: "--font-pixel",
});

export const metadata: Metadata = {
    title: "OSRS Vault",
    description: "RuneScape-style vault + metrics for $OSRS",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en">
        <body className={`${pixel.variable} font-pixel bg-[#121010] text-white`}>
        {children}
        </body>
        </html>
    );
}
