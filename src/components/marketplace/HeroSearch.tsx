import React from 'react';
import { PropertyCategory } from '../../types/property';
import { Search, MapPin, SlidersHorizontal, RotateCcw, Home, Sparkles } from 'lucide-react';

interface FilterState {
  keyword: string;
  state: string;
  category: string;
  propertyType: string;
  minPrice: string;
  maxPrice: string;
  bedrooms: string;
}

interface Props {
  filters: FilterState;
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
  totalResults: number;
}

export const HeroSearch: React.FC<Props> = ({ filters, setFilters, totalResults }) => {
  const handleReset = () => {
    setFilters({
      keyword: '',
      state: '',
      category: '',
      propertyType: '',
      minPrice: '',
      maxPrice: '',
      bedrooms: '',
    });
  };

  const isFiltered = Object.values(filters).some((val) => val !== '');

  return (
    <div className="bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 text-white pt-10 pb-16 px-4 sm:px-6 lg:px-8 border-b border-slate-800">
      <div className="max-w-6xl mx-auto text-center space-y-4">
        {/* Header tags */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
          <span>Nigeria’s Premier Admin-Governed Property Exchange</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white max-w-3xl mx-auto leading-tight">
          Verified Nigerian Real Estate with <span className="text-emerald-400">Guaranteed Escrow</span>
        </h1>

        <p className="text-sm sm:text-base text-slate-400 max-w-2xl mx-auto leading-relaxed">
          Zero direct seller contact. Every property inspected, title-vetted, and transaction-governed by Realto Administration.
        </p>

        {/* Filter Card */}
        <div className="mt-8 bg-white/95 backdrop-blur-md rounded-3xl p-4 sm:p-6 text-slate-800 shadow-2xl border border-white/20 text-left max-w-5xl mx-auto">
          {/* Main search input */}
          <div className="flex flex-col md:flex-row gap-3 items-center pb-4 border-b border-slate-200">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={filters.keyword}
                onChange={(e) => setFilters((prev) => ({ ...prev, keyword: e.target.value }))}
                placeholder="Search area, estate name, or property title (e.g. Lekki Phase 1, Ikoyi, Maitama)..."
                className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 outline-hidden transition-all text-slate-800"
              />
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto">
              <select
                value={filters.state}
                onChange={(e) => setFilters((prev) => ({ ...prev, state: e.target.value }))}
                className="w-full md:w-44 py-2.5 px-3 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:border-emerald-600 outline-hidden font-medium text-slate-700"
              >
                <option value="">All States (Nigeria)</option>
                <option value="Lagos">Lagos State</option>
                <option value="Abuja">Abuja (FCT)</option>
                <option value="Oyo">Oyo (Ibadan)</option>
                <option value="Rivers">Rivers (Port Harcourt)</option>
                <option value="Ogun">Ogun State</option>
              </select>

              <select
                value={filters.category}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, category: e.target.value, propertyType: '' }))
                }
                className="w-full md:w-44 py-2.5 px-3 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:border-emerald-600 outline-hidden font-medium text-slate-700"
              >
                <option value="">All Categories</option>
                <option value="HOUSE">Houses & Duplexes</option>
                <option value="FLAT_APARTMENT">Flats & Apartments</option>
                <option value="LAND">Land Parcels</option>
                <option value="COMMERCIAL">Commercial Properties</option>
              </select>
            </div>
          </div>

          {/* Secondary Filter Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 text-xs">
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                Min Price (₦)
              </label>
              <select
                value={filters.minPrice}
                onChange={(e) => setFilters((prev) => ({ ...prev, minPrice: e.target.value }))}
                className="w-full p-2 bg-slate-50 rounded-lg border border-slate-200 text-slate-700 outline-hidden"
              >
                <option value="">No Minimum</option>
                <option value="30000000">₦30,000,000</option>
                <option value="50000000">₦50,000,000</option>
                <option value="100000000">₦100,000,000</option>
                <option value="250000000">₦250,000,000</option>
                <option value="500000000">₦500,000,000</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                Max Price (₦)
              </label>
              <select
                value={filters.maxPrice}
                onChange={(e) => setFilters((prev) => ({ ...prev, maxPrice: e.target.value }))}
                className="w-full p-2 bg-slate-50 rounded-lg border border-slate-200 text-slate-700 outline-hidden"
              >
                <option value="">No Maximum</option>
                <option value="100000000">₦100,000,000</option>
                <option value="200000000">₦200,000,000</option>
                <option value="350000000">₦350,000,000</option>
                <option value="500000000">₦500,000,000</option>
                <option value="1000000000">₦1,000,000,000+</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">Bedrooms</label>
              <select
                value={filters.bedrooms}
                onChange={(e) => setFilters((prev) => ({ ...prev, bedrooms: e.target.value }))}
                className="w-full p-2 bg-slate-50 rounded-lg border border-slate-200 text-slate-700 outline-hidden"
              >
                <option value="">Any Bedrooms</option>
                <option value="1">1+ Bedroom</option>
                <option value="2">2+ Bedrooms</option>
                <option value="3">3+ Bedrooms</option>
                <option value="4">4+ Bedrooms</option>
                <option value="5">5+ Bedrooms</option>
              </select>
            </div>

            <div className="flex items-end justify-between gap-2">
              {isFiltered ? (
                <button
                  onClick={handleReset}
                  className="w-full py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-colors"
                >
                  <RotateCcw className="w-3 h-3 text-slate-500" />
                  Reset
                </button>
              ) : (
                <div className="w-full py-2 px-3 text-[11px] font-semibold text-slate-500 text-center bg-slate-50 rounded-lg">
                  {totalResults} verified listings
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
