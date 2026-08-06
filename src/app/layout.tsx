import { ReactNode } from "react";
import "./globals.css";
import Navbar from "@/components/Navbar";
import SideBar from "@/components/SideBar";
import Footer from "@/components/Footer";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-br">
      <body className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex flex-1">
          <SideBar />
          <main className="flex-1 p-6 bg-zinc-950">
            {children}
          </main>
        </div>
        <Footer />
      </body>
    </html>
  );
}
