import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Building, User, Lock, Mail, Phone, Eye, EyeOff, ShieldCheck, X, Sparkles, Building2 } from 'lucide-react';

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
  const { login, registerUser } = useAuth();
  const [tab, setTab] = useState<'login' | 'register'>(defaultTab);

  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Registration state
  const [role, setRole] = useState<'BUYER' | 'SELLER' | 'DEVELOPER'>('BUYER');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [state, setState] = useState('Lagos');
  const [city, setCity] = useState('Lekki');
  const [companyName, setCompanyName] = useState('');
  const [cacNumber, setCacNumber] = useState('');
  const [sellerRelationship, setSellerRelationship] = useState<'OWNER' | 'REPRESENTATIVE'>('OWNER');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await login({ email: loginEmail.trim(), password: loginPassword });
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (regPassword.length < 8) {
      setError('Password must be at least 8 characters long.');
      setLoading(false);
      return;
    }

    if (role === 'DEVELOPER' && (!companyName || !cacNumber)) {
      setError('Company name and CAC registration number are required for developers.');
      setLoading(false);
      return;
    }

    try {
      await registerUser({
        role,
        firstName: role === 'DEVELOPER' ? companyName.split(' ')[0] || 'Developer' : firstName,
        lastName: role === 'DEVELOPER' ? companyName.split(' ').slice(1).join(' ') || 'Firm' : lastName,
        email: regEmail.trim(),
        password: regPassword,
        phone,
        state,
        city,
        companyName: role === 'DEVELOPER' ? companyName : undefined,
        cacNumber: role === 'DEVELOPER' ? cacNumber : undefined,
        sellerRelationship: role === 'SELLER' ? sellerRelationship : undefined,
      });
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  const fillDemoAccount = (email: string, pass: string) => {
    setTab('login');
    setLoginEmail(email);
    setLoginPassword(pass);
    setError(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 my-8">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-black">
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

        {/* Tab switcher */}
        <div className="flex border-b border-slate-100 mt-3">
          <button
            onClick={() => {
              setTab('login');
              setError(null);
            }}
            className={`flex-1 py-2 text-xs font-bold border-b-2 transition-colors ${
              tab === 'login'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => {
              setTab('register');
              setError(null);
            }}
            className={`flex-1 py-2 text-xs font-bold border-b-2 transition-colors ${
              tab === 'register'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            Register Account
          </button>
        </div>

        {error && (
          <div className="mt-3 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium">
            {error}
          </div>
        )}

        {tab === 'login' ? (
          <div>
            <form onSubmit={handleLoginSubmit} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="email"
                    required
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="e.g. buyer@realto.ng"
                    className="w-full text-xs pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 focus:border-emerald-600 outline-hidden font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full text-xs pl-9 pr-10 py-2.5 rounded-xl border border-slate-300 focus:border-emerald-600 outline-hidden font-medium"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md transition-colors disabled:opacity-50"
              >
                {loading ? 'Signing in...' : 'Sign In Securely'}
              </button>
            </form>

            {/* Demo Credentials Helper for Quick Evaluation */}
            <div className="mt-5 pt-4 border-t border-slate-100">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-2 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                Quick-Fill Evaluation Accounts:
              </span>
              <div className="grid grid-cols-2 gap-2 text-left">
                <button
                  type="button"
                  onClick={() => fillDemoAccount('admin@realto.ng', 'AdminPass2026!')}
                  className="p-2 rounded-xl border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/50 transition-all text-left"
                >
                  <span className="text-[11px] font-bold text-slate-800 block">Platform Admin</span>
                  <span className="text-[10px] text-slate-500 font-mono">admin@realto.ng</span>
                </button>
                <button
                  type="button"
                  onClick={() => fillDemoAccount('contact@ekoprime.ng', 'PartnerPass2026!')}
                  className="p-2 rounded-xl border border-slate-200 hover:border-purple-300 hover:bg-purple-50/50 transition-all text-left"
                >
                  <span className="text-[11px] font-bold text-slate-800 block">Developer (Eko Prime)</span>
                  <span className="text-[10px] text-slate-500 font-mono">contact@ekoprime.ng</span>
                </button>
                <button
                  type="button"
                  onClick={() => fillDemoAccount('emeka.okonkwo@gmail.com', 'PartnerPass2026!')}
                  className="p-2 rounded-xl border border-slate-200 hover:border-amber-300 hover:bg-amber-50/50 transition-all text-left"
                >
                  <span className="text-[11px] font-bold text-slate-800 block">Pending Seller</span>
                  <span className="text-[10px] text-slate-500 font-mono">emeka.okonkwo@...</span>
                </button>
                <button
                  type="button"
                  onClick={() => fillDemoAccount('folake.adeleke@unilag.edu.ng', 'BuyerPass2026!')}
                  className="p-2 rounded-xl border border-slate-200 hover:border-blue-300 hover:bg-blue-50/50 transition-all text-left"
                >
                  <span className="text-[11px] font-bold text-slate-800 block">Buyer (Saved Items)</span>
                  <span className="text-[10px] text-slate-500 font-mono">folake.adeleke@...</span>
                </button>
              </div>
            </div>
          </div>
        ) : (
          <form onSubmit={handleRegisterSubmit} className="mt-4 space-y-3.5">
            {/* Role selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Account Type
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setRole('BUYER')}
                  className={`p-2.5 rounded-xl border text-center transition-all ${
                    role === 'BUYER'
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-900 font-bold'
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
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-900 font-bold'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Building className="w-4 h-4 mx-auto mb-1 text-emerald-600" />
                  <span className="text-xs block">Individual Seller</span>
                </button>

                <button
                  type="button"
                  onClick={() => setRole('DEVELOPER')}
                  className={`p-2.5 rounded-xl border text-center transition-all ${
                    role === 'DEVELOPER'
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-900 font-bold'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Building2 className="w-4 h-4 mx-auto mb-1 text-emerald-600" />
                  <span className="text-xs block">Real Estate Developer</span>
                </button>
              </div>
            </div>

            {/* Governance notice for Sellers/Developers */}
            {role !== 'BUYER' && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-[11px] text-emerald-900 flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block">Immediate Dashboard & Private Draft Access</span>
                  Your account is created immediately. While pending administrator accreditation, you can freely operate your dashboard, create private property drafts, and view notifications. Nothing goes live until approved.
                </div>
              </div>
            )}

            {/* Developer corporate fields */}
            {role === 'DEVELOPER' ? (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Company Registered Name
                  </label>
                  <input
                    type="text"
                    required
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="e.g. Apex Horizon Developments Ltd"
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:border-emerald-600 outline-hidden font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Corporate Affairs Commission (CAC) Registration No.
                  </label>
                  <input
                    type="text"
                    required
                    value={cacNumber}
                    onChange={(e) => setCacNumber(e.target.value)}
                    placeholder="e.g. RC-1849204"
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:border-emerald-600 outline-hidden font-mono font-medium"
                  />
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    First Name
                  </label>
                  <input
                    type="text"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="First name"
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:border-emerald-600 outline-hidden font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Last Name
                  </label>
                  <input
                    type="text"
                    required
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Last name"
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:border-emerald-600 outline-hidden font-medium"
                  />
                </div>
              </div>
            )}

            {role === 'SELLER' && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Relationship to Properties
                </label>
                <select
                  value={sellerRelationship}
                  onChange={(e) => setSellerRelationship(e.target.value as any)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:border-emerald-600 outline-hidden"
                >
                  <option value="OWNER">Direct Beneficial Property Owner</option>
                  <option value="REPRESENTATIVE">Authorized Family / Legal Representative</option>
                </select>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Official Email
                </label>
                <input
                  type="email"
                  required
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:border-emerald-600 outline-hidden font-medium"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Phone (WhatsApp-enabled)
                </label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+234 800 000 0000"
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:border-emerald-600 outline-hidden font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Password (min 8 characters)
              </label>
              <input
                type="password"
                required
                minLength={8}
                value={regPassword}
                onChange={(e) => setRegPassword(e.target.value)}
                placeholder="Create a strong password"
                className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:border-emerald-600 outline-hidden font-medium"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">State</label>
                <select
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:border-emerald-600 outline-hidden"
                >
                  <option value="Lagos">Lagos</option>
                  <option value="Abuja (FCT)">Abuja (FCT)</option>
                  <option value="Oyo">Oyo</option>
                  <option value="Rivers">Rivers</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">City / Hub</label>
                <input
                  type="text"
                  required
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="e.g. Lekki, Ikoyi, Maitama"
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:border-emerald-600 outline-hidden font-medium"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md transition-colors disabled:opacity-50"
            >
              {loading ? 'Creating Account...' : 'Complete Registration'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
