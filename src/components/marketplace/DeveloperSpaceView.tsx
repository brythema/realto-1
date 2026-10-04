import React, { useState } from 'react';
import { useMarketplace } from '../../context/MarketplaceContext';
import { Property } from '../../types/property';
import { PropertyCard } from './PropertyCard';
import {
  Building2,
  ShieldCheck,
  Award,
  ArrowLeft,
  Calendar,
  Layers,
  MapPin,
  Lock,
} from 'lucide-react';

interface Props {
  developerSlug: string;
  onBack: () => void;
  onSelectProperty: (property: Property) => void;
  onInquireProperty: (property: Property) => void;
}

export const DeveloperSpaceView: React.FC<Props> = ({
  developerSlug,
  onBack,
  onSelectProperty,
  onInquireProperty,
}) => {
  const { getDeveloperBySlug, getDeveloperLiveProperties } = useMarketplace();
  const developer = getDeveloperBySlug(developerSlug);

  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');

  if (!developer) {
    return (
      <div className="max-w-4xl mx-auto py-16 px-4 text-center">
        <Building2 className="w-12 h-12 text-slate-400 mx-auto mb-3" />
        <h2 className="text-xl font-bold text-slate-800">Developer Space Not Found</h2>
        <p className="text-sm text-slate-500 mt-1">
          This developer either does not exist or does not currently have 2 or more live properties.
        </p>
        <button
          onClick={onBack}
          className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg text-xs font-semibold"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Marketplace
        </button>
      </div>
    );
  }

  const liveProperties = getDeveloperLiveProperties(developer.developerId);

  const filteredProperties =
    categoryFilter === 'ALL'
      ? liveProperties
      : liveProperties.filter((p) => p.category === categoryFilter);

  return (
    <div className="pb-16">
      {/* Back button */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-2">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 px-3 py-1.5 rounded-lg shadow-2xs hover:bg-slate-50 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to All Properties
        </button>
      </div>

      {/* Developer Header Hero Banner */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-2">
        <div className="relative rounded-3xl overflow-hidden border border-slate-200/80 shadow-sm bg-slate-900 text-white">
          {/* Banner background photo */}
          {developer.bannerUrl && (
            <div className="absolute inset-0 opacity-25">
              <img
                src={developer.bannerUrl}
                alt={developer.companyName}
                className="w-full h-full object-cover"
              />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-900/90 to-slate-900/60" />

          <div className="relative p-6 sm:p-8 lg:p-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
              {/* Logo */}
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-white p-2 border-2 border-emerald-500/40 shadow-xl overflow-hidden shrink-0 flex items-center justify-center">
                {developer.logoUrl ? (
                  <img
                    src={developer.logoUrl}
                    alt={developer.companyName}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <Building2 className="w-10 h-10 text-slate-700" />
                )}
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-2 mb-1.5">
                  <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    Verified Corporate Developer
                  </span>
                  <span className="text-[11px] font-semibold text-slate-300 bg-white/10 px-2 py-0.5 rounded-full">
                    CAC: {developer.cacNumber}
                  </span>
                </div>

                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                  {developer.companyName}
                </h1>

                <p className="text-xs sm:text-sm text-slate-300 max-w-2xl mt-2 leading-relaxed">
                  {developer.businessOverview}
                </p>
              </div>
            </div>

            {/* Quick Metrics */}
            <div className="flex items-center gap-3 shrink-0 bg-white/10 backdrop-blur-md p-3.5 rounded-2xl border border-white/10">
              <div className="text-center px-3 border-r border-white/20">
                <span className="text-2xl font-black text-emerald-400 block">
                  {liveProperties.length}
                </span>
                <span className="text-[11px] text-slate-300 font-medium">Active Units</span>
              </div>
              <div className="text-center px-3">
                <span className="text-xs font-bold text-white flex items-center justify-center gap-1">
                  <Award className="w-4 h-4 text-amber-400" />
                  Accredited
                </span>
                <span className="text-[10px] text-slate-400 font-medium">Tier-1 Partner</span>
              </div>
            </div>
          </div>

          {/* Privacy & Anti-Disintermediation Notice Bar */}
          <div className="bg-slate-950/80 border-t border-white/10 px-6 py-2.5 text-xs text-slate-300 flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <Lock className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>
                <strong className="text-white">Admin-Facilitated Concierge & Inquiries:</strong> In accordance with Realto governing standards, all inquiries and inspection scheduling for {developer.companyName} listings are facilitated directly through Realto Administration. Direct personal developer contacts remain confidential.
              </span>
            </div>
            <span className="text-[11px] text-emerald-400 font-semibold">Protected Buyer Protocol</span>
          </div>
        </div>
      </div>

      {/* Portfolio Catalog Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Layers className="w-5 h-5 text-emerald-600" />
              Developer Portfolio ({filteredProperties.length} Properties)
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Live, approved development projects currently available on the platform.
            </p>
          </div>

          {/* Filter tabs */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
            {['ALL', 'HOUSE', 'FLAT_APARTMENT', 'LAND', 'COMMERCIAL'].map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                  categoryFilter === cat
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {cat === 'ALL'
                  ? 'All Units'
                  : cat === 'HOUSE'
                  ? 'Houses'
                  : cat === 'FLAT_APARTMENT'
                  ? 'Apartments'
                  : cat === 'LAND'
                  ? 'Land'
                  : 'Commercial'}
              </button>
            ))}
          </div>
        </div>

        {/* Listings Grid */}
        {filteredProperties.length === 0 ? (
          <div className="py-16 text-center bg-white rounded-2xl border border-slate-200 mt-6">
            <Building2 className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-sm text-slate-600 font-medium">No properties match this category.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
            {filteredProperties.map((prop) => (
              <PropertyCard
                key={prop.id}
                property={prop}
                onSelect={onSelectProperty}
                onInquire={onInquireProperty}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
