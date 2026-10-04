import React, { useState } from 'react';
import { Property } from '../../types/property';
import { useAuth } from '../../context/AuthContext';
import { useMarketplace } from '../../context/MarketplaceContext';
import { formatNaira } from '../../utils/formatters';
import {
  Calendar,
  MessageSquare,
  CheckCircle2,
  X,
  ExternalLink,
  Lock,
  UserCheck,
} from 'lucide-react';
import { AuthModal } from '../auth/AuthModal';

interface Props {
  property: Property | null;
  isOpen: boolean;
  onClose: () => void;
  onViewThreads?: () => void;
}

export const InquiryModal: React.FC<Props> = ({
  property,
  isOpen,
  onClose,
  onViewThreads,
}) => {
  const { currentUser } = useAuth();
  const { createEnquiryThread } = useMarketplace();

  const [message, setMessage] = useState(
    'Good day Realto Admin, I would like to schedule a physical site inspection for this property and review the title documents.'
  );
  const [preferredDate, setPreferredDate] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [whatsappUrl, setWhatsappUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authTab, setAuthTab] = useState<'login' | 'register'>('login');

  if (!isOpen || !property) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const fullMessage = preferredDate
      ? `${message}\n\n[Preferred Inspection Date: ${preferredDate}]`
      : message;

    try {
      const res = await createEnquiryThread(property.id, fullMessage);
      setWhatsappUrl(res.whatsappUrl);
      setSubmitted(true);
    } catch (err) {
      console.error('Failed to submit inquiry:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setSubmitted(false);
    onClose();
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 overflow-y-auto">
        <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="font-bold text-slate-900 text-lg flex items-center gap-2">
                <Calendar className="w-5 h-5 text-emerald-600" />
                Inquire / Request Inspection
              </h2>
              <p className="text-xs text-slate-500">
                Facilitated strictly through Realto Platform Administration
              </p>
            </div>
            <button
              onClick={handleClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Property Brief */}
          <div className="mt-4 p-3.5 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-3">
            <img
              src={property.coverImageUrl}
              alt={property.title}
              className="w-16 h-14 object-cover rounded-xl shrink-0"
            />
            <div className="min-w-0 flex-1">
              <span className="text-[10px] font-mono font-bold text-slate-500 bg-slate-200 px-1.5 py-0.5 rounded">
                {property.id}
              </span>
              <h4 className="text-xs font-bold text-slate-900 truncate mt-0.5">{property.title}</h4>
              <div className="text-xs font-extrabold text-emerald-700">
                {formatNaira(property.price.amount)}
              </div>
            </div>
          </div>

          {/* Inquire Gate: Visitor not signed in */}
          {!currentUser ? (
            <div className="mt-5 space-y-4">
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-2xl text-xs text-blue-900 leading-relaxed">
                <span className="font-bold block mb-1">Buyer Account Required</span>
                To protect against fraudulent diversion and schedule an official inspection, inquiries are dispatched by authenticated Buyers directly to Realto Admin Concierge.
              </div>

              <div className="space-y-2">
                <button
                  onClick={() => {
                    setAuthTab('login');
                    setIsAuthOpen(true);
                  }}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5"
                >
                  <UserCheck className="w-4 h-4" />
                  Sign In with Your Buyer Account
                </button>

                <button
                  onClick={() => {
                    setAuthTab('register');
                    setIsAuthOpen(true);
                  }}
                  className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl transition-colors"
                >
                  Register New Buyer Account (Instant Active)
                </button>

                {/* Instant WhatsApp Option */}
                <a
                  href={`https://wa.me/2348007325866?text=${encodeURIComponent(
                    `Hello Realto Admin Concierge, I am interested in inspecting property ID: ${property.id} (${property.title}).`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5"
                >
                  <span>Continue on WhatsApp Concierge</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          ) : !submitted ? (
            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Your Inquiry or Inspection Request
                </label>
                <textarea
                  rows={3}
                  required
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="What would you like to know or arrange?"
                  className="w-full text-xs p-3 rounded-xl border border-slate-300 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Preferred Inspection Date (Optional)
                </label>
                <input
                  type="date"
                  value={preferredDate}
                  onChange={(e) => setPreferredDate(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:border-emerald-600 outline-hidden"
                />
              </div>

              {/* Anti-Disintermediation Trust Notice */}
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-2 text-xs text-emerald-900">
                <Lock className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                <span>
                  Your inquiry is dispatched directly to our Realto Administration Concierge team for scheduled physical inspection.
                </span>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-700/20 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <MessageSquare className="w-4 h-4" />
                {loading ? 'Dispatching...' : 'Dispatch Inquiry to Realto Admin'}
              </button>
            </form>
          ) : (
            <div className="mt-5 space-y-4 text-center">
              <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-7 h-7 text-emerald-600" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Inquiry Received by Admin</h3>
                <p className="text-xs text-slate-600 mt-1 max-w-sm mx-auto leading-relaxed">
                  Your inquiry on <strong>{property.id}</strong> has been logged in the Administration Console. You can track communication in your dashboard or continue on WhatsApp.
                </p>
              </div>

              <div className="pt-2 flex flex-col gap-2">
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5"
                >
                  <span>Chat with Admin on WhatsApp</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>

                {onViewThreads && (
                  <button
                    onClick={() => {
                      handleClose();
                      onViewThreads();
                    }}
                    className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-colors"
                  >
                    View Inquiries in Dashboard
                  </button>
                )}

                <button
                  onClick={handleClose}
                  className="w-full py-2 text-slate-400 hover:text-slate-600 text-xs"
                >
                  Done
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        defaultTab={authTab}
      />
    </>
  );
};
