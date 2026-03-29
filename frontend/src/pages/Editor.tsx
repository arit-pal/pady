import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { apiClient } from '../api/Api';
import type { Document } from '../models/Models';

const Editor: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [document, setDocument] = useState<Document | null>(null);
    const [content, setContent] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDocument = async () => {
            try {
                const response = await apiClient.get<{ document: Document }>(`/documents/${id}`);
                setDocument(response.data.document);
                const meta = response.data.document.metadata as { content?: string };
                setContent(meta?.content || '');
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchDocument();
    }, [id]);

    const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setContent(e.target.value);
    };

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center bg-surface-container-lowest text-on-surface-variant font-medium">Loading editor...</div>;
    }

    return (
        <div className="min-h-screen bg-surface-container-lowest flex flex-col page-transition">
            <header className="flex items-center px-6 py-4 border-b border-surface-container-highest/20">
                <button
                    onClick={() => navigate('/dashboard')}
                    className="flex items-center gap-2 text-on-surface-variant hover:text-on-surface transition-colors font-medium text-sm"
                >
                    <span className="material-symbols-outlined text-[20px]">arrow_back</span>
                    Back to Dashboard
                </button>
                <div className="ml-6 text-sm font-bold text-on-surface">{document?.title || 'Untitled Document'}</div>
            </header>
            <main className="flex-1 flex justify-center py-10 px-6">
                <div className="w-full max-w-4xl h-full">
                    <textarea
                        value={content}
                        onChange={handleContentChange}
                        placeholder="Start typing..."
                        className="w-full h-[80vh] resize-none outline-none bg-transparent text-on-surface text-lg leading-relaxed placeholder:text-outline-variant font-body"
                    />
                </div>
            </main>
        </div>
    );
};

export default Editor;
