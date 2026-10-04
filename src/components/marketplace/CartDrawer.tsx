import React from 'react';
import { useMarketplace } from '../../context/MarketplaceContext';
import { Property } from '../../types/property';
import { formatNaira, getPropertyTypeLabel } from '../../utils/formatters';
import { Heart, X, Trash2, Calendar, MapPin, ExternalLink, ArrowRight } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSelectProperty: (property: Property) => void;
  onInquireProperty: (property: Property) => void;
}

export const CartDrawer: React.FC<Props> = ({
  isOpen,
  onClose,
  onSelectProperty,
  onInquireProperty,
}) => {
  const { savedProperties, toggleSaveProperty } = useMarketplace();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/50 backdrop-blur-xs">
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center">
                <Heart className="w-4 h-4 fill-rose-600" />
              </div>
              <div>
                <h2 className="font-bold text-slate-900 text-sm">Saved Properties (Cart)</h2>
                <p className="text-[11px] text-slate-500">{savedProperties.length} listings saved</p>
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
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {savedProperties.length === 0 ? (
              <div className="py-20 text-center">
                <Heart className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                <h3 className="font-bold text-slate-700 text-sm">Your cart is empty</h3>
                <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                  Browse marketplace listings and click the heart icon to save properties for review or batch inquiry.
                </p>
              </div>
            ) : (
              savedProperties.map((prop) => (
                <div
                  key={prop.id}
                  className="p-3 bg-white border border-slate-200 rounded-2xl shadow-2xs hover:border-slate-300 transition-all flex gap-3"
                >
                  <img
                    src={prop.coverImageUrl}
                    alt={prop.title}
                    className="w-20 h-20 object-cover rounded-xl shrink-0 cursor-pointer"
                    onClick={() => {
                      onClose();
                      onSelectProperty(prop);
                    }}
                  />
                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-[10px] font-mono font-bold text-slate-400">
                          {prop.id}
                        </span>
                        <button
                          onClick={() => toggleSaveProperty(prop.id)}
                          className="text-slate-400 hover:text-rose-600 transition-colors p-0.5"
                          title="Remove from saved"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <h4
                        onClick={() => {
                          onClose();
                          onSelectProperty(prop);
                        }}
                        className="text-xs font-bold text-slate-900 truncate hover:text-emerald-700 cursor-pointer"
                      >
                        {prop.title}
                      </h4>

                      <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-0.5">
                        <MapPin className="w-3 h-3 text-emerald-600 shrink-0" />
                        <span className="truncate">
                          {prop.location.area}, {prop.location.city}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-2 pt-1 border-t border-slate-100">
                      <div className="text-xs font-extrabold text-slate-900">
                        {formatNaira(prop.price.amount)}
                      </div>
                      <button
                        onClick={() => {
                          onClose();
                          onInquireProperty(prop);
                        }}
                        className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-semibold flex items-center gap-1 transition-colors"
                      >
                        <Calendar className="w-3 h-3" />
                        Inquire
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          {savedProperties.length > 0 && (
            <div className="p-4 border-t border-slate-200 bg-slate-50/50">
              <div className="text-xs text-slate-500 mb-3 text-center">
                All saved inquiries are verified and processed through Realto Admin.
              </div>
              <button
                onClick={onClose}
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-colors"
              >
                Continue Browsing
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
