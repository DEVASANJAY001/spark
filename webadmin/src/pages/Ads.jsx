import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  Plus, 
  Search, 
  Trash2, 
  ExternalLink, 
  Eye, 
  MousePointer2, 
  Clock,
  Layout,
  Play,
  Pause,
  Image as ImageIcon,
  Flame,
  Filter,
  BarChart3,
  Calendar,
  Building2,
  ChevronDown,
  TrendingUp,
  Activity,
  Edit2,
  ArrowRight,
  Info,
  Maximize2
} from 'lucide-react';
import { 
  collection, 
  query, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  serverTimestamp,
  orderBy,
  limit,
  where
} from 'firebase/firestore';
import { db } from '../firebase';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  AreaChart, 
  Area,
  PieChart,
  Pie,
  Cell
} from 'recharts';

const Ads = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const companyFilter = searchParams.get('companyId') || 'all';

  const [ads, setAds] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [analytics, setAnalytics] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(null); // ad object
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCompany, setSelectedCompany] = useState(companyFilter);
  const [timeRange, setTimeRange] = useState('7d'); 
  const [editingId, setEditingId] = useState(null);
  
  const [newAd, setNewAd] = useState({
    title: '',
    description: '',
    image: '',
    targetUrl: '',
    placement: 'swipe_deck',
    active: true,
    buttonText: 'Learn More',
    order: 0,
    mediaType: 'image',
    highlighted: false,
    companyId: '',
    targetingType: 'global',
    targetingCity: '',
    targetingLat: '',
    targetingLng: '',
    targetingRadius: 50,
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  });

  useEffect(() => {
    const qAds = query(collection(db, 'app_ads'), orderBy('createdAt', 'desc'));
    const unsubAds = onSnapshot(qAds, (snapshot) => {
      setAds(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const qComp = query(collection(db, 'ad_companies'));
    const unsubComp = onSnapshot(qComp, (snapshot) => {
      setCompanies(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const qAnalytics = query(collection(db, 'ad_analytics'), limit(2000));
    const unsubAnalytics = onSnapshot(qAnalytics, (snapshot) => {
      setAnalytics(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => {
      unsubAds();
      unsubComp();
      unsubAnalytics();
    };
  }, []);

  // Sync state with URL params
  useEffect(() => {
    setSelectedCompany(companyFilter);
  }, [companyFilter]);

  const handleCompanyChange = (val) => {
    setSelectedCompany(val);
    setSearchParams(val === 'all' ? {} : { companyId: val });
  };

  const handleToggleActive = async (id, currentStatus) => {
    await updateDoc(doc(db, 'app_ads', id), { active: !currentStatus });
  };

  const handleToggleHighlighted = async (id, currentStatus) => {
    await updateDoc(doc(db, 'app_ads', id), { highlighted: !currentStatus });
  };

  const handleAddAd = async (e) => {
    e.preventDefault();
    if (!newAd.companyId) return alert('Please select a company');
    
    const adData = {
      ...newAd,
      startDate: new Date(newAd.startDate),
      endDate: new Date(newAd.endDate),
    };

    if (editingId) {
      await updateDoc(doc(db, 'app_ads', editingId), adData);
    } else {
      await addDoc(collection(db, 'app_ads'), {
        ...adData,
        totalImpressions: 0,
        totalEngagement: 0,
        totalEngagementTime: 0,
        createdAt: serverTimestamp()
      });
    }
    
    setShowAddModal(false);
    setEditingId(null);
  };

  const handleEditClick = (ad) => {
    setEditingId(ad.id);
    setNewAd({
      title: ad.title || '',
      description: ad.description || '',
      image: ad.image || '',
      targetUrl: ad.targetUrl || '',
      placement: ad.placement || 'swipe_deck',
      active: ad.active ?? true,
      buttonText: ad.buttonText || 'Learn More',
      order: ad.order || 0,
      mediaType: ad.mediaType || 'image',
      highlighted: ad.highlighted || false,
      companyId: ad.companyId || '',
      targetingType: ad.targetingType || 'global',
      targetingCity: ad.targetingCity || '',
      targetingLat: ad.targetingLat || '',
      targetingLng: ad.targetingLng || '',
      targetingRadius: ad.targetingRadius || 50,
      startDate: ad.startDate?.toDate ? ad.startDate.toDate().toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      endDate: ad.endDate?.toDate ? ad.endDate.toDate().toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
    });
    setShowAddModal(true);
  };

  const handleDeleteAd = async (id) => {
    if (window.confirm('Delete this ad?')) await deleteDoc(doc(db, 'app_ads', id));
  };

  const filteredAds = useMemo(() => {
    return ads.filter(ad => {
      const matchSearch = ad.title?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchCompany = selectedCompany === 'all' || ad.companyId === selectedCompany;
      return matchSearch && matchCompany;
    });
  }, [ads, searchTerm, selectedCompany]);

  const chartData = useMemo(() => {
    const days = parseInt(timeRange) || 7;
    const data = [];
    const now = new Date();
    
    for (let i = days; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dateStr = date.toLocaleDateString([], { month: 'short', day: 'numeric' });
      
      const dayLogs = analytics.filter(log => {
        if (!log.timestamp) return false;
        if (selectedCompany !== 'all' && ads.find(a => a.id === log.adId)?.companyId !== selectedCompany) return false;
        const logDate = log.timestamp.toDate();
        return logDate.toDateString() === date.toDateString();
      });

      data.push({
        name: dateStr,
        views: dayLogs.filter(l => l.type === 'impression').length,
        clicks: dayLogs.filter(l => l.type === 'engagement' && l.duration === 0).length,
      });
    }
    return data;
  }, [analytics, timeRange, selectedCompany, ads]);

  const stats = useMemo(() => {
    const relevantAds = selectedCompany === 'all' ? ads : ads.filter(a => a.companyId === selectedCompany);
    return {
      active: relevantAds.filter(a => a.active).length,
      placements: [...new Set(relevantAds.map(a => a.placement))].length,
      totalViews: relevantAds.reduce((acc, curr) => acc + (curr.totalImpressions || 0), 0),
      totalClicks: relevantAds.reduce((acc, curr) => acc + (curr.totalEngagement || 0), 0),
    };
  }, [ads, selectedCompany]);

  return (
    <div className="space-y-6 pb-20">
      {/* Header & Main Stats */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-display font-black text-white tracking-tight">
            {selectedCompany !== 'all' ? companies.find(c => c.id === selectedCompany)?.name.toUpperCase() : 'PLATFORM'} <span className="text-primary text-lg">PRO</span>
          </h1>
          <p className="text-gray-500 font-medium mt-1">
            {selectedCompany !== 'all' ? `Dedicated campaign analytics for ${companies.find(c => c.id === selectedCompany)?.name}.` : 'Multi-company campaign management & deep analytics.'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {selectedCompany !== 'all' && (
            <button onClick={() => handleCompanyChange('all')} className="bg-white/5 hover:bg-white/10 text-gray-400 px-4 py-4 rounded-2xl font-bold flex items-center gap-2 border border-white/10 transition-all">
              Reset Filters
            </button>
          )}
          <button onClick={() => setShowAddModal(true)} className="bg-primary hover:bg-primary-hover text-white px-8 py-4 rounded-2xl font-bold flex items-center gap-2 transition-all shadow-xl shadow-primary/20">
            <Plus size={22} /> Create Asset
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard icon={<Activity className="text-primary" />} label="Active Ads" value={stats.active} trend="Live" />
        <StatCard icon={<Layout className="text-blue-400" />} label="Placements" value={stats.placements} trend="Active" />
        <StatCard icon={<TrendingUp className="text-emerald-400" />} label="Total Views" value={stats.totalViews.toLocaleString()} trend="Organic" />
        <StatCard icon={<MousePointer2 className="text-purple-400" />} label="Engagements" value={stats.totalClicks.toLocaleString()} trend="Real-time" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-surface border border-white/10 rounded-2xl p-6 shadow-2xl">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <BarChart3 className="text-primary" size={20} /> Performance Timeline
              </h3>
              <p className="text-gray-500 text-sm mt-1">Real-time impressions & engagement data.</p>
            </div>
            <div className="flex bg-white/5 p-1 rounded-xl border border-white/10">
              {['7d', '14d', '30d'].map(r => (
                <button 
                  key={r} 
                  onClick={() => setTimeRange(r)}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${timeRange === r ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-gray-500 hover:text-white'}`}
                >
                  {r.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
          
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#FF3366" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#FF3366" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                <XAxis dataKey="name" stroke="#555" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#555" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#000', border: '1px solid #333', borderRadius: '16px', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}
                  itemStyle={{ color: '#fff', fontSize: '12px', fontWeight: 'bold' }}
                />
                <Area type="monotone" dataKey="views" stroke="#FF3366" strokeWidth={4} fillOpacity={1} fill="url(#colorViews)" />
                <Area type="monotone" dataKey="clicks" stroke="#00D1FF" strokeWidth={3} fill="transparent" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-surface border border-white/10 rounded-2xl p-6 flex flex-col shadow-2xl">
          <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <Filter className="text-primary" size={20} /> Analytics Drill-down
          </h3>
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Partner Company</label>
              <div className="relative">
                <select 
                  value={selectedCompany} 
                  onChange={e => handleCompanyChange(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-5 text-white appearance-none focus:border-primary outline-none transition-all cursor-pointer hover:bg-white/[0.07]"
                >
                  <option value="all">All Ad Providers</option>
                  {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" size={18} />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Search Assets</label>
              <div className="relative">
                <input 
                  value={searchTerm} 
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-12 text-white outline-none focus:border-primary transition-all hover:bg-white/[0.07]"
                  placeholder="Creative title..."
                />
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
              </div>
            </div>

            <div className="flex-1 flex flex-col justify-end pt-8">
              <div className="bg-emerald-400/5 border border-emerald-400/10 p-5 rounded-2xl">
                <div className="flex items-center gap-2 text-emerald-400 mb-2">
                  <TrendingUp size={16} />
                  <span className="text-[10px] font-black uppercase tracking-widest">Conversion Insight</span>
                </div>
                <p className="text-xs text-gray-400 leading-relaxed font-medium">
                  Currently, <span className="text-white font-bold">Video Ads</span> are seeing 24% higher engagement time than static banners in the Chats screen.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-surface border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
        <div className="p-8 border-b border-white/10 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-white">Campaign Creative Assets</h2>
          <div className="flex items-center gap-4 text-xs font-bold text-gray-500">
             <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-emerald-400" /> Live</span>
             <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-red-400" /> Expired</span>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left border-b border-white/10 bg-white/5">
                <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] w-[40%]">Creative Detail</th>
                <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Company</th>
                <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Schedule</th>
                <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Performance</th>
                <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredAds.map((ad) => {
                const isExpired = ad.endDate?.toDate && ad.endDate.toDate() < new Date();
                return (
                  <tr key={ad.id} className="hover:bg-white/[0.01] transition-colors group">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-5">
                        <div className={`w-28 h-16 rounded-2xl overflow-hidden flex-shrink-0 border-2 transition-all group-hover:scale-105 ${ad.highlighted ? 'border-primary shadow-lg shadow-primary/20' : 'border-white/10'}`}>
                          {ad.mediaType === 'video' ? (
                            <div className="w-full h-full bg-black flex items-center justify-center text-primary">
                              <Play size={24} fill="currentColor" />
                            </div>
                          ) : (
                            <img src={ad.image} alt="" className="w-full h-full object-cover" />
                          )}
                        </div>
                        <div className="overflow-hidden">
                          <p className="text-white font-bold text-lg truncate group-hover:text-primary transition-colors">{ad.title || 'Creative Asset'}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] font-black text-gray-500 uppercase tracking-wider">{ad.placement}</span>
                            {ad.highlighted && <span className="bg-primary/10 text-primary text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-widest">Premium</span>}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <button 
                        onClick={() => handleCompanyChange(ad.companyId)}
                        className="flex items-center gap-2 hover:bg-white/5 px-3 py-2 rounded-xl transition-all"
                      >
                        <Building2 size={14} className="text-primary" />
                        <span className="text-sm text-gray-300 font-bold whitespace-nowrap">
                          {companies.find(c => c.id === ad.companyId)?.name || 'Provider'}
                        </span>
                      </button>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-1.5 text-[10px] font-black text-gray-500 uppercase tracking-wider">
                          <Calendar size={10} /> {ad.startDate?.toDate ? ad.startDate.toDate().toLocaleDateString() : 'Active'}
                        </div>
                        <div className={`flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider ${isExpired ? 'text-red-400' : 'text-emerald-400'}`}>
                          <Clock size={10} /> {ad.endDate?.toDate ? ad.endDate.toDate().toLocaleDateString() : 'Continuous'}
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className="text-center">
                          <p className="text-[10px] font-black text-gray-600 uppercase tracking-widest">Views</p>
                          <p className="text-sm font-bold text-white">{(ad.totalImpressions || 0).toLocaleString()}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-[10px] font-black text-gray-600 uppercase tracking-widest">Clicks</p>
                          <p className="text-sm font-bold text-primary">{(ad.totalEngagement || 0).toLocaleString()}</p>
                        </div>
                        <button 
                          onClick={() => setShowDetailModal(ad)}
                          className="p-2 text-gray-500 hover:text-white hover:bg-white/5 rounded-lg transition-all"
                        >
                          <Maximize2 size={16} />
                        </button>
                      </div>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => handleEditClick(ad)} className="p-3 text-gray-400 hover:text-primary hover:bg-primary/10 rounded-xl transition-all">
                          <Edit2 size={18} />
                        </button>
                        <button onClick={() => handleDeleteAd(ad.id)} className="p-3 text-gray-400 hover:text-red-400 hover:bg-red-400/10 rounded-xl transition-all">
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Ad Detail Modal */}
      {showDetailModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl">
          <div className="bg-surface border border-white/10 w-full max-w-4xl rounded-2xl overflow-hidden shadow-2xl relative">
            <button onClick={() => setShowDetailModal(null)} className="absolute top-8 right-8 text-gray-500 hover:text-white z-10">
              <Plus size={32} className="rotate-45" />
            </button>
            <div className="grid grid-cols-1 md:grid-cols-2">
              <div className="bg-black p-10 flex items-center justify-center min-h-[400px]">
                {showDetailModal.mediaType === 'video' ? (
                  <div className="w-full aspect-video bg-white/5 rounded-2xl flex items-center justify-center border border-white/10">
                    <Play size={48} className="text-primary" fill="currentColor" />
                  </div>
                ) : (
                  <img src={showDetailModal.image} className="w-full rounded-2xl shadow-2xl" alt="" />
                )}
              </div>
              <div className="p-12 space-y-8">
                <div>
                  <div className="flex items-center gap-2 mb-2 text-primary font-black text-xs uppercase tracking-[0.2em]">
                    <Building2 size={14} />
                    {companies.find(c => c.id === showDetailModal.companyId)?.name}
                  </div>
                  <h2 className="text-3xl font-black text-white">{showDetailModal.title}</h2>
                  <p className="text-gray-500 mt-2 font-medium">{showDetailModal.description}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/5 p-6 rounded-3xl border border-white/10">
                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Total Impressions</p>
                    <p className="text-3xl font-black text-white">{(showDetailModal.totalImpressions || 0).toLocaleString()}</p>
                  </div>
                  <div className="bg-white/5 p-6 rounded-3xl border border-white/10">
                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Total Engagements</p>
                    <p className="text-3xl font-black text-primary">{(showDetailModal.totalEngagement || 0).toLocaleString()}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-widest border-b border-white/5 pb-2">Geographic Impact</h4>
                  <div className="space-y-3">
                    {(() => {
                      const adLogs = analytics.filter(l => l.adId === showDetailModal.id);
                      const locations = adLogs.reduce((acc, curr) => {
                        const loc = curr.location || 'Unknown';
                        acc[loc] = (acc[loc] || 0) + 1;
                        return acc;
                      }, {});
                      return Object.entries(locations).sort((a,b) => b[1]-a[1]).slice(0, 3).map(([loc, count]) => (
                        <div key={loc} className="flex items-center justify-between">
                          <span className="text-gray-400 text-xs font-medium flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-primary" /> {loc}
                          </span>
                          <span className="text-white text-xs font-bold">{count} views</span>
                        </div>
                      ));
                    })()}
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500 font-medium">Placement</span>
                    <span className="text-white font-bold uppercase tracking-wider">{showDetailModal.placement}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500 font-medium">Expiry Status</span>
                    <span className={`font-bold ${showDetailModal.endDate?.toDate && showDetailModal.endDate.toDate() < new Date() ? 'text-red-400' : 'text-emerald-400'}`}>
                      {showDetailModal.endDate?.toDate ? showDetailModal.endDate.toDate().toLocaleDateString() : 'Infinite'}
                    </span>
                  </div>
                </div>

                <div className="pt-4">
                  <button 
                    onClick={() => { handleEditClick(showDetailModal); setShowDetailModal(null); }}
                    className="w-full bg-white/10 hover:bg-white/20 text-white py-4 rounded-2xl font-bold transition-all border border-white/10 flex items-center justify-center gap-2"
                  >
                    <Edit2 size={18} /> Update Creative Details
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
          <div className="bg-surface border border-white/10 w-full max-w-2xl rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            <div className="p-8 border-b border-white/10 flex items-center justify-between shrink-0">
              <div>
                <h3 className="text-2xl font-black text-white tracking-tight">{editingId ? 'EDIT CREATIVE' : 'NEW CREATIVE ASSET'}</h3>
                <p className="text-gray-500 text-xs mt-1">{editingId ? 'Update your campaign parameters.' : 'Configure your campaign parameters.'}</p>
              </div>
              <button onClick={() => { setShowAddModal(false); setEditingId(null); }} className="text-gray-400 hover:text-white transition-transform hover:rotate-90">
                <Plus size={24} className="rotate-45" />
              </button>
            </div>

            {/* Placement Specs Guide */}
            <div className="bg-primary/5 px-8 py-4 border-b border-white/10">
              <div className="flex items-center gap-2 text-primary mb-2">
                <Info size={14} />
                <span className="text-[10px] font-black uppercase tracking-widest">Creative Specifications</span>
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-4">
                {[
                  { id: 'swipe_deck', ratio: '9:16', size: '1080x1920' },
                  { id: 'profile_bottom', ratio: '4:1', size: '1200x300' },
                  { id: 'chats_top', ratio: '3:1', size: '1200x400' },
                  { id: 'explore_grid', ratio: '1:1', size: '1080x1080' },
                  { id: 'likes_top', ratio: '3.5:1', size: '1200x350' },
                ].map(spec => (
                  <div key={spec.id} className={`p-2 rounded-lg border ${newAd.placement === spec.id ? 'bg-primary/10 border-primary/30' : 'bg-black/20 border-white/5'}`}>
                    <p className="text-[8px] font-black text-gray-500 uppercase truncate mb-0.5">{spec.id.replace('_', ' ')}</p>
                    <p className="text-[10px] font-bold text-white leading-none">{spec.ratio}</p>
                    <p className="text-[8px] font-medium text-gray-500">{spec.size}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="overflow-y-auto p-8 custom-scrollbar">
              <form onSubmit={handleAddAd} className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Ad Provider</label>
                  <div className="relative">
                    <select 
                      required
                      value={newAd.companyId}
                      onChange={(e) => setNewAd({...newAd, companyId: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-5 text-white outline-none focus:border-primary transition-all cursor-pointer appearance-none"
                    >
                      <option value="" className="bg-surface">Select Company</option>
                      {companies.map(c => <option key={c.id} value={c.id} className="bg-surface">{c.name}</option>)}
                    </select>
                    <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" size={18} />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Media Type</label>
                  <div className="relative">
                    <select 
                      value={newAd.mediaType}
                      onChange={(e) => setNewAd({...newAd, mediaType: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-5 text-white outline-none focus:border-primary cursor-pointer appearance-none"
                    >
                      <option value="image" className="bg-surface">Static Image / Gif</option>
                      <option value="video" className="bg-surface">Motion Video (MP4)</option>
                    </select>
                    <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" size={18} />
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Title</label>
                  <input required value={newAd.title} onChange={e => setNewAd({...newAd, title: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-5 text-white outline-none focus:border-primary" placeholder="Creative Title" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Subtitle</label>
                  <input value={newAd.description} onChange={e => setNewAd({...newAd, description: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-5 text-white outline-none focus:border-primary" placeholder="Catchy description..." />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Asset Source URL (Image/Video)</label>
                <input required value={newAd.image} onChange={e => setNewAd({...newAd, image: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-5 text-white outline-none focus:border-primary" placeholder="https://..." />
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Button Text (CTA)</label>
                  <input required value={newAd.buttonText} onChange={e => setNewAd({...newAd, buttonText: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-5 text-white outline-none focus:border-primary" placeholder="e.g. Learn More" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Action URL (Destination)</label>
                  <input required value={newAd.targetUrl} onChange={e => setNewAd({...newAd, targetUrl: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-5 text-white outline-none focus:border-primary" placeholder="https://..." />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Start Date</label>
                  <input type="date" required value={newAd.startDate} onChange={e => setNewAd({...newAd, startDate: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-5 text-white outline-none focus:border-primary" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Expiry Date</label>
                  <input type="date" required value={newAd.endDate} onChange={e => setNewAd({...newAd, endDate: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-5 text-white outline-none focus:border-primary" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Targeting Type</label>
                  <div className="relative">
                    <select 
                      value={newAd.targetingType}
                      onChange={(e) => setNewAd({...newAd, targetingType: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-5 text-white outline-none focus:border-primary cursor-pointer appearance-none"
                    >
                      <option value="global" className="bg-surface">Global (All Users)</option>
                      <option value="city" className="bg-surface">City Specific</option>
                      <option value="radius" className="bg-surface">Coordinate Radius (KM)</option>
                    </select>
                    <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" size={18} />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Target City</label>
                  <input 
                    disabled={newAd.targetingType !== 'city'}
                    value={newAd.targetingCity} 
                    onChange={e => setNewAd({...newAd, targetingCity: e.target.value})} 
                    className={`w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-5 text-white outline-none focus:border-primary ${newAd.targetingType !== 'city' ? 'opacity-50 grayscale' : ''}`} 
                    placeholder="e.g. New York" 
                  />
                </div>
              </div>

              {newAd.targetingType === 'radius' && (
                <div className="grid grid-cols-3 gap-6 animate-in fade-in slide-in-from-top-2">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Latitude</label>
                    <input 
                      type="number"
                      step="any"
                      value={newAd.targetingLat} 
                      onChange={e => setNewAd({...newAd, targetingLat: e.target.value})} 
                      className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-5 text-white outline-none focus:border-primary" 
                      placeholder="0.0000" 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Longitude</label>
                    <input 
                      type="number"
                      step="any"
                      value={newAd.targetingLng} 
                      onChange={e => setNewAd({...newAd, targetingLng: e.target.value})} 
                      className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-5 text-white outline-none focus:border-primary" 
                      placeholder="0.0000" 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Radius (KM)</label>
                    <input 
                      type="number"
                      min="10"
                      max="10000"
                      value={newAd.targetingRadius} 
                      onChange={e => setNewAd({...newAd, targetingRadius: e.target.value})} 
                      className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-5 text-white outline-none focus:border-primary" 
                      placeholder="50" 
                    />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Placement Area</label>
                  <div className="relative">
                    <select value={newAd.placement} onChange={e => setNewAd({...newAd, placement: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-5 text-white outline-none focus:border-primary cursor-pointer appearance-none">
                      <option value="swipe_deck" className="bg-surface">Swipe Deck</option>
                      <option value="profile_bottom" className="bg-surface">Profile Dashboard</option>
                      <option value="chats_top" className="bg-surface">Messages / New Matches</option>
                      <option value="explore_grid" className="bg-surface">Explore Grid</option>
                      <option value="likes_top" className="bg-surface">Likes Page Top</option>
                    </select>
                    <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" size={18} />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Creative Tier</label>
                  <button 
                    type="button"
                    onClick={() => setNewAd({...newAd, highlighted: !newAd.highlighted})}
                    className={`w-full py-4 rounded-xl font-black transition-all text-xs ${newAd.highlighted ? 'bg-primary text-white shadow-xl shadow-primary/30' : 'bg-white/5 text-gray-500 border border-white/5'}`}
                  >
                    {newAd.highlighted ? 'PREMIUM (GLOW)' : 'STANDARD'}
                  </button>
                </div>
              </div>

              <button type="submit" className="w-full bg-primary py-5 rounded-2xl font-black text-white shadow-2xl shadow-primary/30 mt-4 text-lg tracking-widest hover:scale-[1.02] active:scale-95 transition-all">
                {editingId ? 'COMMIT CHANGES' : 'LAUNCH CAMPAIGN'}
              </button>
            </form>
          </div>
        </div>
      </div>
    )}
    </div>
  );
};

const StatCard = ({ icon, label, value, trend }) => (
  <div className="bg-surface border border-white/10 p-6 rounded-2xl shadow-xl group hover:border-primary/50 transition-all relative overflow-hidden flex flex-col justify-between min-h-[130px]">
    <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 transition-opacity">
      {React.cloneElement(icon, { size: 80 })}
    </div>
    <div className="flex items-center justify-between mb-4 relative z-10">
      <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10">
        {React.cloneElement(icon, { size: 24 })}
      </div>
      <span className="text-[10px] font-black px-3 py-1 rounded-lg bg-white/5 text-gray-500 border border-white/10 uppercase tracking-widest">
        {trend}
      </span>
    </div>
    <div className="relative z-10">
      <p className="text-gray-500 text-[10px] font-black uppercase tracking-[0.2em]">{label}</p>
      <p className="text-3xl font-black text-white mt-1 leading-none">{value}</p>
    </div>
  </div>
);

export default Ads;
