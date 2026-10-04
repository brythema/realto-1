import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useMarketplace } from '../../context/MarketplaceContext';
import { Property } from '../../types/property';
import { formatNaira, formatDate } from '../../utils/formatters';
import {
  Heart,
  MessageSquare,
  MapPin,
  Calendar,
  ExternalLink,
  ShieldCheck,
  Send,
} from 'lucide-react';

interface Props {
  onSelectProperty: (property: Property) => void;
  onInquireProperty: (property: Property) => void;
  onBrowseMarketplace: () => void;
}

export const BuyerDashboard: React.FC<Props> = ({
  onSelectProperty,
  onInquireProperty,
  onBrowseMarketplace,
}) => {
  const { currentUser } = useAuth();
  const { savedProperties, toggleSaveProperty, myThreads, sendMessage } = useMarketplace();

  const [activeTab, setActiveTab] = useState<'saved' | 'inquiries'>('saved');
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');

  const activeThread = myThreads.find((t) => t.id === selectedThreadId) || myThreads[0];

  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeThread || !replyText.trim()) return;
    sendMessage(activeThread.id, replyText);
    setReplyText('');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-xs mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-bold text-xl shadow-md shadow-blue-600/20">
            {currentUser?.firstName[0]}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900">
                {currentUser?.firstName} {currentUser?.lastName}
              </h1>
              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800">
                Buyer (Active)
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {currentUser?.email} • {currentUser?.phone}
            </p>
          </div>
        </div>

        <button
          onClick={onBrowseMarketplace}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-colors shadow-xs"
        >
          Explore All Properties &rarr;
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-2 mb-6">
        <button
          onClick={() => setActiveTab('saved')}
          className={`py-2 px-4 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 ${
            activeTab === 'saved'
              ? 'bg-slate-900 text-white'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Heart className="w-4 h-4" />
          <span>Saved Properties ({savedProperties.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('inquiries')}
          className={`py-2 px-4 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 ${
            activeTab === 'inquiries'
              ? 'bg-blue-600 text-white'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span>My Inquiries & Escrow ({myThreads.length})</span>
        </button>
      </div>

      {activeTab === 'saved' && (
        <div>
          {savedProperties.length === 0 ? (
            <div className="py-20 text-center bg-white rounded-3xl border border-slate-200">
              <Heart className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="font-bold text-slate-700 text-sm">No saved properties</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                Explore listings and click the heart icon on any property to store it in your cart.
              </p>
              <button
                onClick={onBrowseMarketplace}
                className="mt-4 px-4 py-2 bg-emerald-600 text-white text-xs font-semibold rounded-xl"
              >
                Browse Marketplace
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {savedProperties.map((prop) => (
                <div
                  key={prop.id}
                  className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden flex flex-col justify-between"
                >
                  <div
                    className="relative aspect-16/10 cursor-pointer"
                    onClick={() => onSelectProperty(prop)}
                  >
                    <img
                      src={prop.coverImageUrl}
                      alt={prop.title}
                      className="w-full h-full object-cover"
                    />
                    <span className="absolute top-3 left-3 px-2 py-0.5 bg-slate-900/80 text-white text-[10px] font-bold rounded-full">
                      {prop.id}
                    </span>
                    <span className="absolute bottom-3 left-3 bg-slate-900/90 text-white px-2.5 py-1 rounded text-xs font-extrabold">
                      {formatNaira(prop.price.amount)}
                    </span>
                  </div>

                  <div className="p-4 flex-1 flex flex-col justify-between">
                    <div>
                      <h4
                        onClick={() => onSelectProperty(prop)}
                        className="font-bold text-slate-900 text-sm line-clamp-2 hover:text-emerald-700 cursor-pointer"
                      >
                        {prop.title}
                      </h4>
                      <p className="text-xs text-slate-500 mt-1">
                        {prop.location.area}, {prop.location.city}
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                      <button
                        onClick={() => toggleSaveProperty(prop.id)}
                        className="text-xs text-slate-400 hover:text-rose-600 transition-colors"
                      >
                        Remove
                      </button>

                      <button
                        onClick={() => onInquireProperty(prop)}
                        className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-xs flex items-center gap-1.5"
                      >
                        <Calendar className="w-3.5 h-3.5" />
                        Inquire (Admin)
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'inquiries' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-3xl border border-slate-200 p-4 shadow-xs">
            <h3 className="font-bold text-slate-900 text-sm mb-3">Inquiry Threads</h3>
            {myThreads.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">No inquiry threads active.</p>
            ) : (
              <div className="space-y-2">
                {myThreads.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setSelectedThreadId(t.id)}
                    className={`w-full text-left p-3 rounded-xl border text-xs transition-all ${
                      (selectedThreadId || activeThread?.id) === t.id
                        ? 'border-blue-600 bg-blue-50/50'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-slate-700">{t.propertyId}</span>
                      <span className="text-[10px] text-slate-400">{formatDate(t.lastMessageAt)}</span>
                    </div>
                    <div className="font-semibold text-slate-900 truncate mt-0.5">
                      {t.propertyTitle}
                    </div>
                    <p className="text-slate-500 truncate mt-1">{t.lastMessageSnippet}</p>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="md:col-span-2 bg-white rounded-3xl border border-slate-200 p-6 shadow-xs flex flex-col justify-between">
            {activeThread ? (
              <div>
                <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">
                      {activeThread.propertyTitle} ({activeThread.propertyId})
                    </h3>
                    <p className="text-xs text-slate-500">
                      Communication managed directly by Realto Administration
                    </p>
                  </div>
                </div>

                <div className="space-y-3 py-4 max-h-[350px] overflow-y-auto">
                  {activeThread.messages.map((m) => (
                    <div
                      key={m.id}
                      className={`p-3 rounded-2xl max-w-md text-xs leading-relaxed ${
                        m.senderRole === 'ADMIN'
                          ? 'bg-slate-900 text-white mr-auto'
                          : 'bg-blue-600 text-white ml-auto'
                      }`}
                    >
                      <div className="font-bold mb-0.5 opacity-80">{m.senderName}</div>
                      <div>{m.body}</div>
                    </div>
                  ))}
                </div>

                <form onSubmit={handleSendReply} className="pt-4 border-t border-slate-100 flex gap-2">
                  <input
                    type="text"
                    required
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Type your reply to Realto Admin..."
                    className="flex-1 text-xs p-2.5 rounded-xl border border-slate-300 outline-hidden focus:border-blue-600"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs"
                  >
                    Reply
                  </button>
                </form>
              </div>
            ) : (
              <div className="py-20 text-center text-xs text-slate-400">
                Select an inquiry to view communications.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
