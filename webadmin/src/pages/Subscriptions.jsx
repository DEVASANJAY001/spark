import { useState, useEffect } from 'react'
import { db } from '../firebase'
import { collection, getDocs, updateDoc, doc, setDoc, deleteDoc } from 'firebase/firestore'
import { 
  CreditCard, 
  Edit2, 
  Save, 
  X, 
  CheckCircle2,
  AlertCircle,
  RefreshCcw,
  Plus,
  Trash2,
  Zap
} from 'lucide-react'

const Subscriptions = () => {
  const [plans, setPlans] = useState([])
  const [editingPlan, setEditingPlan] = useState(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [message, setMessage] = useState(null)
  const [isAdding, setIsAdding] = useState(false)
  
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    price: '',
    period: 'month',
    features: '',
    popular: false,
    color1: '#fd267d',
    color2: '#ff7854'
  })

  useEffect(() => {
    fetchPlans()
  }, [])

  const fetchPlans = async () => {
    setLoading(true)
    try {
      const querySnapshot = await getDocs(collection(db, 'plans'))
      const fetchedPlans = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      setPlans(fetchedPlans)
    } catch (error) {
      console.error('Error fetching plans:', error)
      setMessage({ type: 'error', text: 'Failed to fetch plans: ' + error.message })
    } finally {
      setLoading(false)
    }
  }

  const handleSavePlan = async (e) => {
    e.preventDefault()
    setUpdating(true)
    try {
      const planId = formData.id.toLowerCase().replace(/\s+/g, '-')
      const planData = {
        name: formData.name,
        price: parseInt(formData.price),
        period: formData.period,
        features: formData.features.split(',').map(f => f.trim()),
        popular: formData.popular,
        colors: [formData.color1, formData.color2]
      }
      
      await setDoc(doc(db, 'plans', planId), planData)
      setMessage({ type: 'success', text: 'Plan saved successfully!' })
      setIsAdding(false)
      fetchPlans()
      resetForm()
    } catch (error) {
      setMessage({ type: 'error', text: 'Save failed: ' + error.message })
    } finally {
      setUpdating(false)
    }
  }

  const handleDeletePlan = async (id) => {
    if (!window.confirm('Are you sure you want to delete this plan?')) return
    setUpdating(true)
    try {
      await deleteDoc(doc(db, 'plans', id))
      setMessage({ type: 'success', text: 'Plan deleted.' })
      fetchPlans()
    } catch (error) {
      setMessage({ type: 'error', text: 'Delete failed: ' + error.message })
    } finally {
      setUpdating(false)
    }
  }

  const resetForm = () => {
    setFormData({
      id: '',
      name: '',
      price: '',
      period: 'month',
      features: '',
      popular: false,
      color1: '#fd267d',
      color2: '#ff7854'
    })
  }

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-full gap-4">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-primary"></div>
      <p className="text-gray-500 animate-pulse text-sm">Loading Plans...</p>
    </div>
  )

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500 pb-20">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-display">Subscription Plans</h1>
          <p className="text-gray-400 mt-1">Manage pricing, tiers, and billing periods.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={fetchPlans}
            className="p-2.5 bg-white/5 hover:bg-white/10 rounded-xl transition-all text-gray-400 border border-white/10"
          >
            <RefreshCcw size={18} />
          </button>
          <button 
            onClick={() => setIsAdding(!isAdding)}
            className="btn-primary text-sm flex items-center gap-2"
          >
            {isAdding ? <X size={18} /> : <Plus size={18} />}
            {isAdding ? 'Cancel' : 'Add New Plan'}
          </button>
        </div>
      </div>

      {message && (
        <div className={`p-4 rounded-2xl flex items-center gap-3 animate-in fade-in zoom-in duration-300 border ${message.type === 'success' ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20'}`}>
          {message.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
          <span className="text-sm font-medium">{message.text}</span>
          <button onClick={() => setMessage(null)} className="ml-auto opacity-50 hover:opacity-100"><X size={16}/></button>
        </div>
      )}

      {isAdding && (
        <div className="glass-card p-8 animate-in slide-in-from-top-4 duration-300">
          <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
            <Zap className="text-primary" size={20} />
            Create New Tier
          </h3>
          <form onSubmit={handleSavePlan} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Plan ID (Unique)</label>
              <input 
                required
                className="input-field" 
                placeholder="e.g. platinum"
                value={formData.id}
                onChange={e => setFormData({...formData, id: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Display Name</label>
              <input 
                required
                className="input-field" 
                placeholder="e.g. Spark Platinum"
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Price (₹)</label>
              <input 
                required
                type="number"
                className="input-field" 
                placeholder="e.g. 799"
                value={formData.price}
                onChange={e => setFormData({...formData, price: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Period</label>
              <select 
                className="input-field"
                value={formData.period}
                onChange={e => setFormData({...formData, period: e.target.value})}
              >
                <option value="daily">Daily</option>
                <option value="week">Weekly</option>
                <option value="month">Monthly</option>
                <option value="year">Yearly</option>
              </select>
            </div>
            <div className="md:col-span-2 space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Features (comma separated)</label>
              <input 
                required
                className="input-field" 
                placeholder="Unlimited Likes, Passport Mode, Priority Likes"
                value={formData.features}
                onChange={e => setFormData({...formData, features: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Accent Colors</label>
              <div className="flex gap-2">
                <input type="color" className="h-10 w-full rounded-lg bg-surface border-0" value={formData.color1} onChange={e => setFormData({...formData, color1: e.target.value})} />
                <input type="color" className="h-10 w-full rounded-lg bg-surface border-0" value={formData.color2} onChange={e => setFormData({...formData, color2: e.target.value})} />
              </div>
            </div>
            <div className="flex items-end pb-1">
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" className="w-5 h-5 rounded border-white/10 bg-white/5 text-primary" checked={formData.popular} onChange={e => setFormData({...formData, popular: e.target.checked})} />
                <span className="text-sm font-medium">Most Popular?</span>
              </label>
            </div>
            <div className="md:col-span-4 flex justify-end gap-3 mt-4">
               <button type="submit" disabled={updating} className="btn-primary px-10">
                 {updating ? 'Saving...' : 'Save Plan'}
               </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {plans.map((plan) => (
          <div key={plan.id} className="glass-card p-8 flex flex-col gap-6 relative group border-t-4" style={{ borderColor: plan.colors?.[0] || '#fd267d' }}>
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-2xl font-bold font-display">{plan.name}</h3>
                <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mt-1">{plan.id}</p>
              </div>
              <button 
                onClick={() => handleDeletePlan(plan.id)}
                className="p-2 text-gray-600 hover:text-red-500 transition-colors"
              >
                <Trash2 size={18} />
              </button>
            </div>

            <div className="flex items-baseline gap-2">
              <span className="text-5xl font-display font-bold tracking-tight">₹{plan.price}</span>
              <span className="text-gray-500 uppercase text-xs font-bold tracking-widest">/{plan.period}</span>
            </div>

            <div className="space-y-4 flex-1 pt-6 border-t border-white/5">
              {plan.features?.map((feature, i) => (
                <div key={i} className="flex items-center gap-3 text-sm text-gray-400">
                  <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: plan.colors?.[0] }} />
                  <span className="truncate">{feature}</span>
                </div>
              ))}
            </div>

            {plan.popular && (
              <div className="absolute top-4 right-4 bg-primary/10 text-primary text-[10px] font-black px-2 py-1 rounded">
                POPULAR
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

export default Subscriptions
