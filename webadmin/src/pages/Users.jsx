import { useState, useEffect } from 'react'
import { db, rtdb } from '../firebase'
import { 
  collection, 
  getDocs, 
  updateDoc, 
  doc, 
  writeBatch, 
  setDoc, 
  serverTimestamp, 
  deleteDoc 
} from 'firebase/firestore'
import { ref, get, set } from 'firebase/database'
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
  AlertCircle,
  Database,
  Trash2,
  HardDriveDownload,
  AlertTriangle
} from 'lucide-react'

const Users = () => {
  const [users, setUsers] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isWiping, setIsWiping] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)
  const [maintenanceMsg, setMaintenanceMsg] = useState('')
  const [userTab, setUserTab] = useState('app') // 'app' or 'admin'
  
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

  const handleWipeAllUsers = async () => {
    const confirmation = window.prompt("⚠️ ULTIMATE SYSTEM WIPE: This will delete ALL data (Users, Matches, Ads, Transactions, etc.). Admins will be preserved. Type 'WIPE EVERYTHING' to confirm:");
    if (confirmation !== 'WIPE EVERYTHING') return;

    setIsWiping(true);
    setMaintenanceMsg('Performing Ultimate Wipe...');
    try {
      const collectionsToWipe = [
        'ad_analytics',
        'ad_companies',
        'app_ads',
        'coupons',
        'matches',
        'plans',
        'tickets',
        'transactions',
        'usernames',
        'safety_reports',
        'verification_requests',
        'notifications'
      ];

      for (const colName of collectionsToWipe) {
        console.log(`[WIPE] Starting ${colName}...`);
        setMaintenanceMsg(`Wiping Firestore: ${colName}...`);
        const snap = await getDocs(collection(db, colName));
        
        for (const parentDoc of snap.docs) {
          // Handle specific subcollections
          if (colName === 'matches') {
            const subSnap = await getDocs(collection(db, 'matches', parentDoc.id, 'messages'));
            for (const subDoc of subSnap.docs) {
              await deleteDoc(subDoc.ref);
            }
          }
          await deleteDoc(parentDoc.ref);
        }
        console.log(`[WIPE] Finished ${colName}`);
      }

      setMaintenanceMsg('Cleaning User Discovery Index...');
      const userSnap = await getDocs(collection(db, 'users'));
      let deletedCount = 0;
      
      for (const userDoc of userSnap.docs) {
        const data = userDoc.data();
        if (data.role !== 'admin') {
          // Attempt to clean subcollections (swipes/likes)
          try {
            const swipesSnap = await getDocs(collection(db, 'users', userDoc.id, 'swipes'));
            for (const sDoc of swipesSnap.docs) await deleteDoc(sDoc.ref);
            
            const likesSnap = await getDocs(collection(db, 'users', userDoc.id, 'likes'));
            for (const lDoc of likesSnap.docs) await deleteDoc(lDoc.ref);
          } catch (e) { console.warn('Subcollection cleanup failed for', userDoc.id); }

          await deleteDoc(userDoc.ref);
          deletedCount++;
        }
      }

      setMaintenanceMsg('Wiping Realtime Database Users...');
      const rtdbUsersRef = ref(rtdb, 'users');
      const rtdbSnap = await get(rtdbUsersRef);
      if (rtdbSnap.exists()) {
        const allUsers = rtdbSnap.val();
        for (const uid in allUsers) {
          if (allUsers[uid]?.profile?.role !== 'admin') {
            await set(ref(rtdb, `users/${uid}`), null);
          }
        }
      }

      setMaintenanceMsg(`Ultimate Wipe Complete! Removed ${deletedCount} users and all platform data.`);
      setTimeout(() => setMaintenanceMsg(''), 5000);
      fetchUsers();
    } catch (err) {
      console.error('Wipe failed:', err);
      setError("Wipe failed at " + (err.path || "unknown") + ": " + err.message);
    } finally {
      setIsWiping(false);
    }
  }

  const handleSyncFromRTDB = async () => {
    if (!window.confirm("This will read all users from Realtime Database and re-populate Firestore. Use this to repair a deleted collection. Continue?")) return;

    setIsSyncing(true);
    setMaintenanceMsg('Syncing from RTDB...');
    try {
      const usersRef = ref(rtdb, 'users');
      const snapshot = await get(usersRef);
      
      if (snapshot.exists()) {
        const rtdbUsers = snapshot.val();
        const uids = Object.keys(rtdbUsers);
        let count = 0;
        
        // Use individual setDoc calls to avoid batch size limits if many users exist
        for (const uid of uids) {
          const rtdbData = rtdbUsers[uid].profile || {};
          
          // Only sync discovery fields
          const discoveryFields = [
            'firstName', 'birthday', 'gender', 'interestedIn',
            'lookingFor', 'city', 'isProfileComplete', 'premiumTier',
            'hasPremium', 'locationEnabled', 'username', 'photos',
            'selectedCategory', 'bio', 'jobTitle', 'company', 'height'
          ];
          
          const discoveryData = {};
          discoveryFields.forEach(field => {
            if (rtdbData[field] !== undefined) discoveryData[field] = rtdbData[field];
          });

          await setDoc(doc(db, 'users', uid), {
            ...discoveryData,
            uid,
            updatedAt: serverTimestamp(),
            status: rtdbData.status || 'Active'
          }, { merge: true });
          
          count++;
          setMaintenanceMsg(`Synced ${count} / ${uids.length} users...`);
        }
        
        setMaintenanceMsg(`Successfully synced ${count} users!`);
      } else {
        setError("No users found in RTDB.");
      }
      
      setTimeout(() => setMaintenanceMsg(''), 5000);
      fetchUsers();
    } catch (err) {
      console.error('Sync failed:', err);
      setError("Sync failed: " + err.message);
    } finally {
      setIsSyncing(false);
    }
  }

  const handleSeedDefaults = async () => {
    if (!window.confirm("This will recreate default Subscription Plans, Ad Companies, and Sample Ads. Continue?")) return;

    setMaintenanceMsg('Seeding System Data...');
    try {
      // 1. SEED PLANS
      const plans = [
        { id: 'silver', name: 'Spark Silver', price: 499, duration: '1 Month', features: ['See who likes you', 'Unlimited likes', '5 Super likes per week', 'No ads'], tier: 'silver' },
        { id: 'gold', name: 'Spark Gold', price: 999, duration: '1 Month', features: ['Everything in Silver', 'Top Picks daily', 'See who visited your profile', 'Priority likes'], tier: 'gold' },
        { id: 'platinum', name: 'Spark Platinum', price: 1999, duration: '1 Month', features: ['Everything in Gold', 'Message before matching', 'See likes you sent', 'Global passport'], tier: 'platinum' }
      ];

      for (const plan of plans) {
        await setDoc(doc(db, 'plans', plan.id), plan);
      }

      // 2. SEED SAMPLE AD COMPANIES
      const companies = [
        { id: 'spark_internal', name: 'Spark Media', industry: 'Social', contact: 'admin@spark.com', status: 'Active' }
      ];
      for (const comp of companies) {
        await setDoc(doc(db, 'ad_companies', comp.id), comp);
      }

      // 3. SEED SAMPLE ADS
      const ads = [
        { id: 'premium_upsell', companyId: 'spark_internal', title: 'Go Platinum!', description: 'Unlock 10x more matches.', imageUrl: 'https://images.unsplash.com/photo-1512351735139-ce015767c7f9?q=80&w=1000', targetUrl: 'spark://subscriptions', type: 'banner', status: 'Active', totalImpressions: 0, totalEngagement: 0 }
      ];
      for (const ad of ads) {
        await setDoc(doc(db, 'app_ads', ad.id), ad);
      }

      setMaintenanceMsg('Seeding Complete!');
      setTimeout(() => setMaintenanceMsg(''), 5000);
    } catch (err) {
      console.error('Seed failed:', err);
      setError("Seed failed: " + err.message);
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

  const filteredUsers = users.filter(u => {
    const matchesSearch = (
      u.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    if (userTab === 'admin') {
      return matchesSearch && u.role === 'admin';
    }
    return matchesSearch && u.role !== 'admin';
  })

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-full gap-4">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-primary"></div>
      <p className="text-gray-500 animate-pulse text-sm">Fetching User Records...</p>
    </div>
  )

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-end gap-6">
        <div>
          <h1 className="text-3xl font-display">Identity Management</h1>
          <div className="flex gap-4 mt-4">
            <button 
              onClick={() => setUserTab('app')}
              className={`text-xs font-bold uppercase tracking-widest pb-2 border-b-2 transition-all ${userTab === 'app' ? 'border-primary text-white' : 'border-transparent text-gray-500 hover:text-gray-300'}`}
            >
              App Users
            </button>
            <button 
              onClick={() => setUserTab('admin')}
              className={`text-xs font-bold uppercase tracking-widest pb-2 border-b-2 transition-all ${userTab === 'admin' ? 'border-primary text-white' : 'border-transparent text-gray-500 hover:text-gray-300'}`}
            >
              System Admins
            </button>
          </div>
        </div>
        <div className="flex flex-col items-end gap-3">
          {maintenanceMsg && (
            <div className="flex items-center gap-2 text-primary text-[10px] font-bold uppercase tracking-widest bg-primary/5 px-3 py-1 rounded-full border border-primary/10">
              <RefreshCcw size={10} className="animate-spin" />
              {maintenanceMsg}
            </div>
          )}
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
              title="Refresh List"
            >
              <RefreshCcw size={20} />
            </button>
            <div className="h-10 w-px bg-white/10 mx-2" />
            <button 
              onClick={handleSyncFromRTDB}
              disabled={isSyncing}
              className={`flex items-center gap-2 px-4 rounded-xl border border-blue-500/30 text-blue-400 text-xs font-bold hover:bg-blue-500/10 transition-all ${isSyncing ? 'opacity-50 cursor-not-allowed' : ''}`}
              title="Repair collection by syncing from Realtime Database"
            >
              <HardDriveDownload size={18} />
              <span>RE-SYNC FIRESTORE</span>
            </button>
            <button 
              onClick={handleSeedDefaults}
              className="flex items-center gap-2 px-4 rounded-xl border border-purple-500/30 text-purple-400 text-xs font-bold hover:bg-purple-500/10 transition-all"
              title="Restore default plans and system data"
            >
              <Database size={18} />
              <span>SEED DEFAULTS</span>
            </button>
            <button 
              onClick={handleWipeAllUsers}
              disabled={isWiping}
              className={`flex items-center gap-2 px-4 rounded-xl border border-red-500/30 text-red-500 text-xs font-bold hover:bg-red-500/10 transition-all ${isWiping ? 'opacity-50 cursor-not-allowed' : ''}`}
              title="Danger: Delete all Firestore user records"
            >
              <Trash2 size={18} />
              <span>WIPE COLLECTION</span>
            </button>
          </div>
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
