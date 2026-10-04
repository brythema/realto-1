import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useMarketplace } from '../../context/MarketplaceContext';
import {
  Shield,
  Heart,
  Bell,
  User,
  LayoutDashboard,
  LogOut,
  Building2,
  ChevronDown,
  Sparkles,
  Zap,
} from 'lucide-react';
import { RoleSwitcherModal } from './RoleSwitcherModal';
import { AuthModal } from '../auth/AuthModal';
import { TestRunnerModal } from '../common/TestRunnerModal';

interface Props {
  activeView: string;
  setActiveView: (view: string) => void;
  openCart: () => void;
  openNotifications: () => void;
}

export const Navbar: React.FC<Props> = ({
  activeView,
  setActiveView,
  openCart,
  openNotifications,
}) => {
  const { currentUser, currentRole, accountStatus, logout } = useAuth();
  const { savedPropertyIds, myNotifications } = useMarketplace();

  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [isTestModalOpen, setIsTestModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authDefaultTab, setAuthDefaultTab] = useState<'login' | 'register'>('login');
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const unreadNotifications = myNotifications.filter((n) => !n.read).length;

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
        {/* Top governance guarantee banner */}
        <div className="bg-slate-900 text-slate-300 text-[11px] py-1.5 px-4">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="font-medium text-white">Realto Governance Protocol:</span>
              <span className="hidden sm:inline text-slate-400">
                All properties, edits, and inquiries route through Admin. Zero direct seller contact for buyer protection.
              </span>
            </div>

            <div className="flex items-center gap-2">
              {/* Automated Test Suite trigger */}
              <button
                onClick={() => setIsTestModalOpen(true)}
                className="flex items-center gap-1.5 bg-emerald-950 hover:bg-emerald-900 text-emerald-300 px-2.5 py-0.5 rounded-full border border-emerald-700/60 transition-colors text-[10px] font-bold"
                title="Run automated Smoke & Stress Tests"
              >
                <Zap className="w-3 h-3 text-emerald-400" />
                <span className="hidden sm:inline">Smoke & Stress Tests</span>
                <span className="sm:hidden">Tests</span>
              </button>

              {/* Quick persona switcher trigger */}
              <button
                onClick={() => setIsRoleModalOpen(true)}
                className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-emerald-400 hover:text-emerald-300 px-2.5 py-0.5 rounded-full border border-slate-700 transition-colors text-[10px] font-semibold"
              >
                <Sparkles className="w-3 h-3 text-emerald-400" />
                <span>Persona: </span>
                <span className="text-white capitalize">
                  {currentRole === 'ADMIN'
                    ? 'Platform Admin'
                    : currentRole === 'DEVELOPER'
                    ? `Developer (${accountStatus || 'Guest'})`
                    : currentRole === 'SELLER'
                    ? `Seller (${accountStatus || 'Guest'})`
                    : currentRole === 'BUYER'
                    ? 'Buyer'
                    : 'Visitor'}
                </span>
                <ChevronDown className="w-2.5 h-2.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Main nav */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-6">
              <button
                onClick={() => setActiveView('marketplace')}
                className="flex items-center gap-2.5 text-left group"
              >
                <div className="w-9 h-9 rounded-xl bg-emerald-700 text-white flex items-center justify-center font-black text-lg shadow-sm shadow-emerald-700/20 group-hover:bg-emerald-800 transition-colors">
                  R
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-extrabold text-slate-900 tracking-tight text-xl">REALTO</span>
                    <span className="text-[10px] font-bold px-1.5 py-0.2 bg-emerald-100 text-emerald-800 rounded">
                      NG
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-500 font-medium block -mt-0.5">
                    Admin-Governed Real Estate
                  </span>
                </div>
              </button>

              {/* Navigation links */}
              <nav className="hidden md:flex items-center gap-1 ml-4">
                <button
                  onClick={() => setActiveView('marketplace')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                    activeView === 'marketplace'
                      ? 'bg-slate-100 text-slate-900'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  Marketplace Feed
                </button>

                <button
                  onClick={() => setActiveView('developer-spaces')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                    activeView === 'developer-spaces'
                      ? 'bg-purple-100 text-purple-900'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <Building2 className="w-3.5 h-3.5 text-purple-600" />
                  Developer Spaces
                </button>

                {currentUser && (
                  <button
                    onClick={() => setActiveView('dashboard')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                      activeView === 'dashboard'
                        ? 'bg-emerald-100 text-emerald-900'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    <LayoutDashboard className="w-3.5 h-3.5 text-emerald-600" />
                    <span>My Dashboard</span>
                    {accountStatus === 'PENDING_APPROVAL' && (
                      <span className="text-[9px] bg-amber-200 text-amber-900 px-1 rounded font-bold">
                        Pending
                      </span>
                    )}
                  </button>
                )}

                {currentRole === 'ADMIN' && (
                  <button
                    onClick={() => setActiveView('admin')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 ${
                      activeView === 'admin'
                        ? 'bg-indigo-600 text-white'
                        : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
                    }`}
                  >
                    <Shield className="w-3.5 h-3.5" />
                    Admin Governance Hub
                  </button>
                )}
              </nav>
            </div>

            {/* Right actions */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Saved Properties (Cart) */}
              <button
                onClick={openCart}
                className="relative p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors"
                title="Saved Properties"
              >
                <Heart className="w-5 h-5" />
                {savedPropertyIds.length > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-emerald-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                    {savedPropertyIds.length}
                  </span>
                )}
              </button>

              {/* In-app Notifications */}
              {currentUser && (
                <button
                  onClick={openNotifications}
                  className="relative p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors"
                  title="Notifications"
                >
                  <Bell className="w-5 h-5" />
                  {unreadNotifications > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-rose-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                      {unreadNotifications}
                    </span>
                  )}
                </button>
              )}

              {/* User Menu or Sign In */}
              {currentUser ? (
                <div className="relative">
                  <button
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="flex items-center gap-2 p-1.5 pl-2.5 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all text-xs font-semibold text-slate-800"
                  >
                    <div className="w-6 h-6 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-[11px]">
                      {currentUser.firstName[0]}
                    </div>
                    <span className="hidden sm:inline max-w-[120px] truncate">
                      {currentUser.firstName}
                    </span>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                  </button>

                  {isUserMenuOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-50 text-xs">
                      <div className="px-3 py-2 border-b border-slate-100">
                        <div className="font-semibold text-slate-900">
                          {currentUser.firstName} {currentUser.lastName}
                        </div>
                        <div className="text-slate-400 text-[11px] truncate">{currentUser.email}</div>
                        <div className="mt-1 flex items-center gap-1.5">
                          <span className="px-1.5 py-0.5 bg-slate-100 text-slate-700 rounded font-semibold text-[10px]">
                            {currentUser.role}
                          </span>
                          <span
                            className={`px-1.5 py-0.5 rounded font-semibold text-[10px] ${
                              accountStatus === 'ACTIVE'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {accountStatus}
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          setActiveView('dashboard');
                          setIsUserMenuOpen(false);
                        }}
                        className="w-full text-left px-3 py-2 text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                      >
                        <LayoutDashboard className="w-4 h-4 text-slate-500" />
                        Dashboard
                      </button>

                      {currentRole === 'ADMIN' && (
                        <button
                          onClick={() => {
                            setActiveView('admin');
                            setIsUserMenuOpen(false);
                          }}
                          className="w-full text-left px-3 py-2 text-indigo-700 font-semibold hover:bg-indigo-50 flex items-center gap-2"
                        >
                          <Shield className="w-4 h-4 text-indigo-600" />
                          Admin Governance
                        </button>
                      )}

                      <button
                        onClick={() => {
                          setIsRoleModalOpen(true);
                          setIsUserMenuOpen(false);
                        }}
                        className="w-full text-left px-3 py-2 text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                      >
                        <Sparkles className="w-4 h-4 text-amber-500" />
                        Switch Test Persona
                      </button>

                      <div className="border-t border-slate-100 my-1"></div>

                      <button
                        onClick={() => {
                          logout();
                          setIsUserMenuOpen(false);
                        }}
                        className="w-full text-left px-3 py-2 text-rose-600 hover:bg-rose-50 flex items-center gap-2"
                      >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setAuthDefaultTab('login');
                      setIsAuthModalOpen(true);
                    }}
                    className="px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    Sign In
                  </button>
                  <button
                    onClick={() => {
                      setAuthDefaultTab('register');
                      setIsAuthModalOpen(true);
                    }}
                    className="px-3 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-xs transition-colors"
                  >
                    Register
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <RoleSwitcherModal isOpen={isRoleModalOpen} onClose={() => setIsRoleModalOpen(false)} />
      <TestRunnerModal isOpen={isTestModalOpen} onClose={() => setIsTestModalOpen(false)} />
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        defaultTab={authDefaultTab}
      />
    </>
  );
};
