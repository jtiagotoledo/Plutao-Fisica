"useClient";
import {Forward, FileClock, MessageSquareWarning } from "lucide-react";

interface SideBarCelularProps{
    setIsOpen: (value:boolean)=>void;
}

export function SideBar() {
    return (
        <aside className="hidden md:block w-64 p-4 border-r border-zinc-800 bg-zinc-900 shrink-0">
            <p className="text-zinc-100 text-xs font-semibold uppercase mb-4 px-3">Menu</p>
            <nav className="space-y-2">
                <a 
                    href="#" 
                    className="text-zinc-100 px-3 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-500 flex gap-3"
                >
                    <Forward className="w-5 h-5 shrink-0 text-zinc-400" />
                    <span>Envio de tarefa</span>
                </a>
                <a 
                    href="#" 
                    className="text-zinc-100 px-3 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-500 flex gap-3"
                >
                    <FileClock className="w-5 h-5 shrink-0 text-zinc-400" />
                    <span>Envio de tarefa</span>
                </a>
                <a 
                    href="#" 
                    className="text-zinc-100 px-3 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-500 flex gap-3"
                >
                    <MessageSquareWarning className="w-5 h-5 shrink-0 text-zinc-400" />
                    <span>Envio de tarefa</span>
                </a>
            </nav>
        </aside>
    );
}

export function SideBarCelular({ setIsOpen }: SideBarCelularProps) {
    return (
        <aside className="relative w-64 border-zinc-800 bg-zinc-900 border-r p4 space-y-2 z-30 h-full shadow-xl">
            <p className="text-zinc-100 text-xs font-semibold uppercase mb-4 px-3 mt-4">Menu</p>

            <nav className="space-y-1">
                <a
                    href="#"
                    onClick={() => setIsOpen(false)}
                    
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-amber-500 text-zinc-950 font-semibold"
                >
                    <Forward className="w-5 h-5 shrink-0 text-zinc-400" />
                    <span>Envio de tarefa</span>
                </a>

                <a
                    href="#"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-amber-500 text-zinc-950 font-semibold"

                >
                    <FileClock className="w-5 h-5 shrink-0 text-zinc-400" />
                    <span>Histórico de envios</span>
                </a>

                <a
                    href="#"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-amber-500 text-zinc-950 font-semibold"

                    >
                    <MessageSquareWarning className="w-5 h-5 shrink-0 text-zinc-400" />
                    <span>Avisos</span>
                    </a>
            </nav>
        </aside>
    );
}