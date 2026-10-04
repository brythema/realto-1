import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { UserProfile, UserRole, AccountStatus } from '../types/roles';
import { Property, PropertyCategory } from '../types/property';
import { Developer } from '../types/developer';
import { ChangeRequest, ChangeRequestType } from '../types/change-request';
import { Thread, Message } from '../types/thread';
import { Notification, AuditLog } from '../types/notification';
import {
  SEED_PROPERTIES,
  SEED_DEVELOPERS,
  SEED_USERS,
  SEED_CHANGE_REQUESTS,
  SEED_THREADS,
  SEED_NOTIFICATIONS,
  SEED_AUDIT_LOGS,
} from '../data/seedData';

// User with password hash for server-side auth
export interface UserRecord extends UserProfile {
  passwordHash: string;
  salt: string;
  cart: string[];
}

export interface RealtoDatabase {
  users: UserRecord[];
  properties: Property[];
  developers: Developer[];
  changeRequests: ChangeRequest[];
  threads: Thread[];
  notifications: Notification[];
  auditLogs: AuditLog[];
  counters: {
    property: number;
    changeRequest: number;
    thread: number;
    message: number;
    notification: number;
    auditLog: number;
    user: number;
  };
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'realto-db.json');

// Helper to hash password
export function hashPassword(password: string, salt: string): string {
  return crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha256').toString('hex');
}

export function generateSalt(): string {
  return crypto.randomBytes(16).toString('hex');
}

function initializeSeedDatabase(): RealtoDatabase {
  const defaultSalt = 'realto-secure-seed-salt-2026';
  
  // Create users with predictable, secure passwords
  // Admin: AdminPass2026!
  // Developers & Sellers: PartnerPass2026!
  // Buyers: BuyerPass2026!
  const usersWithAuth: UserRecord[] = SEED_USERS.map((u) => {
    let plainPass = 'PartnerPass2026!';
    if (u.role === 'ADMIN') plainPass = 'AdminPass2026!';
    if (u.role === 'BUYER') plainPass = 'BuyerPass2026!';
    
    return {
      ...u,
      salt: defaultSalt,
      passwordHash: hashPassword(plainPass, defaultSalt),
      cart: u.uid === 'buyer-1' ? ['RTL-00101'] : [],
    };
  });

  return {
    users: usersWithAuth,
    properties: JSON.parse(JSON.stringify(SEED_PROPERTIES)),
    developers: JSON.parse(JSON.stringify(SEED_DEVELOPERS)),
    changeRequests: JSON.parse(JSON.stringify(SEED_CHANGE_REQUESTS)),
    threads: JSON.parse(JSON.stringify(SEED_THREADS)),
    notifications: JSON.parse(JSON.stringify(SEED_NOTIFICATIONS)),
    auditLogs: JSON.parse(JSON.stringify(SEED_AUDIT_LOGS)),
    counters: {
      property: 108,
      changeRequest: 105,
      thread: 104,
      message: 110,
      notification: 110,
      auditLog: 110,
      user: 110,
    },
  };
}

class Store {
  private db: RealtoDatabase;

  constructor() {
    this.db = this.loadDatabase();
  }

