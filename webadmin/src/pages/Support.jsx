import { useState, useEffect } from 'react'
import { db } from '../firebase'
import { collection, query, orderBy, onSnapshot, updateDoc, doc, getDoc, arrayUnion, serverTimestamp } from 'firebase/firestore'
import { 
  MessageSquare, 
  Send, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  User,
  Mail,
  Search,
  Filter,
  ArrowLeft
} from 'lucide-react'

const Support = () => {
  const [tickets, setTickets] = useState([])
  const [selectedTicket, setSelectedTicket] = useState(null)
  const [reply, setReply] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    const q = query(collection(db, 'tickets'), orderBy('createdAt', 'desc'))
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedTickets = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      setTickets(fetchedTickets)
      setLoading(false)
    })
    return () => unsubscribe()
  }, [])

  const handleSendReply = async () => {
    if (!reply.trim() || !selectedTicket) return
    setSending(true)
    try {
      const ticketRef = doc(db, 'tickets', selectedTicket.id)
      await updateDoc(ticketRef, {
        replies: arrayUnion({
          message: reply,
          sender: 'Admin',
          timestamp: new Date().toISOString()
        }),
        status: 'responded',
        updatedAt: serverTimestamp()
      })

      // Send Push Notification
      try {
        const userSnap = await getDoc(doc(db, 'users', selectedTicket.uid));
        if (userSnap.exists()) {
          const userData = userSnap.data();
          if (userData.expoPushToken) {
            await fetch('https://exp.host/--/api/v2/push/send', {
              method: 'POST',
              headers: {
                'Accept': 'application/json',
                'Accept-encoding': 'gzip, deflate',
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                to: userData.expoPushToken,
                title: 'Support Update',
                body: `Admin replied: ${reply.substring(0, 50)}${reply.length > 50 ? '...' : ''}`,
                data: { ticketId: selectedTicket.id, type: 'support' },
              }),
            });
          }
        }
      } catch (pushErr) {
        console.error('Error sending push:', pushErr);
      }

      setReply('')
    } catch (error) {
      console.error('Error sending reply:', error)
    } finally {
      setSending(false)
    }
  }

  const handleCloseTicket = async (id) => {
    try {
      await updateDoc(doc(db, 'tickets', id), {
        status: 'resolved',
        updatedAt: serverTimestamp()
      })
    } catch (error) {
      console.error('Error resolving ticket:', error)
    }
  }

  const filteredTickets = tickets.filter(t => 
    t.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.email?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) return <div className="flex items-center justify-center h-full"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-primary"></div></div>

  return (
    <div className="flex h-[calc(100vh-120px)] gap-8 animate-in fade-in duration-500">
      {/* Ticket List */}
      <div className={`flex-1 flex flex-col gap-6 ${selectedTicket ? 'hidden lg:flex' : 'flex'}`}>
        <div className="flex justify-between items-center">
          <h1 className="text-3xl">Support Tickets</h1>
          <div className="flex gap-3">
             <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
              <input 
                type="text" 
                placeholder="Search tickets..." 
                className="bg-surface border border-white/10 rounded-xl pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button className="p-2 border border-white/10 rounded-xl hover:bg-white/5"><Filter size={20} /></button>
          </div>
        </div>

        <div className="glass-card flex-1 overflow-y-auto">
          {filteredTickets.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500 gap-4">
              <MessageSquare size={48} className="opacity-20" />
              <p>No support tickets found.</p>
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {filteredTickets.map((ticket) => (
                <button
                  key={ticket.id}
                  onClick={() => setSelectedTicket(ticket)}
                  className={`w-full p-6 text-left hover:bg-white/[0.02] transition-colors flex gap-4 ${selectedTicket?.id === ticket.id ? 'bg-white/[0.05]' : ''}`}
                >
                  <div className={`w-12 h-12 rounded-xl flex-shrink-0 flex items-center justify-center ${
                    ticket.status === 'open' ? 'bg-red-500/10 text-red-500' :
                    ticket.status === 'responded' ? 'bg-blue-500/10 text-blue-500' : 'bg-green-500/10 text-green-500'
                  }`}>
                    <MessageSquare size={20} />
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <div className="flex justify-between items-start mb-1">
                      <h4 className="font-bold truncate">{ticket.subject}</h4>
                      <span className="text-[10px] text-gray-500 flex items-center gap-1">
                        <Clock size={10} />
                        {ticket.createdAt?.toDate ? new Date(ticket.createdAt.toDate()).toLocaleDateString() : 'Just now'}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 truncate mb-2">{ticket.email} • {ticket.category}</p>
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                      ticket.status === 'open' ? 'bg-red-500/10 text-red-500' :
                      ticket.status === 'responded' ? 'bg-blue-500/10 text-blue-500' : 'bg-green-500/10 text-green-500'
                    }`}>
                      {ticket.status}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Ticket Detail */}
      {selectedTicket ? (
        <div className="flex-[1.5] glass-card flex flex-col overflow-hidden animate-in slide-in-from-right-4 duration-300">
          <div className="p-6 border-b border-white/10 flex justify-between items-center">
            <div className="flex items-center gap-4">
              <button onClick={() => setSelectedTicket(null)} className="lg:hidden p-2 hover:bg-white/5 rounded-lg"><ArrowLeft size={20} /></button>
              <div>
                <h3 className="text-xl font-bold">{selectedTicket.subject}</h3>
                <p className="text-xs text-gray-500">Ticket ID: {selectedTicket.id}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={() => handleCloseTicket(selectedTicket.id)}
                className="bg-green-500/10 text-green-500 px-4 py-2 rounded-xl text-sm font-bold hover:bg-green-500/20 transition-all flex items-center gap-2"
              >
                <CheckCircle size={18} /> Resolve
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-8 space-y-8">
            {/* User Message */}
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">U</div>
              <div className="flex-1">
                <div className="bg-white/5 rounded-2xl p-4 rounded-tl-none">
                   <div className="flex justify-between items-center mb-2">
                    <span className="font-bold text-sm">{selectedTicket.email}</span>
                    <span className="text-[10px] text-gray-500">{selectedTicket.createdAt?.toDate ? new Date(selectedTicket.createdAt.toDate()).toLocaleString() : ''}</span>
                  </div>
                  <p className="text-gray-300 leading-relaxed">{selectedTicket.message}</p>
                </div>
              </div>
            </div>

            {/* Replies */}
            {selectedTicket.replies?.map((rep, i) => (
              <div key={i} className={`flex gap-4 ${rep.sender === 'Admin' ? 'flex-row-reverse' : ''}`}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${rep.sender === 'Admin' ? 'bg-blue-500/20 text-blue-500' : 'bg-primary/20 text-primary'}`}>
                  {rep.sender === 'Admin' ? 'A' : 'U'}
                </div>
                <div className={`max-w-[80%] ${rep.sender === 'Admin' ? 'text-right' : ''}`}>
                  <div className={`rounded-2xl p-4 ${rep.sender === 'Admin' ? 'bg-primary/10 rounded-tr-none' : 'bg-white/5 rounded-tl-none'}`}>
                     <div className={`flex justify-between items-center mb-2 gap-4 ${rep.sender === 'Admin' ? 'flex-row-reverse' : ''}`}>
                      <span className="font-bold text-sm">{rep.sender}</span>
                      <span className="text-[10px] text-gray-500">{new Date(rep.timestamp).toLocaleString()}</span>
                    </div>
                    <p className="text-gray-300 leading-relaxed text-left">{rep.message}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="p-6 border-t border-white/10">
            <div className="flex gap-3">
              <textarea
                placeholder="Type your response here..."
                className="flex-1 bg-surface border border-white/10 rounded-xl p-4 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50 resize-none"
                rows={1}
                value={reply}
                onChange={(e) => setReply(e.target.value)}
              />
              <button 
                onClick={handleSendReply}
                disabled={sending || !reply.trim()}
                className="btn-primary w-14 h-14 flex items-center justify-center rounded-xl flex-shrink-0"
              >
                {sending ? <div className="animate-spin h-5 w-5 border-2 border-white/30 border-t-white rounded-full" /> : <Send size={20} />}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="hidden lg:flex flex-[1.5] glass-card items-center justify-center text-gray-500 flex-col gap-4">
          <AlertCircle size={64} className="opacity-10" />
          <p>Select a ticket to view details and respond.</p>
        </div>
      )}
    </div>
  )
}

export default Support
