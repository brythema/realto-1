export type UserRole = 'PUBLIC' | 'BUYER' | 'SELLER' | 'DEVELOPER' | 'ADMIN';

export type AccountStatus =
  | 'PENDING_APPROVAL'
  | 'ACTIVE'
  | 'REJECTED'
  | 'SUSPENDED'
  | 'DEACTIVATED';

export interface UserProfile {
  uid: string;
  role: UserRole;
  accountStatus: AccountStatus;
  statusReason?: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  state?: string;
  city?: string;
  sellerRelationship?: 'OWNER' | 'REPRESENTATIVE';
  representationDetails?: string;
  developerId?: string;
  createdAt: string;
  updatedAt: string;
  kycDocumentUrl?: string;
  kycDocumentName?: string;
  kycStatus?: 'NOT_SUBMITTED' | 'SUBMITTED' | 'VERIFIED' | 'REJECTED';
}
