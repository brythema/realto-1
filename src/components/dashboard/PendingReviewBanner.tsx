import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Clock, ShieldAlert, CheckCircle2, FileText, ArrowRight } from 'lucide-react';

interface Props {
  onGoToSupport?: () => void;
  onOpenDraftModal?: () => void;
}

export const PendingReviewBanner: React.FC<Props> = ({ onGoToSupport, onOpenDraftModal }) => {
  const { currentUser, accountStatus } = useAuth();

  if (accountStatus !== 'PENDING_APPROVAL') return null;

  const isDeveloper = currentUser?.role === 'DEVELOPER';

  return (
    <div className="bg-gradient-to-r from-amber-500 via-amber-600 to-orange-600 text-white rounded-3xl p-6 sm:p-7 shadow-lg border border-amber-400/40 mb-8 relative overflow-hidden">
      <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-44 h-44 rounded-full bg-white/10 blur-xl pointer-events-none" />

      <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-white text-xs font-bold">
            <Clock className="w-3.5 h-3.5" />
            <span>Account Status: Pending Admin Review</span>
          </div>

          <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
            Welcome to Realto, {currentUser?.firstName}! Your Dashboard is Active.
          </h2>

          <p className="text-xs sm:text-sm text-amber-50 leading-relaxed">
            Your {isDeveloper ? 'Developer' : 'Seller'} account is currently undergoing credential verification. You have <strong>immediate full access to this dashboard</strong>: you can assemble private drafts, review platform notifications, and message Admin via support. <em>Nothing you build will be visible to the public until Admin approves your account.</em>
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-3 text-xs text-amber-100 font-medium">
            <div className="flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4 text-emerald-300" />
              <span>Dashboard Operations: Enabled</span>
            </div>
            <div className="flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4 text-emerald-300" />
              <span>Private Drafts: Unlocked</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4 text-amber-200" />
              <span>Public Publishing: Locked Until Approval</span>
            </div>
          </div>
        </div>

        {/* Quick action buttons */}
        <div className="flex flex-col sm:flex-row md:flex-col gap-2.5 shrink-0">
          {onOpenDraftModal && (
            <button
              onClick={onOpenDraftModal}
              className="px-5 py-2.5 bg-white text-slate-900 hover:bg-amber-50 text-xs font-bold rounded-xl shadow-md transition-colors text-center"
            >
              + Create Private Draft
            </button>
          )}

          {onGoToSupport && (
            <button
              onClick={onGoToSupport}
              className="px-5 py-2.5 bg-slate-900/40 hover:bg-slate-900/60 text-white text-xs font-semibold rounded-xl border border-white/20 transition-colors text-center"
            >
              Message Admin Support
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
