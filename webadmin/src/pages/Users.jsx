import { useState, useEffect } from 'react'
import { db } from '../firebase'
import { collection, getDocs, updateDoc, doc } from 'firebase/firestore'
import { 
  Search, 
  Filter, 
  MoreVertical, 
  Mail, 
  ShieldCheck, 
  Ban, 
  Eye,
  ChevronLeft,
  ChevronRight,
  User as UserIcon,
  RefreshCcw,
  AlertCircle
} from 'lucide-react'

const Users = () => {
  const [users, setUsers] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  const fetchUsers = async () => {
    setLoading(true)
    setError(null)
    try {
      const snapshot = await getDocs(collection(db, 'users'))
      const fetchedUsers = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      setUsers(fetchedUsers)
    } catch (err) {
      console.error('Error fetching users:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  const handleBanUser = async (uid, currentStatus) => {
    const newStatus = currentStatus === 'Banned' ? 'Active' : 'Banned'
    try {
      await updateDoc(doc(db, 'users', uid), {
        status: newStatus
      })
      fetchUsers()
    } catch (error) {
      console.error('Error banning user:', error)
    }
  }

  const filteredUsers = users.filter(u => 
    u.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-full gap-4">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-primary"></div>
      <p className="text-gray-500 animate-pulse text-sm">Fetching User Records...</p>
    </div>
  )

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-display">User Management</h1>
        <div className="flex gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
            <input 
              type="text" 
              placeholder="Search users..." 
              className="input-field pl-10 w-64 text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button 
            onClick={fetchUsers}
            className="bg-surface border border-white/10 p-2.5 rounded-xl hover:bg-white/5 transition-colors text-gray-400"
          >
            <RefreshCcw size={20} />
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-2xl text-red-500 text-sm flex items-center gap-3">
          <AlertCircle size={18} />
          Error: {error}
        </div>
      )}

      <div className="glass-card overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-white/5 border-b border-white/10 text-gray-400 text-xs font-bold uppercase tracking-widest">
            <tr>
              <th className="px-6 py-5 font-semibold">User Profile</th>
              <th className="px-6 py-5 font-semibold">Status</th>
              <th className="px-6 py-5 font-semibold">Subscription</th>
              <th className="px-6 py-5 font-semibold">Joined Date</th>
              <th className="px-6 py-5 font-semibold">Verified</th>
              <th className="px-6 py-5 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {filteredUsers.length === 0 ? (
              <tr><td colSpan="6" className="px-6 py-20 text-center text-gray-500 italic">No user records found in database.</td></tr>
            ) : filteredUsers.map((user) => (
              <tr key={user.id} className="hover:bg-white/[0.02] transition-colors group">
                <td className="px-6 py-5">
                  <div className="flex items-center gap-3">
                    {user.photos && user.photos[0] ? (
                      <img src={user.photos[0]} className="w-10 h-10 rounded-xl object-cover ring-1 ring-white/10" />
                    ) : (
                      <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center font-bold text-primary border border-white/10">
                        {user.firstName?.charAt(0) || <UserIcon size={16} />}
                      </div>
                    )}
                    <div>
                      <p className="font-bold text-sm">{user.firstName} {user.lastName || ''}</p>
                      <p className="text-[10px] text-gray-500 font-mono tracking-tighter">{user.id}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-5">
                  <span className={`px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                    user.status === 'Active' || !user.status ? 'bg-green-500/10 text-green-500 border border-green-500/20' : 
                    user.status === 'Banned' ? 'bg-red-500/10 text-red-500 border border-red-500/20' : 'bg-gray-500/10 text-gray-400'
                  }`}>
                    {user.status || 'Active'}
                  </span>
                </td>
                <td className="px-6 py-5">
                  <select 
                    value={user.premiumTier || 'free'}
                    onChange={async (e) => {
                      const tier = e.target.value;
                      await updateDoc(doc(db, 'users', user.id), {
                        premiumTier: tier === 'free' ? null : tier,
                        hasPremium: tier !== 'free'
                      });
                      fetchUsers();
                    }}
                    className={`bg-transparent text-xs font-bold outline-none cursor-pointer border-b border-transparent hover:border-white/20 transition-all ${
                      user.premiumTier === 'platinum' ? 'text-[#E5E4E2]' :
                      user.premiumTier === 'gold' ? 'text-[#FFD700]' :
                      user.premiumTier === 'silver' ? 'text-[#C0C0C0]' : 'text-gray-600'
                    }`}
                  >
                    <option value="free" className="bg-surface text-gray-400 font-bold">FREE TIER</option>
                    <option value="silver" className="bg-surface text-[#C0C0C0] font-bold">SILVER</option>
                    <option value="gold" className="bg-surface text-[#FFD700] font-bold">GOLD</option>
                    <option value="platinum" className="bg-surface text-[#E5E4E2] font-bold">PLATINUM</option>
                  </select>
                </td>
                <td className="px-6 py-5 text-xs text-gray-500">
                  {user.createdAt?.toDate ? new Date(user.createdAt.toDate()).toLocaleDateString() : 'N/A'}
                </td>
                <td className="px-6 py-5">
                  <button 
                    onClick={async () => {
                      await updateDoc(doc(db, 'users', user.id), {
                        isVerified: !user.isVerified
                      });
                      fetchUsers();
                    }}
                    className={`transition-colors ${user.isVerified ? 'text-blue-500' : 'text-gray-600 hover:text-blue-400'}`}
                    title={user.isVerified ? 'Revoke Verification' : 'Verify User'}
                  >
                    <ShieldCheck size={20} fill={user.isVerified ? 'rgba(59, 130, 246, 0.1)' : 'transparent'} />
                  </button>
                </td>
                <td className="px-6 py-5 text-right">
                  <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={async () => {
                        const newRole = user.role === 'admin' ? 'user' : 'admin';
                        if (window.confirm(`Are you sure you want to make this user an ${newRole}?`)) {
                            await updateDoc(doc(db, 'users', user.id), { role: newRole });
                            fetchUsers();
                        }
                      }}
                      className={`p-2 rounded-lg transition-colors ${user.role === 'admin' ? 'text-purple-500 bg-purple-500/10' : 'text-gray-400 hover:text-white'}`}
                      title={user.role === 'admin' ? 'Revoke Admin' : 'Make Admin'}
                    >
                      <UserIcon size={18} />
                    </button>
                    <button 
                      className={`p-2 rounded-lg transition-colors ${user.status === 'Banned' ? 'text-green-500 hover:bg-green-500/10' : 'text-red-500 hover:bg-red-500/10'}`} 
                      title={user.status === 'Banned' ? 'Unban User' : 'Ban User'}
                      onClick={() => handleBanUser(user.id, user.status)}
                    >
                      <Ban size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default Users
