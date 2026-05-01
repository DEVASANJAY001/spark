import React, { useState, useEffect } from 'react';
import { 
  CreditCard, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  XCircle, 
  RefreshCw,
  Zap,
  Star,
  Award,
  Edit3,
  Save,
  X
} from 'lucide-react';
import { 
  collection, 
  query, 
  onSnapshot, 
  updateDoc, 
  doc, 
  setDoc,
  deleteDoc
} from 'firebase/firestore';
import { db } from '../firebase';

const Subscriptions = () => {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingPlan, setEditingPlan] = useState(null);

  useEffect(() => {
    const q = query(collection(db, 'plans'));
    const unsub = onSnapshot(q, (snapshot) => {
      setPlans(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });
    return unsub;
  }, []);

  const handleSeedPlans = async () => {
    const defaultPlans = [
      {
        id: 'silver',
        name: 'Silver Explorer',
        price: 199,
        tier: 1,
        color: '#C0C0C0',
        features: [
          'unlimited_swipes',
          'see_likes',
          '5_super_likes_day',
          '1_boost_month',
          'ad_free_video'
        ]
      },
      {
        id: 'gold',
        name: 'Gold Power',
        price: 499,
        tier: 2,
        color: '#FFD700',
        features: [
          'unlimited_swipes',
          'see_likes',
          '5_super_likes_day',
          '1_boost_month',
          'ad_free_video',
          'unlimited_rewind',
          'passport_mode',
          'top_picks',
          'read_receipts',
          'priority_verification'
        ]
      },
      {
        id: 'platinum',
        name: 'Platinum Elite',
        price: 999,
        tier: 3,
        color: '#E5E4E2',
        features: [
          'unlimited_swipes',
          'see_likes',
          '5_super_likes_day',
          '1_boost_month',
          'ad_free_video',
          'unlimited_rewind',
          'passport_mode',
          'top_picks',
          'read_receipts',
          'priority_verification',
          'message_before_match',
          'prioritized_likes',
          'advanced_filters',
          'incognito_mode',
          'ad_free_total'
        ]
      }
    ];

    if (window.confirm('This will reset all plans to defaults. Continue?')) {
      for (const plan of defaultPlans) {
        await setDoc(doc(db, 'plans', plan.id), plan);
      }
      alert('Default plans seeded successfully!');
    }
  };

  const handleUpdatePrice = async (id, newPrice) => {
    await updateDoc(doc(db, 'plans', id), { price: parseFloat(newPrice) });
    setEditingPlan(null);
  };

  const toggleFeature = async (planId, featureKey) => {
    const plan = plans.find(p => p.id === planId);
    let newFeatures = [...plan.features];
    if (newFeatures.includes(featureKey)) {
      newFeatures = newFeatures.filter(f => f !== featureKey);
    } else {
      newFeatures.push(featureKey);
    }
    await updateDoc(doc(db, 'plans', planId), { features: newFeatures });
  };

  if (loading) return (
    <div className="flex items-center justify-center h-[60vh]">
      <RefreshCw className="animate-spin text-primary" size={48} />
    </div>
  );

  return (
    <div className="space-y-8 pb-20">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-black text-white tracking-tight">MONETIZATION <span className="text-primary text-lg">PRO</span></h1>
          <p className="text-gray-500 mt-1 font-medium">Manage subscription tiers, pricing, and premium feature distribution.</p>
        </div>
        <button 
          onClick={handleSeedPlans}
          className="bg-white/5 hover:bg-white/10 text-gray-400 px-6 py-4 rounded-2xl font-bold flex items-center gap-2 border border-white/10 transition-all"
        >
          <RefreshCw size={18} /> Reset Defaults
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {plans.sort((a,b) => a.tier - b.tier).map((plan) => (
          <div key={plan.id} className="bg-surface border border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col group hover:border-primary/50 transition-all">
            {/* Plan Header */}
            <div className="p-10 text-center relative">
              <div 
                className="absolute inset-0 opacity-10" 
                style={{ background: `radial-gradient(circle at center, ${plan.color || '#fff'}, transparent)` }} 
              />
              <div className="relative z-10">
                <div className="w-20 h-20 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-6 shadow-xl">
                  {plan.tier === 1 && <Zap size={32} style={{ color: plan.color }} />}
                  {plan.tier === 2 && <Star size={32} style={{ color: plan.color }} />}
                  {plan.tier === 3 && <Award size={32} style={{ color: plan.color }} />}
                </div>
                <h3 className="text-3xl font-black text-white uppercase tracking-tight">{plan.name}</h3>
                
                {editingPlan === plan.id ? (
                  <div className="flex items-center justify-center gap-2 mt-4">
                    <span className="text-2xl font-black text-gray-500">₹</span>
                    <input 
                      autoFocus
                      defaultValue={plan.price}
                      onBlur={(e) => handleUpdatePrice(plan.id, e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleUpdatePrice(plan.id, e.target.value)}
                      className="bg-white/10 border border-white/20 text-4xl font-black text-white w-32 px-2 py-1 rounded-xl outline-none focus:border-primary"
                    />
                  </div>
                ) : (
                  <div 
                    onClick={() => setEditingPlan(plan.id)}
                    className="mt-4 flex items-center justify-center gap-2 cursor-pointer group/price"
                  >
                    <p className="text-5xl font-black text-white tracking-tighter">₹{plan.price}</p>
                    <span className="text-gray-500 text-sm font-bold mt-4">/mo</span>
                    <Edit3 size={16} className="text-primary opacity-0 group-hover/price:opacity-100 transition-opacity ml-2" />
                  </div>
                )}
              </div>
            </div>

            {/* Features List */}
            <div className="flex-1 p-10 bg-black/20 space-y-4">
              <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-6">Tier Entitlements</p>
              <div className="space-y-4">
                {ALL_FEATURES.map((feature) => {
                  const isActive = plan.features.includes(feature.key);
                  return (
                    <button 
                      key={feature.key}
                      onClick={() => toggleFeature(plan.id, feature.key)}
                      className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all ${isActive ? 'bg-white/5 border-white/10' : 'bg-transparent border-transparent opacity-40 hover:opacity-100'}`}
                    >
                      <div className="flex items-center gap-3">
                        {isActive ? <CheckCircle2 size={18} className="text-emerald-400" /> : <XCircle size={18} className="text-gray-600" />}
                        <span className={`text-sm font-bold ${isActive ? 'text-white' : 'text-gray-500'}`}>{feature.label}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="p-8 border-t border-white/5 bg-white/[0.02]">
              <div className="flex items-center justify-between text-[10px] font-black text-gray-500 uppercase tracking-widest">
                <span>Database ID: {plan.id}</span>
                <span>Tier Level: {plan.tier}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const ALL_FEATURES = [
  { key: 'unlimited_swipes', label: 'Unlimited Swipes' },
  { key: 'see_likes', label: 'See Who Likes You' },
  { key: '5_super_likes_day', label: '5 Super Likes / Day' },
  { key: '1_boost_month', label: '1 Profile Boost / Month' },
  { key: 'ad_free_video', label: 'Remove Video Ads' },
  { key: 'unlimited_rewind', label: 'Unlimited Rewind' },
  { key: 'passport_mode', label: 'Passport (Global Travel)' },
  { key: 'top_picks', label: 'Daily Top Picks' },
  { key: 'read_receipts', label: 'Read Receipts' },
  { key: 'priority_verification', label: 'Priority Verification' },
  { key: 'message_before_match', label: 'Message Before Match' },
  { key: 'prioritized_likes', label: 'Prioritized Likes' },
  { key: 'advanced_filters', label: 'Advanced Search Filters' },
  { key: 'incognito_mode', label: 'Incognito Mode' },
  { key: 'ad_free_total', label: '100% Ad-Free Experience' },
];

export default Subscriptions;
