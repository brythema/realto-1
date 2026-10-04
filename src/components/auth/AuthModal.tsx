import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Shield, Building, User, CheckCircle2, AlertCircle, X } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: 'login' | 'register';
  onSuccess?: () => void;
}

export const AuthModal: React.FC<Props> = ({
  isOpen,
  onClose,
  defaultTab = 'login',
  onSuccess,
}) => {
  const { registerUser, switchRolePersona } = useAuth();
  const [tab, setTab] = useState<'login' | 'register'>(defaultTab);

  // Registration state
  const [role, setRole] = useState<'BUYER' | 'SELLER' | 'DEVELOPER'>('BUYER');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [state, setState] = useState('Lagos');
  const [city, setCity] = useState('Lekki');
  const [companyName, setCompanyName] = useState('');
  const [cacNumber, setCacNumber] = useState('');
  const [sellerRelationship, setSellerRelationship] = useState<'OWNER' | 'REPRESENTATIVE'>('OWNER');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (tab === 'register') {
      registerUser({
        role,
        firstName: role === 'DEVELOPER' ? companyName.split(' ')[0] || 'Developer' : firstName,
        lastName: role === 'DEVELOPER' ? companyName.split(' ').slice(1).join(' ') || 'Company' : lastName,
        email,
        phone,
        state,
        city,
        companyName: role === 'DEVELOPER' ? companyName : undefined,
        cacNumber: role === 'DEVELOPER' ? cacNumber : undefined,
        sellerRelationship: role === 'SELLER' ? sellerRelationship : undefined,
      });
    }
    if (onSuccess) onSuccess();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold">
              R
            </div>
            <div>
              <h2 className="font-bold text-slate-900 text-lg">
                {tab === 'login' ? 'Sign In to Realto' : 'Create Realto Account'}
              </h2>
              <p className="text-xs text-slate-500">Admin-Governed Real Estate Marketplace</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switch */}
        <div className="flex border-b border-slate-100 mt-3">
          <button
            onClick={() => setTab('login')}
            className={`flex-1 py-2 text-sm font-semibold border-b-2 transition-colors ${
              tab === 'login'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => setTab('register')}
            className={`flex-1 py-2 text-sm font-semibold border-b-2 transition-colors ${
              tab === 'register'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            Create Account
          </button>
        </div>

        {tab === 'login' ? (
          <div className="mt-4 space-y-4">
            <p className="text-xs text-slate-600">
              For testing in this preview build, choose an instant role profile to log in immediately:
            </p>
            <div className="grid grid-cols-1 gap-2">
              <button
                onClick={() => {
                  switchRolePersona('BUYER');
                  if (onSuccess) onSuccess();
                  onClose();
                }}
                className="p-3 text-left border rounded-xl hover:bg-blue-50/50 hover:border-blue-300 transition-all flex items-center justify-between"
              >
                <div>
                  <span className="font-semibold text-sm text-slate-800">Sign in as Buyer</span>
                  <p className="text-xs text-slate-500">Dr. Folake Adeleke (Saved items, Inquire)</p>
                </div>
                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded font-medium">Buyer</span>
              </button>

              <button
                onClick={() => {
                  switchRolePersona('SELLER_PENDING');
                  if (onSuccess) onSuccess();
                  onClose();
                }}
                className="p-3 text-left border rounded-xl hover:bg-amber-50/50 hover:border-amber-300 transition-all flex items-center justify-between"
              >
                <div>
                  <span className="font-semibold text-sm text-slate-800">Sign in as Pending Seller</span>
                  <p className="text-xs text-slate-500">Chief Emeka Okonkwo (Drafts workspace active!)</p>
                </div>
                <span className="text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded font-medium">Pending Seller</span>
              </button>

              <button
                onClick={() => {
                  switchRolePersona('DEVELOPER_ACTIVE');
                  if (onSuccess) onSuccess();
                  onClose();
                }}
                className="p-3 text-left border rounded-xl hover:bg-purple-50/50 hover:border-purple-300 transition-all flex items-center justify-between"
              >
                <div>
                  <span className="font-semibold text-sm text-slate-800">Sign in as Active Developer</span>
                  <p className="text-xs text-slate-500">Eko Prime Developments (Dedicated Space)</p>
                </div>
                <span className="text-xs bg-purple-100 text-purple-800 px-2 py-0.5 rounded font-medium">Developer Space</span>
              </button>

              <button
                onClick={() => {
                  switchRolePersona('ADMIN');
                  if (onSuccess) onSuccess();
                  onClose();
                }}
                className="p-3 text-left border rounded-xl hover:bg-indigo-50/50 hover:border-indigo-300 transition-all flex items-center justify-between"
              >
                <div>
                  <span className="font-semibold text-sm text-slate-800">Sign in as Platform Admin</span>
                  <p className="text-xs text-slate-500">Tunde Balogun (Governance & Approval Queue)</p>
                </div>
                <span className="text-xs bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded font-medium">Admin</span>
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-4 space-y-3.5">
            {/* Role selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Select Your Account Type
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setRole('BUYER')}
                  className={`p-2.5 rounded-xl border text-center transition-all ${
                    role === 'BUYER'
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-900 font-semibold'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <User className="w-4 h-4 mx-auto mb-1 text-emerald-600" />
                  <span className="text-xs block">Buyer</span>
                </button>

                <button
                  type="button"
                  onClick={() => setRole('SELLER')}
                  className={`p-2.5 rounded-xl border text-center transition-all ${
                    role === 'SELLER'
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-900 font-semibold'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Building className="w-4 h-4 mx-auto mb-1 text-emerald-600" />
                  <span className="text-xs block">Seller</span>
                </button>

                <button
                  type="button"
                  onClick={() => setRole('DEVELOPER')}
                  className={`p-2.5 rounded-xl border text-center transition-all ${
                    role === 'DEVELOPER'
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-900 font-semibold'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Shield className="w-4 h-4 mx-auto mb-1 text-emerald-600" />
                  <span className="text-xs block">Developer</span>
                </button>
              </div>
            </div>

            {/* Explanatory callout for Sellers & Developers */}
            {role !== 'BUYER' && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2.5 text-xs text-amber-900">
                <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold block">Immediate Dashboard Access</span>
                  Your account is created immediately in pending approval status. You can instantly access your dashboard, explore notifications, and assemble private drafts. Nothing goes live until approved by Admin.
                </div>
              </div>
            )}

            {role === 'DEVELOPER' ? (
              <>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Company / Developer Name</label>
                  <input
                    type="text"
                    required
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="e.g. Lekki Prime Homes Ltd"
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">CAC Registration Number</label>
                  <input
                    type="text"
                    required
                    value={cacNumber}
                    onChange={(e) => setCacNumber(e.target.value)}
                    placeholder="e.g. RC-1920392"
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 outline-hidden"
                  />
                </div>
              </>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">First Name</label>
                  <input
                    type="text"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="e.g. Tunde"
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Last Name</label>
                  <input
                    type="text"
                    required
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="e.g. Adeleke"
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 outline-hidden"
                  />
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 outline-hidden"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number (NG)</label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+234 800 000 0000"
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 outline-hidden"
                />
              </div>
            </div>

            {role === 'SELLER' && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Seller Capacity</label>
                <select
                  value={sellerRelationship}
                  onChange={(e) => setSellerRelationship(e.target.value as any)}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:border-emerald-600 outline-hidden"
                >
                  <option value="OWNER">Direct Property Owner</option>
                  <option value="REPRESENTATIVE">Authorized Representative / Power of Attorney</option>
                </select>
              </div>
            )}

            <button
              type="submit"
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5 mt-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              Create Account & Enter Dashboard
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
