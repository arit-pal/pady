import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/Auth';
import { apiClient } from '../api/Api';
import type { Document } from '../models/Models';

const TAB_API_CONFIG: Record<string, { sortBy: string }> = {
  documents: { sortBy: 'created_at' },
  recent: { sortBy: 'updated_at' },
  shared: { sortBy: 'created_at' },
  starred: { sortBy: 'created_at' },
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
        const { sortBy } = TAB_API_CONFIG[activeTab];
        const response = await apiClient.get<{ documents: Document[], total_count: number }>(`/documents?page=${currentPage}&size=${limit}&searchKey=${encodeURIComponent(debouncedSearchQuery)}&sortBy=${sortBy}`);
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
  }, [currentPage, limit, debouncedSearchQuery, activeTab]);

  useEffect(() => {
    const handleClickOutside = () => {
      setOpenMenuId(null);
      setIsProfileMenuOpen(false);
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
      window.location.reload();
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
      window.location.reload();
    } catch (err) {
      console.error(err);
      setError('Failed to update visibility.');
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
        window.location.reload();
      } catch (err) {
        console.error(err);
        setError('Failed to delete document.');
        setConfirmData({ isOpen: false, type: null, docId: '' });
      }
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
                className="w-full text-left px-3 py-1.5 text-xs font-medium text-error hover:bg-error-container/20 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
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
                <p className="text-on-surface-variant">No documents found. Create one to get started!</p>
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
                          className={`hover:bg-surface-container-low/30 transition-colors group ${openMenuId === doc.id ? 'relative z-20' : 'relative z-0'}`}
                        >
                          <td className="px-6 py-5 cursor-pointer">
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 rounded-lg bg-primary-container flex items-center justify-center text-primary shrink-0">
                                <span className="material-symbols-outlined">article</span>
                              </div>
                              <div>
                                <p className="font-semibold text-on-surface">{doc.title}</p>
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
                          <td className={`px-6 py-5 text-right ${openMenuId === doc.id ? 'relative z-[30]' : 'relative z-10'}`}>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setOpenMenuId(openMenuId === doc.id ? null : doc.id);
                                setIsProfileMenuOpen(false);
                              }}
                              className="p-2 rounded-full hover:bg-surface-container text-on-surface-variant opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100 outline-none"
                            >
                              <span className="material-symbols-outlined">more_vert</span>
                            </button>

                            {openMenuId === doc.id && (
                              <div
                                className="absolute right-8 bottom-12 mb-1 w-44 bg-surface-container-lowest border border-outline-variant/20 rounded-xl shadow-[0_-8px_30px_rgba(0,0,0,0.12)] py-2 z-[100] animate-in fade-in slide-in-from-bottom-2 duration-200"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <button
                                  onClick={() => openRenameModal(doc)}
                                  className="w-full text-left px-4 py-2 text-sm font-medium text-on-surface hover:bg-surface-container-low transition-colors flex items-center gap-3 outline-none"
                                >
                                  <span className="material-symbols-outlined text-[18px]">edit</span>
                                  Rename
                                </button>
                                <button
                                  onClick={() => handleToggleVisibility(doc)}
                                  className="w-full text-left px-4 py-2 text-sm font-medium text-on-surface hover:bg-surface-container-low transition-colors flex items-center gap-3 outline-none"
                                >
                                  <span className="material-symbols-outlined text-[18px]">
                                    {doc.visibility === 'private' ? 'public' : 'lock'}
                                  </span>
                                  Make {doc.visibility === 'private' ? 'Public' : 'Private'}
                                </button>
                                <button
                                  onClick={() => { setOpenMenuId(null); }}
                                  className="w-full text-left px-4 py-2 text-sm font-medium text-on-surface hover:bg-surface-container-low transition-colors flex items-center gap-3 outline-none"
                                >
                                  <span className="material-symbols-outlined text-[18px]">star</span>
                                  Star Document
                                </button>
                                <button
                                  onClick={() => openDeleteDocModal(doc.id)}
                                  className="w-full text-left px-4 py-1.5 text-[13px] font-medium text-error hover:bg-error-container/20 transition-colors flex items-center gap-3 outline-none"
                                >
                                  <span className="material-symbols-outlined text-[16px]">delete</span>
                                  Delete
                                </button>
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

      {renameData.isOpen && (
        <div className="fixed inset-0 bg-inverse-surface/40 backdrop-blur-[2px] z-[200] flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest rounded-2xl w-full max-w-md p-6 shadow-[0_20px_60px_-10px_rgba(0,0,0,0.2)] animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-xl font-bold font-headline text-on-surface mb-4">Rename Document</h3>
            <input
              type="text"
              value={renameData.title}
              onChange={(e) => setRenameData({ ...renameData, title: e.target.value })}
              className="w-full bg-surface-container-low border-none rounded-xl py-3 px-4 text-on-surface focus:ring-2 focus:ring-primary/20 outline-none mb-6 font-medium"
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
