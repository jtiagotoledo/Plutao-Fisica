"use client";

import { useState } from "react";
import { Menu, X} from "lucide-react";
import { SideBarCelular } from "@/components/SideBar";

export default function Navbar() {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <>
            <header className="h-16 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between px-6 sticky top-0 z-30">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setIsOpen(!isOpen)}
                        className="md:hidden p-2 text-zinc-400 hover:text-amber-500 hover:bg-zinc-800 rounded-lg transition"
                        aria-label="Alternar Menu"
                    >
                        {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                    </button>

                    <span className="text-xl font-bold text-amber-500">Plutão Física</span>
                </div>

                <span className="text-sm text-zinc-400">Topo do Site</span>
            </header>

            {isOpen && (
                <div className="md:hidden fixed inset-0 top-16 z-20 flex">
                    <div
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm"
                        onClick={() => setIsOpen(false)}
                    />
                    <SideBarCelular setIsOpen={setIsOpen} />
                </div>
            )}
        </>
    );
}