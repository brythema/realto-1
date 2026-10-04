import React, { useState, useEffect } from 'react';
import { useMarketplace } from '../../context/MarketplaceContext';
import { useAuth } from '../../context/AuthContext';
import { ChangeRequest } from '../../types/change-request';
import { Property } from '../../types/property';
import { UserProfile } from '../../types/roles';
import { api } from '../../services/api';
import { formatNaira, formatDate, formatDateTime, getPropertyTypeLabel } from '../../utils/formatters';
import {
  Shield,
  Clock,
  CheckCircle2,
  XCircle,
  Users,
  Building,
  Layers,
  MessageSquare,
  AlertTriangle,
  Eye,
  FileText,
  Search,
  Check,
  X,
  Lock,
  Send,
} from 'lucide-react';

interface Props {
  onSelectProperty: (property: Property) => void;
}

export const AdminDashboard: React.FC<Props> = ({ onSelectProperty }) => {
  const { currentUser, updateUserStatus } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const {
    properties,
    changeRequests,
    pendingChangeRequests,
    approveChangeRequest,
    rejectChangeRequest,
    suspendUserAccount,
    reactivateUserAccount,
    adminTogglePropertyVisibility,
    adminSetPropertyAvailability,
    adminThreads,
    sendMessage,
    closeThread,
    auditLogs,
    developers,
  } = useMarketplace();

  const [adminTab, setAdminTab] = useState<'queue' | 'users' | 'properties' | 'inbox' | 'audit'>('queue');
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
  const [propertyFilter, setPropertyFilter] = useState<'ALL' | 'LIVE' | 'PENDING_REVIEW' | 'DRAFT' | 'UNPUBLISHED'>('ALL');
  const [userRoleFilter, setUserRoleFilter] = useState<'ALL' | 'DEVELOPER' | 'SELLER' | 'BUYER'>('ALL');
  const [inspectingPrivateProperty, setInspectingPrivateProperty] = useState<Property | null>(null);

  // Reject Modal state
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [requestToReject, setRequestToReject] = useState<ChangeRequest | null>(null);

  // Inbox state
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const [adminReply, setAdminReply] = useState('');

  useEffect(() => {
    if (adminTab === 'users') {
      api.admin.getUsers().then(setUsers).catch(console.error);
    }
  }, [adminTab]);

  // Selected request in queue
  const activeRequest =
    changeRequests.find((cr) => cr.id === selectedRequestId) || pendingChangeRequests[0] || changeRequests[0];

  const handleOpenReject = (req: ChangeRequest) => {
    setRequestToReject(req);
    setRejectReason('');
    setIsRejectModalOpen(true);
  };

  const handleConfirmReject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!requestToReject || !rejectReason.trim()) return;
    rejectChangeRequest(requestToReject.id, rejectReason);
    setIsRejectModalOpen(false);
    setRequestToReject(null);
  };

  const activeThread = adminThreads.find((t) => t.id === selectedThreadId) || adminThreads[0];

  const handleSendAdminReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeThread || !adminReply.trim()) return;
    sendMessage(activeThread.id, adminReply);
    setAdminReply('');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Top Admin Banner */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-7 shadow-xl border border-slate-800 mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold mb-2">
            <Shield className="w-3.5 h-3.5 text-emerald-400" />
            <span>Platform Governance & Review Hub</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            Central Administrative Authority
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl leading-relaxed">
            Every user-initiated modification requires approval. Private drafts are quarantined until submitted as Change Requests. All public inquiries and escrow transactions route through this hub.
          </p>
        </div>

        {/* Live Metrics */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="p-3 bg-slate-800/80 rounded-2xl border border-slate-700 text-center px-4">
            <span className="text-2xl font-black text-amber-400 block">
              {pendingChangeRequests.length}
            </span>
            <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
              Pending Queue
            </span>
          </div>

          <div className="p-3 bg-slate-800/80 rounded-2xl border border-slate-700 text-center px-4">
            <span className="text-2xl font-black text-emerald-400 block">
              {properties.filter((p) => p.isPublic).length}
            </span>
            <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
              Live Approved
            </span>
          </div>
        </div>
      </div>

      {/* Admin Tabs */}
      <div className="flex border-b border-slate-200 gap-2 mb-6 overflow-x-auto pb-1">
        <button
          onClick={() => setAdminTab('queue')}
          className={`py-2 px-4 text-xs font-bold rounded-xl transition-all whitespace-nowrap flex items-center gap-1.5 ${
            adminTab === 'queue'
              ? 'bg-amber-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Review Queue ({pendingChangeRequests.length})</span>
        </button>

        <button
          onClick={() => setAdminTab('properties')}
          className={`py-2 px-4 text-xs font-bold rounded-xl transition-all whitespace-nowrap flex items-center gap-1.5 ${
            adminTab === 'properties'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>All Properties ({properties.length})</span>
        </button>

        <button
          onClick={() => setAdminTab('users')}
          className={`py-2 px-4 text-xs font-bold rounded-xl transition-all whitespace-nowrap flex items-center gap-1.5 ${
            adminTab === 'users'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>User & Developer Accounts</span>
        </button>

        <button
          onClick={() => setAdminTab('inbox')}
          className={`py-2 px-4 text-xs font-bold rounded-xl transition-all whitespace-nowrap flex items-center gap-1.5 ${
            adminTab === 'inbox'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span>Inquiries & Concierge Inbox ({adminThreads.length})</span>
        </button>

        <button
          onClick={() => setAdminTab('audit')}
          className={`py-2 px-4 text-xs font-bold rounded-xl transition-all whitespace-nowrap flex items-center gap-1.5 ${
            adminTab === 'audit'
              ? 'bg-slate-700 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Audit Log Trail ({auditLogs.length})</span>
        </button>
      </div>

      {/* TAB 1: Review Queue (Change Requests with side-by-side diff) */}
      {adminTab === 'queue' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Requests List */}
          <div className="bg-white rounded-3xl border border-slate-200 p-4 shadow-xs">
            <h3 className="font-bold text-slate-900 text-sm mb-3">Change Requests</h3>
            {changeRequests.length === 0 ? (
              <p className="text-xs text-slate-400 py-8 text-center">Queue is empty.</p>
            ) : (
              <div className="space-y-2 max-h-[600px] overflow-y-auto">
                {changeRequests.map((req) => (
                  <button
                    key={req.id}
                    onClick={() => setSelectedRequestId(req.id)}
                    className={`w-full text-left p-3.5 rounded-2xl border text-xs transition-all ${
                      activeRequest?.id === req.id
                        ? 'border-amber-500 bg-amber-50/60 ring-2 ring-amber-500/20'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span className="font-mono font-bold text-slate-600">{req.id}</span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          req.status === 'APPROVED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : req.status === 'REJECTED'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {req.status}
                      </span>
                    </div>

                    <div className="font-semibold text-slate-900 line-clamp-1">
                      {req.targetTitle || req.targetId}
                    </div>

                    <div className="text-[11px] text-slate-500 mt-1 flex items-center justify-between">
                      <span>{req.requesterName}</span>
                      <span className="text-[10px] font-medium bg-slate-100 text-slate-700 px-1.5 py-0.2 rounded">
                        {req.type}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Diff & Decision Window */}
          <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 p-6 shadow-xs flex flex-col justify-between">
            {activeRequest ? (
              <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-slate-700 text-sm">
                        {activeRequest.id}
                      </span>
                      <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-800">
                        {activeRequest.type}
                      </span>
                      <span
                        className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                          activeRequest.status === 'APPROVED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : activeRequest.status === 'REJECTED'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {activeRequest.status}
                      </span>
                    </div>
                    <h2 className="text-lg font-bold text-slate-900 mt-1">
                      {activeRequest.targetTitle || activeRequest.targetId}
                    </h2>
                    <p className="text-xs text-slate-500">
                      Submitted by: <strong>{activeRequest.requesterName}</strong> ({activeRequest.requesterRole}) on {formatDateTime(activeRequest.createdAt)}
                    </p>
                  </div>
                </div>

                {/* Side-by-Side Diff View */}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                    Side-by-Side Verification Diff
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Previous/Current Data */}
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs">
                      <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px] block mb-2">
                        Baseline / Current Live Record
                      </span>
                      <pre className="whitespace-pre-wrap font-mono text-[11px] text-slate-700 bg-white p-3 rounded-xl border border-slate-100 max-h-60 overflow-y-auto">
                        {JSON.stringify(activeRequest.previousData, null, 2)}
                      </pre>
                    </div>

                    {/* Proposed Data */}
                    <div className="p-4 bg-emerald-50/60 rounded-2xl border border-emerald-200 text-xs">
                      <span className="font-bold text-emerald-800 uppercase tracking-wider text-[10px] block mb-2">
                        Proposed Modifications (Pending Review)
                      </span>
                      <pre className="whitespace-pre-wrap font-mono text-[11px] text-emerald-950 bg-white p-3 rounded-xl border border-emerald-100 max-h-60 overflow-y-auto">
                        {JSON.stringify(activeRequest.proposedData, null, 2)}
                      </pre>
                    </div>
                  </div>
                </div>

                {/* If rejected, show decision reason */}
                {activeRequest.decisionReason && (
                  <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-900">
                    <strong>Rejection Justification:</strong> {activeRequest.decisionReason}
                  </div>
                )}

                {/* Action Buttons */}
                {activeRequest.status === 'PENDING' ? (
                  <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                    <button
                      onClick={() => handleOpenReject(activeRequest)}
                      className="px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-xl transition-colors flex items-center gap-1.5"
                    >
                      <X className="w-4 h-4" />
                      Reject with Written Reason
                    </button>

                    <button
                      onClick={() => approveChangeRequest(activeRequest.id)}
                      className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-700/20 transition-colors flex items-center gap-2"
                    >
                      <Check className="w-4 h-4" />
                      Approve & Publish Live
                    </button>
                  </div>
                ) : (
                  <div className="pt-4 border-t border-slate-100 text-xs text-slate-400 italic text-right">
                    This Change Request has already been decided ({activeRequest.status}).
                  </div>
                )}
              </div>
            ) : (
              <div className="py-20 text-center text-xs text-slate-400">
                Select a change request to inspect.
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: All Properties Governance */}
      {adminTab === 'properties' && (
        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="p-4 border-b border-slate-100 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">All Platform Listings Directory</h3>
              <p className="text-[11px] text-slate-500">
                Inspect public listings, private titles, set availability, or toggle live visibility.
              </p>
            </div>

            {/* Filter buttons */}
            <div className="flex items-center gap-1 bg-slate-200/70 p-1 rounded-xl text-xs">
              {(['ALL', 'LIVE', 'PENDING_REVIEW', 'DRAFT'] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => setPropertyFilter(st)}
                  className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                    propertyFilter === st
                      ? 'bg-white text-slate-900 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          <div className="divide-y divide-slate-100 text-xs overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="p-3">Ref ID</th>
                  <th className="p-3">Title & Location</th>
                  <th className="p-3">Category</th>
                  <th className="p-3">Owner / Developer</th>
                  <th className="p-3">Price</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Availability</th>
                  <th className="p-3">Public</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {properties
                  .filter((p) => propertyFilter === 'ALL' || p.status === propertyFilter)
                  .map((prop) => (
                    <tr key={prop.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="p-3 font-mono font-bold text-slate-700">{prop.id}</td>
                      <td className="p-3 max-w-xs">
                        <div className="font-semibold text-slate-900 truncate">{prop.title}</div>
                        <div className="text-[11px] text-slate-400">
                          {prop.location.area}, {prop.location.city}
                        </div>
                      </td>
                      <td className="p-3 font-medium text-slate-600">
                        {getPropertyTypeLabel(prop.propertyType)}
                      </td>
                      <td className="p-3 text-slate-700">{prop.ownerRef.ownerName}</td>
                      <td className="p-3 font-bold text-slate-900">{formatNaira(prop.price.amount)}</td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                            prop.status === 'LIVE'
                              ? 'bg-emerald-100 text-emerald-800'
                              : prop.status === 'DRAFT'
                              ? 'bg-slate-100 text-slate-700'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {prop.status}
                        </span>
                      </td>
                      <td className="p-3">
                        <select
                          value={prop.availability}
                          onChange={(e) =>
                            adminSetPropertyAvailability(prop.id, e.target.value as any)
                          }
                          className="text-[11px] p-1 rounded border border-slate-200 bg-white font-medium text-slate-700"
                        >
                          <option value="AVAILABLE">AVAILABLE</option>
                          <option value="UNDER_OFFER">UNDER OFFER</option>
                          <option value="SOLD">SOLD</option>
                        </select>
                      </td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                            prop.isPublic ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {prop.isPublic ? 'YES' : 'NO'}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setInspectingPrivateProperty(prop)}
                            className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[11px] font-semibold flex items-center gap-1"
                            title="Inspect Private Title & Address"
                          >
                            <Lock className="w-3 h-3 text-slate-500" />
                            Private Details
                          </button>

                          <button
                            onClick={() => onSelectProperty(prop)}
                            className="p-1.5 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-100"
                            title="Inspect public view"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() =>
                              adminTogglePropertyVisibility(
                                prop.id,
                                !prop.isPublic,
                                prop.isPublic
                                  ? 'Administrative unpublish from governance console'
                                  : 'Administrative republish to public marketplace'
                              )
                            }
                            className={`px-2 py-1 rounded text-[11px] font-semibold transition-colors ${
                              prop.isPublic
                                ? 'bg-amber-50 text-amber-800 hover:bg-amber-100'
                                : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                            }`}
                          >
                            {prop.isPublic ? 'Unpublish' : 'Make Live'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: Users & Developer Governance */}
      {adminTab === 'users' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
              <div>
                <h3 className="font-bold text-slate-900 text-base">
                  Platform User & Developer Accounts
                </h3>
                <p className="text-xs text-slate-500">
                  Manage accounts, verify submitted KYC documents, approve onboarding, or suspend users.
                </p>
              </div>

              {/* Role filter */}
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs">
                {(['ALL', 'DEVELOPER', 'SELLER', 'BUYER'] as const).map((r) => (
                  <button
                    key={r}
                    onClick={() => setUserRoleFilter(r)}
                    className={`px-3 py-1 rounded-lg font-semibold transition-all ${
                      userRoleFilter === r
                        ? 'bg-white text-slate-900 shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {users
                .filter((u) => userRoleFilter === 'ALL' || u.role === userRoleFilter)
                .map((u) => {
                  const dev = developers.find((d) => d.userId === u.uid || d.developerId === u.developerId);
                  return (
                    <div
                      key={u.uid}
                      className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="font-bold text-slate-900 text-sm">
                              {dev?.companyName || `${u.firstName} ${u.lastName}`}
                            </span>
                            <span className="text-[10px] font-semibold text-slate-500 block">
                              {u.email} • {u.phone}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-800">
                              {u.role}
                            </span>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                u.accountStatus === 'ACTIVE'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : u.accountStatus === 'SUSPENDED'
                                  ? 'bg-rose-100 text-rose-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {u.accountStatus}
                            </span>
                          </div>
                        </div>

                        <div className="text-xs text-slate-600 mt-2 space-y-1">
                          {dev && (
                            <div>
                              <strong>CAC Number:</strong> {dev.cacNumber}
                            </div>
                          )}
                          {u.sellerRelationship && (
                            <div>
                              <strong>Capacity:</strong> {u.sellerRelationship}
                              {u.representationDetails && ` (${u.representationDetails})`}
                            </div>
                          )}
                          <div>
                            <strong>Location:</strong> {u.city}, {u.state}
                          </div>
                          {u.kycDocumentName && (
                            <div className="flex items-center gap-1.5 pt-1">
                              <span className="font-semibold text-slate-700">KYC Document:</span>
                              <span className="font-mono text-[11px] bg-slate-200 text-slate-700 px-2 py-0.5 rounded flex items-center gap-1">
                                <FileText className="w-3 h-3 text-slate-500" />
                                {u.kycDocumentName}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-between">
                        <span className="text-[11px] text-slate-400 font-mono">{u.uid}</span>
                        <div className="flex items-center gap-2">
                          {u.accountStatus === 'PENDING_APPROVAL' && (
                            <button
                              onClick={() => {
                                updateUserStatus(u.uid, 'ACTIVE');
                                if (dev) {
                                  dev.verificationStatus = 'VERIFIED';
                                }
                              }}
                              className="px-2.5 py-1 text-emerald-700 bg-emerald-100 hover:bg-emerald-200 text-xs font-bold rounded-lg transition-colors"
                            >
                              Approve Account
                            </button>
                          )}
                          {u.accountStatus === 'ACTIVE' && u.role !== 'ADMIN' && (
                            <button
                              onClick={() => suspendUserAccount(u.uid, 'Administrative review')}
                              className="px-2.5 py-1 text-rose-700 bg-rose-50 hover:bg-rose-100 text-xs font-semibold rounded-lg transition-colors"
                            >
                              Suspend
                            </button>
                          )}
                          {u.accountStatus === 'SUSPENDED' && (
                            <button
                              onClick={() => reactivateUserAccount(u.uid)}
                              className="px-2.5 py-1 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 text-xs font-semibold rounded-lg transition-colors"
                            >
                              Reactivate
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: Inquiries & Concierge Inbox */}
      {adminTab === 'inbox' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-3xl border border-slate-200 p-4 shadow-xs">
            <h3 className="font-bold text-slate-900 text-sm mb-3">All Inbound Threads</h3>
            <div className="space-y-2 max-h-[500px] overflow-y-auto">
              {adminThreads.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setSelectedThreadId(t.id)}
                  className={`w-full text-left p-3 rounded-2xl border text-xs transition-all ${
                    (selectedThreadId || activeThread?.id) === t.id
                      ? 'border-emerald-600 bg-emerald-50/50'
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">{t.userName}</span>
                    <span className="text-[10px] text-slate-400">{formatDate(t.lastMessageAt)}</span>
                  </div>
                  <div className="text-[11px] text-emerald-800 font-semibold mt-0.5 truncate">
                    {t.propertyTitle ? `${t.propertyId} • ${t.propertyTitle}` : t.kind}
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-slate-500 truncate flex-1">{t.lastMessageSnippet}</p>
                    <span
                      className={`text-[9px] font-bold px-1.5 py-0.2 rounded ml-1 ${
                        t.status === 'CLOSED'
                          ? 'bg-slate-200 text-slate-700'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {t.status}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="md:col-span-2 bg-white rounded-3xl border border-slate-200 p-6 shadow-xs flex flex-col justify-between">
            {activeThread ? (
              <div>
                <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">
                      {activeThread.userName} ({activeThread.userPhone})
                    </h3>
                    <p className="text-xs text-slate-500">
                      {activeThread.propertyTitle || 'Platform Support'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {activeThread.status !== 'CLOSED' && (
                      <button
                        onClick={() => closeThread(activeThread.id)}
                        className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors"
                      >
                        Close Thread
                      </button>
                    )}
                  </div>
                </div>

                <div className="space-y-3 py-4 max-h-[350px] overflow-y-auto">
                  {activeThread.messages.map((m) => (
                    <div
                      key={m.id}
                      className={`p-3 rounded-2xl max-w-md text-xs leading-relaxed ${
                        m.senderRole === 'ADMIN'
                          ? 'bg-slate-900 text-white ml-auto'
                          : 'bg-slate-100 text-slate-800 mr-auto'
                      }`}
                    >
                      <div className="font-bold mb-0.5 opacity-80">{m.senderName}</div>
                      <div>{m.body}</div>
                    </div>
                  ))}
                </div>

                {activeThread.status !== 'CLOSED' ? (
                  <form onSubmit={handleSendAdminReply} className="pt-4 border-t border-slate-100 flex gap-2">
                    <input
                      type="text"
                      required
                      value={adminReply}
                      onChange={(e) => setAdminReply(e.target.value)}
                      placeholder="Type official Admin Concierge response..."
                      className="flex-1 text-xs p-2.5 rounded-xl border border-slate-300 outline-hidden focus:border-emerald-600"
                    />
                    <button
                      type="submit"
                      className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs"
                    >
                      Reply as Admin
                    </button>
                  </form>
                ) : (
                  <div className="pt-4 border-t border-slate-100 text-center text-xs text-slate-400 italic">
                    This inquiry thread has been marked CLOSED.
                  </div>
                )}
              </div>
            ) : (
              <div className="py-20 text-center text-xs text-slate-400">
                Select a message to view.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Private Details Inspection Modal */}
      {inspectingPrivateProperty && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-emerald-600" />
                <h3 className="font-bold text-slate-900 text-sm">
                  Confidential Property Records ({inspectingPrivateProperty.id})
                </h3>
              </div>
              <button
                onClick={() => setInspectingPrivateProperty(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 space-y-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px] block mb-1">
                  Exact Physical Coordinates / Street Address
                </span>
                <p className="text-slate-800 font-medium">
                  {inspectingPrivateProperty.privateDetails?.exactAddress || 'Not specified'}
                </p>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px] block mb-1">
                  Ownership & Lands Registry Verification Details
                </span>
                <p className="text-slate-800 leading-relaxed">
                  {inspectingPrivateProperty.privateDetails?.ownershipDetails || 'Direct owner title registered.'}
                </p>
              </div>

              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200">
                <span className="font-bold text-amber-800 uppercase tracking-wider text-[10px] block mb-1">
                  Internal Admin Notes
                </span>
                <p className="text-amber-950 leading-relaxed">
                  {inspectingPrivateProperty.privateDetails?.internalAdminNotes || 'Inspected and vetted by Realto Physical Inspection Team.'}
                </p>
              </div>
            </div>

            <div className="mt-5 flex justify-end">
              <button
                onClick={() => setInspectingPrivateProperty(null)}
                className="px-4 py-2 bg-slate-900 text-white text-xs font-semibold rounded-xl"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: Audit Log Trail */}
      {adminTab === 'audit' && (
        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-sm">Append-Only Administrative Audit Log</h3>
            <span className="text-xs text-slate-500">Immutable Ledger</span>
          </div>

          <div className="divide-y divide-slate-100 text-xs">
            {auditLogs.map((log) => (
              <div key={log.id} className="p-4 flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-slate-600">{log.action}</span>
                    <span className="text-slate-400">•</span>
                    <span className="font-semibold text-slate-800">{log.entityType} ({log.entityId})</span>
                  </div>
                  <p className="text-slate-600 text-xs leading-relaxed">{log.details}</p>
                  <div className="text-[11px] text-slate-400">Actor: {log.actorName}</div>
                </div>

                <span className="text-[11px] text-slate-400 shrink-0 font-mono">
                  {formatDateTime(log.timestamp)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Rejection Modal (Mandatory Reason) */}
      {isRejectModalOpen && requestToReject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="font-bold text-slate-900 text-base mb-1">
              Reject Change Request ({requestToReject.id})
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Realto governing rules require a written reason explaining why this submission or edit was rejected.
            </p>

            <form onSubmit={handleConfirmReject} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Written Rejection Reason (Required)
                </label>
                <textarea
                  rows={3}
                  required
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="e.g. Title deed document illegible; please upload a clear scanned copy of the Governor's Consent."
                  className="w-full text-xs p-3 rounded-xl border border-slate-300 focus:border-rose-600 outline-hidden"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsRejectModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-xs"
                >
                  Confirm Rejection
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
