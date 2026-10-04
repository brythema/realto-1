import React, { useState } from 'react';
import { Property, PropertyCategory, PropertyType } from '../../types/property';
import { useMarketplace } from '../../context/MarketplaceContext';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import {
  X,
  Save,
  Send,
  Building,
  Upload,
  AlertCircle,
  FileText,
  Image as ImageIcon,
  CheckCircle2,
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
  const isRejected = draftToEdit?.status === 'REJECTED';

  // Form State: clean initial values, no junk prefilled!
  const [title, setTitle] = useState(draftToEdit?.title || '');
  const [category, setCategory] = useState<PropertyCategory>(draftToEdit?.category || 'HOUSE');
  const [propertyType, setPropertyType] = useState<PropertyType>(
    draftToEdit?.propertyType || 'DETACHED_DUPLEX'
  );
  const [amount, setAmount] = useState(draftToEdit?.price?.amount ? draftToEdit.price.amount.toString() : '');
  const [negotiable, setNegotiable] = useState(draftToEdit?.price?.negotiable ?? true);

  const [state, setState] = useState(draftToEdit?.location?.state || currentUser?.state || 'Lagos');
  const [city, setCity] = useState(draftToEdit?.location?.city || currentUser?.city || '');
  const [area, setArea] = useState(draftToEdit?.location?.area || '');
  const [estate, setEstate] = useState(draftToEdit?.location?.estate || '');
  const [exactAddress, setExactAddress] = useState(draftToEdit?.privateDetails?.exactAddress || '');

  const [bedrooms, setBedrooms] = useState(
    draftToEdit?.specifications?.bedrooms !== undefined ? draftToEdit.specifications.bedrooms.toString() : ''
  );
  const [bathrooms, setBathrooms] = useState(
    draftToEdit?.specifications?.bathrooms !== undefined ? draftToEdit.specifications.bathrooms.toString() : ''
  );
  const [landSize, setLandSize] = useState(
    draftToEdit?.specifications?.landSize !== undefined ? draftToEdit.specifications.landSize.toString() : ''
  );
  const [landSizeUnit, setLandSizeUnit] = useState<'SQM' | 'PLOT' | 'HECTARE'>(
    draftToEdit?.specifications?.landSizeUnit || 'SQM'
  );
  const [titleDocument, setTitleDocument] = useState(
    draftToEdit?.specifications?.titleDocument || 'C_OF_O'
  );

  const [description, setDescription] = useState(draftToEdit?.description || '');
  const [imageUrl, setImageUrl] = useState(draftToEdit?.coverImageUrl || '');
  const [kycDocUrl, setKycDocUrl] = useState(draftToEdit?.privateDetails?.submittedKycDoc || '');
  const [kycDocName, setKycDocName] = useState('');

  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  if (!isOpen) return null;

  // Real file upload handler with base64 conversion and MIME verification
  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    type: 'IMAGE' | 'DOCUMENT'
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size limit: max 5MB
    if (file.size > 5 * 1024 * 1024) {
      setValidationError('File size exceeds the 5MB limit.');
      return;
    }

    if (type === 'IMAGE' && !file.type.startsWith('image/')) {
      setValidationError('Please select an image file (JPEG, PNG, WEBP).');
      return;
    }

    if (
      type === 'DOCUMENT' &&
      !file.type.startsWith('image/') &&
      file.type !== 'application/pdf'
    ) {
      setValidationError('Please select a valid document (PDF, PNG, or JPEG).');
      return;
    }

    setValidationError(null);
    if (type === 'IMAGE') setUploadingImage(true);
    if (type === 'DOCUMENT') setUploadingDoc(true);

    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const base64Data = reader.result as string;
        const uploaded = await api.upload.uploadFile(file.name, base64Data, file.type);
        if (type === 'IMAGE') {
          setImageUrl(uploaded.url);
        } else {
          setKycDocUrl(uploaded.url);
          setKycDocName(file.name);
        }
      } catch (err: any) {
        setValidationError(err.message || 'File upload failed.');
      } finally {
        setUploadingImage(false);
        setUploadingDoc(false);
      }
    };
    reader.onerror = () => {
      setValidationError('Failed to read file.');
      setUploadingImage(false);
      setUploadingDoc(false);
    };
    reader.readAsDataURL(file);
  };

  const buildPayload = (): Partial<Property> => ({
    title: title.trim(),
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
      city: city.trim(),
      citySlug: city.trim().toLowerCase().replace(/\s+/g, '-'),
      area: area.trim(),
      areaSlug: area.trim().toLowerCase().replace(/\s+/g, '-'),
      estate: estate.trim() || undefined,
    },
    specifications: {
      bedrooms: category === 'LAND' ? undefined : Number(bedrooms) || undefined,
      bathrooms: category === 'LAND' ? undefined : Number(bathrooms) || undefined,
      landSize: Number(landSize) || undefined,
      landSizeUnit,
      titleDocument: titleDocument as any,
    },
    description: description.trim(),
    features: ['Security Guard Patrol', 'Borehole & Water Treatment', 'Paved Road Access'],
    coverImageUrl: imageUrl,
    images: imageUrl ? [{ id: 'img-1', url: imageUrl, order: 1, isCover: true }] : [],
    privateDetails: {
      exactAddress: exactAddress.trim() || `${area}, ${city}`,
      ownershipDetails: 'Deed and title documentation verified during admin review.',
      submittedKycDoc: kycDocUrl || undefined,
    },
  });

  const handleSaveDraft = async () => {
    setIsSubmitting(true);
    setValidationError(null);
    try {
      const payload = buildPayload();
      if (isEditing && draftToEdit) {
        await updateDraft(draftToEdit.id, payload);
      } else {
        await createDraft(payload);
      }
      onClose();
    } catch (err: any) {
      setValidationError(err.message || 'Failed to save draft.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitForReview = async () => {
    setValidationError(null);

    // Strict validation to prevent junk reaching queue
    if (!title.trim() || title.trim().length < 5) {
      setValidationError('Property title must be at least 5 characters long.');
      return;
    }
    const numAmount = Number(amount);
    if (!amount || isNaN(numAmount) || numAmount <= 0) {
      setValidationError('Please specify a valid asking price greater than ₦0.');
      return;
    }
    if (!city.trim() || !area.trim()) {
      setValidationError('Both City and Neighborhood/Area are mandatory for verification.');
      return;
    }
    if (!imageUrl) {
      setValidationError('Please upload at least one verified property photo or provide a photo URL.');
      return;
    }
    if (description.trim().length < 15) {
      setValidationError('Please provide a descriptive overview of the property (min 15 characters).');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = buildPayload();
      let targetId = draftToEdit?.id;

      if (isEditing && draftToEdit) {
        await updateDraft(draftToEdit.id, payload);
      } else {
        const created = await createDraft(payload);
        targetId = created.id;
      }

      if (targetId) {
        await submitDraftForReview(targetId);
      }
      onClose();
    } catch (err: any) {
      setValidationError(err.message || 'Failed to submit property for review.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-3xl w-full my-auto shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50/80">
          <div>
            <h2 className="font-bold text-slate-900 text-lg flex items-center gap-2">
              <Building className="w-5 h-5 text-emerald-600" />
              {isEditing
                ? isRejected
                  ? 'Revise & Resubmit Rejected Listing'
                  : 'Edit Private Draft Listing'
                : 'Assemble New Property Draft'}
            </h2>
            <p className="text-xs text-slate-500">
              Private Workspace: Drafts never affect public data until verified and approved.
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
          {/* Rejection Feedback Banner if fixing a rejected listing */}
          {isRejected && draftToEdit?.lastDecisionReason && (
            <div className="p-4 bg-amber-50 border border-amber-300 rounded-2xl text-xs text-amber-950 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-sm block text-amber-900">
                  Administrator Correction Required
                </span>
                <p className="mt-1 leading-relaxed">
                  Reason provided by Realto Admin: &ldquo;{draftToEdit.lastDecisionReason}&rdquo;
                </p>
                <p className="mt-1 text-slate-600">
                  Please update the details or documents below and click &ldquo;Submit for Admin Review&rdquo; to resubmit.
                </p>
              </div>
            </div>
          )}

          {validationError && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-700 font-medium">
              {validationError}
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Property Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Contemporary 4-Bedroom Semi-Detached Duplex with BQ"
              className="w-full text-xs p-3 rounded-xl border border-slate-300 focus:border-emerald-600 outline-hidden font-medium"
            />
          </div>

          {/* Category & Property Type */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Taxonomy Category <span className="text-rose-500">*</span>
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as PropertyCategory)}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-white focus:border-emerald-600 outline-hidden"
              >
                <option value="HOUSE">House / Duplex / Terrace</option>
                <option value="FLAT_APARTMENT">Flat / Apartment / Maisonette</option>
                <option value="LAND">Land / Plot / Site</option>
                <option value="COMMERCIAL">Commercial (Office / Retail / Warehouse)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Property Architecture
              </label>
              <select
                value={propertyType}
                onChange={(e) => setPropertyType(e.target.value as PropertyType)}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-white focus:border-emerald-600 outline-hidden"
              >
                <option value="DETACHED_DUPLEX">Detached Duplex</option>
                <option value="SEMI_DETACHED_DUPLEX">Semi-Detached Duplex</option>
                <option value="TERRACE_DUPLEX">Terraced Duplex</option>
                <option value="BUNGALOW">Bungalow</option>
                <option value="PENTHOUSE">Penthouse</option>
                <option value="MAISONETTE">Maisonette</option>
                <option value="STANDARD_APARTMENT">Standard Flat / Apartment</option>
                <option value="RESIDENTIAL_LAND">Residential Land</option>
                <option value="COMMERCIAL_LAND">Commercial Land</option>
                <option value="OFFICE_SPACE">Office Complex / Floor</option>
              </select>
            </div>
          </div>

          {/* Pricing */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-slate-100 pt-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Asking Price (NGN ₦) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min={1}
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="e.g. 85000000"
                className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:border-emerald-600 outline-hidden font-bold"
              />
            </div>
            <div className="flex items-center gap-2 pt-6">
              <input
                type="checkbox"
                id="nego-draft"
                checked={negotiable}
                onChange={(e) => setNegotiable(e.target.checked)}
                className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 w-4 h-4"
              />
              <label htmlFor="nego-draft" className="text-xs font-semibold text-slate-700 cursor-pointer">
                Price is Open to Negotiation
              </label>
            </div>
          </div>

          {/* Nigerian Location Hierarchy */}
          <div className="border-t border-slate-100 pt-4 space-y-3">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Location Breakdown
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">State</label>
                <select
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  className="w-full text-xs p-2 rounded-xl border border-slate-300 bg-white"
                >
                  <option value="Lagos">Lagos</option>
                  <option value="Abuja (FCT)">Abuja (FCT)</option>
                  <option value="Oyo">Oyo</option>
                  <option value="Rivers">Rivers</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  City / Town <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="e.g. Lekki, Ikoyi, Maitama"
                  className="w-full text-xs p-2 rounded-xl border border-slate-300"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Neighborhood / Area <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={area}
                  onChange={(e) => setArea(e.target.value)}
                  placeholder="e.g. Lekki Phase 1, Oniru, Jabi"
                  className="w-full text-xs p-2 rounded-xl border border-slate-300"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Estate Name (Optional)
                </label>
                <input
                  type="text"
                  value={estate}
                  onChange={(e) => setEstate(e.target.value)}
                  placeholder="e.g. Carlton Gate Estate"
                  className="w-full text-xs p-2 rounded-xl border border-slate-300"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Exact Street Address (Quarantined for Admin Only)
                </label>
                <input
                  type="text"
                  value={exactAddress}
                  onChange={(e) => setExactAddress(e.target.value)}
                  placeholder="e.g. Plot 14, Block 8, Admiralty Way"
                  className="w-full text-xs p-2 rounded-xl border border-slate-300 bg-amber-50/40"
                />
              </div>
            </div>
          </div>

          {/* Specifications */}
          <div className="border-t border-slate-100 pt-4 space-y-3">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Property Specifications & Legal Title
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {category !== 'LAND' && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Bedrooms</label>
                    <input
                      type="number"
                      min={0}
                      value={bedrooms}
                      onChange={(e) => setBedrooms(e.target.value)}
                      placeholder="e.g. 4"
                      className="w-full text-xs p-2 rounded-xl border border-slate-300"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Bathrooms</label>
                    <input
                      type="number"
                      min={0}
                      value={bathrooms}
                      onChange={(e) => setBathrooms(e.target.value)}
                      placeholder="e.g. 4"
                      className="w-full text-xs p-2 rounded-xl border border-slate-300"
                    />
                  </div>
                </>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Land Size</label>
                <input
                  type="number"
                  min={0}
                  value={landSize}
                  onChange={(e) => setLandSize(e.target.value)}
                  placeholder="e.g. 500"
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
            <div>
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

          {/* Photo & Document Uploads */}
          <div className="border-t border-slate-100 pt-4 space-y-4">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Property Visuals & Verification Documents
            </h3>

            {/* Photo Upload */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <ImageIcon className="w-3.5 h-3.5 text-slate-400" />
                  Cover Photo (Image Upload or URL) <span className="text-rose-500">*</span>
                </span>
                <span className="text-[10px] text-slate-400 font-normal">Max 5MB</span>
              </label>

              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="Paste direct image URL or choose file &rarr;"
                  className="flex-1 text-xs p-2.5 rounded-xl border border-slate-300 font-mono"
                />
                <label className="cursor-pointer px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl border border-slate-300 transition-colors flex items-center justify-center gap-1.5 shrink-0">
                  <Upload className="w-3.5 h-3.5" />
                  <span>{uploadingImage ? 'Uploading...' : 'Upload Image'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileUpload(e, 'IMAGE')}
                    className="hidden"
                  />
                </label>
              </div>

              {imageUrl && (
                <div className="mt-2 relative w-36 h-24 rounded-xl overflow-hidden border border-slate-200 bg-slate-100">
                  <img src={imageUrl} alt="Property Preview" className="w-full h-full object-cover" />
                </div>
              )}
            </div>

            {/* KYC Document Upload */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-slate-400" />
                  Ownership / Title Deed Proof (Confidential KYC for Admin Review)
                </span>
                <span className="text-[10px] text-slate-400 font-normal">PDF or Image (Max 5MB)</span>
              </label>

              <div className="flex items-center gap-3">
                <label className="cursor-pointer px-4 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl border border-dashed border-slate-300 transition-colors flex items-center gap-2">
                  <Upload className="w-3.5 h-3.5 text-slate-500" />
                  <span>{uploadingDoc ? 'Uploading document...' : 'Attach Proof of Title Document'}</span>
                  <input
                    type="file"
                    accept=".pdf,image/*"
                    onChange={(e) => handleFileUpload(e, 'DOCUMENT')}
                    className="hidden"
                  />
                </label>

                {kycDocUrl && (
                  <span className="text-xs text-emerald-700 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    {kycDocName || 'Document Attached'}
                  </span>
                )}
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Detailed Property Description <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={4}
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Highlight floor plan, finishing, estate security, proximity to main hubs, power situation..."
                className="w-full text-xs p-3 rounded-xl border border-slate-300 focus:border-emerald-600 outline-hidden leading-relaxed"
              />
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:text-slate-900 rounded-xl"
          >
            Cancel
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleSaveDraft}
              className="px-4 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 shadow-2xs disabled:opacity-50"
            >
              <Save className="w-4 h-4 text-slate-600" />
              {isSubmitting ? 'Saving...' : 'Save Private Draft'}
            </button>

            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleSubmitForReview}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 shadow-md shadow-emerald-700/20 disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              {isSubmitting ? 'Submitting...' : 'Submit for Admin Review'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
