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
  const { currentUser, currentRole, accountStatus, isAuthenticated, logout } = useAuth();
  const { savedPropertyIds, myNotifications } = useMarketplace();

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authDefaultTab, setAuthDefaultTab] = useState<'login' | 'register'>('login');
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isTestModalOpen, setIsTestModalOpen] = useState(false);

  const unreadNotifications = myNotifications.filter((n) => !n.read).length;

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
        {/* Top governance protocol banner */}
        <div className="bg-slate-900 text-slate-300 text-[11px] py-1.5 px-4">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="font-semibold text-white">Realto Protocol:</span>
              <span className="hidden sm:inline text-slate-300">
                All property submissions and modifications require Admin Change Request audit. Contact info is quarantined for buyer safety.
              </span>
            </div>

            <div className="flex items-center gap-3">
              {/* Automated Test Suite trigger for reviewers */}
              <button
                onClick={() => setIsTestModalOpen(true)}
                className="flex items-center gap-1 text-slate-400 hover:text-emerald-400 text-[10px] font-medium transition-colors"
                title="Run in-browser compliance tests"
              >
                <Zap className="w-3 h-3 text-emerald-400" />
                <span className="hidden md:inline">Run Stress & Smoke Tests</span>
              </button>
            </div>
          </div>
        </div>

        {/* Main Navigation Bar */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo & Brand */}
            <div className="flex items-center gap-6">
              <button
                onClick={() => setActiveView('marketplace')}
                className="flex items-center gap-2.5 text-left focus:outline-hidden"
              >
                <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center text-white font-black text-lg shadow-md shadow-emerald-700/20">
                  R
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-extrabold text-slate-900 text-lg tracking-tight">REALTO</span>
                    <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded">
                      NG
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500 font-medium hidden sm:block -mt-1">
                    Centralized Real Estate Exchange
                  </p>
                </div>
              </button>

              {/* Primary Nav Links */}
              <nav className="hidden md:flex items-center gap-1">
                <button
                  onClick={() => setActiveView('marketplace')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                    activeView === 'marketplace'
                      ? 'bg-slate-100 text-emerald-700'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  All Properties
                </button>
                <button
                  onClick={() => setActiveView('developer-spaces')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                    activeView === 'developer-spaces' || activeView === 'developer-space-detail'
                      ? 'bg-purple-50 text-purple-700'
                      : 'text-slate-600 hover:text-purple-700 hover:bg-purple-50/50'
                  }`}
                >
                  <Building2 className="w-3.5 h-3.5 text-purple-600" />
                  Developer Spaces
                </button>
              </nav>
            </div>

            {/* Right Action Cluster */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Saved Cart */}
              <button
                onClick={openCart}
                className="relative p-2 text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-100 transition-colors"
                title="Saved Properties"
              >
                <Heart className="w-5 h-5" />
                {savedPropertyIds.length > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-rose-600 text-white text-[10px] font-bold flex items-center justify-center">
                    {savedPropertyIds.length}
                  </span>
                )}
              </button>

              {/* Notifications */}
              {isAuthenticated && (
                <button
                  onClick={openNotifications}
                  className="relative p-2 text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-100 transition-colors"
                  title="Notifications"
                >
                  <Bell className="w-5 h-5" />
                  {unreadNotifications > 0 && (
                    <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-emerald-600 text-white text-[10px] font-bold flex items-center justify-center">
                      {unreadNotifications}
                    </span>
                  )}
                </button>
              )}

              {/* User Account Controls */}
              {isAuthenticated && currentUser ? (
                <div className="relative">
                  <button
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all text-xs font-semibold text-slate-800"
                  >
                    <div className="w-6 h-6 rounded-lg bg-emerald-600 text-white flex items-center justify-center text-[11px] font-bold">
                      {currentUser.firstName ? currentUser.firstName[0].toUpperCase() : 'U'}
                    </div>
                    <span className="hidden sm:inline max-w-[120px] truncate">
                      {currentUser.firstName}
                    </span>
                    <span
                      className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${
                        accountStatus === 'ACTIVE'
                          ? 'bg-emerald-100 text-emerald-800'
                          : accountStatus === 'PENDING_APPROVAL'
                          ? 'bg-amber-100 text-amber-800'
                          : accountStatus === 'SUSPENDED'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {currentRole === 'ADMIN'
                        ? 'Admin'
                        : accountStatus === 'PENDING_APPROVAL'
                        ? 'Pending'
                        : currentRole}
                    </span>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                  </button>

                  {/* Dropdown Menu */}
                  {isUserMenuOpen && (
                    <div
                      className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-200 py-1.5 z-50 text-xs"
                      onClick={() => setIsUserMenuOpen(false)}
                    >
                      <div className="px-4 py-2 border-b border-slate-100">
                        <p className="font-bold text-slate-900 truncate">
                          {currentUser.firstName} {currentUser.lastName}
                        </p>
                        <p className="text-[11px] text-slate-500 font-mono truncate">
                          {currentUser.email}
                        </p>
                      </div>

                      <button
                        onClick={() => setActiveView('dashboard')}
                        className="w-full px-4 py-2 text-left hover:bg-slate-50 flex items-center gap-2 text-slate-700"
                      >
                        <LayoutDashboard className="w-4 h-4 text-emerald-600" />
                        {currentRole === 'BUYER' ? 'My Saved & Inquiries' : 'My Dashboard & Drafts'}
                      </button>

                      {currentRole === 'ADMIN' && (
                        <button
                          onClick={() => setActiveView('admin')}
                          className="w-full px-4 py-2 text-left hover:bg-slate-50 flex items-center gap-2 text-slate-700 font-bold"
                        >
                          <Shield className="w-4 h-4 text-indigo-600" />
                          Governance Hub (Admin)
                        </button>
                      )}

                      <div className="my-1 border-t border-slate-100" />

                      <button
                        onClick={async () => {
                          await logout();
                          setActiveView('marketplace');
                        }}
                        className="w-full px-4 py-2 text-left hover:bg-rose-50 text-rose-600 flex items-center gap-2 font-medium"
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
                    className="px-3.5 py-1.5 text-xs font-bold text-slate-700 hover:text-emerald-700 hover:bg-slate-100 rounded-xl transition-colors"
                  >
                    Sign In
                  </button>
                  <button
                    onClick={() => {
                      setAuthDefaultTab('register');
                      setIsAuthModalOpen(true);
                    }}
                    className="px-3.5 py-1.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
                  >
                    <User className="w-3.5 h-3.5" />
                    Register
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        defaultTab={authDefaultTab}
      />

      {/* Automated Tests Modal */}
      <TestRunnerModal isOpen={isTestModalOpen} onClose={() => setIsTestModalOpen(false)} />
    </>
  );
};
