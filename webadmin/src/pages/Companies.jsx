import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  ExternalLink, 
  TrendingUp, 
  MoreVertical,
  Briefcase,
  Plus,
  Search,
  Trash2,
  ArrowRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { 
  collection, 
  query, 
  onSnapshot, 
  addDoc, 
  deleteDoc, 
  doc, 
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../firebase';

const Companies = () => {
  const navigate = useNavigate();
  const [companies, setCompanies] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [newCompany, setNewCompany] = useState({
    name: '',
    industry: 'Technology',
    logo: '',
    website: '',
    active: true
  });

  useEffect(() => {
    const q = query(collection(db, 'ad_companies'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setCompanies(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    console.log("Submitting company:", newCompany);
    try {
      await addDoc(collection(db, 'ad_companies'), {
        ...newCompany,
        createdAt: serverTimestamp()
      });
      console.log("Company added successfully");
      setShowAddModal(false);
      setNewCompany({ name: '', industry: 'Technology', logo: '', website: '', active: true });
    } catch (error) { 
      console.error("Error adding company:", error);
      alert("Failed to register company: " + error.message);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this company and all its data?')) {
      await deleteDoc(doc(db, 'ad_companies', id));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-display font-bold text-white">Ad Providers</h1>
          <p className="text-gray-400 mt-1">Manage partner companies and their advertising accounts.</p>
        </div>
        <button onClick={() => setShowAddModal(true)} className="bg-primary hover:bg-primary-hover text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all">
          <Plus size={20} /> Register Company
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {companies.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase())).map(company => (
          <div key={company.id} className="bg-surface border border-white/10 p-6 rounded-3xl group hover:border-primary/50 transition-all relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
              <button onClick={() => handleDelete(company.id)} className="text-red-400 hover:text-red-300 p-2 bg-red-400/10 rounded-lg">
                <Trash2 size={16} />
              </button>
            </div>

            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 overflow-hidden flex items-center justify-center">
                {company.logo ? (
                  <img src={company.logo} className="w-full h-full object-cover" />
                ) : (
                  <Building2 size={24} className="text-gray-500" />
                )}
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">{company.name}</h3>
                <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">{company.industry}</p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Status</span>
                <span className="text-emerald-400 font-bold">Active Partner</span>
              </div>
              <button 
                onClick={() => navigate(`/ads?companyId=${company.id}`)}
                className="flex justify-between items-center text-sm w-full group/link"
              >
                <span className="text-gray-500">Campaigns</span>
                <span className="text-white font-bold group-hover/link:text-primary transition-colors flex items-center gap-1">
                  Manage Ads <ArrowRight size={14} />
                </span>
              </button>
            </div>

            {company.website && (
              <a href={company.website} target="_blank" className="mt-6 flex items-center justify-center gap-2 w-full py-3 bg-white/5 hover:bg-white/10 rounded-xl text-gray-300 text-sm font-bold transition-all border border-white/5">
                <ExternalLink size={14} /> Visit Website
              </a>
            )}
          </div>
        ))}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-surface border border-white/10 w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-white/10 flex items-center justify-between bg-white/5">
              <h3 className="text-xl font-bold text-white">Register Ad Partner</h3>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-white"><Plus size={24} className="rotate-45" /></button>
            </div>
            <form onSubmit={handleAdd} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-400 uppercase">Company Name</label>
                <input required value={newCompany.name} onChange={e => setNewCompany({...newCompany, name: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white" placeholder="e.g. Acme Corp" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-400 uppercase">Industry</label>
                  <select value={newCompany.industry} onChange={e => setNewCompany({...newCompany, industry: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white">
                    <option>Technology</option>
                    <option>Lifestyle</option>
                    <option>Fashion</option>
                    <option>Beverages</option>
                    <option>Entertainment</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-400 uppercase">Website</label>
                  <input type="url" value={newCompany.website} onChange={e => setNewCompany({...newCompany, website: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white" placeholder="https://..." />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-400 uppercase">Logo URL</label>
                <input value={newCompany.logo} onChange={e => setNewCompany({...newCompany, logo: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white" placeholder="https://..." />
              </div>
              <button type="submit" className="w-full bg-primary py-4 rounded-xl font-bold text-white shadow-lg shadow-primary/20 mt-4">Register Account</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Companies;
