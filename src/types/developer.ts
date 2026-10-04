export interface Developer {
  developerId: string;
  userId: string;
  slug: string;
  companyName: string;
  cacNumber: string; // Corporate Affairs Commission registration
  logoUrl?: string;
  bannerUrl?: string;
  companyAddress: string; // Private
  contactPerson: string; // Private
  phone: string; // Private
  email: string; // Private
  website?: string; // Private
  businessOverview: string; // Publicly visible on Developer Space
  livePropertiesCount: number; // Maintained counter
  hasDeveloperSpace: boolean; // Computed: livePropertiesCount >= 2
  verificationStatus: 'PENDING' | 'VERIFIED' | 'REJECTED';
  verifiedAt?: string;
  createdAt: string;
  updatedAt: string;
}
