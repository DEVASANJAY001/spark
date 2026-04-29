import { useState, useEffect } from 'react'
import { db } from '../firebase'
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore'
import { Bell, Send, Users, Smartphone, Search, Filter, CheckCircle, AlertCircle } from 'lucide-react'

const Notifications = () => {
  const [users, setUsers] = useState([])
  const [selectedUsers, setSelectedUsers] = useState([])
  const [sendToAll, setSendToAll] = useState(false)
  const [title, setTitle] = useState('')
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [status, setStatus] = useState(null) // { type: 'success' | 'error', text: string }

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      const q = query(collection(db, 'users'), orderBy('updatedAt', 'desc'), limit(1000))
      const querySnapshot = await getDocs(q)
      const fetchedUsers = querySnapshot.docs.map(doc => {
        const data = doc.data()
        const token = data.expoPushToken || data.pushToken
        return {
          id: doc.id,
          ...data,
          expoPushToken: token, // Normalize to expoPushToken for the logic
          hasToken: !!token
        }
      })
      setUsers(fetchedUsers)
    } catch (error) {
      console.error('Error fetching users:', error)
      setStatus({ type: 'error', text: 'Failed to load users from database.' })
    }
  }

  const handleSend = async () => {
    if (!title.trim() || !message.trim()) return
    if (!sendToAll && selectedUsers.length === 0) return
    
    setSending(true)
    setStatus(null)

    let tokens = []
    
    try {
        if (sendToAll) {
            // Get all unique tokens from all users
            tokens = users
                .map(u => u.expoPushToken)
                .filter(t => t && typeof t === 'string' && t.startsWith('ExponentPushToken'))
            
            // Deduplicate tokens
            tokens = [...new Set(tokens)]
        } else {
            tokens = selectedUsers
                .map(id => users.find(u => u.id === id)?.expoPushToken)
                .filter(t => t)
        }
        
        if (tokens.length === 0) {
            setStatus({ type: 'error', text: 'No users with valid push tokens were selected.' })
            setSending(false)
            return
        }

        // expo-notifications requires sending in chunks of 100
        const chunks = []
        for (let i = 0; i < tokens.length; i += 100) {
            chunks.push(tokens.slice(i, i + 100))
        }

        let successCount = 0
        let failureCount = 0

        for (const chunk of chunks) {
            try {
                const response = await fetch('/expo-api/--/api/v2/push/send', {
                    method: 'POST',
                    headers: {
                        'Accept': 'application/json',
                        'Accept-encoding': 'gzip, deflate',
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(chunk.map(token => ({
                        to: token,
                        title: title,
                        body: message,
                        data: { type: 'admin_broadcast' },
                        sound: 'default'
                    }))),
                })
                
                const result = await response.json()
                
                if (response.ok) {
                    successCount += chunk.length
                } else {
                    console.error('Expo API error:', result)
                    failureCount += chunk.length
                }
            } catch (chunkError) {
                console.error('Chunk sending error:', chunkError)
                failureCount += chunk.length
            }
        }

        if (successCount > 0) {
            setStatus({ 
                type: 'success', 
                text: `Broadcast complete! Successfully sent to ${successCount} users.${failureCount > 0 ? ` (${failureCount} failed)` : ''}` 
            })
            setTitle('')
            setMessage('')
            setSelectedUsers([])
            setSendToAll(false)
        } else {
            setStatus({ type: 'error', text: 'Failed to send notifications. Check console for details.' })
        }
    } catch (error) {
      console.error('Error sending notifications:', error)
      setStatus({ type: 'error', text: `Error: ${error.message}` })
    } finally {
      setSending(false)
    }
  }

  const toggleUserSelection = (userId) => {
    const user = users.find(u => u.id === userId)
    if (!user?.hasToken) return // Prevent selecting users without tokens

    if (selectedUsers.includes(userId)) {
      setSelectedUsers(selectedUsers.filter(id => id !== userId))
    } else {
      setSelectedUsers([...selectedUsers, userId])
    }
  }

  const selectAll = () => {
    const usersWithTokens = filteredUsers.filter(u => u.hasToken)
    if (selectedUsers.length === usersWithTokens.length) {
      setSelectedUsers([])
    } else {
      setSelectedUsers(usersWithTokens.map(u => u.id))
    }
  }

  const filteredUsers = users.filter(u => 
    u.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const usersWithTokensCount = users.filter(u => u.hasToken).length;

  return (
    <div className="flex flex-col gap-8 animate-in fade-in duration-500 max-w-6xl mx-auto">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-black tracking-tight">Push Notifications</h1>
        <div className="flex items-center gap-2 text-sm text-gray-500 bg-white/5 px-4 py-2 rounded-xl">
          <Smartphone size={16} />
          <span>{usersWithTokensCount} / {users.length} Users with Push enabled</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Composer */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <div className="glass-card p-8 flex flex-col gap-6">
            <h3 className="text-xl font-bold flex items-center gap-3">
                <Bell className="text-primary" size={24} /> Compose Broadcast
            </h3>
            
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-gray-400">Notification Title</label>
                <input 
                  type="text" 
                  placeholder="e.g. Special Offer! 🎁" 
                  className="bg-surface border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-1 focus:ring-primary/50"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-gray-400">Message body</label>
                <textarea 
                  placeholder="Type your announcement here..." 
                  className="bg-surface border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-1 focus:ring-primary/50 min-h-[150px] resize-none"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                />
              </div>

              <div className="flex items-center gap-3 p-4 bg-white/5 rounded-xl border border-white/10 mt-2">
                <input 
                    type="checkbox"
                    id="sendToAll"
                    className="w-5 h-5 accent-primary cursor-pointer"
                    checked={sendToAll}
                    onChange={(e) => setSendToAll(e.target.checked)}
                />
                <label htmlFor="sendToAll" className="text-sm font-bold cursor-pointer select-none">
                    Broadcast to All Users ({usersWithTokensCount} reachable users)
                </label>
              </div>
            </div>

            {status && (
              <div className={`p-4 rounded-xl flex items-center gap-3 ${status.type === 'success' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                {status.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
                <p className="text-sm font-medium">{status.text}</p>
              </div>
            )}

            <button 
              onClick={handleSend}
              disabled={sending || !title.trim() || !message.trim() || (!sendToAll && selectedUsers.length === 0)}
              className="btn-primary flex items-center justify-center gap-3 py-4 text-lg font-bold disabled:opacity-50 transition-all hover:scale-[1.02]"
            >
              {sending ? (
                <div className="animate-spin h-6 w-6 border-2 border-white/30 border-t-white rounded-full" />
              ) : (
                <>
                  <Send size={20} />
                  {sendToAll ? 'Broadcast to Everyone' : `Send to ${selectedUsers.length} Selected`}
                </>
              )}
            </button>
          </div>
        </div>

        {/* User Selector */}
        <div className="lg:col-span-1 flex flex-col gap-6">
          <div className="glass-card overflow-hidden flex flex-col max-h-[700px]">
            <div className="p-6 border-b border-white/10 flex flex-col gap-4">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <Users size={20} /> Select Audience
              </h3>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                <input 
                  type="text" 
                  placeholder="Search users..." 
                  className="w-full bg-surface border border-white/10 rounded-xl pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <button 
                onClick={selectAll}
                className="text-xs font-bold text-primary hover:underline text-left"
              >
                {selectedUsers.length === filteredUsers.filter(u => u.hasToken).length ? 'Deselect All reachable' : 'Select All reachable'}
              </button>
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-white/5">
              {filteredUsers.map((user) => (
                <div 
                  key={user.id} 
                  className={`p-4 flex items-center gap-3 cursor-pointer hover:bg-white/5 transition-colors ${selectedUsers.includes(user.id) ? 'bg-primary/5' : ''} ${!user.hasToken ? 'opacity-40 grayscale cursor-not-allowed' : ''}`}
                  onClick={() => toggleUserSelection(user.id)}
                >
                  <div className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${selectedUsers.includes(user.id) ? 'bg-primary border-primary' : 'border-white/20'}`}>
                    {selectedUsers.includes(user.id) && <Send size={12} className="text-white" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold truncate">{user.firstName || 'User'}</p>
                    <p className="text-[10px] text-gray-500 truncate">{user.email || user.id}</p>
                  </div>
                  {!user.hasToken && (
                    <span className="text-[8px] font-black bg-white/10 text-gray-400 px-1.5 py-0.5 rounded uppercase">No Push</span>
                  )}
                </div>
              ))}
              {filteredUsers.length === 0 && (
                <div className="p-8 text-center text-gray-500">
                    <p className="text-sm">No users found.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Notifications
