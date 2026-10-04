import { UserRole } from './roles';

export type ChangeRequestType =
  | 'ACCOUNT_REGISTRATION'
  | 'PROFILE_EDIT'
  | 'PROPERTY_SUBMIT'
  | 'PROPERTY_EDIT'
  | 'PROPERTY_DELETE'
  | 'ROLE_CHANGE'
  | 'ACCOUNT_DELETION';

export type ChangeRequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'WITHDRAWN';

export interface ChangeRequest {
  id: string;
  type: ChangeRequestType;
  targetType: 'USER' | 'DEVELOPER' | 'PROPERTY';
  targetId: string;
  targetTitle?: string;
  requestedBy: string; // uid
  requesterName: string;
  requesterRole: UserRole;
  proposedData: Record<string, any>;
  previousData: Record<string, any>;
  baseVersion: number;
  status: ChangeRequestStatus;
  decisionBy?: string; // Admin uid
  decisionAt?: string;
  decisionReason?: string; // Mandatory on REJECTED
  createdAt: string;
  updatedAt: string;
}
