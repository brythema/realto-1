import React from 'react';
import { useMarketplace } from '../../context/MarketplaceContext';
import { Building2, ShieldCheck, ArrowRight, Award, Lock } from 'lucide-react';

interface Props {
  onSelectDeveloperSpace: (slug: string) => void;
  onBackToFeed: () => void;
}

export const DeveloperSpacesDirectory: React.FC<Props> = ({
  onSelectDeveloperSpace,
  onBackToFeed,
}) => {
  const { developers } = useMarketplace();

  // Developers with dedicated spaces (>= 2 live properties)
  const eligibleDevelopers = developers.filter((d) => d.hasDeveloperSpace);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-800 text-xs font-bold mb-2">
            <Building2 className="w-3.5 h-3.5 text-purple-600" />
            Verified Developer Collections
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Developer Spaces
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl leading-relaxed">
            Institutional developers with multiple verified live developments receive a dedicated public showcase. All inquiries and inspections route through Realto Administration.
          </p>
        </div>

        <button
          onClick={onBackToFeed}
          className="self-start sm:self-center px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors"
        >
          View All Individual Listings &rarr;
        </button>
      </div>

      {eligibleDevelopers.length === 0 ? (
        <div className="py-20 text-center bg-white rounded-3xl border border-slate-200 mt-8">
          <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="font-bold text-slate-700 text-sm">No Active Developer Spaces</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Developers unlock their dedicated Space automatically upon reaching 2 or more approved live properties.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
          {eligibleDevelopers.map((dev) => (
            <div
              key={dev.developerId}
              onClick={() => onSelectDeveloperSpace(dev.slug)}
              className="bg-white rounded-3xl border border-slate-200/90 shadow-xs hover:shadow-xl hover:border-purple-300 transition-all overflow-hidden cursor-pointer group flex flex-col justify-between"
            >
              <div>
                {/* Header banner */}
                <div className="relative h-36 bg-slate-900 overflow-hidden">
                  {dev.bannerUrl && (
                    <img
                      src={dev.bannerUrl}
                      alt={dev.companyName}
                      className="w-full h-full object-cover opacity-35 group-hover:scale-105 transition-transform duration-500"
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/60 to-transparent" />

                  <div className="absolute top-3 left-3 flex items-center gap-1.5">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 backdrop-blur-xs flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3 text-emerald-400" />
                      Verified CAC
                    </span>
                  </div>

                  <div className="absolute bottom-3 right-3 bg-white/10 backdrop-blur-md px-2.5 py-1 rounded-lg text-white text-xs font-extrabold border border-white/20">
                    {dev.livePropertiesCount} Live Properties
                  </div>
                </div>

                {/* Company details */}
                <div className="p-6 relative">
                  {/* Floating Logo */}
                  <div className="w-16 h-16 rounded-2xl bg-white p-1.5 border-2 border-purple-500/30 shadow-md overflow-hidden -mt-14 mb-3 shrink-0 flex items-center justify-center">
                    {dev.logoUrl ? (
                      <img
                        src={dev.logoUrl}
                        alt={dev.companyName}
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <Building2 className="w-8 h-8 text-slate-700" />
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-slate-900 group-hover:text-purple-700 transition-colors">
                      {dev.companyName}
                    </h3>
                  </div>

                  <p className="text-xs text-slate-500 mt-2 line-clamp-3 leading-relaxed">
                    {dev.businessOverview}
                  </p>
                </div>
              </div>

              {/* Action footer */}
              <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-purple-700 group-hover:text-purple-900">
                <span className="flex items-center gap-1">
                  <Award className="w-3.5 h-3.5 text-amber-500" />
                  Accredited Partner
                </span>
                <span className="flex items-center gap-1">
                  Explore Space <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Trust Notice */}
      <div className="mt-12 p-4 bg-slate-100 rounded-2xl border border-slate-200 text-xs text-slate-600 flex items-center gap-3">
        <Lock className="w-4 h-4 text-emerald-600 shrink-0" />
        <span>
          <strong>Zero Direct Contact Policy:</strong> Developer Spaces showcase portfolio offerings and architecture without disclosing personal phone numbers or direct contacts. Inquiries are handled exclusively by Realto Administration.
        </span>
      </div>
    </div>
  );
};
