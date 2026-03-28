import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/Auth';
import { apiClient } from '../api/Api';
import type { Document } from '../models/Models';

const Dashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const [isExpanded, setIsExpanded] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const limit = isExpanded ? 10 : 3;
  const totalPages = Math.ceil(totalCount / limit) || 1;

  useEffect(() => {
    const fetchDocuments = async () => {
      setLoading(true);
      try {
        const response = await apiClient.get<{ documents: Document[], total_count: number }>(`/documents?page=${currentPage}&size=${limit}`);
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
  }, [currentPage, limit]);

  useEffect(() => {
    const handleClickOutside = () => setOpenMenuId(null);
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  return (
    <div className="flex bg-background min-h-screen page-transition">
      <aside className="fixed left-0 top-0 h-full w-72 bg-[#f2f4f7] font-['Inter'] text-sm tracking-wide flex flex-col p-6 gap-y-2 z-50 border-r border-surface-container-highest/40 hidden md:flex">

        <div className="mb-8 flex items-center gap-3 px-2">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary-dim flex items-center justify-center text-on-primary font-bold shadow-md shrink-0">
            {user?.full_name?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div className="overflow-hidden">
            <h2 className="text-[#2d3338] font-bold tracking-tight truncate">{user?.full_name || 'User'}</h2>
            <p className="text-xs text-[#596065] truncate">{user?.email || 'email@example.com'}</p>
          </div>
        </div>

        <button className="mb-6 w-full bg-gradient-to-r from-primary to-primary-dim text-on-primary font-bold py-3.5 rounded-xl shadow-lg shadow-primary/10 hover:shadow-xl hover:shadow-primary/25 transform hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-300 flex items-center justify-center gap-2 group">
          <span className="material-symbols-outlined">add</span>
          New Document
        </button>

        <nav className="space-y-1">
          <a href="#" className="flex items-center gap-3 px-4 py-3 bg-[#ffffff] text-[#2d3338] rounded-lg shadow-sm font-semibold transition-all">
            <span className="material-symbols-outlined text-xl">description</span>
            All Files
          </a>
          <a href="#" className="flex items-center gap-3 px-4 py-3 text-[#596065] hover:bg-[#ebeef2] rounded-lg hover:translate-x-1 transition-all duration-300">
            <span className="material-symbols-outlined text-xl">schedule</span>
            Recent
          </a>
          <a href="#" className="flex items-center gap-3 px-4 py-3 text-[#596065] hover:bg-[#ebeef2] rounded-lg hover:translate-x-1 transition-all duration-300">
            <span className="material-symbols-outlined text-xl">grade</span>
            Starred
          </a>
        </nav>

        <div className="mt-auto pt-6 border-t border-outline-variant/10 space-y-1">
          <button onClick={logout} className="w-full flex items-center gap-3 px-4 py-3 text-[#596065] hover:bg-error-container/20 hover:text-error rounded-lg transition-all text-left">
            <span className="material-symbols-outlined text-xl">logout</span>
            Log out
          </button>
        </div>
      </aside>

      <main className="flex-1 md:ml-72 min-h-screen pb-20">

        <header className="sticky top-0 z-40 bg-[#f9f9fb] px-6 md:px-12 py-4 flex items-center justify-between w-full max-w-[1920px] mx-auto font-['Manrope'] tracking-tight text-sm font-medium border-b border-surface-container-highest/20">
          <div className="flex items-center gap-12">
            <nav className="hidden md:flex items-center gap-8">
              <a className="text-[#2d3338] font-bold border-b-2 border-[#5d5e61] pb-1" href="#">Documents</a>
              <a className="text-[#596065] hover:text-[#2d3338] transition-colors duration-200" href="#">Shared</a>
            </nav>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:block relative group">
              <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                <span className="material-symbols-outlined text-on-surface-variant text-lg">search</span>
              </div>
              <input type="text" placeholder="Search your files..." className="bg-surface-container-low border-none rounded-full py-2.5 pl-10 pr-4 w-48 md:w-72 text-sm focus:ring-1 focus:ring-primary focus:bg-white transition-all outline-none" />
            </div>
          </div>
        </header>

        <div className="px-6 md:px-12 py-10 space-y-12">
          {error && <p className="text-error font-medium">{error}</p>}

          <section>
            <div className="flex items-end justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold font-headline tracking-tight text-on-surface">Start a new document</h2>
                <p className="text-on-surface-variant font-body hidden sm:block">Choose a template or start from a blank canvas.</p>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 gap-6">
              <div className="group cursor-pointer">
                <div className="aspect-[3/4] rounded-xl bg-surface-container-lowest border border-outline-variant/10 flex items-center justify-center hover:border-primary/40 transition-all shadow-[0_4px_20px_-4px_rgba(45,51,56,0.04)] mb-3">
                  <span className="material-symbols-outlined text-4xl text-primary/30 group-hover:text-primary transition-colors">add</span>
                </div>
                <p className="text-sm font-medium text-on-surface text-center">Blank Document</p>
              </div>
            </div>
          </section>

          <section>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold font-headline tracking-tight text-on-surface">All Documents</h2>
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
                      {loading && isExpanded && (
                        <div className="absolute inset-0 bg-surface-container-lowest/50 z-10 flex items-center justify-center backdrop-blur-[1px]"></div>
                      )}

                      {documents.map((doc) => (
                        <tr
                          key={doc.id}
                          className={`hover:bg-surface-container-low/30 transition-colors group ${openMenuId === doc.id ? 'relative z-50' : 'relative z-0'}`}
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
                          <td className={`px-6 py-5 text-right ${openMenuId === doc.id ? 'relative z-[60]' : 'relative z-10'}`}>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setOpenMenuId(openMenuId === doc.id ? null : doc.id);
                              }}
                              className="p-2 rounded-full hover:bg-surface-container text-on-surface-variant opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100 outline-none"
                            >
                              <span className="material-symbols-outlined">more_vert</span>
                            </button>

                            {openMenuId === doc.id && (
                              <div
                                className="absolute right-8 bottom-12 mb-1 w-36 bg-surface-container-lowest border border-outline-variant/20 rounded-xl shadow-[0_-8px_30px_rgba(0,0,0,0.12)] py-2 z-[100] animate-in fade-in slide-in-from-bottom-2 duration-200"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <button className="w-full text-left px-4 py-2.5 text-sm font-medium text-on-surface hover:bg-surface-container-low transition-colors flex items-center gap-3">
                                  <span className="material-symbols-outlined text-[18px]">edit</span>
                                  Rename
                                </button>
                                <button className="w-full text-left px-4 py-2.5 text-sm font-medium text-error hover:bg-error-container/20 transition-colors flex items-center gap-3">
                                  <span className="material-symbols-outlined text-[18px]">delete</span>
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

                {!isExpanded && totalCount > 3 && (
                  <div className="p-3 border-t border-outline-variant/5 flex justify-center">
                    <button
                      onClick={() => {
                        setIsExpanded(true);
                        setCurrentPage(1);
                      }}
                      className="text-sm font-bold text-primary hover:text-primary-dim transition-colors py-2.5 px-6 rounded-lg hover:bg-primary/5 active:scale-95"
                    >
                      Show more
                    </button>
                  </div>
                )}

                {isExpanded && totalPages > 1 && (
                  <div className="p-4 border-t border-outline-variant/5 flex justify-between items-center bg-surface-container-lowest rounded-b-2xl">
                    <button
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="text-sm font-semibold text-on-surface-variant hover:text-on-surface disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 py-2 px-4 rounded-lg hover:bg-surface-container-low transition-all active:scale-95"
                    >
                      <span className="material-symbols-outlined text-[18px]">chevron_left</span> Previous
                    </button>

                    <span className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">
                      Page {currentPage} of {totalPages}
                    </span>

                    <button
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="text-sm font-semibold text-on-surface-variant hover:text-on-surface disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 py-2 px-4 rounded-lg hover:bg-surface-container-low transition-all active:scale-95"
                    >
                      Next <span className="material-symbols-outlined text-[18px]">chevron_right</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
