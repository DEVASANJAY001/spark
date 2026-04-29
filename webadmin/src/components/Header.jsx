import { Bell, Search, Moon, Sun } from 'lucide-react'

const Header = () => {
  return (
    <header className="h-20 border-b border-white/10 bg-black/50 backdrop-blur-md px-8 flex items-center justify-between sticky top-0 z-50">
      <div className="relative w-96 hidden md:block">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
        <input 
          type="text" 
          placeholder="Search for users, tickets, transactions..." 
          className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
        />
      </div>

      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <button className="p-2.5 rounded-xl hover:bg-white/5 text-gray-400 hover:text-white transition-all">
            <Moon size={20} />
          </button>
          <button className="p-2.5 rounded-xl hover:bg-white/5 text-gray-400 hover:text-white transition-all relative">
            <Bell size={20} />
            <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-primary rounded-full border-2 border-black" />
          </button>
        </div>
        
        <div className="h-8 w-px bg-white/10" />

        <div className="flex items-center gap-3 pl-2">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-bold">Admin Portal</p>
            <p className="text-[10px] text-primary font-bold uppercase tracking-wider">Superadmin</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center font-bold text-white shadow-lg shadow-primary/20">
            SP
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header
