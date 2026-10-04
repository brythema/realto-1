import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { Property } from '../types/property';
import { Developer } from '../types/developer';
import { ChangeRequest } from '../types/change-request';
import { Thread } from '../types/thread';
import { Notification, AuditLog } from '../types/notification';
import { useAuth } from './AuthContext';
import { api } from '../services/api';

interface MarketplaceContextType {
  // Properties
  publicProperties: Property[];
  properties: Property[]; // Full properties for admin or owner
  myProperties: Property[];
  myDrafts: Property[];
  myPendingReview: Property[];
  myLiveProperties: Property[];
  isLoading: boolean;
  refreshData: () => Promise<void>;

  // Developers & Developer Spaces
  developers: Developer[];
  getDeveloperBySlug: (slug: string) => Developer | undefined;
  getDeveloperLiveProperties: (developerId: string) => Property[];

  // Private Draft Actions
  createDraft: (draft: Partial<Property>) => Promise<Property>;
  updateDraft: (id: string, updates: Partial<Property>) => Promise<Property>;
  deleteDraft: (id: string) => Promise<void>;
  submitDraftForReview: (id: string) => Promise<void>;

  // Live Property Actions
  requestPropertyEdit: (id: string, proposedData: Record<string, any>) => Promise<void>;
  requestPropertyDelete: (id: string, reason?: string) => Promise<void>;
  requestMarkSold: (id: string) => Promise<void>;

  // Change Requests (Admin & User)
  changeRequests: ChangeRequest[];
  pendingChangeRequests: ChangeRequest[];
  myChangeRequests: ChangeRequest[];
  approveChangeRequest: (requestId: string) => Promise<void>;
  rejectChangeRequest: (requestId: string, reason: string) => Promise<void>;

  // Admin Direct Governance
  suspendUserAccount: (userId: string, reason: string) => Promise<void>;
  reactivateUserAccount: (userId: string) => Promise<void>;
  adminTogglePropertyVisibility: (propertyId: string, isPublic: boolean, reason: string) => Promise<void>;
  adminSetPropertyAvailability: (propertyId: string, availability: 'AVAILABLE' | 'UNDER_OFFER' | 'SOLD') => Promise<void>;

  // Inquiries, WhatsApp & Support
  threads: Thread[];
  myThreads: Thread[];
  adminThreads: Thread[];
  createEnquiryThread: (propertyId: string, messageBody: string) => Promise<{ thread: Thread; whatsappUrl: string }>;
  sendMessage: (threadId: string, body: string) => Promise<void>;
  closeThread: (threadId: string) => Promise<void>;

  // Cart / Saved Properties
  savedPropertyIds: string[];
  savedProperties: Property[];
  toggleSaveProperty: (propertyId: string) => Promise<void>;
  isSaved: (propertyId: string) => boolean;

  // Notifications & Audit Logs
  notifications: Notification[];
  myNotifications: Notification[];
  markNotificationAsRead: (notificationId: string) => Promise<void>;
  auditLogs: AuditLog[];
}

const MarketplaceContext = createContext<MarketplaceContextType | undefined>(undefined);

