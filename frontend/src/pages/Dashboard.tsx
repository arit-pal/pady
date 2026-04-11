import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/Auth';
import { apiClient } from '../api/Api';
import type { Document, Collaborator, User } from '../models/Models';

const TAB_API_CONFIG: Record<string, { sortBy: string; starred?: boolean; shared?: boolean }> = {
  documents: { sortBy: 'created_at' },
  recent: { sortBy: 'updated_at' },
  shared: { sortBy: 'created_at', shared: true },
  starred: { sortBy: 'created_at', starred: true },
};

type TabType = 'documents' | 'shared' | 'recent' | 'starred';

const Dashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const [isExpanded, setIsExpanded] = useState(
    sessionStorage.getItem('pady_isExpanded') === 'true'
  );
  const [currentPage, setCurrentPage] = useState(
    Number(sessionStorage.getItem('pady_currentPage')) || 1
  );
  const [totalCount, setTotalCount] = useState(0);

  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isDeletingProfile, setIsDeletingProfile] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');

  const [renameData, setRenameData] = useState({ isOpen: false, docId: '', title: '' });
  const [confirmData, setConfirmData] = useState<{ isOpen: boolean; type: 'profile' | 'document' | null; docId: string }>({ isOpen: false, type: null, docId: '' });

  const [shareModal, setShareModal] = useState<{ isOpen: boolean; doc: Document | null }>({ isOpen: false, doc: null });
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [shareEmail, setShareEmail] = useState('');
  const [shareRole, setShareRole] = useState('editor');
  const [isSharing, setIsSharing] = useState(false);
  const [collabLoading, setCollabLoading] = useState(false);
  const [shareError, setShareError] = useState('');

  const [searchedUsers, setSearchedUsers] = useState<User[]>([]);
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const [activeTab, setActiveTab] = useState<TabType>(
    (sessionStorage.getItem('pady_activeTab') as TabType) || 'documents'
  );

  let limit = 10;
  if (activeTab === 'recent') {
    limit = 20;
  } else if (activeTab === 'documents' && !isExpanded) {
    limit = 3;
  }

  const totalPages = Math.ceil(totalCount / limit) || 1;

  useEffect(() => {
    sessionStorage.setItem('pady_activeTab', activeTab);
  }, [activeTab]);

  useEffect(() => {
    sessionStorage.setItem('pady_currentPage', String(currentPage));
  }, [currentPage]);

  useEffect(() => {
    sessionStorage.setItem('pady_isExpanded', String(isExpanded));
  }, [isExpanded]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
      setCurrentPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    const fetchUsers = async () => {
      if (shareEmail.trim().length < 2) {
        setSearchedUsers([]);
        setShowUserDropdown(false);
        return;
      }
      try {
        const res = await apiClient.get<{ users: User[] }>(`/users/search?email=${encodeURIComponent(shareEmail)}`);
        setSearchedUsers(res.data.users || []);
        setShowUserDropdown(true);
      } catch (err) {
        console.error(err);
        setSearchedUsers([]);
      }
    };
    const timer = setTimeout(fetchUsers, 300);
    return () => clearTimeout(timer);
  }, [shareEmail]);

  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    setCurrentPage(1);
    setIsExpanded(false);
  }, [activeTab]);

  useEffect(() => {
    const fetchDocuments = async () => {
      setLoading(true);
      try {
        const { sortBy, starred, shared } = TAB_API_CONFIG[activeTab];
        const response = await apiClient.get<{ documents: Document[], total_count: number }>(
          `/documents?page=${currentPage}&size=${limit}&searchKey=${encodeURIComponent(debouncedSearchQuery)}&sortBy=${sortBy}&is_starred=${starred || false}&is_shared=${shared || false}`
        );
        setDocuments(response.data.documents || []);
        setTotalCount(response.data.total_count || 0);
      } catch (err) {
        console.error(err);
        setError('Failed to load documents.');
      } finally {
        setLoading(false);
      }
    };

    fetchDocuments();
  }, [currentPage, limit, debouncedSearchQuery, activeTab, refreshTrigger]);

  useEffect(() => {
    const handleClickOutside = () => {
      setOpenMenuId(null);
      setIsProfileMenuOpen(false);
      setShowUserDropdown(false);
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const handleCreateDocument = async () => {
    try {
      const response = await apiClient.post<{ document: Document }>('/documents', {
        title: 'Untitled Document',
        metadata: {}
      });
      navigate(`/document/${response.data.document.id}`);
    } catch (err) {
      console.error(err);
      setError('Failed to create document.');
    }
  };

  const openRenameModal = (doc: Document) => {
    setOpenMenuId(null);
    setRenameData({ isOpen: true, docId: doc.id, title: doc.title });
  };

  const submitRename = async () => {
    if (!renameData.title.trim()) return;
    try {
      await apiClient.put(`/documents/${renameData.docId}`, { title: renameData.title });
      setRefreshTrigger(prev => prev + 1);
      setRenameData({ isOpen: false, docId: '', title: '' });
    } catch (err) {
      console.error(err);
      setError('Failed to rename document.');
      setRenameData({ isOpen: false, docId: '', title: '' });
    }
  };

  const handleToggleVisibility = async (doc: Document) => {
    setOpenMenuId(null);
    const newVisibility = doc.visibility === 'private' ? 'public' : 'private';
    try {
      await apiClient.put(`/documents/${doc.id}`, { visibility: newVisibility });
      setRefreshTrigger(prev => prev + 1);
      if (shareModal.isOpen && shareModal.doc?.id === doc.id) {
        setShareModal({ ...shareModal, doc: { ...shareModal.doc, visibility: newVisibility } });
      }
    } catch (err) {
      console.error(err);
      setError('Failed to update visibility.');
    }
  };

  const handleToggleStar = async (doc: Document) => {
    setOpenMenuId(null);
    try {
      await apiClient.put(`/documents/${doc.id}`, { is_starred: !doc.is_starred });
      setRefreshTrigger(prev => prev + 1);
    } catch (err) {
      console.error(err);
      setError('Failed to update starred status.');
    }
  };

  const openDeleteDocModal = (docId: string) => {
    setOpenMenuId(null);
    setConfirmData({ isOpen: true, type: 'document', docId });
  };

  const openDeleteProfileModal = () => {
    setIsProfileMenuOpen(false);
    setConfirmData({ isOpen: true, type: 'profile', docId: '' });
  };

  const executeConfirmAction = async () => {
    if (confirmData.type === 'profile') {
      setIsDeletingProfile(true);
      try {
        await apiClient.delete('/delete');
        logout();
      } catch (err) {
        console.error(err);
        setError('Failed to delete profile. Please try again.');
        setIsDeletingProfile(false);
        setConfirmData({ isOpen: false, type: null, docId: '' });
      }
    } else if (confirmData.type === 'document') {
      try {
        await apiClient.delete(`/documents/${confirmData.docId}`);
        setRefreshTrigger(prev => prev + 1);
        setConfirmData({ isOpen: false, type: null, docId: '' });
      } catch (err) {
        console.error(err);
        setError('Failed to delete document.');
        setConfirmData({ isOpen: false, type: null, docId: '' });
      }
    }
  };

  const openShareModal = (doc: Document) => {
    setOpenMenuId(null);
    setShareModal({ isOpen: true, doc });
    setShareError('');
    fetchCollaborators(doc.id);
  };

  const fetchCollaborators = async (docId: string) => {
    setCollabLoading(true);
    try {
      const res = await apiClient.get<{ collaborators: Collaborator[] }>(`/documents/${docId}/collaborators`);
      setCollaborators(res.data.collaborators || []);
    } catch (err) {
      console.error(err);
      setShareError('Failed to load collaborators.');
    } finally {
      setCollabLoading(false);
    }
  };

  const handleAddCollaborator = async () => {
    if (!shareEmail.trim() || !shareModal.doc) return;
    setIsSharing(true);
    setShareError('');
    try {
      await apiClient.post(`/documents/${shareModal.doc.id}/share`, {
        emails: [shareEmail.trim()],
        permission: shareRole
      });
      setShareEmail('');
      setShowUserDropdown(false);
      fetchCollaborators(shareModal.doc.id);
    } catch (err) {
      console.error(err);
      setShareError('Failed to share document. Please verify the email is active.');
    } finally {
      setIsSharing(false);
    }
  };

  const handleRemoveCollaborator = async (userId: string) => {
    if (!shareModal.doc) return;
    try {
      await apiClient.delete(`/documents/${shareModal.doc.id}/share/${userId}`);
      fetchCollaborators(shareModal.doc.id);
    } catch (err) {
      console.error(err);
      setShareError('Failed to remove collaborator.');
    }
  };

  return (
    <div className="flex bg-background min-h-screen page-transition">
      <aside className="fixed left-0 top-0 h-full w-72 bg-[#f2f4f7] font-['Inter'] text-sm tracking-wide flex flex-col p-6 gap-y-2 z-40 border-r border-surface-container-highest/40 hidden md:flex">
        <div className="mb-8 flex items-center gap-3 px-2 relative z-[60]">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary-dim flex items-center justify-center text-on-primary font-bold shadow-md shrink-0">
            {user?.full_name?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div className="overflow-hidden flex-1">
            <h2 className="text-[#2d3338] font-bold tracking-tight truncate">{user?.full_name || 'User'}</h2>
            <p className="text-xs text-[#596065] truncate">{user?.email || 'email@example.com'}</p>
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsProfileMenuOpen(!isProfileMenuOpen);
              setOpenMenuId(null);
            }}
            className="p-1.5 rounded-full hover:bg-surface-container text-on-surface-variant transition-colors outline-none shrink-0 active:bg-surface-container-high"
          >
            <span className="material-symbols-outlined text-xl">more_vert</span>
          </button>

          {isProfileMenuOpen && (
            <div
              className="absolute left-full top-0 ml-2 w-40 bg-surface-container-lowest border border-outline-variant/20 rounded-xl shadow-[0_8px_30px_rgba(0,0,0,0.12)] py-1 z-[100] animate-in fade-in slide-in-from-left-2 duration-200"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={openDeleteProfileModal}
                disabled={isDeletingProfile}
                className="w-full text-left px-3 py-1.5 text-xs font-medium text-error hover:bg-error-container/20 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
              >
                <span className="material-symbols-outlined text-[15px]">
                  {isDeletingProfile ? 'hourglass_empty' : 'delete_forever'}
                </span>
                {isDeletingProfile ? 'Deleting...' : 'Delete Profile'}
              </button>
            </div>
          )}
        </div>

        <button onClick={handleCreateDocument} className="mb-6 w-full bg-gradient-to-r from-primary to-primary-dim text-on-primary font-bold py-3.5 rounded-xl shadow-lg shadow-primary/10 hover:shadow-xl hover:shadow-primary/25 transform hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-300 flex items-center justify-center gap-2 group outline-none">
          <span className="material-symbols-outlined">add</span>
          New Document
        </button>

        <nav className="space-y-1">
          <button onClick={() => setActiveTab('documents')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300 text-left outline-none ${activeTab === 'documents' ? 'bg-[#ffffff] text-[#2d3338] shadow-sm font-semibold' : 'text-[#596065] hover:bg-[#ebeef2] hover:translate-x-1'}`}>
            <span className="material-symbols-outlined text-xl">description</span>
            All Files
          </button>
          <button onClick={() => setActiveTab('recent')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300 text-left outline-none ${activeTab === 'recent' ? 'bg-[#ffffff] text-[#2d3338] shadow-sm font-semibold' : 'text-[#596065] hover:bg-[#ebeef2] hover:translate-x-1'}`}>
            <span className="material-symbols-outlined text-xl">schedule</span>
            Recent
          </button>
          <button onClick={() => setActiveTab('starred')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300 text-left outline-none ${activeTab === 'starred' ? 'bg-[#ffffff] text-[#2d3338] shadow-sm font-semibold' : 'text-[#596065] hover:bg-[#ebeef2] hover:translate-x-1'}`}>
            <span className="material-symbols-outlined text-xl">grade</span>
            Starred
          </button>
        </nav>

        <div className="mt-auto pt-6 border-t border-outline-variant/10 space-y-1">
          <button onClick={logout} className="w-full flex items-center gap-3 px-4 py-3 text-[#596065] hover:bg-error-container/20 hover:text-error rounded-lg transition-all text-left outline-none">
            <span className="material-symbols-outlined text-xl">logout</span>
            Log out
          </button>
        </div>
      </aside>

      <main className="flex-1 md:ml-72 min-h-screen pb-20">
        <header className="sticky top-0 z-30 bg-[#f9f9fb] px-6 md:px-12 py-4 flex items-center justify-between w-full max-w-[1920px] mx-auto font-['Manrope'] tracking-tight text-sm font-medium border-b border-surface-container-highest/20">
          <div className="flex items-center gap-12">
            <nav className="hidden md:flex items-center gap-8">
              <button onClick={() => setActiveTab('documents')} className={activeTab === 'documents' ? "text-[#2d3338] font-bold border-b-2 border-[#5d5e61] pb-1 outline-none" : "text-[#596065] hover:text-[#2d3338] transition-colors duration-200 outline-none"}>Documents</button>
              <button onClick={() => setActiveTab('shared')} className={activeTab === 'shared' ? "text-[#2d3338] font-bold border-b-2 border-[#5d5e61] pb-1 outline-none" : "text-[#596065] hover:text-[#2d3338] transition-colors duration-200 outline-none"}>Shared</button>
            </nav>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:block relative group">
              <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                <span className="material-symbols-outlined text-on-surface-variant text-lg">search</span>
              </div>
              <input
                type="text"
                placeholder="Search your files..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-surface-container-low border-none rounded-full py-2.5 pl-10 pr-10 w-48 md:w-72 text-sm focus:ring-1 focus:ring-primary focus:bg-white transition-all outline-none"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute inset-y-0 right-3 flex items-center text-on-surface-variant hover:text-on-surface transition-colors outline-none"
                >
                  <span className="material-symbols-outlined text-[18px]">close</span>
                </button>
              )}
            </div>
          </div>
        </header>

        <div className="px-6 md:px-12 py-10 space-y-12">
          {error && <p className="text-error font-medium">{error}</p>}

          {activeTab === 'documents' && (
            <section>
              <div className="flex items-end justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold font-headline tracking-tight text-on-surface">Start a new document</h2>
                  <p className="text-on-surface-variant font-body hidden sm:block">Choose a template or start from a blank canvas.</p>
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 gap-6">
                <div className="group cursor-pointer" onClick={handleCreateDocument}>
                  <div className="aspect-[3/4] rounded-xl bg-surface-container-lowest border border-outline-variant/10 flex items-center justify-center hover:border-primary/40 transition-all shadow-[0_4px_20px_-4px_rgba(45,51,56,0.04)] mb-3">
                    <span className="material-symbols-outlined text-4xl text-primary/30 group-hover:text-primary transition-colors">add</span>
                  </div>
                  <p className="text-sm font-medium text-on-surface text-center">Blank Document</p>
                </div>
              </div>
            </section>
          )}

          <section>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold font-headline tracking-tight text-on-surface">
                {activeTab === 'documents' && 'All Documents'}
                {activeTab === 'shared' && 'Shared Documents'}
                {activeTab === 'recent' && 'Recent Documents'}
                {activeTab === 'starred' && 'Starred Documents'}
              </h2>
            </div>

            {loading && documents.length === 0 ? (
              <p className="text-on-surface-variant">Loading workspace...</p>
            ) : documents.length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed border-surface-container-high rounded-2xl">
                <p className="text-on-surface-variant">No documents found.</p>
              </div>
            ) : (
              <div className="bg-surface-container-lowest rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.02)] border border-surface-container-high/40 flex flex-col">
                <div className="overflow-visible w-full">
                  <table className="w-full text-left border-collapse min-w-[600px]">
                    <thead>
                      <tr className="bg-surface-container-low/50">
                        <th className="px-6 py-4 text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Name</th>
                        <th className="px-6 py-4 text-xs font-semibold text-on-surface-variant uppercase tracking-wider hidden sm:table-cell">Visibility</th>
                        <th className="px-6 py-4 text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Last Modified</th>
                        <th className="px-6 py-4 text-xs font-semibold text-on-surface-variant uppercase tracking-wider text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-outline-variant/5 relative">
                      {loading && (activeTab !== 'documents' || isExpanded) && (
                        <div className="absolute inset-0 bg-surface-container-lowest/50 z-10 flex items-center justify-center backdrop-blur-[1px]"></div>
                      )}

                      {documents.map((doc) => (
                        <tr
                          key={doc.id}
                          onClick={() => navigate(`/document/${doc.id}`)}
                          className={`hover:bg-surface-container-low/30 transition-colors group cursor-pointer ${openMenuId === doc.id ? 'relative z-20' : 'relative z-0'}`}
                        >
                          <td className="px-6 py-5">
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 rounded-lg bg-primary-container flex items-center justify-center text-primary shrink-0">
                                <span className="material-symbols-outlined">article</span>
                              </div>
                              <div>
                                <p className="font-semibold text-on-surface">
                                  {doc.title}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-5 hidden sm:table-cell">
                            <span className="inline-flex items-center rounded-full bg-secondary-container px-2.5 py-0.5 text-xs font-medium text-on-secondary-container capitalize">
                              {doc.visibility}
                            </span>
                          </td>
                          <td className="px-6 py-5">
                            <span className="text-sm text-on-surface-variant">
                              {new Date(doc.updated_at).toLocaleDateString()}
                            </span>
                          </td>
                          <td
                            className={`px-6 py-5 text-right ${openMenuId === doc.id ? 'relative z-[30]' : 'relative z-10'}`}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              onClick={() => {
                                setOpenMenuId(openMenuId === doc.id ? null : doc.id);
                                setIsProfileMenuOpen(false);
                              }}
                              className="p-2 rounded-full hover:bg-surface-container text-on-surface-variant opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100 outline-none"
                            >
                              <span className="material-symbols-outlined">more_vert</span>
                            </button>

                            {openMenuId === doc.id && (
                              <div
                                className="absolute right-8 bottom-12 mb-1 w-48 bg-surface-container-lowest border border-outline-variant/20 rounded-xl shadow-[0_-8px_30px_rgba(0,0,0,0.12)] py-2 z-[100] animate-in fade-in slide-in-from-bottom-2 duration-200"
                                onClick={(e) => e.stopPropagation()}
                              >
                                {(doc.permission === 'owner' || doc.permission === 'editor') && (
                                  <button
                                    onClick={() => openRenameModal(doc)}
                                    className="w-full text-left px-4 py-2 text-sm font-medium text-on-surface hover:bg-surface-container-low transition-colors flex items-center gap-3 outline-none whitespace-nowrap"
                                  >
                                    <span className="material-symbols-outlined text-[18px]">edit</span>
                                    Rename
                                  </button>
                                )}

                                {doc.permission === 'owner' && (
                                  <>
                                    <button
                                      onClick={() => openShareModal(doc)}
                                      className="w-full text-left px-4 py-2 text-sm font-medium text-on-surface hover:bg-surface-container-low transition-colors flex items-center gap-3 outline-none whitespace-nowrap"
                                    >
                                      <span className="material-symbols-outlined text-[18px]">person_add</span>
                                      Share
                                    </button>
                                    <button
                                      onClick={() => handleToggleVisibility(doc)}
                                      className="w-full text-left px-4 py-2 text-sm font-medium text-on-surface hover:bg-surface-container-low transition-colors flex items-center gap-3 outline-none whitespace-nowrap"
                                    >
                                      <span className="material-symbols-outlined text-[18px]">
                                        {doc.visibility === 'private' ? 'public' : 'lock'}
                                      </span>
                                      Make {doc.visibility === 'private' ? 'Public' : 'Private'}
                                    </button>
                                  </>
                                )}

                                {doc.permission === 'owner' && (
                                  <button
                                    onClick={() => handleToggleStar(doc)}
                                    className="w-full text-left px-4 py-2 text-sm font-medium text-on-surface hover:bg-surface-container-low transition-colors flex items-center gap-3 outline-none whitespace-nowrap"
                                  >
                                    <span className="material-symbols-outlined text-[18px]" style={doc.is_starred ? { fontVariationSettings: "'FILL' 1" } : {}}>star</span>
                                    {doc.is_starred ? 'Unstar Document' : 'Star Document'}
                                  </button>
                                )}

                                {doc.permission === 'owner' && (
                                  <button
                                    onClick={() => openDeleteDocModal(doc.id)}
                                    className="w-full text-left px-4 py-1.5 text-[13px] font-medium text-error hover:bg-error-container/20 transition-colors flex items-center gap-3 outline-none whitespace-nowrap"
                                  >
                                    <span className="material-symbols-outlined text-[16px]">delete</span>
                                    Delete
                                  </button>
                                )}
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {activeTab === 'documents' && !isExpanded && totalCount > 3 && (
                  <div className="p-3 border-t border-outline-variant/5 flex justify-center">
                    <button
                      onClick={() => {
                        setIsExpanded(true);
                        setCurrentPage(1);
                      }}
                      className="text-sm font-bold text-primary hover:text-primary-dim transition-colors py-2.5 px-6 rounded-lg hover:bg-primary/5 active:scale-95 outline-none"
                    >
                      Show more
                    </button>
                  </div>
                )}

                {(activeTab !== 'documents' || isExpanded) && (
                  (activeTab !== 'recent' && totalPages > 1) || (activeTab === 'recent' && totalCount > 20)
                ) && (
                    <div className="p-4 border-t border-outline-variant/5 flex flex-col gap-3 bg-surface-container-lowest rounded-b-2xl">
                      {activeTab !== 'recent' && totalPages > 1 && (
                        <div className="flex justify-between items-center w-full">
                          <button
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            className="text-sm font-semibold text-on-surface-variant hover:text-on-surface disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 py-2 px-4 rounded-lg hover:bg-surface-container-low transition-all active:scale-95 outline-none"
                          >
                            <span className="material-symbols-outlined text-[18px]">chevron_left</span> Previous
                          </button>

                          <span className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">
                            Page {currentPage} of {totalPages}
                          </span>

                          <button
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                            className="text-sm font-semibold text-on-surface-variant hover:text-on-surface disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 py-2 px-4 rounded-lg hover:bg-surface-container-low transition-all active:scale-95 outline-none"
                          >
                            Next <span className="material-symbols-outlined text-[18px]">chevron_right</span>
                          </button>
                        </div>
                      )}

                      {activeTab === 'recent' && totalCount > 20 && (
                        <div className="flex justify-center items-center text-sm font-medium text-on-surface-variant">
                          No more recent documents.
                          <button
                            onClick={() => {
                              setActiveTab('documents');
                              setIsExpanded(true);
                              setCurrentPage(1);
                            }}
                            className="text-primary hover:text-primary-dim font-bold transition-colors ml-1.5 outline-none hover:underline"
                          >
                            Visit all documents
                          </button>
                        </div>
                      )}
                    </div>
                  )}
              </div>
            )}
          </section>
        </div>
      </main>

      {shareModal.isOpen && (
        <div className="fixed inset-0 bg-inverse-surface/40 backdrop-blur-[2px] z-[200] flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest rounded-2xl w-full max-w-lg p-6 shadow-[0_20px_60px_-10px_rgba(0,0,0,0.2)] animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold font-headline text-on-surface truncate pr-4">
                Share "{shareModal.doc?.title}"
              </h3>
              <button onClick={() => setShareModal({ isOpen: false, doc: null })} className="text-on-surface-variant hover:text-on-surface p-1 rounded-full hover:bg-surface-container outline-none transition-colors">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="flex items-center justify-between p-3 bg-surface-container-low rounded-xl mb-6">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-primary">{shareModal.doc?.visibility === 'public' ? 'public' : 'lock'}</span>
                <div>
                  <p className="text-sm font-semibold text-on-surface">General Access</p>
                  <p className="text-xs text-on-surface-variant">{shareModal.doc?.visibility === 'public' ? 'Anyone with the link can view' : 'Only invited people can access'}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => handleToggleVisibility(shareModal.doc!)} className="px-3 py-1.5 text-xs font-semibold text-on-surface-variant bg-surface-container hover:bg-surface-container-high rounded-lg transition-colors outline-none">
                  Make {shareModal.doc?.visibility === 'private' ? 'Public' : 'Private'}
                </button>
                <button onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/document/${shareModal.doc?.id}`); }} className="px-3 py-1.5 text-xs font-semibold bg-primary text-on-primary rounded-lg transition-colors flex items-center gap-1 outline-none shadow-sm active:scale-95">
                  <span className="material-symbols-outlined text-[14px]">link</span> Copy
                </button>
              </div>
            </div>

            <div className="flex items-center gap-3 mb-2 relative">
              <div className="flex-1 relative">
                <input
                  type="email"
                  placeholder="Add people via email..."
                  value={shareEmail}
                  onChange={(e) => setShareEmail(e.target.value)}
                  className="w-full bg-surface-container-low border border-outline-variant/20 rounded-xl py-2.5 px-4 text-sm text-on-surface focus:ring-2 focus:ring-primary/20 focus:border-primary/30 outline-none transition-all shadow-sm"
                  onKeyDown={(e) => e.key === 'Enter' && handleAddCollaborator()}
                />
                {showUserDropdown && searchedUsers.length > 0 && (
                  <div className="absolute top-full left-0 w-full mt-1.5 bg-surface-container-lowest border border-outline-variant/20 rounded-xl shadow-[0_4px_20px_rgb(0,0,0,0.1)] z-[210] max-h-48 overflow-y-auto">
                    {searchedUsers.map(u => (
                      <div
                        key={u.id}
                        className="px-4 py-2 hover:bg-surface-container-low cursor-pointer flex items-center gap-3 transition-colors border-b border-outline-variant/5 last:border-b-0"
                        onClick={() => {
                          setShareEmail(u.email);
                          setShowUserDropdown(false);
                        }}
                      >
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-container to-surface-container-highest text-on-primary-container flex items-center justify-center font-bold text-[11px] shrink-0">
                          {u.full_name.charAt(0).toUpperCase()}
                        </div>
                        <div className="overflow-hidden">
                          <p className="text-sm font-semibold text-on-surface truncate">{u.full_name}</p>
                          <p className="text-xs text-on-surface-variant truncate">{u.email}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <select
                value={shareRole}
                onChange={(e) => setShareRole(e.target.value)}
                className="bg-surface-container-low border border-outline-variant/20 rounded-xl py-2.5 pl-4 pr-8 text-sm text-on-surface focus:ring-2 focus:ring-primary/20 outline-none cursor-pointer shadow-sm transition-all"
              >
                <option value="viewer">Viewer</option>
                <option value="editor">Editor</option>
              </select>
              <button
                onClick={handleAddCollaborator}
                disabled={isSharing || !shareEmail.trim()}
                className="px-5 py-2.5 text-sm font-bold text-on-primary bg-primary hover:bg-primary-dim rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed outline-none shadow-md shadow-primary/20 active:scale-95"
              >
                Invite
              </button>
            </div>

            {shareError && <p className="text-error text-xs font-medium mb-4 px-1">{shareError}</p>}
            {!shareError && <div className="mb-4"></div>}

            <div className="flex-1 overflow-y-auto min-h-[150px]">
              <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-3 px-1">People with access</p>

              <div className="space-y-1">
                <div className="flex items-center justify-between p-2 rounded-lg bg-surface-container-lowest/50 border border-transparent">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-primary-dim text-on-primary flex items-center justify-center font-bold text-sm shadow-sm shrink-0">
                      {user?.full_name?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-on-surface">{user?.full_name} (You)</p>
                      <p className="text-xs text-on-surface-variant">{user?.email}</p>
                    </div>
                  </div>
                  <span className="text-xs font-semibold text-on-surface-variant pr-2 uppercase tracking-wide">Owner</span>
                </div>

                {collabLoading ? (
                  <div className="flex justify-center items-center py-8">
                    <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin"></div>
                  </div>
                ) : collaborators.length === 0 ? (
                  <p className="text-sm text-on-surface-variant text-center py-8 italic opacity-70">No one else has been invited yet.</p>
                ) : (
                  collaborators.map(c => (
                    <div key={c.user_id} className="flex items-center justify-between p-2 hover:bg-surface-container-lowest border border-transparent hover:border-outline-variant/10 rounded-lg transition-colors group shadow-sm hover:shadow-md">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center font-bold text-sm shrink-0">
                          {c.full_name ? c.full_name.charAt(0).toUpperCase() : 'U'}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-on-surface">{c.full_name}</p>
                          <p className="text-xs text-on-surface-variant">{c.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-medium text-on-surface-variant capitalize px-2 py-1 bg-surface-container rounded-md">{c.permission}</span>
                        <button
                          onClick={() => handleRemoveCollaborator(c.user_id)}
                          className="text-error hover:text-error-dim p-1.5 rounded-full hover:bg-error-container/20 transition-all opacity-0 group-hover:opacity-100 outline-none"
                          title="Remove access"
                        >
                          <span className="material-symbols-outlined text-[18px]">person_remove</span>
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {renameData.isOpen && (
        <div className="fixed inset-0 bg-inverse-surface/40 backdrop-blur-[2px] z-[200] flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest rounded-2xl w-full max-w-md p-6 shadow-[0_20px_60px_-10px_rgba(0,0,0,0.2)] animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-xl font-bold font-headline text-on-surface mb-4">Rename Document</h3>
            <input
              type="text"
              value={renameData.title}
              onChange={(e) => setRenameData({ ...renameData, title: e.target.value })}
              className="w-full bg-surface-container-low border border-outline-variant/20 rounded-xl py-3 px-4 text-on-surface focus:ring-2 focus:ring-primary/20 outline-none mb-6 font-medium shadow-sm transition-all"
              onKeyDown={(e) => e.key === 'Enter' && submitRename()}
              autoFocus
            />
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setRenameData({ isOpen: false, docId: '', title: '' })}
                className="px-4 py-2.5 text-sm font-semibold text-on-surface-variant hover:bg-surface-container-low rounded-xl transition-colors outline-none"
              >
                Cancel
              </button>
              <button
                onClick={submitRename}
                className="px-6 py-2.5 text-sm font-bold text-on-primary bg-primary hover:bg-primary-dim rounded-xl transition-colors shadow-md shadow-primary/20 active:scale-95 outline-none"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmData.isOpen && (
        <div className="fixed inset-0 bg-inverse-surface/40 backdrop-blur-[2px] z-[200] flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest rounded-2xl w-full max-w-md p-6 shadow-[0_20px_60px_-10px_rgba(0,0,0,0.2)] animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-xl font-bold font-headline text-on-surface mb-2">Are you sure?</h3>
            <p className="text-on-surface-variant font-medium mb-6 text-sm leading-relaxed">
              {confirmData.type === 'profile'
                ? "This will permanently delete your account and all associated documents. This action cannot be undone."
                : "This document will be permanently deleted. This action cannot be undone."}
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setConfirmData({ isOpen: false, type: null, docId: '' })}
                className="px-4 py-2.5 text-sm font-semibold text-on-surface-variant hover:bg-surface-container-low rounded-xl transition-colors outline-none"
              >
                Cancel
              </button>
              <button
                onClick={executeConfirmAction}
                disabled={isDeletingProfile}
                className="px-6 py-2.5 text-sm font-bold text-on-error bg-error hover:bg-error-dim rounded-xl transition-colors shadow-md shadow-error/20 flex items-center gap-2 active:scale-95 outline-none"
              >
                {isDeletingProfile ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
