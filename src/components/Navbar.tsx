import { Menu } from "lucide-react";

export default function Navbar() {
    return (
        <header className="h-16 bg-zinc-950 flex items-center justify-between px-6 border-b border-zinc-800">
            <div className="flex">
                <Menu className="w-6 h-6 text-amber-500 shrink-0 mr-6" />
                <span className="text-zinc-100">Plutão Física</span>
            </div>
        </header>
    );
}