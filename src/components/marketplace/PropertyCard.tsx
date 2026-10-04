import React from 'react';
import { Property } from '../../types/property';
import { useMarketplace } from '../../context/MarketplaceContext';
import { formatNaira, getPropertyTypeLabel } from '../../utils/formatters';
import {
  Heart,
  MapPin,
  Bed,
  Bath,
  Maximize2,
  ShieldCheck,
  Building2,
  Calendar,
} from 'lucide-react';

interface Props {
  property: Property;
  onSelect: (property: Property) => void;
  onInquire: (property: Property) => void;
  onViewDeveloperSpace?: (slug: string) => void;
}

export const PropertyCard: React.FC<Props> = ({
  property,
  onSelect,
  onInquire,
  onViewDeveloperSpace,
}) => {
  const { isSaved, toggleSaveProperty, developers } = useMarketplace();
  const saved = isSaved(property.id);

  // Check if developer has >1 live property (eligible for Developer Space)
  const dev = developers.find((d) => d.developerId === property.ownerRef.id);
  const hasDeveloperSpace = dev?.hasDeveloperSpace && dev?.slug;

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md hover:border-slate-300 transition-all overflow-hidden flex flex-col group">
      {/* Cover Image & Badges */}
      <div className="relative aspect-16/10 overflow-hidden bg-slate-100 cursor-pointer" onClick={() => onSelect(property)}>
        <img
          src={property.coverImageUrl}
          alt={property.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />

        {/* Top Badges */}
        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5 items-center">
          <span className="bg-slate-900/80 backdrop-blur-xs text-white text-[11px] font-semibold px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-xs">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            Verified Listing
          </span>

          <span className="bg-emerald-600/90 backdrop-blur-xs text-white text-[11px] font-bold px-2 py-0.5 rounded-full shadow-xs">
            {getPropertyTypeLabel(property.propertyType)}
          </span>
        </div>

        {/* Save button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleSaveProperty(property.id);
          }}
          className={`absolute top-3 right-3 p-2 rounded-full backdrop-blur-xs transition-colors shadow-xs ${
            saved
              ? 'bg-rose-500 text-white hover:bg-rose-600'
              : 'bg-white/80 text-slate-700 hover:bg-white hover:text-rose-500'
          }`}
          title={saved ? 'Remove from saved' : 'Save property'}
        >
          <Heart className={`w-4 h-4 ${saved ? 'fill-white' : ''}`} />
        </button>

        {/* Price Tag Overlay */}
        <div className="absolute bottom-3 left-3 bg-slate-900/90 backdrop-blur-xs text-white px-3 py-1 rounded-lg">
          <div className="text-base font-extrabold tracking-tight">
            {formatNaira(property.price.amount)}
          </div>
          {property.price.negotiable && (
            <span className="text-[10px] text-emerald-300 font-medium block -mt-0.5">Negotiable</span>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          {/* Location */}
          <div className="flex items-center gap-1 text-slate-500 text-xs font-medium mb-1.5">
            <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span className="truncate">
              {property.location.area}, {property.location.city}, {property.location.state}
            </span>
          </div>

          {/* Title */}
          <h3
            onClick={() => onSelect(property)}
            className="font-bold text-slate-900 text-sm leading-snug line-clamp-2 hover:text-emerald-700 cursor-pointer transition-colors"
          >
            {property.title}
          </h3>

          {/* Developer space link if developer has >1 property */}
          {hasDeveloperSpace && (
            <div className="mt-2">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (onViewDeveloperSpace && dev) {
                    onViewDeveloperSpace(dev.slug);
                  }
                }}
                className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-purple-700 hover:text-purple-900 bg-purple-50 hover:bg-purple-100 px-2 py-0.5 rounded-md border border-purple-200 transition-colors"
              >
                <Building2 className="w-3 h-3 text-purple-600" />
                <span>{property.ownerRef.developerName || dev?.companyName}</span>
                <span className="text-[10px] text-purple-500 underline ml-0.5">Space &rarr;</span>
              </button>
            </div>
          )}

          {/* Specs Bar */}
          <div className="flex items-center gap-3 mt-3 pt-2.5 border-t border-slate-100 text-xs text-slate-600">
            {property.specifications.bedrooms !== undefined && (
              <div className="flex items-center gap-1" title="Bedrooms">
                <Bed className="w-3.5 h-3.5 text-slate-400" />
                <span className="font-semibold">{property.specifications.bedrooms}</span>
                <span className="text-slate-400 text-[10px]">Beds</span>
              </div>
            )}

            {property.specifications.bathrooms !== undefined && (
              <div className="flex items-center gap-1" title="Bathrooms">
                <Bath className="w-3.5 h-3.5 text-slate-400" />
                <span className="font-semibold">{property.specifications.bathrooms}</span>
                <span className="text-slate-400 text-[10px]">Baths</span>
              </div>
            )}

            {property.specifications.landSize && (
              <div className="flex items-center gap-1" title="Land / Plot Size">
                <Maximize2 className="w-3.5 h-3.5 text-slate-400" />
                <span className="font-semibold">{property.specifications.landSize}</span>
                <span className="text-slate-400 text-[10px]">
                  {property.specifications.landSizeUnit || 'SQM'}
                </span>
              </div>
            )}

            {property.specifications.titleDocument && (
              <div className="ml-auto text-[10px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                Verified Title
              </div>
            )}
          </div>
        </div>

        {/* Card Action Buttons */}
        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-2">
          <button
            onClick={() => onSelect(property)}
            className="flex-1 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors text-center"
          >
            Inspect Specs
          </button>
          <button
            onClick={() => onInquire(property)}
            className="flex-1 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs transition-colors flex items-center justify-center gap-1"
          >
            <Calendar className="w-3.5 h-3.5" />
            Inquire (Admin)
          </button>
        </div>
      </div>
    </div>
  );
};
