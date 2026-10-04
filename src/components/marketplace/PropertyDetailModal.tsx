import React, { useState } from 'react';
import { Property } from '../../types/property';
import { useMarketplace } from '../../context/MarketplaceContext';
import {
  formatNaira,
  getPropertyTypeLabel,
  getCategoryLabel,
  getTitleDocumentLabel,
} from '../../utils/formatters';
import {
  X,
  MapPin,
  Heart,
  ShieldCheck,
  Bed,
  Bath,
  Maximize2,
  Calendar,
  Building2,
  CheckCircle2,
  Share2,
  ChevronLeft,
  ChevronRight,
  Layers,
  FileCheck,
  Lock,
} from 'lucide-react';

interface Props {
  property: Property | null;
  onClose: () => void;
  onInquire: (property: Property) => void;
  onViewDeveloperSpace?: (slug: string) => void;
}

export const PropertyDetailModal: React.FC<Props> = ({
  property,
  onClose,
  onInquire,
  onViewDeveloperSpace,
}) => {
  const { isSaved, toggleSaveProperty, developers } = useMarketplace();
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [copied, setCopied] = useState(false);

  if (!property) return null;

  const saved = isSaved(property.id);

  // Check developer space eligibility
  const dev = developers.find((d) => d.developerId === property.ownerRef.id);
  const hasDeveloperSpace = dev?.hasDeveloperSpace && dev?.slug;

  const handleShare = () => {
    navigator.clipboard?.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const images = property.images && property.images.length > 0
    ? property.images
    : [{ id: '1', url: property.coverImageUrl, order: 1, isCover: true }];

  const nextImage = () => {
    setActiveImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setActiveImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-4xl w-full my-auto shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header bar */}
        <div className="flex items-center justify-between px-6 py-3.5 border-b border-slate-200 bg-slate-50/70">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold text-slate-600 bg-slate-200/80 px-2 py-0.5 rounded">
              {property.id}
            </span>
            <span className="text-xs font-semibold px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
              Realto Verified
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                const shareUrl = `${window.location.origin}/?property=${property.id}`;
                navigator.clipboard?.writeText(shareUrl);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              }}
              className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors text-xs font-medium flex items-center gap-1"
              title="Copy direct share link"
            >
              <Share2 className="w-4 h-4" />
              {copied ? 'Copied Link' : 'Copy Link'}
            </button>
            <a
              href={`https://wa.me/?text=${encodeURIComponent(
                `Check out this verified listing on Realto Nigeria:\n${property.title} (${formatNaira(
                  property.price.amount
                )})\n${window.location.origin}/?property=${property.id}`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors text-xs font-bold flex items-center gap-1"
              title="Share on WhatsApp"
            >
              WhatsApp
            </a>
            <button
              onClick={() => toggleSaveProperty(property.id)}
              className={`p-2 rounded-lg transition-colors ${
                saved
                  ? 'bg-rose-50 text-rose-600'
                  : 'text-slate-500 hover:text-rose-600 hover:bg-slate-100'
              }`}
              title={saved ? 'Remove from saved' : 'Save property'}
            >
              <Heart className={`w-4 h-4 ${saved ? 'fill-rose-600' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto p-6 space-y-6 flex-1">
          {/* Gallery with Navigation */}
          <div className="space-y-3">
            <div className="relative aspect-16/9 rounded-2xl overflow-hidden bg-slate-900 group">
              <img
                src={images[activeImageIndex]?.url || property.coverImageUrl}
                alt={property.title}
                className="w-full h-full object-cover"
              />

              {images.length > 1 && (
                <>
                  <button
                    onClick={prevImage}
                    className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 hover:bg-black/80 text-white backdrop-blur-xs transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    onClick={nextImage}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 hover:bg-black/80 text-white backdrop-blur-xs transition-colors"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                  <div className="absolute bottom-3 right-3 bg-black/60 backdrop-blur-xs text-white text-[11px] font-medium px-2 py-0.5 rounded-md">
                    {activeImageIndex + 1} / {images.length}
                  </div>
                </>
              )}
            </div>

            {/* Thumbnail strip */}
            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {images.map((img, idx) => (
                  <button
                    key={img.id || idx}
                    onClick={() => setActiveImageIndex(idx)}
                    className={`relative w-20 h-14 rounded-lg overflow-hidden shrink-0 border-2 transition-all ${
                      activeImageIndex === idx
                        ? 'border-emerald-600 ring-2 ring-emerald-600/30'
                        : 'border-transparent opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img src={img.url} alt="thumbnail" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Pricing & Title */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-semibold px-2.5 py-0.5 bg-slate-100 text-slate-700 rounded-full">
                  {getCategoryLabel(property.category)}
                </span>
                <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full">
                  {getPropertyTypeLabel(property.propertyType)}
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                {property.title}
              </h1>
              <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1">
                <MapPin className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  {property.location.estate ? `${property.location.estate}, ` : ''}
                  {property.location.area}, {property.location.city}, {property.location.state}
                </span>
              </div>
            </div>

            <div className="text-left sm:text-right shrink-0">
              <div className="text-2xl sm:text-3xl font-black text-slate-900">
                {formatNaira(property.price.amount)}
              </div>
              <div className="text-xs text-slate-500">
                {property.price.negotiable ? 'Direct purchase • Negotiable' : 'Fixed Price'}
              </div>
            </div>
          </div>

          {/* Developer Space Callout Banner (if applicable) */}
          {hasDeveloperSpace && dev && (
            <div className="p-4 bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200/80 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center shrink-0">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[11px] font-bold text-purple-700 uppercase tracking-wider block">
                    Developer Portfolio
                  </span>
                  <span className="font-bold text-slate-900 text-sm">{dev.companyName}</span>
                  <span className="text-xs text-slate-500 block">
                    Verified developer with {dev.livePropertiesCount} live active units on Realto.
                  </span>
                </div>
              </div>
              <button
                onClick={() => {
                  onClose();
                  if (onViewDeveloperSpace) onViewDeveloperSpace(dev.slug);
                }}
                className="px-3.5 py-2 bg-purple-700 hover:bg-purple-800 text-white text-xs font-semibold rounded-xl transition-colors shadow-2xs whitespace-nowrap text-center"
              >
                Visit Developer Space &rarr;
              </button>
            </div>
          )}

          {/* Key Specifications Grid */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
              Key Specifications
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {property.specifications.bedrooms !== undefined && (
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="text-slate-400 text-xs flex items-center gap-1">
                    <Bed className="w-3.5 h-3.5" />
                    Bedrooms
                  </div>
                  <div className="text-base font-bold text-slate-900 mt-0.5">
                    {property.specifications.bedrooms} Ensuite
                  </div>
                </div>
              )}

              {property.specifications.bathrooms !== undefined && (
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="text-slate-400 text-xs flex items-center gap-1">
                    <Bath className="w-3.5 h-3.5" />
                    Bathrooms
                  </div>
                  <div className="text-base font-bold text-slate-900 mt-0.5">
                    {property.specifications.bathrooms} Baths
                  </div>
                </div>
              )}

              {property.specifications.landSize && (
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="text-slate-400 text-xs flex items-center gap-1">
                    <Maximize2 className="w-3.5 h-3.5" />
                    Land Area
                  </div>
                  <div className="text-base font-bold text-slate-900 mt-0.5">
                    {property.specifications.landSize} {property.specifications.landSizeUnit || 'SQM'}
                  </div>
                </div>
              )}

              {property.specifications.titleDocument && (
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="text-slate-400 text-xs flex items-center gap-1">
                    <FileCheck className="w-3.5 h-3.5" />
                    Title Document
                  </div>
                  <div className="text-xs font-bold text-emerald-800 mt-0.5 truncate">
                    {getTitleDocumentLabel(property.specifications.titleDocument)}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Description */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
              Property Description
            </h3>
            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-line bg-slate-50/50 p-4 rounded-xl border border-slate-100">
              {property.description}
            </p>
          </div>

          {/* Features */}
          {property.features && property.features.length > 0 && (
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                Amenities & Estate Features
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {property.features.map((feat, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg text-xs font-medium text-slate-700"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>{feat}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Anti-Disintermediation Trust Shield */}
          <div className="p-4 bg-emerald-50/80 border border-emerald-200 rounded-2xl flex items-start gap-3">
            <Lock className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
            <div className="text-xs text-emerald-950 leading-relaxed">
              <strong className="font-bold">Realto Buyer Protection Protocol:</strong> To protect buyers from Nigerian land title fraud, illegal dual-allocations, and bait-and-switch listings, all title verification, physical site inspections, and inquiry routing are managed directly through Realto Platform Administration.
            </div>
          </div>
        </div>

        {/* Action footer */}
        <div className="px-6 py-4 border-t border-slate-200 bg-white flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-slate-500">
            Listing Ref: <span className="font-mono font-bold text-slate-700">{property.id}</span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={() => toggleSaveProperty(property.id)}
              className="py-2.5 px-4 rounded-xl border border-slate-300 hover:border-slate-400 text-slate-700 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors"
            >
              <Heart className={`w-4 h-4 ${saved ? 'fill-rose-500 text-rose-500' : ''}`} />
              {saved ? 'Saved in Cart' : 'Save to Cart'}
            </button>

            <button
              onClick={() => {
                onClose();
                onInquire(property);
              }}
              className="flex-1 sm:flex-none py-2.5 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-700/20 transition-colors flex items-center justify-center gap-2"
            >
              <Calendar className="w-4 h-4" />
              Inquire / Book Inspection
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