  private loadDatabase(): RealtoDatabase {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        if (parsed.users && parsed.properties) {
          return parsed;
        }
      }
    } catch (err) {
      console.error('Failed to load database from disk, falling back to seed:', err);
    }
    const initial = initializeSeedDatabase();
    this.saveDatabase(initial);
    return initial;
  }

  private saveDatabase(data?: RealtoDatabase): void {
    const toSave = data || this.db;
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      const tmpFile = `${DB_FILE}.tmp`;
      fs.writeFileSync(tmpFile, JSON.stringify(toSave, null, 2), 'utf-8');
      fs.renameSync(tmpFile, DB_FILE);
    } catch (err) {
      console.error('Failed to save database to disk:', err);
    }
  }

  // --- ID GENERATION (Strict RTL- counter format) ---
  public nextPropertyId(): string {
    this.db.counters.property += 1;
    const id = `RTL-${String(this.db.counters.property).padStart(5, '0')}`;
    this.saveDatabase();
    return id;
  }

  public nextChangeRequestId(): string {
    this.db.counters.changeRequest += 1;
    const id = `CR-${String(this.db.counters.changeRequest).padStart(5, '0')}`;
    this.saveDatabase();
    return id;
  }

  public nextThreadId(): string {
    this.db.counters.thread += 1;
    const id = `TH-${String(this.db.counters.thread).padStart(5, '0')}`;
    this.saveDatabase();
    return id;
  }

  public nextMessageId(): string {
    this.db.counters.message += 1;
    const id = `MSG-${String(this.db.counters.message).padStart(5, '0')}`;
    this.saveDatabase();
    return id;
  }

  public nextNotificationId(): string {
    this.db.counters.notification += 1;
    const id = `NOTIF-${String(this.db.counters.notification).padStart(5, '0')}`;
    this.saveDatabase();
    return id;
  }

  public nextAuditLogId(): string {
    this.db.counters.auditLog += 1;
    const id = `AUDIT-${String(this.db.counters.auditLog).padStart(5, '0')}`;
    this.saveDatabase();
    return id;
  }

  public nextUserId(role: UserRole): string {
    this.db.counters.user += 1;
    const prefix = role.toLowerCase();
    const id = `${prefix}-${this.db.counters.user}`;
    this.saveDatabase();
    return id;
  }

  // --- RECOMPUTE PROPERTY VISIBILITY (Core Invariant) ---
  public computeVisibility(
    ownerStatus: AccountStatus,
    propertyStatus: string,
    availability: string,
    isDeleted: boolean
  ): boolean {
    return (
      ownerStatus === 'ACTIVE' &&
      propertyStatus === 'LIVE' &&
      availability === 'AVAILABLE' &&
      !isDeleted
    );
  }

  public recomputeAllPropertiesVisibility(): void {
    const userMap = new Map<string, UserRecord>();
    for (const u of this.db.users) {
      userMap.set(u.uid, u);
    }

    for (const p of this.db.properties) {
      // Find owner user
      const owner = userMap.get(p.submittedBy);
      const ownerStatus = owner ? owner.accountStatus : 'PENDING_APPROVAL';

      // If marked UNPUBLISHED explicitly by admin, status is UNPUBLISHED
      if (p.status === 'UNPUBLISHED') {
        p.isPublic = false;
        continue;
      }

      p.isPublic = this.computeVisibility(ownerStatus, p.status, p.availability, p.isDeleted);
    }
    this.saveDatabase();
  }

  // --- SANITIZATION: QUARANTINE SENSITIVE PRIVATE DATA ---
  public sanitizePublicProperty(p: Property): Partial<Property> {
    const {
      privateDetails,
      exactAddress,
      ownershipDetails,
      ...safe
    } = p as any;

    // Sanitize ownerRef so seller personal phone or personal email never leaks
    const safeOwnerRef = {
      type: p.ownerRef.type,
      id: p.ownerRef.id,
      ownerName: p.ownerRef.ownerName,
      developerSlug: p.ownerRef.developerSlug,
      developerName: p.ownerRef.developerName,
    };

    return {
      ...safe,
      ownerRef: safeOwnerRef,
      // Ensure private location info is quarantined
      location: {
        state: p.location.state,
        stateSlug: p.location.stateSlug,
        city: p.location.city,
        citySlug: p.location.citySlug,
        area: p.location.area,
        areaSlug: p.location.areaSlug,
        estate: p.location.estate,
      },
    };
  }

  // --- ACCESSORS ---
  public getUsers(): UserRecord[] {
    return this.db.users;
  }

  public getUserById(uid: string): UserRecord | undefined {
    return this.db.users.find((u) => u.uid === uid);
  }

  public getUserByEmail(email: string): UserRecord | undefined {
    return this.db.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  }

  public addUser(user: UserRecord): void {
    this.db.users.push(user);
    this.saveDatabase();
  }

  public updateUser(uid: string, updates: Partial<UserRecord>): UserRecord | undefined {
    const user = this.db.users.find((u) => u.uid === uid);
    if (!user) return undefined;
    Object.assign(user, updates);
    this.saveDatabase();
    return user;
  }

  public getProperties(): Property[] {
    return this.db.properties;
  }

  public getPropertyById(id: string): Property | undefined {
    return this.db.properties.find((p) => p.id === id);
  }

  public addProperty(p: Property): void {
    this.db.properties.unshift(p);
    this.recomputeAllPropertiesVisibility();
  }

  public updateProperty(id: string, updates: Partial<Property>): Property | undefined {
    const prop = this.db.properties.find((p) => p.id === id);
    if (!prop) return undefined;
    Object.assign(prop, updates);
    this.recomputeAllPropertiesVisibility();
    return prop;
  }

  public deleteProperty(id: string): boolean {
    const idx = this.db.properties.findIndex((p) => p.id === id);
    if (idx === -1) return false;
    this.db.properties.splice(idx, 1);
    this.saveDatabase();
    return true;
  }

  public getDevelopers(): Developer[] {
    return this.db.developers;
  }

  public getDeveloperById(id: string): Developer | undefined {
    return this.db.developers.find((d) => d.developerId === id);
  }

  public getDeveloperBySlug(slug: string): Developer | undefined {
    return this.db.developers.find((d) => d.slug === slug);
  }

  public addDeveloper(dev: Developer): void {
    this.db.developers.push(dev);
    this.saveDatabase();
  }

  public updateDeveloper(id: string, updates: Partial<Developer>): Developer | undefined {
    const dev = this.db.developers.find((d) => d.developerId === id || d.userId === id);
    if (!dev) return undefined;
    Object.assign(dev, updates);
    this.saveDatabase();
    return dev;
  }

  public getChangeRequests(): ChangeRequest[] {
    return this.db.changeRequests;
  }

  public getChangeRequestById(id: string): ChangeRequest | undefined {
    return this.db.changeRequests.find((cr) => cr.id === id);
  }

  public addChangeRequest(cr: ChangeRequest): void {
    this.db.changeRequests.unshift(cr);
    this.saveDatabase();
  }

  public updateChangeRequest(id: string, updates: Partial<ChangeRequest>): ChangeRequest | undefined {
    const cr = this.db.changeRequests.find((c) => c.id === id);
    if (!cr) return undefined;
    Object.assign(cr, updates);
    this.saveDatabase();
    return cr;
  }

  public getThreads(): Thread[] {
    return this.db.threads;
  }

  public getThreadById(id: string): Thread | undefined {
    return this.db.threads.find((t) => t.id === id);
  }

  public addThread(thread: Thread): void {
    this.db.threads.unshift(thread);
    this.saveDatabase();
  }

  public updateThread(id: string, updates: Partial<Thread>): Thread | undefined {
    const thread = this.db.threads.find((t) => t.id === id);
    if (!thread) return undefined;
    Object.assign(thread, updates);
    this.saveDatabase();
    return thread;
  }

  public getNotifications(): Notification[] {
    return this.db.notifications;
  }

  public addNotification(notif: Notification): void {
    this.db.notifications.unshift(notif);
    this.saveDatabase();
  }

  public markNotificationAsRead(id: string): void {
    const n = this.db.notifications.find((notif) => notif.id === id);
    if (n) {
      n.read = true;
      this.saveDatabase();
    }
  }

  public getAuditLogs(): AuditLog[] {
    return this.db.auditLogs;
  }

  public addAuditLog(log: AuditLog): void {
    this.db.auditLogs.unshift(log);
    this.saveDatabase();
  }

  public resetToSeed(): void {
    this.db = initializeSeedDatabase();
    this.saveDatabase();
  }
}

export const dbStore = new Store();
