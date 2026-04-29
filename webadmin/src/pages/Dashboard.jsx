import { useState, useEffect } from 'react'
import { db } from '../firebase'
import { collection, getDocs, query, where, limit } from 'firebase/firestore'
import { 
  Users, 
  TrendingUp, 
  DollarSign, 
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCcw
} from 'lucide-react'
import { 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis
} from 'recharts'

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeSubs: 0,
    totalRev: 0,
    newTickets: 0
  })
  const [recentActivity, setRecentActivity] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchStats = async () => {
    setLoading(true)
    setError(null)
    try {
      const usersSnap = await getDocs(collection(db, 'users'))
      const ticketsSnap = await getDocs(query(collection(db, 'tickets'), where('status', '==', 'open')))
      const transSnap = await getDocs(collection(db, 'transactions'))
      
      let rev = 0
      let subs = 0
      transSnap.forEach(doc => {
        rev += doc.data().amount || 0
      })
      usersSnap.forEach(doc => {
        if (doc.data().hasPremium) subs++
      })

      setStats({
        totalUsers: usersSnap.size,
        activeSubs: subs,
        totalRev: rev,
        newTickets: ticketsSnap.size
      })

      // Simple recent activity without complex ordering to avoid index issues
      const activity = usersSnap.docs.slice(0, 5).map(doc => ({
        id: doc.id,
        type: 'user',
        title: 'User Record Found',
        subtitle: `${doc.data().firstName || 'Anonymous'} is in database`,
        time: doc.data().createdAt?.toDate ? new Date(doc.data().createdAt.toDate()).toLocaleTimeString() : 'N/A'
      }))
      setRecentActivity(activity)
    } catch (err) {
      console.error('Dashboard Error:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStats()
  }, [])

  const statCards = [
    { name: 'Total Users', value: stats.totalUsers.toLocaleString(), icon: Users, change: '+12%', positive: true },
    { name: 'Premium Users', value: stats.activeSubs.toLocaleString(), icon: Activity, change: '+5%', positive: true },
    { name: 'Total Revenue', value: `₹${stats.totalRev.toLocaleString()}`, icon: DollarSign, change: '+18%', positive: true },
    { name: 'Open Tickets', value: stats.newTickets.toLocaleString(), icon: TrendingUp, change: 'Active', positive: true },
  ]

  const chartData = [
    { name: 'Mon', users: 400 },
    { name: 'Tue', users: 300 },
    { name: 'Wed', users: 600 },
    { name: 'Thu', users: 800 },
    { name: 'Fri', users: 500 },
    { name: 'Sat', users: 900 },
    { name: 'Sun', users: 1100 },
  ]

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-full gap-4">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-primary"></div>
      <p className="text-gray-500 animate-pulse text-sm">Connecting to Firebase...</p>
    </div>
  )

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-display">Dashboard Overview</h1>
          <p className="text-gray-400 mt-1">Real-time metrics from your Firestore database.</p>
        </div>
        <button 
          onClick={fetchStats}
          className="p-2.5 bg-white/5 hover:bg-white/10 rounded-xl transition-all text-gray-400 hover:text-white flex items-center gap-2 text-sm border border-white/10"
        >
          <RefreshCcw size={16} />
          Sync Data
        </button>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-2xl text-red-500 text-sm flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          Connection Error: {error}. Please check your Firestore rules and internet connection.
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, i) => (
          <div key={i} className="glass-card p-6 flex flex-col gap-4">
            <div className="flex justify-between items-start">
              <div className="p-3 bg-white/5 rounded-xl text-primary">
                <stat.icon size={24} />
              </div>
              <div className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full ${stat.positive ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                {stat.change}
                {stat.positive ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
              </div>
            </div>
            <div>
              <p className="text-gray-400 text-sm font-medium">{stat.name}</p>
              <h2 className="text-2xl mt-1 font-display font-bold">{stat.value}</h2>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 glass-card p-8">
          <div className="flex justify-between items-center mb-10">
            <h3 className="text-xl font-bold">User Acquisition</h3>
          </div>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#fd267d" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#fd267d" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff08" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#555', fontSize: 12}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#555', fontSize: 12}} />
                <Tooltip 
                  contentStyle={{backgroundColor: '#111', border: '1px solid #ffffff10', borderRadius: '16px', boxShadow: '0 20px 40px rgba(0,0,0,0.5)'}}
                  itemStyle={{color: '#fff'}}
                />
                <Area type="monotone" dataKey="users" stroke="#fd267d" strokeWidth={3} fillOpacity={1} fill="url(#colorUsers)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-card p-8">
          <h3 className="text-xl font-bold mb-8">Recent Database Records</h3>
          <div className="space-y-6">
            {recentActivity.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center opacity-30 gap-3">
                <Users size={48} />
                <p className="text-sm">No recent users found.</p>
              </div>
            ) : recentActivity.map((item, i) => (
              <div key={i} className="flex gap-4 group">
                <div className="w-10 h-10 rounded-xl bg-white/5 flex-shrink-0 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                  <Users size={18} />
                </div>
                <div className="flex-1 overflow-hidden border-b border-white/5 pb-4 group-last:border-0">
                  <p className="text-sm font-bold">{item.title}</p>
                  <p className="text-xs text-gray-500 truncate">{item.subtitle}</p>
                  <p className="text-[10px] text-gray-600 mt-1 uppercase tracking-widest">{item.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