export const MarketplaceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, currentRole, isAuthenticated } = useAuth();

  const [publicProperties, setPublicProperties] = useState<Property[]>([]);
  const [myProperties, setMyProperties] = useState<Property[]>([]);
  const [adminProperties, setAdminProperties] = useState<Property[]>([]);
  const [developers, setDevelopers] = useState<Developer[]>([]);
  const [changeRequests, setChangeRequests] = useState<ChangeRequest[]>([]);
  const [threads, setThreads] = useState<Thread[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [savedPropertyIds, setSavedPropertyIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refreshData = useCallback(async () => {
    try {
      // 1. Fetch public properties
      const pubRes = await api.properties.getPublic({ limit: 100 });
      setPublicProperties(pubRes.data);

      // 2. Fetch developers
      const devs = await api.developers.getAll();
      setDevelopers(devs);

      // 3. User-specific data
      if (isAuthenticated && currentUser) {
        // My properties (drafts, pending, live)
        if (currentUser.role === 'SELLER' || currentUser.role === 'DEVELOPER') {
          const myProps = await api.properties.getMyProperties();
          setMyProperties(myProps);
        }

        // Cart
        try {
          const cartRes = await api.cart.get();
          setSavedPropertyIds(cartRes.cartIds);
        } catch {
          setSavedPropertyIds([]);
        }

        // Threads
        const userThreads = await api.enquiries.getThreads();
        setThreads(userThreads);

        // Notifications
        const userNotifs = await api.notifications.getAll();
        setNotifications(userNotifs);

        // Admin-specific data
        if (currentUser.role === 'ADMIN') {
          const [crs, logs] = await Promise.all([
            api.admin.getChangeRequests(),
            api.admin.getAuditLogs(),
          ]);
          setChangeRequests(crs);
          setAuditLogs(logs);
          // For admin, myProperties contains all listings
          setAdminProperties(pubRes.data);
        }
      } else {
        setMyProperties([]);
        setSavedPropertyIds([]);
        setThreads([]);
        setNotifications([]);
        setChangeRequests([]);
        setAuditLogs([]);
      }
    } catch (err) {
      console.error('Error fetching marketplace data:', err);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, currentUser]);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  // Derived properties
  const properties = currentRole === 'ADMIN' ? (adminProperties.length ? adminProperties : publicProperties) : publicProperties;

  const myDrafts = useMemo(
    () => myProperties.filter((p) => p.status === 'DRAFT' || p.status === 'REJECTED'),
    [myProperties]
  );

  const myPendingReview = useMemo(
    () => myProperties.filter((p) => p.status === 'PENDING_REVIEW'),
    [myProperties]
  );

  const myLiveProperties = useMemo(
    () => myProperties.filter((p) => p.status === 'LIVE' && !p.isDeleted),
    [myProperties]
  );

  const savedProperties = useMemo(() => {
    return publicProperties.filter((p) => savedPropertyIds.includes(p.id));
  }, [publicProperties, savedPropertyIds]);

  const pendingChangeRequests = useMemo(
    () => changeRequests.filter((cr) => cr.status === 'PENDING'),
    [changeRequests]
  );

  const myChangeRequests = useMemo(
    () => (currentUser ? changeRequests.filter((cr) => cr.requestedBy === currentUser.uid) : []),
    [changeRequests, currentUser]
  );

  const myThreads = useMemo(() => {
    if (!currentUser) return [];
    return threads.filter((t) => t.userId === currentUser.uid);
  }, [threads, currentUser]);

  const adminThreads = useMemo(() => {
    if (currentRole !== 'ADMIN') return [];
    return threads;
  }, [threads, currentRole]);

  const myNotifications = useMemo(() => {
    if (!currentUser) return [];
    return notifications.filter((n) => n.recipientId === currentUser.uid);
  }, [notifications, currentUser]);

  const getDeveloperBySlug = (slug: string) => {
    return developers.find((d) => d.slug === slug);
  };

  const getDeveloperLiveProperties = (developerId: string) => {
    return publicProperties.filter(
      (p) => p.ownerRef.id === developerId && p.status === 'LIVE' && p.isPublic && !p.isDeleted
    );
  };

  // --- ACTIONS ---

  const createDraft = async (draftData: Partial<Property>): Promise<Property> => {
    const created = await api.properties.createDraft(draftData);
    setMyProperties((prev) => [created, ...prev]);
    return created;
  };

  const updateDraft = async (id: string, updates: Partial<Property>): Promise<Property> => {
    const updated = await api.properties.updateDraft(id, updates);
    setMyProperties((prev) => prev.map((p) => (p.id === id ? updated : p)));
    return updated;
  };

  const deleteDraft = async (id: string): Promise<void> => {
    await api.properties.deleteDraft(id);
    setMyProperties((prev) => prev.filter((p) => p.id !== id));
  };

  const submitDraftForReview = async (id: string): Promise<void> => {
    await api.properties.submit(id);
    await refreshData();
  };

  const requestPropertyEdit = async (id: string, proposedData: Record<string, any>): Promise<void> => {
    await api.properties.requestEdit(id, proposedData);
    await refreshData();
  };

  const requestPropertyDelete = async (id: string, reason?: string): Promise<void> => {
    await api.properties.requestDelete(id, reason);
    await refreshData();
  };

  const requestMarkSold = async (id: string): Promise<void> => {
    await api.properties.requestMarkSold(id);
    await refreshData();
  };

  const approveChangeRequest = async (requestId: string): Promise<void> => {
    await api.admin.approveChangeRequest(requestId);
    await refreshData();
  };

  const rejectChangeRequest = async (requestId: string, reason: string): Promise<void> => {
    await api.admin.rejectChangeRequest(requestId, reason);
    await refreshData();
  };

  const suspendUserAccount = async (userId: string, reason: string): Promise<void> => {
    await api.admin.suspendUser(userId, reason);
    await refreshData();
  };

  const reactivateUserAccount = async (userId: string): Promise<void> => {
    await api.admin.reactivateUser(userId);
    await refreshData();
  };

  const adminTogglePropertyVisibility = async (propertyId: string, isPublic: boolean, reason: string): Promise<void> => {
    await api.admin.togglePropertyVisibility(propertyId, isPublic, reason);
    await refreshData();
  };

  const adminSetPropertyAvailability = async (
    propertyId: string,
    availability: 'AVAILABLE' | 'UNDER_OFFER' | 'SOLD'
  ): Promise<void> => {
    await api.admin.setPropertyAvailability(propertyId, availability);
    await refreshData();
  };

  const createEnquiryThread = async (
    propertyId: string,
    messageBody: string
  ): Promise<{ thread: Thread; whatsappUrl: string }> => {
    const res = await api.enquiries.submit(propertyId, messageBody);
    setThreads((prev) => [res.thread, ...prev]);
    return res;
  };

  const sendMessage = async (threadId: string, body: string): Promise<void> => {
    const updated = await api.enquiries.sendMessage(threadId, body);
    setThreads((prev) => prev.map((t) => (t.id === threadId ? updated : t)));
  };

  const closeThread = async (threadId: string): Promise<void> => {
    const updated = await api.enquiries.closeThread(threadId);
    setThreads((prev) => prev.map((t) => (t.id === threadId ? updated : t)));
  };

  const toggleSaveProperty = async (propertyId: string): Promise<void> => {
    if (!isAuthenticated) return;
    const res = await api.cart.toggle(propertyId);
    setSavedPropertyIds(res.cartIds);
  };

  const isSaved = (propertyId: string): boolean => {
    return savedPropertyIds.includes(propertyId);
  };

  const markNotificationAsRead = async (notificationId: string): Promise<void> => {
    await api.notifications.markRead(notificationId);
    setNotifications((prev) =>
      prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
    );
  };

  return (
    <MarketplaceContext.Provider
      value={{
        publicProperties,
        properties,
        myProperties,
        myDrafts,
        myPendingReview,
        myLiveProperties,
        isLoading,
        refreshData,
        developers,
        getDeveloperBySlug,
        getDeveloperLiveProperties,
        createDraft,
        updateDraft,
        deleteDraft,
        submitDraftForReview,
        requestPropertyEdit,
        requestPropertyDelete,
        requestMarkSold,
        changeRequests,
        pendingChangeRequests,
        myChangeRequests,
        approveChangeRequest,
        rejectChangeRequest,
        suspendUserAccount,
        reactivateUserAccount,
        adminTogglePropertyVisibility,
        adminSetPropertyAvailability,
        threads,
        myThreads,
        adminThreads,
        createEnquiryThread,
        sendMessage,
        closeThread,
        savedPropertyIds,
        savedProperties,
        toggleSaveProperty,
        isSaved,
        notifications,
        myNotifications,
        markNotificationAsRead,
        auditLogs,
      }}
    >
      {children}
    </MarketplaceContext.Provider>
  );
};

export const useMarketplace = (): MarketplaceContextType => {
  const context = useContext(MarketplaceContext);
  if (!context) {
    throw new Error('useMarketplace must be used within a MarketplaceProvider');
  }
  return context;
};
