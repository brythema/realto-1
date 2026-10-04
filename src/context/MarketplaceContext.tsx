import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { Property, PropertyCategory } from '../types/property';
import { Developer } from '../types/developer';
import { ChangeRequest } from '../types/change-request';
import { Thread, Message } from '../types/thread';
import { Notification, AuditLog } from '../types/notification';
import { useAuth } from './AuthContext';
import {
  SEED_PROPERTIES,
  SEED_DEVELOPERS,
  SEED_CHANGE_REQUESTS,
  SEED_THREADS,
  SEED_NOTIFICATIONS,
  SEED_AUDIT_LOGS,
} from '../data/seedData';

interface MarketplaceContextType {
  // Properties
  properties: Property[];
  publicProperties: Property[]; // Approved, live, available, owner active, not deleted
  myProperties: Property[]; // Current user's properties
  myDrafts: Property[]; // Current user's private drafts
  myPendingReview: Property[]; // Under review
  myLiveProperties: Property[]; // Approved live
  
  // Developers & Developer Spaces
  developers: Developer[];
  getDeveloperBySlug: (slug: string) => Developer | undefined;
  getDeveloperLiveProperties: (developerId: string) => Property[];

  // Private Draft Actions
  createDraft: (draft: Partial<Property>) => Property;
  updateDraft: (id: string, updates: Partial<Property>) => void;
  deleteDraft: (id: string) => void;
  submitDraftForReview: (id: string) => void;

  // Live Property Actions
  requestPropertyEdit: (id: string, proposedData: Record<string, any>) => void;
  requestPropertyDelete: (id: string, reason?: string) => void;

  // Change Requests (Admin & User)
  changeRequests: ChangeRequest[];
  pendingChangeRequests: ChangeRequest[];
  myChangeRequests: ChangeRequest[];
  approveChangeRequest: (requestId: string) => void;
  rejectChangeRequest: (requestId: string, reason: string) => void;

  // Admin Direct Governance
  suspendUserAccount: (userId: string, reason: string) => void;
  reactivateUserAccount: (userId: string) => void;
  adminTogglePropertyVisibility: (propertyId: string, isPublic: boolean) => void;
  adminSetPropertyAvailability: (propertyId: string, availability: 'AVAILABLE' | 'UNDER_OFFER' | 'SOLD') => void;

  // Inquiries, WhatsApp & Support
  threads: Thread[];
  myThreads: Thread[];
  adminThreads: Thread[];
  createEnquiryThread: (propertyId: string, messageBody: string) => { thread: Thread; whatsappUrl: string };
  createSupportThread: (messageBody: string) => Thread;
  sendMessage: (threadId: string, body: string) => void;
  closeThread: (threadId: string) => void;
  requestMarkSold: (propertyId: string) => void;

  // Cart / Saved Properties
  savedPropertyIds: string[];
  savedProperties: Property[];
  toggleSaveProperty: (propertyId: string) => void;
  isSaved: (propertyId: string) => boolean;

  // Notifications & Audit Logs
  notifications: Notification[];
  myNotifications: Notification[];
  markNotificationAsRead: (notificationId: string) => void;
  auditLogs: AuditLog[];
}

const MarketplaceContext = createContext<MarketplaceContextType | undefined>(undefined);

const REALTO_WHATSAPP_NUMBER = '2348007325866'; // +234 800 REALTO NG

