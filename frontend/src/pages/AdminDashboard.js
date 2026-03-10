import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import KnowledgePanel from '../components/KnowledgePanel';
import UserManagementPanel from '../components/UserManagementPanel';
import AdminChatReviewPanel from '../components/AdminChatReviewPanel';

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('users'); // 'users', 'knowledge', 'chats'

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div style={styles.wrapper}>
      <div style={styles.header}>
        <h2>🛡️ Admin Dashboard</h2>
        <div>
          <span>{user?.email} ({user?.role}) </span>
          <button onClick={handleLogout} style={styles.btn}>Logout</button>
        </div>
      </div>
      
      {/* Tabs Navigation */}
      <div style={styles.tabsContainer}>
        <button 
          style={activeTab === 'users' ? styles.activeTab : styles.tab} 
          onClick={() => setActiveTab('users')}
        >
          User Management
        </button>
        <button 
          style={activeTab === 'knowledge' ? styles.activeTab : styles.tab} 
          onClick={() => setActiveTab('knowledge')}
        >
          Knowledge Management
        </button>
        <button 
          style={activeTab === 'chats' ? styles.activeTab : styles.tab} 
          onClick={() => setActiveTab('chats')}
        >
          Human Chat Review
        </button>
      </div>

      <div style={styles.content}>
        {activeTab === 'users' && (
          <div style={styles.card}>
            <UserManagementPanel />
          </div>
        )}
        
        {activeTab === 'knowledge' && (
          <div style={{...styles.card, padding: 0, display: 'flex', flexDirection: 'column'}}>
            <div style={{ padding: 20, borderBottom: '1px solid #334155' }}>
              <h3>Knowledge Management</h3>
            </div>
            <div style={{ height: 600 }}>
              <KnowledgePanel onClose={() => alert('Can only close inside chat view')} />
            </div>
          </div>
        )}

        {activeTab === 'chats' && (
          <div style={{...styles.card, height: 600, padding: 0, display: 'flex'}}>
              <AdminChatReviewPanel />
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  wrapper: { height: '100vh', background: '#0f172a', color: '#f1f5f9', fontFamily: 'sans-serif', overflowY: 'auto' },
  header: { display: 'flex', justifyContent: 'space-between', padding: '20px 40px', background: '#1e293b', borderBottom: '1px solid #334155' },
  btn: { padding: '8px 16px', marginLeft: 20, background: '#ef4444', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' },
  tabsContainer: { display: 'flex', borderBottom: '1px solid #334155', background: '#1e293b', padding: '0 40px' },
  tab: { padding: '16px 24px', background: 'transparent', color: '#94a3b8', border: 'none', cursor: 'pointer', fontSize: '1rem', fontWeight: '500' },
  activeTab: { padding: '16px 24px', background: 'transparent', color: '#3b82f6', border: 'none', borderBottom: '2px solid #3b82f6', cursor: 'pointer', fontSize: '1rem', fontWeight: 'bold' },
  content: { padding: 40 },
  card: { background: '#1e293b', padding: 30, borderRadius: 10, border: '1px solid #334155', flex: 1, position: 'relative' }
};
