import React, { useState } from 'react';
import { Property } from '../../types/property';
import { useAuth } from '../../context/AuthContext';
import { useMarketplace } from '../../context/MarketplaceContext';
import { formatNaira } from '../../utils/formatters';
import {
  Calendar,
  ShieldCheck,
  MessageSquare,
  CheckCircle2,
  X,
  ExternalLink,
  Lock,
} from 'lucide-react';

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
  const { currentUser, switchRolePersona } = useAuth();
  const { createEnquiryThread } = useMarketplace();

  const [message, setMessage] = useState(
    'Good day Realto Admin, I would like to schedule a physical site inspection for this property and review the title documents.'
  );
  const [preferredDate, setPreferredDate] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [whatsappUrl, setWhatsappUrl] = useState('');

  if (!isOpen || !property) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const fullMessage = preferredDate
      ? `${message}\n\n[Preferred Inspection Date: ${preferredDate}]`
      : message;

    const res = createEnquiryThread(property.id, fullMessage);
    setWhatsappUrl(res.whatsappUrl);
    setSubmitted(true);
  };

  const handleClose = () => {
    setSubmitted(false);
    onClose();
  };

  return (
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
              <span className="font-bold block mb-1">Buyer Verification Required</span>
              To protect against fraudulent diversion and schedule an official inspection, inquiries are dispatched by registered Buyers directly to Realto Admin.
            </div>

            <div className="space-y-2">
              <button
                onClick={() => {
                  switchRolePersona('BUYER');
                }}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5"
              >
                Sign In as Buyer (Dr. Folake Adeleke) & Continue
              </button>

              {/* Instant WhatsApp Option */}
              <a
                href={`https://wa.me/2348007325866?text=${encodeURIComponent(
                  `Hello Realto Admin Concierge, I am an unregistered visitor interested in inspecting property ID: ${property.id} (${property.title}).`
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
        ) : currentUser.role === 'SELLER' || currentUser.role === 'DEVELOPER' ? (
          <div className="mt-5 space-y-4">
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-900 leading-relaxed">
              <span className="font-bold block mb-1">Account Role Notice</span>
              Under Realto Marketplace rules, property inquiries are reserved for registered Buyers. As an active or pending {currentUser.role}, please use <strong>Support Threads</strong> in your dashboard to message Admin regarding listing representation.
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  switchRolePersona('BUYER');
                }}
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
              >
                Switch to Buyer Persona
              </button>

              <button
                onClick={onClose}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-colors"
              >
                Close
              </button>
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
                To guarantee zero fraudulent diversion, your inquiry is dispatched directly to our vetted Realto Administration escrow team.
              </span>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-700/20 transition-colors flex items-center justify-center gap-2"
            >
              <MessageSquare className="w-4 h-4" />
              Dispatch Inquiry to Realto Admin
            </button>
          </form>
        ) : (
          <div className="mt-5 space-y-4 text-center">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-base font-bold text-slate-900">Inquiry Dispatched Successfully!</h3>
              <p className="text-xs text-slate-600 mt-1 max-w-sm mx-auto leading-relaxed">
                An internal thread has been established with Realto Admin. You will receive real-time updates and inspection confirmations on your dashboard.
              </p>
            </div>

            {/* WhatsApp concierge click-to-chat */}
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-left space-y-2">
              <span className="text-[11px] font-bold text-emerald-900 block">
                Instant Priority Concierge:
              </span>
              <p className="text-xs text-emerald-800">
                Would you prefer instant real-time chat with our verified concierge on WhatsApp?
              </p>
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors w-full justify-center mt-1"
              >
                <span>Chat via WhatsApp Concierge</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>

            <div className="flex gap-2">
              {onViewThreads && (
                <button
                  onClick={() => {
                    handleClose();
                    onViewThreads();
                  }}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors"
                >
                  View My Inquiries
                </button>
              )}
              <button
                onClick={handleClose}
                className="flex-1 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
