import { NavLink } from 'react-router-dom'
import { 
  LayoutDashboard, 
  Users as UsersIcon, 
  CreditCard, 
  Ticket, 
  History, 
  LifeBuoy,
  Bell,
  Flame,
  ShieldAlert,
  ShieldCheck,
  Megaphone,
  Building2,
  LogOut
} from 'lucide-react'
import { auth } from '../firebase'
import { signOut } from 'firebase/auth'

const Sidebar = () => {
  const menuItems = [
    { name: 'Dashboard', icon: LayoutDashboard, path: '/' },
    { name: 'Users', icon: UsersIcon, path: '/users' },
    { name: 'Subscriptions', icon: CreditCard, path: '/subscriptions' },
    { name: 'Coupons', icon: Ticket, path: '/coupons' },
    { name: 'Transactions', icon: History, path: '/transactions' },
    { name: 'Support', icon: LifeBuoy, path: '/support' },
    { name: 'Notifications', icon: Bell, path: '/notifications' },
    { name: 'Safety', icon: ShieldAlert, path: '/safety' },
    { name: 'Verifications', icon: ShieldCheck, path: '/verifications' },
    { name: 'Ads Manager', icon: Megaphone, path: '/ads' },
    { name: 'Ad Partners', icon: Building2, path: '/companies' },
  ]

  return (
    <div className="w-64 bg-surface border-r border-white/10 flex flex-col">
      <div className="p-6 flex items-center gap-3">
        <div className="w-10 h-10 bg-gradient-to-br from-primary to-secondary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
          <Flame className="text-white fill-white" size={24} />
        </div>
        <span className="text-2xl font-display font-bold tracking-tight">SPARK <span className="text-primary text-xs vertical-top">ADM</span></span>
      </div>

      <nav className="flex-1 px-4 py-6 space-y-2">
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
          >
            <item.icon size={20} />
            <span className="font-medium">{item.name}</span>
          </NavLink>
        ))}
      </nav>

      <div className="p-6 border-t border-white/10 space-y-4">
        <div className="bg-white/5 rounded-2xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
            {auth.currentUser?.email?.charAt(0).toUpperCase() || 'A'}
          </div>
          <div className="flex-1 overflow-hidden">
            <p className="text-sm font-bold truncate">Administrator</p>
            <p className="text-[10px] text-gray-500 truncate font-mono">{auth.currentUser?.email}</p>
          </div>
        </div>
        <button 
          onClick={() => signOut(auth)}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-red-500/20 text-red-500 text-xs font-bold hover:bg-red-500/10 transition-all"
        >
          <LogOut size={14} />
          LOGOUT
        </button>
      </div>
    </div>
  )
}

export default Sidebar
