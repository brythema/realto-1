import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useMarketplace } from '../../context/MarketplaceContext';
import { Property } from '../../types/property';
import { formatNaira, formatDate, getPropertyTypeLabel } from '../../utils/formatters';
import { PendingReviewBanner } from './PendingReviewBanner';
import { DraftPropertyModal } from './DraftPropertyModal';
import { EditLivePropertyModal } from './EditLivePropertyModal';
import {
  Building,
  Plus,
  Layers,
  Clock,
  CheckCircle2,
  AlertCircle,
  Edit3,
  Trash2,
  Send,
  MessageSquare,
  Building2,
  ExternalLink,
  ShieldCheck,
  Eye,
  FileText,
  Lock,
} from 'lucide-react';

interface Props {
  onSelectProperty: (property: Property) => void;
  onViewDeveloperSpace?: (slug: string) => void;
}

export const SellerDeveloperDashboard: React.FC<Props> = ({
  onSelectProperty,
  onViewDeveloperSpace,
}) => {
  const { currentUser, accountStatus } = useAuth();
  const {
    myProperties,
    myDrafts,
    myPendingReview,
    myLiveProperties,
    myChangeRequests,
    deleteDraft,
    submitDraftForReview,
    requestPropertyDelete,
    requestMarkSold,
    myThreads,
    createSupportThread,
    sendMessage,
    developers,
  } = useMarketplace();

  const [activeTab, setActiveTab] = useState<'drafts' | 'under_review' | 'live' | 'requests' | 'support' | 'space'>('drafts');
  const [isDraftModalOpen, setIsDraftModalOpen] = useState(false);
  const [draftToEdit, setDraftToEdit] = useState<Property | null>(null);

  const [livePropertyToEdit, setLivePropertyToEdit] = useState<Property | null>(null);
  const [isLiveEditModalOpen, setIsLiveEditModalOpen] = useState(false);

  // Support thread state
  const [supportMessage, setSupportMessage] = useState('');
  const [replyBody, setReplyBody] = useState('');
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);

  const isDeveloper = currentUser?.role === 'DEVELOPER';
  const devProfile = developers.find(
    (d) => d.userId === currentUser?.uid || d.developerId === currentUser?.developerId
  );

  const handleEditDraft = (draft: Property) => {
    setDraftToEdit(draft);
    setIsDraftModalOpen(true);
  };

  const handleCreateNewDraft = () => {
    setDraftToEdit(null);
    setIsDraftModalOpen(true);
  };

  const handleEditLive = (prop: Property) => {
    setLivePropertyToEdit(prop);
    setIsLiveEditModalOpen(true);
  };

  const handleSendSupport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supportMessage.trim()) return;
    createSupportThread(supportMessage);
    setSupportMessage('');
  };

  const activeThread = myThreads.find((t) => t.id === selectedThreadId) || myThreads[0];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Pending Account Review Banner */}
      <PendingReviewBanner
        onOpenDraftModal={handleCreateNewDraft}
        onGoToSupport={() => setActiveTab('support')}
      />

      {/* Profile & Metric Bar */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-xs mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-100">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-bold text-xl shadow-md shadow-emerald-600/20">
              {currentUser?.firstName[0]}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-slate-900">
                  {isDeveloper
                    ? devProfile?.companyName || `${currentUser?.firstName} ${currentUser?.lastName}`
                    : `${currentUser?.firstName} ${currentUser?.lastName}`}
                </h1>
                <span
                  className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                    accountStatus === 'ACTIVE'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {accountStatus}
                </span>
                <span className="text-[10px] font-semibold px-2 py-0.5 bg-slate-100 text-slate-700 rounded-full">
                  {currentUser?.role}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                {currentUser?.email} • {currentUser?.phone} • {currentUser?.city}, {currentUser?.state}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCreateNewDraft}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Create Private Draft</span>
            </button>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6">
          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
            <span className="text-xs text-slate-400 font-medium block">Private Drafts</span>
            <span className="text-2xl font-black text-slate-800 mt-1 block">{myDrafts.length}</span>
            <span className="text-[10px] text-slate-400">Owner workspace only</span>
          </div>

          <div className="p-3.5 bg-amber-50/70 rounded-2xl border border-amber-100">
            <span className="text-xs text-amber-700 font-medium block">Under Admin Review</span>
            <span className="text-2xl font-black text-amber-900 mt-1 block">
              {myPendingReview.length}
            </span>
            <span className="text-[10px] text-amber-600">Pending submissions</span>
          </div>

          <div className="p-3.5 bg-emerald-50/70 rounded-2xl border border-emerald-100">
            <span className="text-xs text-emerald-700 font-medium block">Live on Marketplace</span>
            <span className="text-2xl font-black text-emerald-900 mt-1 block">
              {myLiveProperties.length}
            </span>
            <span className="text-[10px] text-emerald-600">Public listings</span>
          </div>

          <div className="p-3.5 bg-purple-50/70 rounded-2xl border border-purple-100">
            <span className="text-xs text-purple-700 font-medium block">
              {isDeveloper ? 'Developer Space' : 'Change Requests'}
            </span>
            <span className="text-2xl font-black text-purple-900 mt-1 block">
              {isDeveloper
                ? devProfile?.hasDeveloperSpace
                  ? 'ACTIVE'
                  : `${myLiveProperties.length}/2 Units`
                : myChangeRequests.length}
            </span>
            <span className="text-[10px] text-purple-600">
              {isDeveloper
                ? devProfile?.hasDeveloperSpace
                  ? 'Dedicated Space Live'
                  : 'Needs 2 live units for Space'
                : 'Audited log history'}
            </span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-2 mb-6 overflow-x-auto pb-1">
        <button
          onClick={() => setActiveTab('drafts')}
          className={`py-2 px-4 text-xs font-bold rounded-xl transition-all whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'drafts'
              ? 'bg-slate-900 text-white'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Private Drafts ({myDrafts.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('under_review')}
          className={`py-2 px-4 text-xs font-bold rounded-xl transition-all whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'under_review'
              ? 'bg-amber-600 text-white'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Under Review ({myPendingReview.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('live')}
          className={`py-2 px-4 text-xs font-bold rounded-xl transition-all whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'live'
              ? 'bg-emerald-600 text-white'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>Live Properties ({myLiveProperties.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('requests')}
          className={`py-2 px-4 text-xs font-bold rounded-xl transition-all whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'requests'
              ? 'bg-blue-600 text-white'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Change Requests ({myChangeRequests.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('support')}
          className={`py-2 px-4 text-xs font-bold rounded-xl transition-all whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'support'
              ? 'bg-slate-800 text-white'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span>Support with Admin ({myThreads.length})</span>
        </button>

        {isDeveloper && (
          <button
            onClick={() => setActiveTab('space')}
            className={`py-2 px-4 text-xs font-bold rounded-xl transition-all whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'space'
                ? 'bg-purple-600 text-white'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>Developer Space Status</span>
          </button>
        )}
      </div>

      {/* Tab 1: Private Drafts Workspace */}
      {activeTab === 'drafts' && (
        <div className="space-y-4">
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-600 flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-slate-500" />
              <span>
                <strong>Private Workspace:</strong> Drafts are visible only to you. You can create, edit, and delete them without creating Change Requests. When ready, click <em>Submit for Review</em> to queue it for Admin approval.
              </span>
            </div>
            <button
              onClick={handleCreateNewDraft}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg"
            >
              + New Draft
            </button>
          </div>

          {myDrafts.length === 0 ? (
            <div className="py-16 text-center bg-white rounded-3xl border border-slate-200">
              <Layers className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="font-bold text-slate-700 text-sm">No Private Drafts</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                You do not have any unfinished drafts. Click below to assemble a new listing.
              </p>
              <button
                onClick={handleCreateNewDraft}
                className="mt-4 px-4 py-2 bg-emerald-600 text-white text-xs font-semibold rounded-xl"
              >
                Assemble Property Draft
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {myDrafts.map((draft) => (
                <div
                  key={draft.id}
                  className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden flex flex-col justify-between"
                >
                  <div className="relative aspect-16/10 bg-slate-100">
                    <img
                      src={draft.coverImageUrl}
                      alt={draft.title}
                      className="w-full h-full object-cover"
                    />
                    <span className="absolute top-3 left-3 px-2 py-0.5 bg-slate-900/80 text-white text-[10px] font-bold rounded-full">
                      PRIVATE DRAFT
                    </span>
                    <span className="absolute bottom-3 left-3 bg-slate-900/90 text-white px-2.5 py-1 rounded text-xs font-extrabold">
                      {formatNaira(draft.price.amount)}
                    </span>
                  </div>

                  <div className="p-4 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="text-[10px] font-mono text-slate-400">{draft.id}</div>
                      <h4 className="font-bold text-slate-900 text-sm mt-0.5 line-clamp-2">
                        {draft.title}
                      </h4>
                      <p className="text-xs text-slate-500 mt-1">
                        {draft.location.area}, {draft.location.city}
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                      <button
                        onClick={() => deleteDraft(draft.id)}
                        className="p-2 text-slate-400 hover:text-rose-600 rounded-lg transition-colors"
                        title="Delete draft"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleEditDraft(draft)}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg flex items-center gap-1"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          Edit
                        </button>
                        <button
                          onClick={() => submitDraftForReview(draft.id)}
                          className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-xs flex items-center gap-1"
                        >
                          <Send className="w-3.5 h-3.5" />
                          Submit
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Under Admin Review */}
      {activeTab === 'under_review' && (
        <div className="space-y-4">
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-900 flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-700 shrink-0" />
            <span>
              These properties have been formally submitted and are currently in the Admin Review Queue. They are locked from direct editing. When approved, they will transition to <strong>LIVE</strong>.
            </span>
          </div>

          {myPendingReview.length === 0 ? (
            <div className="py-16 text-center bg-white rounded-3xl border border-slate-200">
              <Clock className="w-12 h-12 text-slate-300 mx-auto mb-2" />
              <p className="text-xs text-slate-400">No properties currently under review.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {myPendingReview.map((prop) => (
                <div
                  key={prop.id}
                  className="bg-white rounded-2xl border border-amber-200 shadow-xs overflow-hidden flex flex-col justify-between"
                >
                  <div className="relative aspect-16/10 bg-slate-100">
                    <img
                      src={prop.coverImageUrl}
                      alt={prop.title}
                      className="w-full h-full object-cover"
                    />
                    <span className="absolute top-3 left-3 px-2 py-0.5 bg-amber-500 text-white text-[10px] font-bold rounded-full flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      PENDING ADMIN REVIEW
                    </span>
                    <span className="absolute bottom-3 left-3 bg-slate-900/90 text-white px-2.5 py-1 rounded text-xs font-extrabold">
                      {formatNaira(prop.price.amount)}
                    </span>
                  </div>

                  <div className="p-4">
                    <span className="text-[10px] font-mono text-slate-400">{prop.id}</span>
                    <h4 className="font-bold text-slate-900 text-sm mt-0.5 line-clamp-2">
                      {prop.title}
                    </h4>
                    <p className="text-xs text-slate-500 mt-1">
                      {prop.location.area}, {prop.location.city}
                    </p>

                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-amber-800 bg-amber-50/60 p-2 rounded-lg">
                      <span className="font-semibold">Review Status:</span>
                      <span className="font-bold">Awaiting Admin Decision</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Live Properties */}
      {activeTab === 'live' && (
        <div className="space-y-4">
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-900 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
            <span>
              These properties are approved and active on the public marketplace. Because they are live, any edits or deletions must be submitted as a <strong>Change Request</strong> to preserve marketplace integrity.
            </span>
          </div>

          {myLiveProperties.length === 0 ? (
            <div className="py-16 text-center bg-white rounded-3xl border border-slate-200">
              <CheckCircle2 className="w-12 h-12 text-slate-300 mx-auto mb-2" />
              <p className="text-xs text-slate-400">No live approved properties yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {myLiveProperties.map((prop) => (
                <div
                  key={prop.id}
                  className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden flex flex-col justify-between"
                >
                  <div className="relative aspect-16/10 bg-slate-100">
                    <img
                      src={prop.coverImageUrl}
                      alt={prop.title}
                      className="w-full h-full object-cover"
                    />
                    <span className="absolute top-3 left-3 px-2 py-0.5 bg-emerald-600 text-white text-[10px] font-bold rounded-full flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      LIVE ON MARKETPLACE
                    </span>
                    <span className="absolute bottom-3 left-3 bg-slate-900/90 text-white px-2.5 py-1 rounded text-xs font-extrabold">
                      {formatNaira(prop.price.amount)}
                    </span>
                  </div>

                  <div className="p-4 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono text-slate-400">{prop.id}</span>
                        {prop.hasPendingChange && (
                          <span className="text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded font-bold">
                            Edit Pending Admin
                          </span>
                        )}
                      </div>
                      <h4 className="font-bold text-slate-900 text-sm mt-0.5 line-clamp-2">
                        {prop.title}
                      </h4>
                      <p className="text-xs text-slate-500 mt-1">
                        {prop.location.area}, {prop.location.city}
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                      <button
                        onClick={() => onSelectProperty(prop)}
                        className="p-2 text-slate-500 hover:text-slate-800 rounded-lg transition-colors"
                        title="View public presentation"
                      >
                        <Eye className="w-4 h-4" />
                      </button>

                      <div className="flex items-center gap-1.5 flex-wrap">
                        {prop.availability === 'AVAILABLE' && (
                          <button
                            onClick={() => requestMarkSold(prop.id)}
                            className="px-2.5 py-1.5 text-slate-700 hover:bg-slate-100 text-xs font-semibold rounded-lg border border-slate-200"
                            title="Request listing availability change to SOLD"
                          >
                            Mark Sold
                          </button>
                        )}
                        <button
                          onClick={() => requestPropertyDelete(prop.id, 'Owner requested listing removal')}
                          className="px-2.5 py-1.5 text-rose-600 hover:bg-rose-50 text-xs font-semibold rounded-lg"
                        >
                          Delete
                        </button>
                        <button
                          onClick={() => handleEditLive(prop)}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-xs flex items-center gap-1"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          Request Edit
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 4: Change Requests History */}
      {activeTab === 'requests' && (
        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">Your Submitted Change Requests</h3>
            <span className="text-xs text-slate-400">Total: {myChangeRequests.length}</span>
          </div>

          {myChangeRequests.length === 0 ? (
            <div className="py-16 text-center text-xs text-slate-400">
              No change requests submitted yet.
            </div>
          ) : (
            <div className="divide-y divide-slate-100 text-xs">
              {myChangeRequests.map((cr) => (
                <div key={cr.id} className="p-4 flex items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-slate-700">{cr.id}</span>
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-700 font-semibold rounded">
                        {cr.type}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded font-bold ${
                          cr.status === 'APPROVED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : cr.status === 'REJECTED'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {cr.status}
                      </span>
                    </div>

                    <div className="font-semibold text-slate-900">{cr.targetTitle || cr.targetId}</div>

                    {cr.decisionReason && (
                      <p className="text-rose-700 bg-rose-50 p-2 rounded-lg mt-1">
                        <strong>Admin Reason:</strong> {cr.decisionReason}
                      </p>
                    )}
                  </div>

                  <div className="text-right text-[11px] text-slate-400 shrink-0">
                    <div>Submitted: {formatDate(cr.createdAt)}</div>
                    {cr.decisionAt && <div>Decided: {formatDate(cr.decisionAt)}</div>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 5: Support Messages */}
      {activeTab === 'support' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Thread list */}
          <div className="bg-white rounded-3xl border border-slate-200 p-4 shadow-xs">
            <h3 className="font-bold text-slate-900 text-sm mb-3">Support Conversations</h3>
            {myThreads.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">No open support threads.</p>
            ) : (
              <div className="space-y-2">
                {myThreads.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setSelectedThreadId(t.id)}
                    className={`w-full text-left p-3 rounded-xl border text-xs transition-all ${
                      (selectedThreadId || activeThread?.id) === t.id
                        ? 'border-emerald-600 bg-emerald-50/50'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900">{t.kind}</span>
                      <span className="text-[10px] text-slate-400">{formatDate(t.lastMessageAt)}</span>
                    </div>
                    <p className="text-slate-600 truncate mt-1">{t.lastMessageSnippet}</p>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Active conversation window */}
          <div className="md:col-span-2 bg-white rounded-3xl border border-slate-200 p-6 shadow-xs flex flex-col justify-between">
            <div>
              <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">
                    {activeThread ? `Support Thread: ${activeThread.id}` : 'Start New Message'}
                  </h3>
                  <p className="text-xs text-slate-500">Direct message channel to Realto Admin</p>
                </div>
              </div>

              {/* Message list */}
              {activeThread ? (
                <div className="space-y-3 py-4 max-h-[350px] overflow-y-auto">
                  {activeThread.messages.map((m) => (
                    <div
                      key={m.id}
                      className={`p-3 rounded-2xl max-w-md text-xs leading-relaxed ${
                        m.senderRole === 'ADMIN'
                          ? 'bg-slate-900 text-white ml-auto'
                          : 'bg-slate-100 text-slate-800'
                      }`}
                    >
                      <div className="font-bold mb-0.5 opacity-80">{m.senderName}</div>
                      <div>{m.body}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-12 text-center text-xs text-slate-400">
                  Select a thread or compose a message below.
                </div>
              )}
            </div>

            {/* Input */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (activeThread && replyBody.trim()) {
                  sendMessage(activeThread.id, replyBody);
                  setReplyBody('');
                } else if (!activeThread && supportMessage.trim()) {
                  handleSendSupport(e);
                }
              }}
              className="pt-4 border-t border-slate-100 flex gap-2"
            >
              <input
                type="text"
                required
                value={activeThread ? replyBody : supportMessage}
                onChange={(e) =>
                  activeThread ? setReplyBody(e.target.value) : setSupportMessage(e.target.value)
                }
                placeholder={
                  activeThread ? 'Type your reply to Admin...' : 'Type message to Realto Admin...'
                }
                className="flex-1 text-xs p-2.5 rounded-xl border border-slate-300 outline-hidden focus:border-emerald-600"
              />
              <button
                type="submit"
                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs"
              >
                Send
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Tab 6: Developer Space Status (for developers only) */}
      {isDeveloper && activeTab === 'space' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-800 text-xs font-bold mb-2">
                <Building2 className="w-3.5 h-3.5 text-purple-600" />
                Dedicated Developer Showcase Space
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
                {devProfile?.companyName || 'Developer Space'}
              </h2>
              <p className="text-xs text-slate-500 mt-1 max-w-xl">
                According to Realto governance rules, developers with <strong>2 or more live properties</strong> automatically unlock a dedicated public showcase page.
              </p>
            </div>

            {devProfile?.hasDeveloperSpace && onViewDeveloperSpace && (
              <button
                onClick={() => onViewDeveloperSpace(devProfile.slug)}
                className="px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow-xs transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                View My Public Developer Space
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-2">
              <span className="font-bold text-slate-900 block">Space Activation Rule:</span>
              <p className="text-slate-600">
                Current Live Units: <strong>{myLiveProperties.length}</strong> (Required: 2)
              </p>
              <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-purple-600 h-full rounded-full transition-all"
                  style={{ width: `${Math.min(100, (myLiveProperties.length / 2) * 100)}%` }}
                />
              </div>
              <span className="text-[11px] text-purple-700 font-semibold block">
                {devProfile?.hasDeveloperSpace
                  ? 'Your Developer Space is currently active on the public marketplace!'
                  : `Submit ${Math.max(0, 2 - myLiveProperties.length)} more property for review to unlock your space.`}
              </span>
            </div>

            <div className="p-4 bg-purple-50 rounded-2xl border border-purple-200 text-xs text-purple-950 space-y-1.5">
              <span className="font-bold flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-purple-700" />
                Privacy Protection on Developer Space
              </span>
              <p className="leading-relaxed">
                Your Developer Space will display your brand logo, corporate overview, and portfolio units. Your phone number, direct email, and physical office remain strictly private to protect against disintermediation.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      <DraftPropertyModal
        isOpen={isDraftModalOpen}
        onClose={() => setIsDraftModalOpen(false)}
        draftToEdit={draftToEdit}
      />
      <EditLivePropertyModal
        isOpen={isLiveEditModalOpen}
        onClose={() => setIsLiveEditModalOpen(false)}
        property={livePropertyToEdit}
      />
    </div>
  );
};
