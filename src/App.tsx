import React, { useState, useMemo } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { MarketplaceProvider, useMarketplace } from './context/MarketplaceContext';
import { Navbar } from './components/navbar/Navbar';
import { Footer } from './components/footer/Footer';
import { HeroSearch } from './components/marketplace/HeroSearch';
import { PropertyCard } from './components/marketplace/PropertyCard';
import { DeveloperSpaceView } from './components/marketplace/DeveloperSpaceView';
import { DeveloperSpacesDirectory } from './components/marketplace/DeveloperSpacesDirectory';
import { PropertyDetailModal } from './components/marketplace/PropertyDetailModal';
import { InquiryModal } from './components/marketplace/InquiryModal';
import { CartDrawer } from './components/marketplace/CartDrawer';
import { NotificationDrawer } from './components/common/NotificationDrawer';
import { WhatsAppFloatingButton } from './components/common/WhatsAppFloatingButton';
import { SellerDeveloperDashboard } from './components/dashboard/SellerDeveloperDashboard';
import { BuyerDashboard } from './components/dashboard/BuyerDashboard';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { Property } from './types/property';
import { Building2, Layers, ShieldCheck, Sparkles, Filter } from 'lucide-react';

const MarketplaceContent: React.FC = () => {
  const { currentUser, currentRole } = useAuth();
  const { publicProperties } = useMarketplace();

  // Navigation Views
  const [activeView, setActiveView] = useState<string>('marketplace');
  const [activeDeveloperSlug, setActiveDeveloperSlug] = useState<string | null>(null);

  // Modals & Drawers
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [inquiryProperty, setInquiryProperty] = useState<Property | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  // Search & Filter State
  const [filters, setFilters] = useState({
    keyword: '',
    state: '',
    category: '',
    propertyType: '',
    minPrice: '',
    maxPrice: '',
    bedrooms: '',
  });

  // Filter public properties
  const filteredProperties = useMemo(() => {
    return publicProperties.filter((p) => {
      if (filters.keyword) {
        const kw = filters.keyword.toLowerCase();
        const matchesTitle = p.title.toLowerCase().includes(kw);
        const matchesArea = p.location.area.toLowerCase().includes(kw);
        const matchesCity = p.location.city.toLowerCase().includes(kw);
        const matchesEstate = p.location.estate?.toLowerCase().includes(kw);
        if (!matchesTitle && !matchesArea && !matchesCity && !matchesEstate) return false;
      }

      if (filters.state && p.location.state !== filters.state) return false;
      if (filters.category && p.category !== filters.category) return false;
      if (filters.propertyType && p.propertyType !== filters.propertyType) return false;

      if (filters.minPrice && p.price.amount < Number(filters.minPrice)) return false;
      if (filters.maxPrice && p.price.amount > Number(filters.maxPrice)) return false;

      if (filters.bedrooms && (p.specifications.bedrooms || 0) < Number(filters.bedrooms)) {
        return false;
      }

      return true;
    });
  }, [publicProperties, filters]);

  const handleSelectDeveloperSpace = (slug: string) => {
    setActiveDeveloperSlug(slug);
    setActiveView('developer-space-detail');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans selection:bg-emerald-500 selection:text-white">
      {/* Top Navbar */}
      <Navbar
        activeView={activeView}
        setActiveView={(v) => {
          setActiveView(v);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        openCart={() => setIsCartOpen(true)}
        openNotifications={() => setIsNotificationsOpen(true)}
      />

      <main className="flex-1">
        {/* VIEW 1: Main Marketplace Feed */}
        {activeView === 'marketplace' && (
          <div>
            <HeroSearch
              filters={filters}
              setFilters={setFilters}
              totalResults={filteredProperties.length}
            />

            {/* Main Content Area */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
              {/* Category & Section Heading */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                    <Layers className="w-6 h-6 text-emerald-600" />
                    All Approved Properties ({filteredProperties.length})
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Unified democratic feed combining verified listings from both independent sellers and multi-property developers.
                  </p>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-center">
                  <button
                    onClick={() => setActiveView('developer-spaces')}
                    className="px-3.5 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-bold rounded-xl border border-purple-200 transition-colors flex items-center gap-1.5 shadow-2xs"
                  >
                    <Building2 className="w-3.5 h-3.5 text-purple-600" />
                    Browse Developer Spaces &rarr;
                  </button>
                </div>
              </div>

              {/* Grid of Properties */}
              {filteredProperties.length === 0 ? (
                <div className="py-24 text-center bg-white rounded-3xl border border-slate-200 mt-6 shadow-2xs">
                  <Filter className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <h3 className="font-bold text-slate-700 text-base">No Matching Properties</h3>
                  <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                    Try adjusting your location, category, or price budget parameters above.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
                  {filteredProperties.map((prop) => (
                    <PropertyCard
                      key={prop.id}
                      property={prop}
                      onSelect={(p) => setSelectedProperty(p)}
                      onInquire={(p) => setInquiryProperty(p)}
                      onViewDeveloperSpace={handleSelectDeveloperSpace}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* VIEW 2: Developer Spaces Directory */}
        {activeView === 'developer-spaces' && (
          <DeveloperSpacesDirectory
            onSelectDeveloperSpace={handleSelectDeveloperSpace}
            onBackToFeed={() => setActiveView('marketplace')}
          />
        )}

        {/* VIEW 3: Single Developer Space View */}
        {activeView === 'developer-space-detail' && activeDeveloperSlug && (
          <DeveloperSpaceView
            developerSlug={activeDeveloperSlug}
            onBack={() => setActiveView('developer-spaces')}
            onSelectProperty={(p) => setSelectedProperty(p)}
            onInquireProperty={(p) => setInquiryProperty(p)}
          />
        )}

        {/* VIEW 4: User Dashboard (Role-aware) */}
        {activeView === 'dashboard' && (
          <div>
            {currentRole === 'BUYER' ? (
              <BuyerDashboard
                onSelectProperty={(p) => setSelectedProperty(p)}
                onInquireProperty={(p) => setInquiryProperty(p)}
                onBrowseMarketplace={() => setActiveView('marketplace')}
              />
            ) : currentRole === 'SELLER' || currentRole === 'DEVELOPER' ? (
              <SellerDeveloperDashboard
                onSelectProperty={(p) => setSelectedProperty(p)}
                onViewDeveloperSpace={handleSelectDeveloperSpace}
              />
            ) : currentRole === 'ADMIN' ? (
              <AdminDashboard onSelectProperty={(p) => setSelectedProperty(p)} />
            ) : (
              <div className="max-w-md mx-auto py-24 px-4 text-center">
                <ShieldCheck className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                <h2 className="text-lg font-bold text-slate-800">Please Sign In</h2>
                <p className="text-xs text-slate-500 mt-1">
                  Access your dashboard to manage drafts, review inquiries, or inspect platform notifications.
                </p>
              </div>
            )}
          </div>
        )}

        {/* VIEW 5: Admin Governance Hub */}
        {activeView === 'admin' && (
          <AdminDashboard onSelectProperty={(p) => setSelectedProperty(p)} />
        )}
      </main>

      {/* Footer */}
      <Footer onNavigate={(v) => setActiveView(v)} />

      {/* Floating Concierge Button */}
      <WhatsAppFloatingButton />

      {/* Modals & Slide-overs */}
      <PropertyDetailModal
        property={selectedProperty}
        onClose={() => setSelectedProperty(null)}
        onInquire={(p) => {
          setSelectedProperty(null);
          setInquiryProperty(p);
        }}
        onViewDeveloperSpace={handleSelectDeveloperSpace}
      />

      <InquiryModal
        property={inquiryProperty}
        isOpen={!!inquiryProperty}
        onClose={() => setInquiryProperty(null)}
        onViewThreads={() => setActiveView('dashboard')}
      />

      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        onSelectProperty={(p) => setSelectedProperty(p)}
        onInquireProperty={(p) => setInquiryProperty(p)}
      />

      <NotificationDrawer
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        onNavigate={() => setActiveView('dashboard')}
      />
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <MarketplaceProvider>
        <MarketplaceContent />
      </MarketplaceProvider>
    </AuthProvider>
  );
}
