import { UserRole } from './roles';

export type ThreadKind = 'ENQUIRY' | 'SUPPORT';
export type ThreadStatus = 'NEW' | 'OPEN' | 'IN_PROGRESS' | 'CLOSED';

export interface Message {
  id: string;
  threadId: string;
  senderId: string;
  senderName: string;
  senderRole: UserRole;
  body: string;
  createdAt: string;
}

export interface Thread {
  id: string;
  kind: ThreadKind;
  userId: string;
  userName: string;
  userEmail: string;
  userPhone: string;
  userRole: UserRole;
  propertyId?: string;
  propertyTitle?: string;
  status: ThreadStatus;
  unreadForAdmin: boolean;
  unreadForUser: boolean;
  lastMessageAt: string;
  lastMessageSnippet: string;
  messages: Message[];
  createdAt: string;
  updatedAt: string;
}
