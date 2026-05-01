import { onAuthStateChanged } from 'firebase/auth'
import { auth } from './firebase'
import { useState, useEffect } from 'react'
import { Routes, Route } from 'react-router-dom'
import Sidebar from './components/Sidebar'
import Dashboard from './pages/Dashboard'
import Users from './pages/Users'
import Subscriptions from './pages/Subscriptions'
import Coupons from './pages/Coupons'
import Transactions from './pages/Transactions'
import Support from './pages/Support'
import Notifications from './pages/Notifications'
import Safety from './pages/Safety'
import Verifications from './pages/Verifications'
import Ads from './pages/Ads'
import Companies from './pages/Companies'
import Header from './components/Header'
import Login from './pages/Login'
import Signup from './pages/Signup'

function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser)
      setLoading(false)
    })
    return () => unsubscribe()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-primary"></div>
      </div>
    )
  }

  // Auth gate
  if (!user) {
    return (
      <Routes>
        <Route path="/signup" element={<Signup />} />
        <Route path="*" element={<Login />} />
      </Routes>
    )
  }

  return (
    <div className="flex min-h-screen bg-black overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/users" element={<Users />} />
            <Route path="/subscriptions" element={<Subscriptions />} />
            <Route path="/coupons" element={<Coupons />} />
            <Route path="/transactions" element={<Transactions />} />
            <Route path="/support" element={<Support />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/safety" element={<Safety />} />
            <Route path="/verifications" element={<Verifications />} />
            <Route path="/ads" element={<Ads />} />
            <Route path="/companies" element={<Companies />} />
          </Routes>
        </main>
      </div>
    </div>
  )
}

export default App
