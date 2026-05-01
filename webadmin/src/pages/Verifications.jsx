import { useState, useEffect } from 'react'
import { db } from '../firebase'
import { collection, query, orderBy, onSnapshot, updateDoc, doc, serverTimestamp, deleteDoc, where } from 'firebase/firestore'
import { 
  ShieldCheck,
  XCircle,
  Clock,
  User,
  Search,
  ArrowLeft,
  Eye,
  RefreshCcw,
  CheckCircle2
} from 'lucide-react'

const Verifications = () => {
  const [tab, setTab] = useState('pending') // 'pending' | 'verified'
  const [requests, setRequests] = useState([])
  const [verifiedUsers, setVerifiedUsers] = useState([])
  const [selectedReq, setSelectedReq] = useState(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    setLoading(true)
    let unsubscribe;

    if (tab === 'pending') {
      const q = query(collection(db, 'verification_requests'), orderBy('createdAt', 'desc'))
      unsubscribe = onSnapshot(q, (snapshot) => {
        setRequests(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })))
        setLoading(false)
      })
    } else {
      const q = query(collection(db, 'users'), where('isVerified', '==', true))
      unsubscribe = onSnapshot(q, (snapshot) => {
        setVerifiedUsers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })))
        setLoading(false)
      })
    }
    return () => unsubscribe && unsubscribe()
  }, [tab])

  const handleReverify = async (user) => {
    try {
      // 1. Reset Firestore status
      await updateDoc(doc(db, 'users', user.id), {
        isVerified: false,
        needsReverify: true,
        reverifyRequestedAt: serverTimestamp()
      })

      // 2. Reset RTDB status for immediate sync
      const { ref, update } = await import('firebase/database');
      const { rtdb } = await import('../firebase');
      await update(ref(rtdb, `users/${user.id}/profile`), {
        isVerified: false,
        needsReverify: true
      });
      
      setSelectedReq(null)
    } catch (error) {
      console.error('Error requesting re-verify:', error)
    }
  }

  const handleApprove = async (req) => {
    try {
      // 1. Update user profile in Firestore
      await updateDoc(doc(db, 'users', req.uid), {
        isVerified: true,
        verifiedAt: serverTimestamp()
      })

      // 2. Update user profile in RTDB for immediate app sync
      try {
        const { ref, update } = await import('firebase/database');
        const { rtdb } = await import('../firebase');
        await update(ref(rtdb, `users/${req.uid}/profile`), {
          isVerified: true
        });
      } catch (err) {
        console.warn('RTDB sync failed:', err);
      }

      // 3. Delete the request
      await deleteDoc(doc(db, 'verification_requests', req.id))
      setSelectedReq(null)
    } catch (error) {
      console.error('Error approving verification:', error)
    }
  }

  const handleReject = async (req) => {
    try {
      // Delete the request (maybe notify user in real app)
      await deleteDoc(doc(db, 'verification_requests', req.id))
      setSelectedReq(null)
    } catch (error) {
      console.error('Error rejecting verification:', error)
    }
  }

  const items = tab === 'pending' ? requests : verifiedUsers
  const filtered = items.filter(r => 
    (r.userName || r.firstName)?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (r.uid || r.id)?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) return <div className="flex items-center justify-center h-full"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-primary"></div></div>

  return (
    <div className="flex h-[calc(100vh-120px)] gap-8 animate-in fade-in duration-500">
      {/* List Section */}
      <div className={`flex-1 flex flex-col gap-6 ${selectedReq ? 'hidden lg:flex' : 'flex'}`}>
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-6">
            <h1 className="text-3xl">Verifications</h1>
            <div className="flex bg-white/5 p-1 rounded-xl border border-white/10">
              <button 
                onClick={() => { setTab('pending'); setSelectedReq(null); }}
                className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all ${tab === 'pending' ? 'bg-primary text-black' : 'text-gray-400 hover:text-white'}`}
              >
                Requests ({requests.length})
              </button>
              <button 
                onClick={() => { setTab('verified'); setSelectedReq(null); }}
                className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all ${tab === 'verified' ? 'bg-primary text-black' : 'text-gray-400 hover:text-white'}`}
              >
                Verified ({verifiedUsers.length})
              </button>
            </div>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
            <input 
              type="text" 
              placeholder="Search users..." 
              className="bg-surface border border-white/10 rounded-xl pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="glass-card flex-1 overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500 gap-4">
              <ShieldCheck size={48} className="opacity-20" />
              <p>No {tab} users found.</p>
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {filtered.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setSelectedReq(item)}
                  className={`w-full p-6 text-left hover:bg-white/[0.02] transition-colors flex gap-4 ${selectedReq?.id === item.id ? 'bg-white/[0.05]' : ''}`}
                >
                  <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center overflow-hidden border border-primary/20">
                    <img src={tab === 'pending' ? item.verificationPhoto : (item.photos?.[0] || 'https://picsum.photos/200')} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <div className="flex justify-between items-start mb-1">
                      <h4 className="font-bold truncate">{item.userName || item.firstName}</h4>
                      <span className="text-[10px] text-gray-500 flex items-center gap-1">
                        <Clock size={10} />
                        {item.createdAt?.toDate ? new Date(item.createdAt.toDate()).toLocaleDateString() : 'Just now'}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 truncate mb-2">UID: {item.uid || item.id}</p>
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                      tab === 'verified' ? 'bg-green-500/10 text-green-500' : 
                      item.status === 'auto-approved' ? 'bg-green-500/10 text-green-500' : 'bg-orange-500/10 text-orange-500'
                    }`}>
                      {tab === 'verified' ? 'Verified' : item.status}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Detail View */}
      {selectedReq ? (
        <div className="flex-[2] glass-card flex flex-col overflow-hidden animate-in slide-in-from-right-4 duration-300">
          <div className="p-6 border-b border-white/10 flex justify-between items-center">
            <div className="flex items-center gap-4">
              <button onClick={() => setSelectedReq(null)} className="lg:hidden p-2 hover:bg-white/5 rounded-lg"><ArrowLeft size={20} /></button>
              <div>
                <h3 className="text-xl font-bold">{tab === 'pending' ? 'Verification Review' : 'Verified Profile'}</h3>
                <p className="text-xs text-gray-500">{selectedReq.userName || selectedReq.firstName} • {selectedReq.uid || selectedReq.id}</p>
              </div>
            </div>
            <div className="flex gap-3">
              {tab === 'pending' ? (
                <>
                  <button 
                    onClick={() => handleReject(selectedReq)}
                    className="bg-red-500/10 text-red-500 px-6 py-2 rounded-xl text-sm font-bold hover:bg-red-500/20 transition-all flex items-center gap-2"
                  >
                    <XCircle size={18} /> Reject
                  </button>
                  <button 
                    onClick={() => handleApprove(selectedReq)}
                    className="bg-primary text-black px-6 py-2 rounded-xl text-sm font-bold hover:opacity-90 transition-all flex items-center gap-2 shadow-lg shadow-primary/20"
                  >
                    <ShieldCheck size={18} /> Approve
                  </button>
                </>
              ) : (
                <button 
                  onClick={() => handleReverify(selectedReq)}
                  className="bg-orange-500/10 text-orange-500 px-6 py-2 rounded-xl text-sm font-bold hover:bg-orange-500/20 transition-all flex items-center gap-2"
                >
                  <RefreshCcw size={18} /> Request Re-verify
                </button>
              )}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-8">
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                {/* Real-time Selfie */}
                <div>
                    <p className="text-xs text-gray-500 uppercase tracking-widest font-bold mb-4">Verification Selfie</p>
                    <div className="aspect-[3/4] rounded-2xl overflow-hidden border-2 border-primary shadow-2xl shadow-primary/10 bg-black">
                        <img src={selectedReq.verificationPhoto} className="w-full h-full object-cover" />
                    </div>
                </div>

                {/* Profile Photos */}
                <div>
                    <p className="text-xs text-gray-500 uppercase tracking-widest font-bold mb-4">Profile Photos</p>
                    <div className="grid grid-cols-2 gap-4">
                        {selectedReq.userPhotos?.map((p, i) => (
                            <div key={i} className="aspect-[3/4] rounded-xl overflow-hidden bg-white/5 border border-white/10">
                                <img src={p} className="w-full h-full object-cover" />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="hidden lg:flex flex-[2] glass-card items-center justify-center text-gray-500 flex-col gap-4">
          <ShieldCheck size={64} className="opacity-10" />
          <p>Select a verification request to compare photos.</p>
        </div>
      )}
    </div>
  )
}

export default Verifications
