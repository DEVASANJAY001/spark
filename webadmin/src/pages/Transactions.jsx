import { useState, useEffect } from 'react'
import { db } from '../firebase'
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore'
import { 
  History, 
  Search, 
  ArrowUpRight, 
  ArrowDownRight,
  Download,
  CreditCard
} from 'lucide-react'

const Transactions = () => {
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    const q = query(collection(db, 'transactions'), orderBy('timestamp', 'desc'))
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetched = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      setTransactions(fetched)
      setLoading(false)
    })
    return () => unsubscribe()
  }, [])

  const filtered = transactions.filter(t => 
    t.uid?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.plan?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.referralCode?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) return <div className="flex items-center justify-center h-full"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-primary"></div></div>

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl">Transaction History</h1>
          <p className="text-gray-400 mt-1">Review all payments and subscription activations.</p>
        </div>
        <div className="flex gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
            <input 
              type="text" 
              placeholder="Search transactions..." 
              className="input-field pl-10 w-64 text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button className="bg-surface border border-white/10 px-4 py-2 rounded-xl flex items-center gap-2 text-sm hover:bg-white/5 transition-colors">
            <Download size={18} />
            Export
          </button>
        </div>
      </div>

      <div className="glass-card overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-white/5 border-b border-white/10 text-gray-400 text-sm">
            <tr>
              <th className="px-6 py-4 font-semibold">Transaction ID</th>
              <th className="px-6 py-4 font-semibold">User ID</th>
              <th className="px-6 py-4 font-semibold">Plan</th>
              <th className="px-6 py-4 font-semibold">Amount</th>
              <th className="px-6 py-4 font-semibold">Status</th>
              <th className="px-6 py-4 font-semibold">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {filtered.length === 0 ? (
              <tr><td colSpan="6" className="px-6 py-12 text-center text-gray-500">No transactions found.</td></tr>
            ) : filtered.map((t) => (
              <tr key={t.id} className="hover:bg-white/[0.02] transition-colors">
                <td className="px-6 py-4 text-xs font-mono text-gray-500">
                  {t.id}
                </td>
                <td className="px-6 py-4 text-sm">
                  {t.uid}
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <div className={`p-1.5 rounded-lg ${
                      t.plan === 'platinum' ? 'bg-gray-500/10 text-gray-400' :
                      t.plan === 'gold' ? 'bg-yellow-500/10 text-yellow-500' : 'bg-pink-500/10 text-pink-500'
                    }`}>
                      <CreditCard size={14} />
                    </div>
                    <span className="text-sm font-medium capitalize">{t.plan}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`text-sm font-bold ${t.amount === 0 ? 'text-green-500' : 'text-white'}`}>
                    {t.amount === 0 ? 'FREE' : `₹${t.amount}`}
                  </span>
                  {t.referralCode && <p className="text-[10px] text-gray-500">Code: {t.referralCode}</p>}
                </td>
                <td className="px-6 py-4">
                   <span className="px-2 py-1 bg-green-500/10 text-green-500 rounded-full text-[10px] font-bold uppercase tracking-wider">
                    Successful
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-400">
                   {t.timestamp?.toDate ? new Date(t.timestamp.toDate()).toLocaleString() : 'N/A'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default Transactions
