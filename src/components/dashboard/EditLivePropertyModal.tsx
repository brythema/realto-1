import React, { useState } from 'react';
import { Property } from '../../types/property';
import { useMarketplace } from '../../context/MarketplaceContext';
import { formatNaira } from '../../utils/formatters';
import { X, Send, AlertTriangle, ShieldCheck, CheckCircle2 } from 'lucide-react';

interface Props {
  property: Property | null;
  isOpen: boolean;
  onClose: () => void;
}

export const EditLivePropertyModal: React.FC<Props> = ({ property, isOpen, onClose }) => {
  const { requestPropertyEdit } = useMarketplace();

  if (!isOpen || !property) return null;

  const [priceAmount, setPriceAmount] = useState(property.price.amount.toString());
  const [negotiable, setNegotiable] = useState(property.price.negotiable);
  const [title, setTitle] = useState(property.title);
  const [description, setDescription] = useState(property.description);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const proposedData: Record<string, any> = {
      title,
      description,
      price: {
        amount: Number(priceAmount) || property.price.amount,
        currency: 'NGN',
        negotiable,
      },
    };

    requestPropertyEdit(property.id, proposedData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-200">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h2 className="font-bold text-slate-900 text-lg flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              Request Live Property Modification
            </h2>
            <p className="text-xs text-slate-500">
              Listing Ref: <span className="font-mono font-bold">{property.id}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live Governance Notice */}
        <div className="mt-4 p-3.5 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3 text-xs text-amber-900">
          <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold block">Live Listing Governance Protocol</span>
            Because this property is currently live on the public marketplace, submitting changes creates a <code>PROPERTY_EDIT</code> Change Request. The public continues to see the currently approved version until Admin verifies and approves your proposed revision.
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Property Title
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:border-emerald-600 outline-hidden font-medium"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Revised Asking Price (NGN ₦)
              </label>
              <input
                type="number"
                required
                value={priceAmount}
                onChange={(e) => setPriceAmount(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:border-emerald-600 outline-hidden font-bold"
              />
            </div>
            <div className="flex items-center gap-2 pt-6">
              <input
                type="checkbox"
                id="edit-nego"
                checked={negotiable}
                onChange={(e) => setNegotiable(e.target.checked)}
                className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 w-4 h-4"
              />
              <label htmlFor="edit-nego" className="text-xs font-semibold text-slate-700 cursor-pointer">
                Price is Negotiable
              </label>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Updated Description / Rationale
            </label>
            <textarea
              rows={4}
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full text-xs p-3 rounded-xl border border-slate-300 focus:border-emerald-600 outline-hidden leading-relaxed"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md shadow-emerald-700/20 transition-colors flex items-center gap-1.5"
            >
              <Send className="w-4 h-4" />
              Submit Change Request to Admin
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
