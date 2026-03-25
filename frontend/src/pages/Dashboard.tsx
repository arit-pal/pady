import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/Auth';
import { apiClient } from '../api/Api';
import type { Document } from '../models/Models';

const Dashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        const response = await apiClient.get<{ documents: Document[], total_count: number }>('/documents');
        setDocuments(response.data.documents || []);
      } catch (err) {
        console.error(err);
        setError('Failed to load documents.');
      } finally {
        setLoading(false);
      }
    };

    fetchDocuments();
  }, []);

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb', padding: '40px 20px' }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
          <div>
            <h1 style={{ margin: 0, color: '#111827', fontSize: '28px' }}>My Documents</h1>
            <p style={{ margin: '5px 0 0 0', color: '#6B7280' }}>Welcome back, {user?.full_name}</p>
          </div>
          <button
            onClick={logout}
            style={{ padding: '8px 16px', backgroundColor: '#EF4444', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '500' }}
          >
            Log Out
          </button>
        </div>

        {error && <p style={{ color: '#DC2626' }}>{error}</p>}

        {loading ? (
          <p style={{ color: '#6B7280' }}>Loading your workspace...</p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '20px' }}>

            <div style={{ border: '2px dashed #D1D5DB', borderRadius: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 20px', cursor: 'pointer', backgroundColor: '#ffffff', minHeight: '200px', transition: 'all 0.2s' }}>
              <span style={{ fontSize: '32px', color: '#007BFF', marginBottom: '10px' }}>+</span>
              <p style={{ margin: 0, fontWeight: '500', color: '#374151' }}>Blank Document</p>
            </div>

            {documents.map((doc) => (
              <div key={doc.id} style={{ border: '1px solid #E5E7EB', borderRadius: '12px', padding: '20px', backgroundColor: '#ffffff', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '200px', cursor: 'pointer' }}>
                <div>
                  <svg viewBox="0 0 24 24" width="24" height="24" stroke="#4B5563" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '15px' }}>
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                    <polyline points="14 2 14 8 20 8"></polyline>
                    <line x1="16" y1="13" x2="8" y2="13"></line>
                    <line x1="16" y1="17" x2="8" y2="17"></line>
                    <polyline points="10 9 9 9 8 9"></polyline>
                  </svg>
                  <h3 style={{ margin: '0 0 8px 0', color: '#111827', fontSize: '18px' }}>{doc.title}</h3>
                  <p style={{ margin: 0, color: '#6B7280', fontSize: '13px', textTransform: 'capitalize' }}>
                    {doc.visibility}
                  </p>
                </div>
                <div style={{ fontSize: '12px', color: '#9CA3AF', marginTop: '20px' }}>
                  Updated {new Date(doc.updated_at).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
