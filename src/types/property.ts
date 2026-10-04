export type PropertyCategory = 'HOUSE' | 'FLAT_APARTMENT' | 'LAND' | 'COMMERCIAL';

export type PropertyStatus =
  | 'DRAFT'
  | 'PENDING_REVIEW'
  | 'LIVE'
  | 'REJECTED'
  | 'UNPUBLISHED';

export type PropertyAvailability = 'AVAILABLE' | 'UNDER_OFFER' | 'SOLD';

export interface PropertyImage {
  id: string;
  url: string;
  order: number;
  isCover: boolean;
  caption?: string;
}

export interface PropertyLocation {
  state: string;
  stateSlug: string;
  city: string;
  citySlug: string;
  area: string;
  areaSlug: string;
  estate?: string;
  // Note: exact street address is private and only stored in private records
}

export interface PropertySpecifications {
  bedrooms?: number;
  bathrooms?: number;
  toilets?: number;
  livingRooms?: number;
  parkingSpaces?: number;
  landSize?: number;
  landSizeUnit?: 'SQM' | 'PLOT' | 'HECTARE';
  buildingSize?: number;
  buildingSizeUnit?: 'SQM';
  floors?: number;
  bq?: boolean;
  titleDocument?:
    | 'C_OF_O'
    | 'GOVERNORS_CONSENT'
    | 'GAZETTE'
    | 'SURVEY_PLAN'
    | 'DEED_OF_ASSIGNMENT'
    | 'COURT_JUDGEMENT'
    | 'EXCISION';
  topography?: 'DRY' | 'WATERLOGGED' | 'SANDFILLED';
  furnishing?: 'FURNISHED' | 'SEMI_FURNISHED' | 'UNFURNISHED';
}

export interface Property {
  id: string; // e.g. RTL-00104
  slug: string;
  title: string;
  category: PropertyCategory;
  propertyType: string; // e.g. DETACHED_DUPLEX, MINI_FLAT, RESIDENTIAL_LAND
  price: {
    amount: number;
    currency: 'NGN';
    negotiable: boolean;
  };
  location: PropertyLocation;
  specifications: PropertySpecifications;
  description: string;
  features: string[];
  images: PropertyImage[];
  coverImageUrl: string;

  // Ownership & Governance Controls
  ownerRef: {
    type: 'SELLER' | 'DEVELOPER';
    id: string; // owner uid or developerId
    ownerName: string; // displayed only to Admin or on Developer Space if developer
    developerSlug?: string;
    developerName?: string;
  };
  submittedBy: string; // uid of user
  status: PropertyStatus;
  availability: PropertyAvailability;
  isPublic: boolean; // Computed: owner is ACTIVE && status === 'LIVE' && availability === 'AVAILABLE' && !isDeleted
  isDeleted: boolean; // Soft delete flag
  deletedAt?: string;
  deletedBy?: string;
  hasPendingChange: boolean;
  pendingChangeId?: string;
  lastDecisionReason?: string;
  approvedAt?: string;
  createdAt: string;
  updatedAt: string;
  version: number;

  // Private data visible only to owner and Admin
  privateDetails?: {
    exactAddress: string;
    ownershipDetails: string;
    internalAdminNotes?: string;
  };
}
