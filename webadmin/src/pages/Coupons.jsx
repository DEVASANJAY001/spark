import { useState, useEffect } from 'react'
import { 
  Plus, 
  Ticket, 
  Copy, 
  Trash2, 
  CheckCircle,
  Calendar,
  Users,
  X,
  Loader2
} from 'lucide-react'
import { db } from '../firebase'
import { collection, query, onSnapshot, addDoc, deleteDoc, doc, serverTimestamp, orderBy } from 'firebase/firestore'

const Coupons = () => {
  const [coupons, setCoupons] = useState([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [newCoupon, setNewCoupon] = useState({
    code: '',
    discount: '',
    type: 'Percentage',
    limit: 100,
    expiry: ''
  })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const q = query(collection(db, 'coupons'), orderBy('createdAt', 'desc'))
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      setCoupons(docs)
      setLoading(false)
    }, (error) => {
      console.error('Snapshot listener error:', error)
      setLoading(false)
    })
    return () => unsubscribe()
  }, [])

  const handleCreate = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      await addDoc(collection(db, 'coupons'), {
        ...newCoupon,
        usage: 0,
        status: 'Active',
        createdAt: serverTimestamp()
      })
      setIsModalOpen(false)
      setNewCoupon({ code: '', discount: '', type: 'Percentage', limit: 100, expiry: '' })
    } catch (error) {
      console.error('Error creating coupon:', error)
      alert('Failed to create coupon: ' + error.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this coupon?')) {
      try {
        await deleteDoc(doc(db, 'coupons', id))
      } catch (error) {
        console.error('Error deleting coupon:', error)
      }
    }
  }

  const copyToClipboard = (code) => {
    navigator.clipboard.writeText(code)
    alert('Code copied to clipboard!')
  }

  return (
    <div className="space-y-8 animate-in slide-in-from-right-4 duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Coupon Management</h1>
          <p className="text-gray-400 mt-1">Manage referral codes and promotional offers.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus size={20} />
          Create New Coupon
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="animate-spin text-primary" size={40} />
        </div>
      ) : coupons.length === 0 ? (
        <div className="text-center py-20 glass-card">
          <Ticket size={48} className="mx-auto text-gray-600 mb-4" />
          <p className="text-gray-400">No coupons found. Create your first one!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {coupons.map((coupon) => (
            <div key={coupon.id} className="glass-card p-6 relative overflow-hidden group">
              <div className={`absolute top-0 right-0 w-32 h-32 -mr-16 -mt-16 rounded-full blur-3xl opacity-20 ${coupon.status === 'Active' ? 'bg-primary' : 'bg-gray-500'}`} />
              
              <div className="flex justify-between items-start mb-6">
                <div className="p-3 bg-white/5 rounded-xl text-primary">
                  <Ticket size={24} />
                </div>
                <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                  coupon.status === 'Active' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'
                }`}>
                  {coupon.status}
                </span>
              </div>

              <div className="space-y-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-2xl tracking-widest font-bold">{coupon.code}</h2>
                    <button 
                      onClick={() => copyToClipboard(coupon.code)}
                      className="p-1 hover:bg-white/10 rounded text-gray-500 hover:text-white transition-colors"
                    >
                      <Copy size={14} />
                    </button>
                  </div>
                  <p className="text-sm text-gray-400 mt-1">{coupon.discount} discount • {coupon.type}</p>
                </div>

                <div className="space-y-3 pt-4 border-t border-white/10">
                  <div className="flex justify-between items-center text-sm">
                    <div className="flex items-center gap-2 text-gray-500">
                      <Users size={16} />
                      <span>Usage</span>
                    </div>
                    <span className="font-medium">{coupon.usage || 0} / {coupon.limit}</span>
                  </div>
                  <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary" 
                      style={{ width: `${((coupon.usage || 0) / coupon.limit) * 100}%` }} 
                    />
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <div className="flex items-center gap-2 text-gray-500">
                      <Calendar size={16} />
                      <span>Expires</span>
                    </div>
                    <span className="font-medium">{coupon.expiry}</span>
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button 
                    onClick={() => handleDelete(coupon.id)}
                    className="flex-1 bg-red-500/10 py-2 rounded-lg text-sm font-medium text-red-500 hover:bg-red-500/20 transition-colors flex items-center justify-center gap-2"
                  >
                    <Trash2 size={16} />
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="glass-card w-full max-w-md p-8 relative animate-in zoom-in-95 duration-200">
            <button 
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white"
            >
              <X size={24} />
            </button>
            
            <h2 className="text-2xl font-bold mb-6">Create New Coupon</h2>
            
            <form onSubmit={handleCreate} className="space-y-5">
              <div>
                <label className="block text-sm text-gray-400 mb-2">Coupon Code</label>
                <input 
                  type="text"
                  required
                  placeholder="e.g. SPARK50"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-primary uppercase"
                  value={newCoupon.code}
                  onChange={(e) => setNewCoupon({...newCoupon, code: e.target.value.toUpperCase()})}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Type</label>
                  <select 
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-primary"
                    value={newCoupon.type}
                    onChange={(e) => setNewCoupon({...newCoupon, type: e.target.value})}
                  >
                    <option value="Percentage">Percentage</option>
                    <option value="Fixed">Fixed Amount</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Discount</label>
                  <input 
                    type="text"
                    required
                    placeholder={newCoupon.type === 'Percentage' ? '50%' : '₹500'}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-primary"
                    value={newCoupon.discount}
                    onChange={(e) => setNewCoupon({...newCoupon, discount: e.target.value})}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Usage Limit</label>
                  <input 
                    type="number"
                    required
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-primary"
                    value={newCoupon.limit}
                    onChange={(e) => setNewCoupon({...newCoupon, limit: parseInt(e.target.value)})}
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Expiry Date</label>
                  <input 
                    type="date"
                    required
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-primary"
                    value={newCoupon.expiry}
                    onChange={(e) => setNewCoupon({...newCoupon, expiry: e.target.value})}
                  />
                </div>
              </div>

              <button 
                type="submit" 
                disabled={submitting}
                className="btn-primary w-full py-4 rounded-xl mt-4 flex items-center justify-center gap-2 font-bold"
              >
                {submitting ? <Loader2 className="animate-spin" size={20} /> : 'Create Coupon'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Coupons
