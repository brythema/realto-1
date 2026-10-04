import React, { useState } from 'react';
import { Property, PropertyCategory } from '../../types/property';
import { useMarketplace } from '../../context/MarketplaceContext';
import { useAuth } from '../../context/AuthContext';
import {
  X,
  Save,
  Send,
  Building,
  Home,
  MapPin,
  Layers,
  FileCheck,
  CheckCircle2,
  AlertCircle,
  Image as ImageIcon,
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  draftToEdit?: Property | null;
}

export const DraftPropertyModal: React.FC<Props> = ({ isOpen, onClose, draftToEdit }) => {
  const { createDraft, updateDraft, submitDraftForReview } = useMarketplace();
  const { currentUser } = useAuth();

  const isEditing = !!draftToEdit;

  // Form State
  const [title, setTitle] = useState(draftToEdit?.title || '');
  const [category, setCategory] = useState<PropertyCategory>(draftToEdit?.category || 'HOUSE');
  const [propertyType, setPropertyType] = useState(draftToEdit?.propertyType || 'DETACHED_DUPLEX');
  const [amount, setAmount] = useState(draftToEdit?.price?.amount?.toString() || '75000000');
  const [negotiable, setNegotiable] = useState(draftToEdit?.price?.negotiable ?? true);

  const [state, setState] = useState(draftToEdit?.location?.state || 'Lagos');
  const [city, setCity] = useState(draftToEdit?.location?.city || 'Lekki');
  const [area, setArea] = useState(draftToEdit?.location?.area || 'Lekki Phase 1');
  const [estate, setEstate] = useState(draftToEdit?.location?.estate || '');
  const [exactAddress, setExactAddress] = useState(draftToEdit?.privateDetails?.exactAddress || '');

  const [bedrooms, setBedrooms] = useState(draftToEdit?.specifications?.bedrooms?.toString() || '4');
  const [bathrooms, setBathrooms] = useState(draftToEdit?.specifications?.bathrooms?.toString() || '4');
  const [landSize, setLandSize] = useState(draftToEdit?.specifications?.landSize?.toString() || '500');
  const [landSizeUnit, setLandSizeUnit] = useState<'SQM' | 'PLOT' | 'HECTARE'>(
    draftToEdit?.specifications?.landSizeUnit || 'SQM'
  );
  const [titleDocument, setTitleDocument] = useState(
    draftToEdit?.specifications?.titleDocument || 'GOVERNORS_CONSENT'
  );

  const [description, setDescription] = useState(
    draftToEdit?.description ||
      'Exquisite, newly constructed property with premium architectural finish, fitted kitchen, and secure estate perimeter.'
  );

  const [imageUrl, setImageUrl] = useState(
    draftToEdit?.coverImageUrl ||
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1000&auto=format&fit=crop&q=80'
  );

  if (!isOpen) return null;

  const buildPayload = (): Partial<Property> => ({
    title,
    category,
    propertyType,
    price: {
      amount: Number(amount) || 0,
      currency: 'NGN',
      negotiable,
    },
    location: {
      state,
      stateSlug: state.toLowerCase().replace(/\s+/g, '-'),
      city,
      citySlug: city.toLowerCase().replace(/\s+/g, '-'),
      area,
      areaSlug: area.toLowerCase().replace(/\s+/g, '-'),
      estate: estate || undefined,
    },
    specifications: {
      bedrooms: category === 'LAND' ? undefined : Number(bedrooms) || undefined,
      bathrooms: category === 'LAND' ? undefined : Number(bathrooms) || undefined,
      landSize: Number(landSize) || undefined,
      landSizeUnit,
      titleDocument: titleDocument as any,
    },
    description,
    features: ['24/7 Security', 'Borehole & Treated Water', 'Good Paved Road Frontage'],
    coverImageUrl: imageUrl,
    images: [{ id: 'img-1', url: imageUrl, order: 1, isCover: true }],
    privateDetails: {
      exactAddress: exactAddress || `${area}, ${city}`,
      ownershipDetails: 'Direct owner title registered with state authorities.',
    },
  });

  const handleSaveDraft = () => {
    const payload = buildPayload();
    if (isEditing && draftToEdit) {
      updateDraft(draftToEdit.id, payload);
    } else {
      createDraft(payload);
    }
    onClose();
  };

  const handleSubmitForReview = () => {
    const payload = buildPayload();
    let targetId = draftToEdit?.id;
    if (isEditing && draftToEdit) {
      updateDraft(draftToEdit.id, payload);
    } else {
      const created = createDraft(payload);
      targetId = created.id;
    }

    if (targetId) {
      submitDraftForReview(targetId);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-3xl w-full my-auto shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50/80">
          <div>
            <h2 className="font-bold text-slate-900 text-lg flex items-center gap-2">
              <Building className="w-5 h-5 text-emerald-600" />
              {isEditing ? 'Edit Private Draft Listing' : 'Assemble New Property Draft'}
            </h2>
            <p className="text-xs text-slate-500">
              Private Workspace: Drafts are saved privately and do not affect public data.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <div className="overflow-y-auto p-6 space-y-5 flex-1">
          {/* Informational Callout */}
          <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-2xl flex items-start gap-3 text-xs text-blue-900">
            <AlertCircle className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block">Private Draft vs. Live Data Isolation</span>
              You can save, tweak, and organize your draft as many times as you want without triggering admin notifications. When complete, click &ldquo;Submit for Review&rdquo; to create a formal <code>PROPERTY_SUBMIT</code> Change Request.
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Property Headline / Title
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Luxurious 4-Bedroom Fully Detached Duplex with Swimming Pool"
              className="w-full text-xs p-3 rounded-xl border border-slate-300 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 outline-hidden font-medium"
            />
          </div>

          {/* Category & Property Type */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => {
                  const cat = e.target.value as PropertyCategory;
                  setCategory(cat);
                  if (cat === 'HOUSE') setPropertyType('DETACHED_DUPLEX');
                  if (cat === 'FLAT_APARTMENT') setPropertyType('MINI_FLAT');
                  if (cat === 'LAND') setPropertyType('RESIDENTIAL_LAND');
                  if (cat === 'COMMERCIAL') setPropertyType('PLAZA_COMPLEX_MALL');
                }}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:border-emerald-600 outline-hidden bg-white"
              >
                <option value="HOUSE">House</option>
                <option value="FLAT_APARTMENT">Flat & Apartment</option>
                <option value="LAND">Land Parcel</option>
                <option value="COMMERCIAL">Commercial Property</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Property Classification
              </label>
              <select
                value={propertyType}
                onChange={(e) => setPropertyType(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:border-emerald-600 outline-hidden bg-white"
              >
                {category === 'HOUSE' && (
                  <>
                    <option value="DETACHED_DUPLEX">Fully Detached Duplex</option>
                    <option value="SEMI_DETACHED_DUPLEX">Semi-Detached Duplex</option>
                    <option value="TERRACED_DUPLEX">Terraced Duplex</option>
                    <option value="DETACHED_BUNGALOW">Detached Bungalow</option>
                    <option value="BLOCK_OF_FLATS">Block of Flats</option>
                  </>
                )}
                {category === 'FLAT_APARTMENT' && (
                  <>
                    <option value="MINI_FLAT">Mini Flat (Room & Parlour)</option>
                    <option value="SELF_CONTAIN">Self-Contained Single Room</option>
                    <option value="STANDARD_APARTMENT">Standard Apartment</option>
                    <option value="PENTHOUSE">Luxury Penthouse</option>
                  </>
                )}
                {category === 'LAND' && (
                  <>
                    <option value="RESIDENTIAL_LAND">Residential Land</option>
                    <option value="COMMERCIAL_LAND">Commercial Land</option>
                    <option value="INDUSTRIAL_LAND">Industrial Land</option>
                    <option value="MIXED_USE_LAND">Mixed-Use Land</option>
                  </>
                )}
                {category === 'COMMERCIAL' && (
                  <>
                    <option value="PLAZA_COMPLEX_MALL">Plaza / Shopping Complex</option>
                    <option value="OFFICE_SPACE">Office Space</option>
                    <option value="WAREHOUSE">Warehouse</option>
                    <option value="HOTEL_GUEST_HOUSE">Hotel / Guest House</option>
                  </>
                )}
              </select>
            </div>
          </div>

          {/* Price & Negotiation */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Asking Price (NGN ₦)
              </label>
              <input
                type="number"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="75000000"
                className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 outline-hidden font-bold"
              />
            </div>
            <div className="flex items-center gap-2 pt-6">
              <input
                type="checkbox"
                id="nego"
                checked={negotiable}
                onChange={(e) => setNegotiable(e.target.checked)}
                className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 w-4 h-4"
              />
              <label htmlFor="nego" className="text-xs font-semibold text-slate-700 cursor-pointer">
                Price is Negotiable
              </label>
            </div>
          </div>

          {/* Location details */}
          <div className="border-t border-slate-100 pt-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-emerald-600" />
              General Location (Public)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">State</label>
                <select
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-white"
                >
                  <option value="Lagos">Lagos State</option>
                  <option value="Abuja (FCT)">Abuja (FCT)</option>
                  <option value="Oyo">Oyo (Ibadan)</option>
                  <option value="Rivers">Rivers (Port Harcourt)</option>
                  <option value="Ogun">Ogun State</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">City</label>
                <input
                  type="text"
                  required
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="e.g. Lekki"
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Area / Neighbourhood
                </label>
                <input
                  type="text"
                  required
                  value={area}
                  onChange={(e) => setArea(e.target.value)}
                  placeholder="e.g. Lekki Phase 1"
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 outline-hidden"
                />
              </div>
            </div>

            {/* Estate & Private Exact Address */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Estate Name (Optional, Public)
                </label>
                <input
                  type="text"
                  value={estate}
                  onChange={(e) => setEstate(e.target.value)}
                  placeholder="e.g. Periwinkle Lifestyle Estate"
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between">
                  <span>Exact Street Address</span>
                  <span className="text-[10px] text-amber-700 font-bold bg-amber-50 px-1.5 py-0.2 rounded">
                    Private (Admin Only)
                  </span>
                </label>
                <input
                  type="text"
                  value={exactAddress}
                  onChange={(e) => setExactAddress(e.target.value)}
                  placeholder="Plot 7, Coral Crescent, Periwinkle Estate"
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 outline-hidden bg-slate-50"
                />
              </div>
            </div>
          </div>

          {/* Specifications */}
          <div className="border-t border-slate-100 pt-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-emerald-600" />
              Property Specifications
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {category !== 'LAND' && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Bedrooms</label>
                    <input
                      type="number"
                      value={bedrooms}
                      onChange={(e) => setBedrooms(e.target.value)}
                      className="w-full text-xs p-2 rounded-xl border border-slate-300"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Bathrooms</label>
                    <input
                      type="number"
                      value={bathrooms}
                      onChange={(e) => setBathrooms(e.target.value)}
                      className="w-full text-xs p-2 rounded-xl border border-slate-300"
                    />
                  </div>
                </>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Land Size</label>
                <input
                  type="number"
                  value={landSize}
                  onChange={(e) => setLandSize(e.target.value)}
                  className="w-full text-xs p-2 rounded-xl border border-slate-300"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Size Unit</label>
                <select
                  value={landSizeUnit}
                  onChange={(e) => setLandSizeUnit(e.target.value as any)}
                  className="w-full text-xs p-2 rounded-xl border border-slate-300 bg-white"
                >
                  <option value="SQM">Square Metres (SQM)</option>
                  <option value="PLOT">Plots</option>
                  <option value="HECTARE">Hectares</option>
                </select>
              </div>
            </div>

            {/* Title Document */}
            <div className="mt-3">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Title / Documentation Status
              </label>
              <select
                value={titleDocument}
                onChange={(e) => setTitleDocument(e.target.value as any)}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-white"
              >
                <option value="GOVERNORS_CONSENT">Governor’s Consent</option>
                <option value="C_OF_O">Certificate of Occupancy (C of O)</option>
                <option value="GAZETTE">Government Gazette</option>
                <option value="SURVEY_PLAN">Registered Survey Plan</option>
                <option value="DEED_OF_ASSIGNMENT">Deed of Assignment</option>
                <option value="EXCISION">Approved Excision</option>
              </select>
            </div>
          </div>

          {/* Photo & Description */}
          <div className="border-t border-slate-100 pt-4 space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5 text-slate-400" />
                Cover Photo URL
              </label>
              <input
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://images.unsplash.com/..."
                className="w-full text-xs p-2.5 rounded-xl border border-slate-300 outline-hidden font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Detailed Description
              </label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full text-xs p-3 rounded-xl border border-slate-300 focus:border-emerald-600 outline-hidden"
              />
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:text-slate-900 rounded-xl"
          >
            Cancel
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSaveDraft}
              className="px-4 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 shadow-2xs"
            >
              <Save className="w-4 h-4 text-slate-600" />
              Save Private Draft
            </button>

            <button
              type="button"
              onClick={handleSubmitForReview}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 shadow-md shadow-emerald-700/20"
            >
              <Send className="w-4 h-4" />
              Submit for Admin Review
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
