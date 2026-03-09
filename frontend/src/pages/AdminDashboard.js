import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import KnowledgePanel from '../components/KnowledgePanel';

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

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
      <div style={styles.content}>
        <div style={styles.statsRow}>
          <div style={styles.card}>
            <h3>Knowledge Base Manager</h3>
            <p>Admins can access the Knowledge Management panel below.</p>
          </div>
          <div style={styles.card}>
            <h3>User Management</h3>
            <p>Coming in Phase 4: Create agents and monitor activity.</p>
          </div>
        </div>
        
        {/* Reuse the KnowledgePanel specifically for Admins */}
        <div style={{...styles.card, marginTop: 24, height: 600, padding: 0, display: 'flex'}}>
            <KnowledgePanel onClose={() => alert('Can only close inside chat view')} />
        </div>
      </div>
    </div>
  );
}

const styles = {
  wrapper: { height: '100vh', background: '#0f172a', color: '#f1f5f9', fontFamily: 'sans-serif', overflowY: 'auto' },
  header: { display: 'flex', justifyContent: 'space-between', padding: '20px 40px', background: '#1e293b', borderBottom: '1px solid #334155' },
  btn: { padding: '8px 16px', marginLeft: 20, background: '#ef4444', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' },
  content: { padding: 40 },
  statsRow: { display: 'flex', gap: 24 },
  card: { background: '#1e293b', padding: 30, borderRadius: 10, border: '1px solid #334155', flex: 1, position: 'relative' }
};
