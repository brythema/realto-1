import React from 'react';
import { useMarketplace } from '../../context/MarketplaceContext';
import { formatDate } from '../../utils/formatters';
import { Bell, CheckCheck, X, ArrowRight } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onNavigate?: (linkTo?: string) => void;
}

export const NotificationDrawer: React.FC<Props> = ({ isOpen, onClose, onNavigate }) => {
  const { myNotifications, markNotificationAsRead } = useMarketplace();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/50 backdrop-blur-xs">
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <Bell className="w-4 h-4" />
              </div>
              <div>
                <h2 className="font-bold text-slate-900 text-sm">Notifications</h2>
                <p className="text-[11px] text-slate-500">Platform updates and review decisions</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
            {myNotifications.length === 0 ? (
              <div className="py-20 text-center">
                <Bell className="w-10 h-10 text-slate-200 mx-auto mb-2" />
                <p className="text-xs text-slate-400">No notifications yet.</p>
              </div>
            ) : (
              myNotifications.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => {
                    markNotificationAsRead(notif.id);
                    if (notif.linkTo && onNavigate) {
                      onNavigate(notif.linkTo);
                      onClose();
                    }
                  }}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                    !notif.read
                      ? 'bg-emerald-50/50 border-emerald-200 hover:border-emerald-300'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="text-xs font-bold text-slate-900">{notif.title}</h4>
                    <span className="text-[10px] text-slate-400 shrink-0">
                      {formatDate(notif.createdAt)}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">{notif.message}</p>
                  {!notif.read && (
                    <div className="mt-2 flex items-center gap-1 text-[10px] text-emerald-700 font-semibold">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      Unread • Click to view
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
