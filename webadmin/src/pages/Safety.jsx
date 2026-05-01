import { useState, useEffect } from 'react'
import { db } from '../firebase'
import { collection, query, orderBy, onSnapshot, updateDoc, doc, getDoc, serverTimestamp } from 'firebase/firestore'
import { 
  ShieldAlert, 
  Clock, 
  CheckCircle, 
  AlertTriangle,
  User,
  Search,
  Filter,
  ArrowLeft,
  MoreVertical,
  Flag
} from 'lucide-react'

const Safety = () => {
  const [reports, setReports] = useState([])
  const [selectedReport, setSelectedReport] = useState(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    const q = query(collection(db, 'safety_reports'), orderBy('createdAt', 'desc'))
    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        const fetchedReports = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
        setReports(fetchedReports)
        setLoading(false)
      },
      (error) => {
        console.error("Safety snapshot error:", error)
        setLoading(false)
      }
    )
    return () => unsubscribe()
  }, [])

  const handleUpdateStatus = async (id, status) => {
    try {
      await updateDoc(doc(db, 'safety_reports', id), {
        status: status,
        updatedAt: serverTimestamp()
      })
      if (selectedReport?.id === id) {
          setSelectedReport(prev => ({...prev, status}))
      }
    } catch (error) {
      console.error('Error updating report status:', error)
    }
  }

  const filteredReports = reports.filter(r => 
    r.type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.reporterId?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) return <div className="flex items-center justify-center h-full"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-primary"></div></div>

  return (
    <div className="flex h-[calc(100vh-120px)] gap-8 animate-in fade-in duration-500">
      {/* Reports List */}
      <div className={`flex-1 flex flex-col gap-6 ${selectedReport ? 'hidden lg:flex' : 'flex'}`}>
        <div className="flex justify-between items-center">
          <h1 className="text-3xl">Safety Reports</h1>
          <div className="flex gap-3">
             <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
              <input 
                type="text" 
                placeholder="Search reports..." 
                className="bg-surface border border-white/10 rounded-xl pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="glass-card flex-1 overflow-y-auto">
          {filteredReports.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500 gap-4">
              <ShieldAlert size={48} className="opacity-20" />
              <p>No safety reports found.</p>
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {filteredReports.map((report) => (
                <button
                  key={report.id}
                  onClick={() => setSelectedReport(report)}
                  className={`w-full p-6 text-left hover:bg-white/[0.02] transition-colors flex gap-4 ${selectedReport?.id === report.id ? 'bg-white/[0.05]' : ''}`}
                >
                  <div className={`w-12 h-12 rounded-xl flex-shrink-0 flex items-center justify-center ${
                    report.status === 'pending' ? 'bg-orange-500/10 text-orange-500' :
                    report.status === 'investigating' ? 'bg-blue-500/10 text-blue-500' : 'bg-green-500/10 text-green-500'
                  }`}>
                    <Flag size={20} />
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <div className="flex justify-between items-start mb-1">
                      <h4 className="font-bold truncate">{report.type}</h4>
                      <span className="text-[10px] text-gray-500 flex items-center gap-1">
                        <Clock size={10} />
                        {report.createdAt?.toDate ? new Date(report.createdAt.toDate()).toLocaleDateString() : 'Just now'}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 truncate mb-2">Reporter UID: {report.reporterId}</p>
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                      report.status === 'pending' ? 'bg-orange-500/10 text-orange-500' :
                      report.status === 'investigating' ? 'bg-blue-500/10 text-blue-500' : 'bg-green-500/10 text-green-500'
                    }`}>
                      {report.status}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Report Detail */}
      {selectedReport ? (
        <div className="flex-[1.5] glass-card flex flex-col overflow-hidden animate-in slide-in-from-right-4 duration-300">
          <div className="p-6 border-b border-white/10 flex justify-between items-center">
            <div className="flex items-center gap-4">
              <button onClick={() => setSelectedReport(null)} className="lg:hidden p-2 hover:bg-white/5 rounded-lg"><ArrowLeft size={20} /></button>
              <div>
                <h3 className="text-xl font-bold">{selectedReport.type}</h3>
                <p className="text-xs text-gray-500">Report ID: {selectedReport.id}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={() => handleUpdateStatus(selectedReport.id, 'investigating')}
                className="bg-blue-500/10 text-blue-500 px-4 py-2 rounded-xl text-sm font-bold hover:bg-blue-500/20 transition-all"
              >
                Investigate
              </button>
              <button 
                onClick={() => handleUpdateStatus(selectedReport.id, 'resolved')}
                className="bg-green-500/10 text-green-500 px-4 py-2 rounded-xl text-sm font-bold hover:bg-green-500/20 transition-all"
              >
                Resolve
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-8 space-y-8">
            <div className="bg-white/5 rounded-2xl p-6">
                <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                            <User size={20} className="text-primary" />
                        </div>
                        <div>
                            <p className="text-sm font-bold">Reporter Information</p>
                            <p className="text-xs text-gray-500">UID: {selectedReport.reporterId}</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="text-xs text-gray-500">Submitted On</p>
                        <p className="text-sm">{selectedReport.createdAt?.toDate ? new Date(selectedReport.createdAt.toDate()).toLocaleString() : 'N/A'}</p>
                    </div>
                </div>

                <div className="space-y-4">
                    <div>
                        <p className="text-xs text-gray-500 uppercase tracking-widest font-bold mb-2">Category</p>
                        <p className="text-lg text-primary">{selectedReport.type}</p>
                    </div>
                    <div>
                        <p className="text-xs text-gray-500 uppercase tracking-widest font-bold mb-2">Description</p>
                        <p className="text-gray-300 leading-relaxed bg-black/20 p-4 rounded-xl border border-white/5">
                            {selectedReport.description}
                        </p>
                    </div>
                </div>
            </div>

            <div className="bg-orange-500/5 border border-orange-500/10 rounded-2xl p-6 flex gap-4">
                <AlertTriangle className="text-orange-500 flex-shrink-0" />
                <div>
                    <p className="text-orange-500 font-bold mb-1">Administrative Note</p>
                    <p className="text-xs text-gray-400 leading-relaxed">
                        Please review the reported content and take appropriate action according to Spark Community Guidelines. 
                        Actions may include account suspension, photo removal, or warnings.
                    </p>
                </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="hidden lg:flex flex-[1.5] glass-card items-center justify-center text-gray-500 flex-col gap-4">
          <ShieldAlert size={64} className="opacity-10" />
          <p>Select a safety report to review details.</p>
        </div>
      )}
    </div>
  )
}

export default Safety
