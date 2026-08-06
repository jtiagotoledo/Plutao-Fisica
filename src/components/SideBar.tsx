export default function SideBar(){
    return(
        <aside className="hidden md:block w-64 p-4 border-r border-zinc-800 bg-zinc-900 shrink-0">
            <p className="text-zinc-100 text-xs font-semibold uppercase mb-4">Menu</p>
            <nav className="space-y-2">
                <a href="#" className="text-zinc-100 block px-3 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-500">Envio de tarefa</a>
                <a href="#" className="text-zinc-100 block px-3 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-500">Histórico de envios</a>
                <a href="#" className="text-zinc-100 block px-3 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-500">Avisos</a>
            </nav>
        </aside>
    );
}