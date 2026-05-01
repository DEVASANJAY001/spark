import { useState } from 'react'
import { auth, db, rtdb } from '../firebase'
import { createUserWithEmailAndPassword } from 'firebase/auth'
import { doc, setDoc, serverTimestamp } from 'firebase/firestore'
import { ref, set } from 'firebase/database'
import { Flame, Lock, Mail, User, AlertCircle, CheckCircle } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'

const Signup = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    email: '',
    password: '',
    confirmPassword: ''
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const navigate = useNavigate()

  const handleSignup = async (e) => {
    e.preventDefault()
    if (formData.password !== formData.confirmPassword) {
      return setError('Passwords do not match.')
    }
    if (formData.password.length < 6) {
      return setError('Password must be at least 6 characters.')
    }

    setLoading(true)
    setError('')
    try {
      // 1. Create Auth User
      const { user } = await createUserWithEmailAndPassword(auth, formData.email, formData.password)
      
      // 2. Initialize Admin Record in Firestore
      await setDoc(doc(db, 'users', user.uid), {
        firstName: formData.firstName,
        email: formData.email,
        role: 'admin',
        premiumTier: 'platinum', // Admins get everything
        isVerified: true,
        isProfileComplete: true,
        createdAt: serverTimestamp(),
        status: 'Active'
      })

      // 3. Initialize RTDB Profile (Required for some app logic)
      await set(ref(rtdb, `users/${user.uid}/profile`), {
        firstName: formData.firstName,
        email: formData.email,
        role: 'admin',
        premiumTier: 'platinum',
        isProfileComplete: true,
        updatedAt: Date.now()
      })

      setSuccess(true)
      setTimeout(() => navigate('/'), 2000)
    } catch (err) {
      console.error('Signup failed:', err)
      if (err.code === 'auth/email-already-in-use') {
        setError('This email is already registered.')
      } else {
        setError('Failed to create admin account. ' + err.message)
      }
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-6 text-center">
        <div className="glass-card p-10 max-w-sm flex flex-col items-center gap-4 border-green-500/20">
          <CheckCircle className="text-green-500" size={60} />
          <h2 className="text-2xl font-bold">Admin Created!</h2>
          <p className="text-gray-400 text-sm">Welcome to the inner circle. Redirecting to dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-6">
      <div className="w-full max-w-md animate-in fade-in zoom-in duration-500">
        <div className="flex flex-col items-center mb-10">
          <div className="w-16 h-16 bg-gradient-to-br from-primary to-secondary rounded-2xl flex items-center justify-center shadow-2xl shadow-primary/20 mb-4">
            <Flame className="text-white fill-white" size={32} />
          </div>
          <h1 className="text-3xl font-display font-bold tracking-tight text-white">SPARK <span className="text-primary text-sm font-bold ml-1">ADMIN</span></h1>
          <p className="text-gray-500 mt-2 text-sm uppercase tracking-widest font-bold">Register New Personnel</p>
        </div>

        <div className="glass-card p-8 border border-white/10 shadow-2xl">
          <form onSubmit={handleSignup} className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5 ml-1">Admin Name</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                <input 
                  type="text" 
                  value={formData.firstName}
                  onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all text-sm"
                  placeholder="Full Name"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5 ml-1">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                <input 
                  type="email" 
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all text-sm"
                  placeholder="name@spark.com"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5 ml-1">Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                  <input 
                    type="password" 
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all text-sm"
                    placeholder="••••••"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5 ml-1">Confirm</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                  <input 
                    type="password" 
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all text-sm"
                    placeholder="••••••"
                    required
                  />
                </div>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-red-500 text-xs bg-red-500/10 p-3 rounded-xl border border-red-500/20">
                <AlertCircle size={14} />
                {error}
              </div>
            )}

            <button 
              type="submit"
              disabled={loading}
              className="w-full bg-white text-black font-bold py-4 rounded-xl shadow-lg transition-all transform active:scale-[0.98] disabled:opacity-50 mt-4 text-sm"
            >
              {loading ? 'CREATING ACCOUNT...' : 'CREATE ADMIN ACCOUNT'}
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-gray-500 text-xs">
              Already have an account?{' '}
              <Link to="/login" className="text-primary font-bold hover:underline">Sign In</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Signup
