import React from 'react';
import { Shield, Lock, MapPin, Phone, Mail, ExternalLink, Heart } from 'lucide-react';

interface Props {
  onNavigate: (view: string) => void;
}

export const Footer: React.FC<Props> = ({ onNavigate }) => {
  return (
    <footer className="bg-slate-950 text-slate-400 text-xs border-t border-slate-900 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-10 border-b border-slate-800/80">
          {/* Brand & Governance */}
          <div className="space-y-3 md:col-span-1">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-black text-base">
                R
              </div>
              <span className="font-extrabold text-white text-lg tracking-tight">REALTO</span>
              <span className="text-[10px] bg-emerald-950 text-emerald-400 font-bold px-1.5 py-0.5 rounded border border-emerald-800/50">
                NIGERIA
              </span>
            </div>
            <p className="text-slate-400 text-xs leading-relaxed">
              Nigeria&apos;s admin-governed real estate exchange. Every listing is title-vetted, physically inspected, and transaction-audited by Realto Administration.
            </p>
            <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 font-semibold">
              <Shield className="w-3.5 h-3.5" />
              <span>Zero-Fraud Escrow Protocol</span>
            </div>
          </div>

          {/* Quick Navigation */}
          <div>
            <h4 className="font-bold text-white text-xs uppercase tracking-wider mb-3">Marketplace</h4>
            <ul className="space-y-2">
              <li>
                <button
                  onClick={() => onNavigate('marketplace')}
                  className="hover:text-white transition-colors"
                >
                  All Verified Properties
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('developer-spaces')}
                  className="hover:text-white transition-colors text-purple-400"
                >
                  Developer Spaces (&ge; 2 Units)
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('marketplace')}
                  className="hover:text-white transition-colors"
                >
                  Houses & Duplexes (Lekki / Ikoyi)
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('marketplace')}
                  className="hover:text-white transition-colors"
                >
                  Commercial & Land (Abuja / Epe)
                </button>
              </li>
            </ul>
          </div>

          {/* Governance Rules & Privacy */}
          <div>
            <h4 className="font-bold text-white text-xs uppercase tracking-wider mb-3">Platform Rules</h4>
            <ul className="space-y-2 text-slate-400">
              <li className="flex items-start gap-1.5">
                <Lock className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                <span>Zero Buyer-to-Seller direct contact (Anti-disintermediation)</span>
              </li>
              <li className="flex items-start gap-1.5">
                <Shield className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                <span>Every user modification requires audited Change Request</span>
              </li>
              <li className="flex items-start gap-1.5">
                <Lock className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                <span>Private drafts never affect live public data</span>
              </li>
            </ul>
          </div>

          {/* Realto Concierge */}
          <div>
            <h4 className="font-bold text-white text-xs uppercase tracking-wider mb-3">
              Official Administration
            </h4>
            <div className="space-y-2 text-slate-400">
              <div className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                <span>Admiralty Way, Lekki Phase 1, Lagos State</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                <span>+234 800 REALTO NG</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                <span>concierge@realto.ng</span>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500">
          <div>&copy; {new Date().getFullYear()} Realto Nigeria Ltd. All Rights Reserved. Controlled Publishing Architecture.</div>
          <div className="flex items-center gap-4">
            <span className="hover:text-slate-400 cursor-pointer">Privacy Policy</span>
            <span className="hover:text-slate-400 cursor-pointer">Terms of Escrow</span>
            <span className="hover:text-slate-400 cursor-pointer">NDPA Compliance</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
