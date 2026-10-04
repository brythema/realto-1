import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Shield, User, Clock, Building2, CheckCircle2, UserCheck, X } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const RoleSwitcherModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const { currentUser, switchRolePersona } = useAuth();

  if (!isOpen) return null;

  const personas = [
    {
      id: 'PUBLIC',
      title: 'Anonymous Visitor',
      roleTag: 'PUBLIC',
      desc: 'Browse individual listings on the home index, explore Developer Spaces, use guest cart, and trigger the Inquire gate.',
      icon: User,
      color: 'bg-slate-100 text-slate-800 border-slate-300',
    },
    {
      id: 'BUYER',
      title: 'Dr. Folake Adeleke',
      roleTag: 'BUYER (Active)',
      desc: 'Saved properties, inquiry threads directly with Admin, and instant WhatsApp concierge link.',
      icon: UserCheck,
      color: 'bg-blue-50 text-blue-800 border-blue-200',
    },
    {
      id: 'SELLER_PENDING',
      title: 'Chief Emeka Okonkwo',
      roleTag: 'SELLER (Pending Review)',
      desc: 'Instant dashboard access! Can assemble and save private drafts (Bodija Duplex) and message Admin, but nothing goes live until approved.',
      icon: Clock,
      color: 'bg-amber-50 text-amber-900 border-amber-300',
    },
    {
      id: 'SELLER_ACTIVE',
      title: 'Alhaji Ibrahim Danjuma',
      roleTag: 'SELLER (Active)',
      desc: 'Approved seller with live listings (Maitama Land & Yaba Flat) and a pending price-revision Change Request.',
      icon: CheckCircle2,
      color: 'bg-emerald-50 text-emerald-900 border-emerald-300',
    },
    {
      id: 'DEVELOPER_ACTIVE',
      title: 'Eko Prime Developments',
      roleTag: 'DEVELOPER (Active, 3 Live)',
      desc: 'Has 3 approved live properties! Eligible for a dedicated public Developer Space showcasing their portfolio (contact info hidden).',
      icon: Building2,
      color: 'bg-purple-50 text-purple-900 border-purple-300',
    },
    {
      id: 'DEVELOPER_PENDING',
      title: 'Skyline Atlantic Towers',
      roleTag: 'DEVELOPER (Pending Review)',
      desc: 'Newly registered developer with pending submission for 20-unit Jabi Suites waiting in Admin review queue.',
      icon: Building2,
      color: 'bg-rose-50 text-rose-900 border-rose-300',
    },
    {
      id: 'ADMIN',
      title: 'Tunde Balogun (Realto Admin)',
      roleTag: 'PLATFORM GOVERNANCE',
      desc: 'Full administrative powers: Review Queue with side-by-side diffs, Approve/Reject with reasons, User management, Listing control, Inbox.',
      icon: Shield,
      color: 'bg-indigo-50 text-indigo-900 border-indigo-300',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Shield className="w-5 h-5 text-emerald-600" />
              Switch Testing Persona
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Select any role to test Realto’s governing rules, draft vs live separation, and Developer Spaces.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-4 space-y-2.5 max-h-[60vh] overflow-y-auto pr-1">
          {personas.map((p) => {
            const Icon = p.icon;
            const isSelected =
              (p.id === 'PUBLIC' && !currentUser) ||
              (p.id === 'BUYER' && currentUser?.uid === 'buyer-1') ||
              (p.id === 'SELLER_ACTIVE' && currentUser?.uid === 'seller-1') ||
              (p.id === 'SELLER_PENDING' && currentUser?.uid === 'seller-pending') ||
              (p.id === 'DEVELOPER_ACTIVE' && currentUser?.uid === 'dev-user-1') ||
              (p.id === 'DEVELOPER_PENDING' && currentUser?.uid === 'dev-user-pending') ||
              (p.id === 'ADMIN' && currentUser?.role === 'ADMIN');

            return (
              <button
                key={p.id}
                onClick={() => {
                  switchRolePersona(p.id as any);
                  onClose();
                }}
                className={`w-full text-left p-3.5 rounded-xl border transition-all flex items-start gap-3.5 ${
                  isSelected
                    ? 'border-emerald-600 bg-emerald-50/60 ring-2 ring-emerald-500/20 shadow-xs'
                    : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 border ${p.color}`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-slate-900 text-sm">{p.title}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-slate-100 text-slate-700">
                      {p.roleTag}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">{p.desc}</p>
                </div>
                {isSelected && (
                  <span className="shrink-0 text-xs font-semibold text-emerald-700 bg-emerald-100 px-2 py-1 rounded-md">
                    Active
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div className="mt-5 pt-3 border-t border-slate-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