export const MarketplaceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, currentRole, updateProfile, updateUserStatus, users } = useAuth();

  // Storage initialization
  const [properties, setProperties] = useState<Property[]>(() => {
    const saved = localStorage.getItem('realto_properties');
    return saved ? JSON.parse(saved) : SEED_PROPERTIES;
  });

  const [developers, setDevelopers] = useState<Developer[]>(() => {
    const saved = localStorage.getItem('realto_developers');
    return saved ? JSON.parse(saved) : SEED_DEVELOPERS;
  });

  const [changeRequests, setChangeRequests] = useState<ChangeRequest[]>(() => {
    const saved = localStorage.getItem('realto_change_requests');
    return saved ? JSON.parse(saved) : SEED_CHANGE_REQUESTS;
  });

  const [threads, setThreads] = useState<Thread[]>(() => {
    const saved = localStorage.getItem('realto_threads');
    return saved ? JSON.parse(saved) : SEED_THREADS;
  });

  const [notifications, setNotifications] = useState<Notification[]>(() => {
    const saved = localStorage.getItem('realto_notifications');
    return saved ? JSON.parse(saved) : SEED_NOTIFICATIONS;
  });

  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => {
    const saved = localStorage.getItem('realto_audit_logs');
    return saved ? JSON.parse(saved) : SEED_AUDIT_LOGS;
  });

  const [savedPropertyIds, setSavedPropertyIds] = useState<string[]>(() => {
    const saved = localStorage.getItem('realto_saved_properties');
    return saved ? JSON.parse(saved) : ['RTL-00101'];
  });

  // Persist state
  useEffect(() => {
    localStorage.setItem('realto_properties', JSON.stringify(properties));
  }, [properties]);

  useEffect(() => {
    localStorage.setItem('realto_developers', JSON.stringify(developers));
  }, [developers]);

  useEffect(() => {
    localStorage.setItem('realto_change_requests', JSON.stringify(changeRequests));
  }, [changeRequests]);

  useEffect(() => {
    localStorage.setItem('realto_threads', JSON.stringify(threads));
  }, [threads]);

  useEffect(() => {
    localStorage.setItem('realto_notifications', JSON.stringify(notifications));
  }, [notifications]);

  useEffect(() => {
    localStorage.setItem('realto_audit_logs', JSON.stringify(auditLogs));
  }, [auditLogs]);

  useEffect(() => {
    localStorage.setItem('realto_saved_properties', JSON.stringify(savedPropertyIds));
  }, [savedPropertyIds]);

  // Dynamically compute live property counts for developers
  const enrichedDevelopers = useMemo(() => {
    return developers.map((dev) => {
      const liveCount = properties.filter(
        (p) => p.ownerRef.id === dev.developerId && p.status === 'LIVE' && p.isPublic && !p.isDeleted
      ).length;
      return {
        ...dev,
        livePropertiesCount: liveCount,
        hasDeveloperSpace: liveCount >= 2, // Developer Space enabled when >= 2 live properties!
      };
    });
  }, [developers, properties]);

  // Compute public properties (strict visibility matrix)
  const publicProperties = useMemo(() => {
    return properties.filter(
      (p) => p.status === 'LIVE' && p.availability === 'AVAILABLE' && p.isPublic && !p.isDeleted
    );
  }, [properties]);

  // Current user's properties
  const myProperties = useMemo(() => {
    if (!currentUser) return [];
    return properties.filter(
      (p) => p.submittedBy === currentUser.uid || (currentUser.developerId && p.ownerRef.id === currentUser.developerId)
    );
  }, [properties, currentUser]);

  const myDrafts = useMemo(() => {
    return myProperties.filter((p) => p.status === 'DRAFT' && !p.isDeleted);
  }, [myProperties]);

  const myPendingReview = useMemo(() => {
    return myProperties.filter((p) => p.status === 'PENDING_REVIEW' && !p.isDeleted);
  }, [myProperties]);

  const myLiveProperties = useMemo(() => {
    return myProperties.filter((p) => p.status === 'LIVE' && !p.isDeleted);
  }, [myProperties]);

  const pendingChangeRequests = useMemo(() => {
    return changeRequests.filter((cr) => cr.status === 'PENDING');
  }, [changeRequests]);

  const myChangeRequests = useMemo(() => {
    if (!currentUser) return [];
    return changeRequests.filter((cr) => cr.requestedBy === currentUser.uid);
  }, [changeRequests, currentUser]);

  const myNotifications = useMemo(() => {
    if (!currentUser) return [];
    return notifications.filter((n) => n.recipientId === currentUser.uid);
  }, [notifications, currentUser]);

  const myThreads = useMemo(() => {
    if (!currentUser) return [];
    return threads.filter((t) => t.userId === currentUser.uid);
  }, [threads, currentUser]);

  const adminThreads = useMemo(() => {
    return threads;
  }, [threads]);

  const savedProperties = useMemo(() => {
    return properties.filter((p) => savedPropertyIds.includes(p.id));
  }, [properties, savedPropertyIds]);

  // Developer helpers
  const getDeveloperBySlug = (slug: string) => {
    return enrichedDevelopers.find((d) => d.slug === slug);
  };

  const getDeveloperLiveProperties = (developerId: string) => {
    return properties.filter(
      (p) => p.ownerRef.id === developerId && p.status === 'LIVE' && p.isPublic && !p.isDeleted
    );
  };

  // --- PRIVATE DRAFT ACTIONS (No Change Request required!) ---
  const createDraft = (draftData: Partial<Property>): Property => {
    const id = `RTL-DRAFT-${Math.floor(1000 + Math.random() * 9000)}`;
    const now = new Date().toISOString();

    const isDeveloper = currentUser?.role === 'DEVELOPER';
    const ownerName = isDeveloper
      ? currentUser?.lastName || 'Developer Firm'
      : `${currentUser?.firstName || ''} ${currentUser?.lastName || ''}`.trim() || 'Private Seller';

    const newDraft: Property = {
      id,
      slug: (draftData.title || 'untitled-draft').toLowerCase().replace(/[^a-z0-9]+/g, '-') + `-${id.toLowerCase()}`,
      title: draftData.title || 'Untitled Property Draft',
      category: draftData.category || 'HOUSE',
      propertyType: draftData.propertyType || 'DETACHED_DUPLEX',
      price: draftData.price || { amount: 50000000, currency: 'NGN', negotiable: true },
      location: draftData.location || {
        state: currentUser?.state || 'Lagos',
        stateSlug: (currentUser?.state || 'lagos').toLowerCase().replace(/\s+/g, '-'),
        city: currentUser?.city || 'Lekki',
        citySlug: (currentUser?.city || 'lekki').toLowerCase().replace(/\s+/g, '-'),
        area: 'Lekki Phase 1',
        areaSlug: 'lekki-phase-1',
      },
      specifications: draftData.specifications || {
        bedrooms: 3,
        bathrooms: 3,
        toilets: 4,
        landSize: 450,
        landSizeUnit: 'SQM',
        titleDocument: 'C_OF_O',
      },
      description: draftData.description || 'Draft property description.',
      features: draftData.features || ['Security Post', 'Borehole Water'],
      images: draftData.images || [
        {
          id: `img-${Date.now()}`,
          url: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1000&auto=format&fit=crop&q=80',
          order: 1,
          isCover: true,
        },
      ],
      coverImageUrl:
        draftData.coverImageUrl ||
        draftData.images?.[0]?.url ||
        'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1000&auto=format&fit=crop&q=80',
      ownerRef: {
        type: isDeveloper ? 'DEVELOPER' : 'SELLER',
        id: isDeveloper ? (currentUser?.developerId || currentUser?.uid || '') : (currentUser?.uid || ''),
        ownerName,
        developerSlug: isDeveloper ? 'eko-prime-developments' : undefined,
        developerName: isDeveloper ? ownerName : undefined,
      },
      submittedBy: currentUser?.uid || 'anonymous',
      status: 'DRAFT', // Strictly private draft
      availability: 'AVAILABLE',
      isPublic: false,
      isDeleted: false,
      hasPendingChange: false,
      version: 1,
      createdAt: now,
      updatedAt: now,
      privateDetails: {
        exactAddress: draftData.privateDetails?.exactAddress || 'Private street address',
        ownershipDetails: draftData.privateDetails?.ownershipDetails || 'Private ownership details',
      },
    };

    setProperties((prev) => [newDraft, ...prev]);
    return newDraft;
  };

  const updateDraft = (id: string, updates: Partial<Property>) => {
    setProperties((prev) =>
      prev.map((p) => {
        if (p.id === id && p.status === 'DRAFT') {
          return {
            ...p,
            ...updates,
            updatedAt: new Date().toISOString(),
          };
        }
        return p;
      })
    );
  };

  const deleteDraft = (id: string) => {
    setProperties((prev) => prev.filter((p) => !(p.id === id && p.status === 'DRAFT')));
  };

  // --- SUBMIT DRAFT FOR ADMIN REVIEW ---
  const submitDraftForReview = (id: string) => {
    const prop = properties.find((p) => p.id === id);
    if (!prop) return;

    const requestId = `cr-sub-${Date.now()}`;
    const now = new Date().toISOString();

    const changeReq: ChangeRequest = {
      id: requestId,
      type: 'PROPERTY_SUBMIT',
      targetType: 'PROPERTY',
      targetId: prop.id,
      targetTitle: prop.title,
      requestedBy: currentUser?.uid || prop.submittedBy,
      requesterName: `${currentUser?.firstName || ''} ${currentUser?.lastName || ''}`.trim() || 'Property Owner',
      requesterRole: currentUser?.role || 'SELLER',
      proposedData: {
        status: 'LIVE',
        isPublic: true,
        title: prop.title,
        category: prop.category,
        price: prop.price,
        location: prop.location,
        specifications: prop.specifications,
        description: prop.description,
        features: prop.features,
      },
      previousData: {
        status: 'DRAFT',
        isPublic: false,
      },
      baseVersion: prop.version,
      status: 'PENDING',
      createdAt: now,
      updatedAt: now,
    };

    // Lock property into PENDING_REVIEW
    setProperties((prev) =>
      prev.map((p) =>
        p.id === id
          ? {
              ...p,
              status: 'PENDING_REVIEW',
              hasPendingChange: true,
              pendingChangeId: requestId,
              updatedAt: now,
            }
          : p
      )
    );

    // Add change request
    setChangeRequests((prev) => [changeReq, ...prev]);

    // Admin notification
    const notif: Notification = {
      id: `notif-${Date.now()}`,
      recipientId: 'admin-1',
      title: 'New Property Submission',
      message: `${changeReq.requesterName} submitted "${prop.title}" for review.`,
      linkTo: '/admin',
      read: false,
      createdAt: now,
    };
    setNotifications((prev) => [notif, ...prev]);
  };

  // --- LIVE PROPERTY MANAGEMENT (Requires Change Request!) ---
  const requestPropertyEdit = (id: string, proposedData: Record<string, any>) => {
    const prop = properties.find((p) => p.id === id);
    if (!prop) return;

    const requestId = `cr-edit-${Date.now()}`;
    const now = new Date().toISOString();

    const changeReq: ChangeRequest = {
      id: requestId,
      type: 'PROPERTY_EDIT',
      targetType: 'PROPERTY',
      targetId: prop.id,
      targetTitle: prop.title,
      requestedBy: currentUser?.uid || prop.submittedBy,
      requesterName: `${currentUser?.firstName || ''} ${currentUser?.lastName || ''}`.trim() || 'Property Owner',
      requesterRole: currentUser?.role || 'SELLER',
      proposedData,
      previousData: {
        price: prop.price,
        description: prop.description,
        title: prop.title,
        features: prop.features,
      },
      baseVersion: prop.version,
      status: 'PENDING',
      createdAt: now,
      updatedAt: now,
    };

    // Mark that property has a pending change (live data remains unchanged!)
    setProperties((prev) =>
      prev.map((p) =>
        p.id === id
          ? {
              ...p,
              hasPendingChange: true,
              pendingChangeId: requestId,
              updatedAt: now,
            }
          : p
      )
    );

    setChangeRequests((prev) => [changeReq, ...prev]);

    // Admin notification
    setNotifications((prev) => [
      {
        id: `notif-${Date.now()}`,
        recipientId: 'admin-1',
        title: 'Property Modification Request',
        message: `${changeReq.requesterName} submitted edits for "${prop.title}".`,
        linkTo: '/admin',
        read: false,
        createdAt: now,
      },
      ...prev,
    ]);
  };

  const requestPropertyDelete = (id: string, reason?: string) => {
    const prop = properties.find((p) => p.id === id);
    if (!prop) return;

    const requestId = `cr-del-${Date.now()}`;
    const now = new Date().toISOString();

    const changeReq: ChangeRequest = {
      id: requestId,
      type: 'PROPERTY_DELETE',
      targetType: 'PROPERTY',
      targetId: prop.id,
      targetTitle: prop.title,
      requestedBy: currentUser?.uid || prop.submittedBy,
      requesterName: `${currentUser?.firstName || ''} ${currentUser?.lastName || ''}`.trim() || 'Property Owner',
      requesterRole: currentUser?.role || 'SELLER',
      proposedData: { isDeleted: true, reason },
      previousData: { isDeleted: false },
      baseVersion: prop.version,
      status: 'PENDING',
      createdAt: now,
      updatedAt: now,
    };

    setProperties((prev) =>
      prev.map((p) => (p.id === id ? { ...p, hasPendingChange: true, pendingChangeId: requestId } : p))
    );

    setChangeRequests((prev) => [changeReq, ...prev]);
  };

  // --- ADMIN ATOMIC APPROVAL ENGINE ---
  const approveChangeRequest = (requestId: string) => {
    const req = changeRequests.find((cr) => cr.id === requestId);
    if (!req || req.status !== 'PENDING') return;

    const now = new Date().toISOString();

    if (req.type === 'PROPERTY_SUBMIT') {
      setProperties((prev) =>
        prev.map((p) => {
          if (p.id === req.targetId) {
            return {
              ...p,
              ...req.proposedData,
              status: 'LIVE',
              isPublic: true,
              hasPendingChange: false,
              pendingChangeId: undefined,
              approvedAt: now,
              updatedAt: now,
              version: p.version + 1,
            };
          }
          return p;
        })
      );
    } else if (req.type === 'PROPERTY_EDIT') {
      setProperties((prev) =>
        prev.map((p) => {
          if (p.id === req.targetId) {
            return {
              ...p,
              ...req.proposedData,
              hasPendingChange: false,
              pendingChangeId: undefined,
              updatedAt: now,
              version: p.version + 1,
            };
          }
          return p;
        })
      );
    } else if (req.type === 'PROPERTY_DELETE') {
      setProperties((prev) =>
        prev.map((p) => {
          if (p.id === req.targetId) {
            return {
              ...p,
              isDeleted: true,
              isPublic: false,
              hasPendingChange: false,
              deletedAt: now,
              deletedBy: 'ADMIN',
              updatedAt: now,
            };
          }
          return p;
        })
      );
    } else if (req.type === 'ACCOUNT_REGISTRATION') {
      // Approve user / developer
      updateUserStatus(req.targetId, 'ACTIVE');
      setDevelopers((prev) =>
        prev.map((dev) =>
          dev.userId === req.targetId
            ? { ...dev, verificationStatus: 'VERIFIED', verifiedAt: now }
            : dev
        )
      );
    }

    // Update Change Request status
    setChangeRequests((prev) =>
      prev.map((cr) =>
        cr.id === requestId
          ? {
              ...cr,
              status: 'APPROVED',
              decisionBy: currentUser?.uid || 'admin-1',
              decisionAt: now,
              updatedAt: now,
            }
          : cr
      )
    );

    // Audit Log
    setAuditLogs((prev) => [
      {
        id: `log-${Date.now()}`,
        actorId: currentUser?.uid || 'admin-1',
        actorName: `${currentUser?.firstName || 'Admin'} ${currentUser?.lastName || ''}`.trim(),
        actorRole: 'ADMIN',
        action: `APPROVE_${req.type}`,
        entityType: req.targetType,
        entityId: req.targetId,
        details: `Approved ${req.type} for target: ${req.targetTitle || req.targetId}.`,
        timestamp: now,
      },
      ...prev,
    ]);

    // In-app Notification to requester
    setNotifications((prev) => [
      {
        id: `notif-${Date.now()}`,
        recipientId: req.requestedBy,
        title: 'Request Approved!',
        message: `Your ${req.type.toLowerCase().replace('_', ' ')} request for "${req.targetTitle || req.targetId}" was approved by Admin.`,
        linkTo: '/dashboard',
        read: false,
        createdAt: now,
      },
      ...prev,
    ]);
  };

  // --- ADMIN REJECTION ---
  const rejectChangeRequest = (requestId: string, reason: string) => {
    const req = changeRequests.find((cr) => cr.id === requestId);
    if (!req || req.status !== 'PENDING') return;

    const now = new Date().toISOString();

    if (req.type === 'PROPERTY_SUBMIT') {
      setProperties((prev) =>
        prev.map((p) =>
          p.id === req.targetId
            ? {
                ...p,
                status: 'REJECTED',
                hasPendingChange: false,
                lastDecisionReason: reason,
                updatedAt: now,
              }
            : p
        )
      );
    } else {
      // Revert pending lock
      setProperties((prev) =>
        prev.map((p) =>
          p.id === req.targetId
            ? {
                ...p,
                hasPendingChange: false,
                lastDecisionReason: reason,
                updatedAt: now,
              }
            : p
        )
      );
    }

    setChangeRequests((prev) =>
      prev.map((cr) =>
        cr.id === requestId
          ? {
              ...cr,
              status: 'REJECTED',
              decisionReason: reason,
              decisionBy: currentUser?.uid || 'admin-1',
              decisionAt: now,
              updatedAt: now,
            }
          : cr
      )
    );

    setAuditLogs((prev) => [
      {
        id: `log-${Date.now()}`,
        actorId: currentUser?.uid || 'admin-1',
        actorName: `${currentUser?.firstName || 'Admin'} ${currentUser?.lastName || ''}`.trim(),
        actorRole: 'ADMIN',
        action: `REJECT_${req.type}`,
        entityType: req.targetType,
        entityId: req.targetId,
        details: `Rejected ${req.type} for target: ${req.targetTitle || req.targetId}. Reason: ${reason}`,
        timestamp: now,
      },
      ...prev,
    ]);

    setNotifications((prev) => [
      {
        id: `notif-${Date.now()}`,
        recipientId: req.requestedBy,
        title: 'Request Rejected',
        message: `Admin review update on "${req.targetTitle || req.targetId}": ${reason}`,
        linkTo: '/dashboard',
        read: false,
        createdAt: now,
      },
      ...prev,
    ]);
  };

  // --- ADMIN DIRECT GOVERNANCE ---
  const suspendUserAccount = (userId: string, reason: string) => {
    updateUserStatus(userId, 'SUSPENDED', reason);
    // Hide all listings from this user immediately!
    setProperties((prev) =>
      prev.map((p) => (p.submittedBy === userId ? { ...p, isPublic: false } : p))
    );

    setAuditLogs((prev) => [
      {
        id: `log-${Date.now()}`,
        actorId: currentUser?.uid || 'admin-1',
        actorName: 'Platform Admin',
        actorRole: 'ADMIN',
        action: 'SUSPEND_USER',
        entityType: 'USER',
        entityId: userId,
        details: `Account suspended. Reason: ${reason}. Listings hidden immediately.`,
        timestamp: new Date().toISOString(),
      },
      ...prev,
    ]);
  };

  const reactivateUserAccount = (userId: string) => {
    updateUserStatus(userId, 'ACTIVE');
    setProperties((prev) =>
      prev.map((p) =>
        p.submittedBy === userId && p.status === 'LIVE' && p.availability === 'AVAILABLE' && !p.isDeleted
          ? { ...p, isPublic: true }
          : p
      )
    );
  };

  const adminTogglePropertyVisibility = (propertyId: string, isPublic: boolean) => {
    setProperties((prev) =>
      prev.map((p) => (p.id === propertyId ? { ...p, isPublic, updatedAt: new Date().toISOString() } : p))
    );
  };

  const adminSetPropertyAvailability = (
    propertyId: string,
    availability: 'AVAILABLE' | 'UNDER_OFFER' | 'SOLD'
  ) => {
    const now = new Date().toISOString();
    setProperties((prev) =>
      prev.map((p) => {
        if (p.id === propertyId) {
          const isPublic = availability === 'AVAILABLE' && p.status === 'LIVE' && !p.isDeleted;
          return {
            ...p,
            availability,
            isPublic,
            updatedAt: now,
          };
        }
        return p;
      })
    );

    setAuditLogs((prev) => [
      {
        id: `log-${Date.now()}`,
        actorId: currentUser?.uid || 'admin-1',
        actorName: `${currentUser?.firstName || 'Admin'} ${currentUser?.lastName || ''}`.trim(),
        actorRole: 'ADMIN',
        action: 'SET_PROPERTY_AVAILABILITY',
        entityType: 'PROPERTY',
        entityId: propertyId,
        details: `Updated availability to ${availability}.`,
        timestamp: now,
      },
      ...prev,
    ]);
  };

  const closeThread = (threadId: string) => {
    const now = new Date().toISOString();
    setThreads((prev) =>
      prev.map((t) => (t.id === threadId ? { ...t, status: 'CLOSED', updatedAt: now } : t))
    );
  };

  const requestMarkSold = (propertyId: string) => {
    const prop = properties.find((p) => p.id === propertyId);
    if (!prop) return;

    const requestId = `cr-sold-${Date.now()}`;
    const now = new Date().toISOString();

    const changeReq: ChangeRequest = {
      id: requestId,
      type: 'PROPERTY_EDIT',
      targetType: 'PROPERTY',
      targetId: prop.id,
      targetTitle: `${prop.title} (Mark as Sold Request)`,
      requestedBy: currentUser?.uid || prop.submittedBy,
      requesterName: `${currentUser?.firstName || ''} ${currentUser?.lastName || ''}`.trim() || 'Property Owner',
      requesterRole: currentUser?.role || 'SELLER',
      proposedData: { availability: 'SOLD', isPublic: false },
      previousData: { availability: prop.availability, isPublic: prop.isPublic },
      baseVersion: prop.version,
      status: 'PENDING',
      createdAt: now,
      updatedAt: now,
    };

    setProperties((prev) =>
      prev.map((p) =>
        p.id === propertyId ? { ...p, hasPendingChange: true, pendingChangeId: requestId } : p
      )
    );

    setChangeRequests((prev) => [changeReq, ...prev]);

    setNotifications((prev) => [
      {
        id: `notif-${Date.now()}`,
        recipientId: 'admin-1',
        title: 'Listing Sold Status Request',
        message: `${changeReq.requesterName} requested to mark "${prop.title}" as SOLD.`,
        linkTo: '/admin',
        read: false,
        createdAt: now,
      },
      ...prev,
    ]);
  };

  // --- INQUIRIES & MESSAGING ---
  const createEnquiryThread = (propertyId: string, messageBody: string) => {
    const prop = properties.find((p) => p.id === propertyId);
    const threadId = `th-enq-${Date.now()}`;
    const now = new Date().toISOString();

    const buyerName = `${currentUser?.firstName || 'Prospective'} ${currentUser?.lastName || 'Buyer'}`.trim();
    const buyerPhone = currentUser?.phone || '+234 800 000 0000';
    const buyerEmail = currentUser?.email || 'visitor@realto.ng';

    const firstMsg: Message = {
      id: `msg-${Date.now()}`,
      threadId,
      senderId: currentUser?.uid || 'guest-user',
      senderName: buyerName,
      senderRole: currentUser?.role || 'BUYER',
      body: messageBody,
      createdAt: now,
    };

    const newThread: Thread = {
      id: threadId,
      kind: 'ENQUIRY',
      userId: currentUser?.uid || 'guest-user',
      userName: buyerName,
      userEmail: buyerEmail,
      userPhone: buyerPhone,
      userRole: currentUser?.role || 'BUYER',
      propertyId: prop?.id,
      propertyTitle: prop?.title || 'Nigerian Property Listing',
      status: 'NEW',
      unreadForAdmin: true,
      unreadForUser: false,
      lastMessageAt: now,
      lastMessageSnippet: messageBody.slice(0, 80) + '...',
      messages: [firstMsg],
      createdAt: now,
      updatedAt: now,
    };

    setThreads((prev) => [newThread, ...prev]);

    // Admin Notification
    setNotifications((prev) => [
      {
        id: `notif-${Date.now()}`,
        recipientId: 'admin-1',
        title: 'New Property Inquiry Received',
        message: `${buyerName} submitted an inspection inquiry on ${prop?.id} (${prop?.title}).`,
        linkTo: '/admin',
        read: false,
        createdAt: now,
      },
      ...prev,
    ]);

    // Pre-filled WhatsApp click-to-chat URL strictly to Realto Admin Concierge!
    const waText = encodeURIComponent(
      `Hello Realto Admin Concierge,\n\nI am interested in inspecting property ID: ${prop?.id} (${prop?.title}) located in ${prop?.location.area}, ${prop?.location.city}.\n\nMy Name: ${buyerName}\nMy Contact: ${buyerPhone}\nMy Inquiry: "${messageBody}"`
    );
    const whatsappUrl = `https://wa.me/${REALTO_WHATSAPP_NUMBER}?text=${waText}`;

    return { thread: newThread, whatsappUrl };
  };

  const createSupportThread = (messageBody: string) => {
    const threadId = `th-sup-${Date.now()}`;
    const now = new Date().toISOString();
    const senderName = `${currentUser?.firstName || 'User'} ${currentUser?.lastName || ''}`.trim();

    const firstMsg: Message = {
      id: `msg-${Date.now()}`,
      threadId,
      senderId: currentUser?.uid || 'user',
      senderName,
      senderRole: currentUser?.role || 'SELLER',
      body: messageBody,
      createdAt: now,
    };

    const newThread: Thread = {
      id: threadId,
      kind: 'SUPPORT',
      userId: currentUser?.uid || 'user',
      userName: senderName,
      userEmail: currentUser?.email || '',
      userPhone: currentUser?.phone || '',
      userRole: currentUser?.role || 'SELLER',
      status: 'OPEN',
      unreadForAdmin: true,
      unreadForUser: false,
      lastMessageAt: now,
      lastMessageSnippet: messageBody.slice(0, 80) + '...',
      messages: [firstMsg],
      createdAt: now,
      updatedAt: now,
    };

    setThreads((prev) => [newThread, ...prev]);
    return newThread;
  };

  const sendMessage = (threadId: string, body: string) => {
    const now = new Date().toISOString();
    const senderName = currentUser
      ? `${currentUser.firstName} ${currentUser.lastName}`.trim()
      : 'User';
    const senderRole = currentUser?.role || 'BUYER';
    const isAdmin = senderRole === 'ADMIN';

    const newMsg: Message = {
      id: `msg-${Date.now()}`,
      threadId,
      senderId: currentUser?.uid || 'user',
      senderName: isAdmin ? 'Realto Admin Concierge' : senderName,
      senderRole,
      body,
      createdAt: now,
    };

    setThreads((prev) =>
      prev.map((t) => {
        if (t.id === threadId) {
          return {
            ...t,
            lastMessageAt: now,
            lastMessageSnippet: body.slice(0, 80) + '...',
            unreadForAdmin: !isAdmin,
            unreadForUser: isAdmin,
            status: 'IN_PROGRESS',
            messages: [...t.messages, newMsg],
            updatedAt: now,
          };
        }
        return t;
      })
    );
  };

  // --- CART / SAVED PROPERTIES ---
  const toggleSaveProperty = (propertyId: string) => {
    setSavedPropertyIds((prev) =>
      prev.includes(propertyId) ? prev.filter((id) => id !== propertyId) : [...prev, propertyId]
    );
  };

  const isSaved = (propertyId: string) => {
    return savedPropertyIds.includes(propertyId);
  };

  const markNotificationAsRead = (notificationId: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
    );
  };

  return (
    <MarketplaceContext.Provider
      value={{
        properties,
        publicProperties,
        myProperties,
        myDrafts,
        myPendingReview,
        myLiveProperties,
        developers: enrichedDevelopers,
        getDeveloperBySlug,
        getDeveloperLiveProperties,
        createDraft,
        updateDraft,
        deleteDraft,
        submitDraftForReview,
        requestPropertyEdit,
        requestPropertyDelete,
        changeRequests,
        pendingChangeRequests,
        myChangeRequests,
        approveChangeRequest,
        rejectChangeRequest,
        suspendUserAccount,
        reactivateUserAccount,
        adminTogglePropertyVisibility,
        adminSetPropertyAvailability,
        closeThread,
        requestMarkSold,
        threads,
        myThreads,
        adminThreads,
        createEnquiryThread,
        createSupportThread,
        sendMessage,
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

export const useMarketplace = () => {
  const context = useContext(MarketplaceContext);
  if (!context) throw new Error('useMarketplace must be used within a MarketplaceProvider');
  return context;
};
