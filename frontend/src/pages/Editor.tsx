import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { apiClient } from '../api/Api';
import { useAuth } from '../context/Auth';
import type { Document, Collaborator, User } from '../models/Models';

const Editor: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [document, setDocument] = useState<Document | null>(null);
    const [content, setContent] = useState('');
    const [initialContent, setInitialContent] = useState('');
    const [loading, setLoading] = useState(true);
    const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error'>('saved');
    const [fetchError, setFetchError] = useState<{ message: string; status: number } | null>(null);

    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [renameData, setRenameData] = useState({ isOpen: false, title: '' });
    const [confirmDelete, setConfirmDelete] = useState(false);

    const [isShareModalOpen, setIsShareModalOpen] = useState(false);
    const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
    const [shareEmail, setShareEmail] = useState('');
    const [shareRole, setShareRole] = useState('editor');
    const [isSharing, setIsSharing] = useState(false);
    const [collabLoading, setCollabLoading] = useState(false);
    const [shareError, setShareError] = useState('');
    const [searchedUsers, setSearchedUsers] = useState<User[]>([]);
    const [showUserDropdown, setShowUserDropdown] = useState(false);

    useEffect(() => {
        const fetchDocument = async () => {
            try {
                const response = await apiClient.get<{ document: Document }>(`/documents/${id}`);
                setDocument(response.data.document);
                const meta = response.data.document.metadata as { content?: string };
                const fetchedContent = meta?.content || '';
                setContent(fetchedContent);
                setInitialContent(fetchedContent);
            } catch (err: unknown) {
                console.error(err);
                if (axios.isAxiosError(err)) {
                    if (err.response?.status === 403 || err.response?.status === 401) {
                        setFetchError({ message: "You don't have access to this document.", status: err.response.status });
                    } else if (err.response?.status === 404) {
                        setFetchError({ message: "This document does not exist or has been deleted.", status: 404 });
                    } else {
                        setFetchError({ message: "Failed to load document.", status: 500 });
                    }
                } else {
                    setFetchError({ message: "An unexpected error occurred while loading the document.", status: 500 });
                }
            } finally {
                setLoading(false);
            }
        };
        fetchDocument();
    }, [id, navigate]);

    useEffect(() => {
        if (!document || document.permission === 'viewer' || content === initialContent) return;

        const timer = setTimeout(async () => {
            setSaveStatus('saving');
            try {
                await apiClient.put(`/documents/${id}`, { metadata: { ...document.metadata, content } });
                setSaveStatus('saved');
                setInitialContent(content);
            } catch (err) {
                console.error(err);
                setSaveStatus('error');
            }
        }, 1000);

        return () => clearTimeout(timer);
    }, [content, id, document, initialContent]);

    useEffect(() => {
        const handleClickOutside = () => {
            setIsMenuOpen(false);
            setShowUserDropdown(false);
        };
        window.addEventListener('click', handleClickOutside);
        return () => window.removeEventListener('click', handleClickOutside);
    }, []);

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

    const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setContent(e.target.value);
    };

    const handleToggleStar = async () => {
        if (!document || document.permission !== 'owner') return;
        try {
            await apiClient.put(`/documents/${id}`, { is_starred: !document.is_starred });
            setDocument({ ...document, is_starred: !document.is_starred });
        } catch (err) {
            console.error(err);
        }
    };

    const handleToggleVisibility = async () => {
        if (!document || document.permission !== 'owner') return;
        const newVisibility = document.visibility === 'private' ? 'public' : 'private';
        try {
            await apiClient.put(`/documents/${id}`, { visibility: newVisibility });
            setDocument({ ...document, visibility: newVisibility });
        } catch (err) {
            console.error(err);
        }
    };

    const submitRename = async () => {
        if (!renameData.title.trim() || !document) return;
        try {
            await apiClient.put(`/documents/${id}`, { title: renameData.title });
            setDocument({ ...document, title: renameData.title });
            setRenameData({ isOpen: false, title: '' });
        } catch (err) {
            console.error(err);
        }
    };

    const executeDelete = async () => {
        try {
            await apiClient.delete(`/documents/${id}`);
            navigate('/dashboard');
        } catch (err) {
            console.error(err);
            setConfirmDelete(false);
        }
    };

    const openShareModal = () => {
        setIsShareModalOpen(true);
        setShareError('');
        fetchCollaborators();
    };

    const fetchCollaborators = async () => {
        setCollabLoading(true);
        try {
            const res = await apiClient.get<{ collaborators: Collaborator[] }>(`/documents/${id}/collaborators`);
            setCollaborators(res.data.collaborators || []);
        } catch (err) {
            console.error(err);
            setShareError('Failed to load collaborators.');
        } finally {
            setCollabLoading(false);
        }
    };

    const handleAddCollaborator = async () => {
        if (!shareEmail.trim() || !document) return;
        setIsSharing(true);
        setShareError('');
        try {
            await apiClient.post(`/documents/${id}/share`, {
                emails: [shareEmail.trim()],
                permission: shareRole
            });
            setShareEmail('');
            setShowUserDropdown(false);
            fetchCollaborators();
        } catch (err) {
            console.error(err);
            setShareError('Failed to share document. Please verify the email is active.');
        } finally {
            setIsSharing(false);
        }
    };

    const handleRemoveCollaborator = async (userId: string) => {
        try {
            await apiClient.delete(`/documents/${id}/share/${userId}`);
            fetchCollaborators();
        } catch (err) {
            console.error(err);
            setShareError('Failed to remove collaborator.');
        }
    };

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center bg-surface-container-lowest text-on-surface-variant font-medium">Loading editor...</div>;
    }

    if (fetchError) {
        return (
            <div className="min-h-screen bg-surface-container-lowest flex flex-col items-center justify-center p-6 page-transition">
                <div className="w-20 h-20 bg-error-container text-on-error-container rounded-full flex items-center justify-center mb-6">
                    <span className="material-symbols-outlined text-4xl">{fetchError.status === 404 ? 'search_off' : 'lock'}</span>
                </div>
                <h1 className="text-2xl md:text-3xl font-bold font-headline text-on-surface mb-3 text-center">
                    {fetchError.status === 404 ? 'Document Not Found' : 'Access Denied'}
                </h1>
                <p className="text-on-surface-variant text-base md:text-lg mb-8 text-center max-w-md">
                    {fetchError.message}
                </p>
                <button
                    onClick={() => navigate('/dashboard')}
                    className="px-6 py-3 bg-primary text-on-primary font-bold rounded-xl shadow-lg shadow-primary/20 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 active:scale-95 outline-none flex items-center gap-2"
                >
                    <span className="material-symbols-outlined">arrow_back</span>
                    Back to Dashboard
                </button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-surface-container-lowest flex flex-col page-transition">
            <header className="flex items-center justify-between px-6 py-4 border-b border-surface-container-highest/20">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="flex items-center gap-2 text-on-surface-variant hover:text-on-surface transition-colors font-medium text-sm outline-none"
                    >
                        <span className="material-symbols-outlined text-[20px]">arrow_back</span>
                        <span className="hidden sm:inline">Dashboard</span>
                    </button>

                    <div className="h-5 w-px bg-outline-variant/30 hidden sm:block"></div>

                    <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-on-surface truncate max-w-[150px] sm:max-w-xs">{document?.title || 'Untitled Document'}</span>
                        {document?.permission === 'owner' && (
                            <button
                                onClick={handleToggleStar}
                                className="text-on-surface-variant hover:text-primary transition-colors outline-none flex items-center"
                                title={document?.is_starred ? 'Unstar' : 'Star'}
                            >
                                <span className="material-symbols-outlined text-[18px]" style={document?.is_starred ? { fontVariationSettings: "'FILL' 1", color: 'var(--color-primary)' } : {}}>star</span>
                            </button>
                        )}
                    </div>

                    {document?.permission !== 'viewer' && (
                        <div className="hidden md:flex items-center gap-2 ml-4">
                            {saveStatus === 'saving' && <span className="text-xs font-medium text-on-surface-variant flex items-center gap-1"><span className="material-symbols-outlined text-[14px] animate-spin">sync</span> Saving...</span>}
                            {saveStatus === 'saved' && <span className="text-xs font-medium text-on-surface-variant flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">cloud_done</span> Saved</span>}
                            {saveStatus === 'error' && <span className="text-xs font-medium text-error flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">error</span> Save failed</span>}
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-3">
                    {document?.permission === 'owner' && (
                        <button
                            onClick={openShareModal}
                            className="bg-primary text-on-primary hover:bg-primary-dim px-4 py-2 rounded-lg text-sm font-bold transition-colors outline-none shadow-sm shadow-primary/20 active:scale-95 flex items-center gap-2"
                        >
                            <span className="material-symbols-outlined text-[18px]">person_add</span>
                            <span className="hidden sm:inline">Share</span>
                        </button>
                    )}

                    {(document?.permission === 'owner' || document?.permission === 'editor') && (
                        <div className="relative">
                            <button
                                onClick={(e) => { e.stopPropagation(); setIsMenuOpen(!isMenuOpen); }}
                                className="p-2 rounded-full hover:bg-surface-container text-on-surface-variant transition-colors outline-none"
                            >
                                <span className="material-symbols-outlined">more_vert</span>
                            </button>

                            {isMenuOpen && (
                                <div
                                    className="absolute right-0 top-full mt-2 w-48 bg-surface-container-lowest border border-outline-variant/20 rounded-xl shadow-[0_8px_30px_rgba(0,0,0,0.12)] py-2 z-[100] animate-in fade-in slide-in-from-top-2 duration-200"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <button
                                        onClick={() => { setIsMenuOpen(false); setRenameData({ isOpen: true, title: document?.title || '' }); }}
                                        className="w-full text-left px-4 py-2 text-sm font-medium text-on-surface hover:bg-surface-container-low transition-colors flex items-center gap-3 outline-none"
                                    >
                                        <span className="material-symbols-outlined text-[18px]">edit</span>
                                        Rename
                                    </button>

                                    {document?.permission === 'owner' && (
                                        <>
                                            <button
                                                onClick={() => { setIsMenuOpen(false); handleToggleVisibility(); }}
                                                className="w-full text-left px-4 py-2 text-sm font-medium text-on-surface hover:bg-surface-container-low transition-colors flex items-center gap-3 outline-none"
                                            >
                                                <span className="material-symbols-outlined text-[18px]">
                                                    {document.visibility === 'private' ? 'public' : 'lock'}
                                                </span>
                                                Make {document.visibility === 'private' ? 'Public' : 'Private'}
                                            </button>

                                            <button
                                                onClick={() => { setIsMenuOpen(false); setConfirmDelete(true); }}
                                                className="w-full text-left px-4 py-1.5 text-[13px] font-medium text-error hover:bg-error-container/20 transition-colors flex items-center gap-3 outline-none"
                                            >
                                                <span className="material-symbols-outlined text-[16px]">delete</span>
                                                Delete
                                            </button>
                                        </>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </header>

            <main className="flex-1 flex justify-center py-10 px-6 overflow-hidden">
                <div className="w-full max-w-4xl h-full flex flex-col">
                    <textarea
                        value={content}
                        onChange={handleContentChange}
                        readOnly={document?.permission === 'viewer'}
                        placeholder={document?.permission === 'viewer' ? 'View only...' : 'Start typing...'}
                        className="w-full flex-1 resize-none outline-none bg-transparent text-on-surface text-lg leading-relaxed placeholder:text-outline-variant font-body min-h-[70vh]"
                    />
                </div>
            </main>

            {renameData.isOpen && (
                <div
                    className="fixed inset-0 bg-inverse-surface/40 backdrop-blur-[2px] z-[200] flex items-center justify-center p-4"
                    onClick={() => setRenameData({ isOpen: false, title: '' })}
                >
                    <div
                        className="bg-surface-container-lowest rounded-2xl w-full max-w-md p-6 shadow-[0_20px_60px_-10px_rgba(0,0,0,0.2)] animate-in fade-in zoom-in-95 duration-200"
                        onClick={(e) => e.stopPropagation()}
                    >
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
                                onClick={() => setRenameData({ isOpen: false, title: '' })}
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

            {confirmDelete && (
                <div
                    className="fixed inset-0 bg-inverse-surface/40 backdrop-blur-[2px] z-[200] flex items-center justify-center p-4"
                    onClick={() => setConfirmDelete(false)}
                >
                    <div
                        className="bg-surface-container-lowest rounded-2xl w-full max-w-md p-6 shadow-[0_20px_60px_-10px_rgba(0,0,0,0.2)] animate-in fade-in zoom-in-95 duration-200"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h3 className="text-xl font-bold font-headline text-on-surface mb-2">Are you sure?</h3>
                        <p className="text-on-surface-variant font-medium mb-6 text-sm leading-relaxed">
                            This document will be permanently deleted. This action cannot be undone.
                        </p>
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setConfirmDelete(false)}
                                className="px-4 py-2.5 text-sm font-semibold text-on-surface-variant hover:bg-surface-container-low rounded-xl transition-colors outline-none"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={executeDelete}
                                className="px-6 py-2.5 text-sm font-bold text-on-error bg-error hover:bg-error-dim rounded-xl transition-colors shadow-md shadow-error/20 active:scale-95 outline-none"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {isShareModalOpen && (
                <div
                    className="fixed inset-0 bg-inverse-surface/40 backdrop-blur-[2px] z-[200] flex items-center justify-center p-4"
                    onClick={() => setIsShareModalOpen(false)}
                >
                    <div
                        className="bg-surface-container-lowest rounded-2xl w-full max-w-lg p-6 shadow-[0_20px_60px_-10px_rgba(0,0,0,0.2)] animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-bold font-headline text-on-surface truncate pr-4">
                                Share "{document?.title}"
                            </h3>
                            <button onClick={() => setIsShareModalOpen(false)} className="text-on-surface-variant hover:text-on-surface p-1 rounded-full hover:bg-surface-container outline-none transition-colors">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>

                        <div className="flex items-center justify-between p-3 bg-surface-container-low rounded-xl mb-6">
                            <div className="flex items-center gap-3">
                                <span className="material-symbols-outlined text-primary">{document?.visibility === 'public' ? 'public' : 'lock'}</span>
                                <div>
                                    <p className="text-sm font-semibold text-on-surface">General Access</p>
                                    <p className="text-xs text-on-surface-variant">{document?.visibility === 'public' ? 'Anyone with the link can view' : 'Only invited people can access'}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button onClick={handleToggleVisibility} className="px-3 py-1.5 text-xs font-semibold text-on-surface-variant bg-surface-container hover:bg-surface-container-high rounded-lg transition-colors outline-none">
                                    Make {document?.visibility === 'private' ? 'Public' : 'Private'}
                                </button>
                                <button onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/document/${document?.id}`); }} className="px-3 py-1.5 text-xs font-semibold bg-primary text-on-primary rounded-lg transition-colors flex items-center gap-1 outline-none shadow-sm active:scale-95">
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
                                                    {u.full_name ? u.full_name.charAt(0).toUpperCase() : 'U'}
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
        </div>
    );
};

export default Editor;
