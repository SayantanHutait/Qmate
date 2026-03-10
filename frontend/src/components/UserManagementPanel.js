import React, { useState, useEffect } from 'react';
import { getUsers, createUser, deleteUser } from '../api/client';

export default function UserManagementPanel() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  // Form state
  const [universityId, setUniversityId] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState('student');
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await getUsers();
      setUsers(data);
    } catch (err) {
      console.error("Failed to fetch users", err);
      setError('Failed to fetch users. Ensure you have admin privileges.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError('');
    setFormSuccess('');

    try {
      await createUser({
        university_id: universityId,
        email,
        password,
        full_name: fullName || undefined, // Send undefined if empty
        role
      });
      setFormSuccess(`User ${email} created successfully.`);
      setUniversityId('');
      setEmail('');
      setPassword('');
      setFullName('');
      setRole('student');
      fetchUsers(); // Refresh the list
    } catch (err) {
      console.error("Failed to create user", err);
      setFormError(err.response?.data?.detail || 'Failed to create user.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteUser = async (userId, userEmail) => {
    if (!window.confirm(`Are you sure you want to delete user ${userEmail}?`)) {
      return;
    }

    try {
      await deleteUser(userId);
      fetchUsers(); // Refresh the list
    } catch (err) {
      console.error("Failed to delete user", err);
      alert(err.response?.data?.detail || 'Failed to delete user.');
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h3>👥 User Management</h3>
        <button onClick={fetchUsers} style={styles.refreshBtn}>Refresh</button>
      </div>

      <div style={styles.content}>
        {/* Left Side: Users List */}
        <div style={styles.listSection}>
          <h4>Existing Users</h4>
          {error && <div style={styles.errorBanner}>{error}</div>}
          
          {loading ? (
            <p>Loading users...</p>
          ) : (
            <div style={styles.tableContainer}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>ID</th>
                    <th style={styles.th}>UID</th>
                    <th style={styles.th}>Name</th>
                    <th style={styles.th}>Email</th>
                    <th style={styles.th}>Role</th>
                    <th style={styles.th}>Status</th>
                    <th style={styles.th}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.id}>
                      <td style={styles.td}>{u.id}</td>
                      <td style={styles.td}>{u.university_id}</td>
                      <td style={styles.td}>{u.full_name || '-'}</td>
                      <td style={styles.td}>{u.email}</td>
                      <td style={styles.td}>
                        <span style={roleBadge(u.role)}>{u.role}</span>
                      </td>
                      <td style={styles.td}>{u.is_active ? 'Active' : 'Inactive'}</td>
                      <td style={styles.td}>
                        <button 
                          onClick={() => handleDeleteUser(u.id, u.email)}
                          style={styles.deleteBtn}
                          title="Delete User"
                        >
                          🗑️
                        </button>
                      </td>
                    </tr>
                  ))}
                  {users.length === 0 && (
                    <tr>
                      <td colSpan="7" style={{...styles.td, textAlign: 'center'}}>No users found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right Side: Add User Form */}
        <div style={styles.formSection}>
          <h4>Create New User</h4>
          <form onSubmit={handleCreateUser} style={styles.form}>
            {formError && <div style={styles.errorMsg}>{formError}</div>}
            {formSuccess && <div style={styles.successMsg}>{formSuccess}</div>}

            <div style={styles.formGroup}>
              <label style={styles.label}>University ID (UID) *</label>
              <input 
                type="text" 
                value={universityId}
                onChange={e => setUniversityId(e.target.value)}
                required
                style={styles.input}
                placeholder="e.g. 10012345"
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Email *</label>
              <input 
                type="email" 
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                style={styles.input}
                placeholder="user@example.com"
              />
            </div>
            
            <div style={styles.formGroup}>
              <label style={styles.label}>Password *</label>
              <input 
                type="password" 
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                style={styles.input}
                placeholder="Required for login"
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Full Name (Optional)</label>
              <input 
                type="text" 
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                style={styles.input}
                placeholder="John Doe"
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Role *</label>
              <select 
                value={role} 
                onChange={e => setRole(e.target.value)}
                style={styles.input}
              >
                <option value="student">Student</option>
                <option value="agent">Agent</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            <button 
              type="submit" 
              disabled={formLoading || !email || !password || !universityId} 
              style={styles.submitBtn}
            >
              {formLoading ? 'Creating...' : 'Create User'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

const roleBadge = (role) => ({
  padding: '4px 8px',
  borderRadius: 12,
  fontSize: '0.8rem',
  fontWeight: 'bold',
  textTransform: 'uppercase',
  backgroundColor: role === 'admin' ? '#ef4444' : role === 'agent' ? '#3b82f6' : '#10b981',
  color: 'white',
});

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
    height: '100%',
    padding: 20,
    backgroundColor: '#1e293b',
    color: '#e2e8f0',
    borderRadius: 8,
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    borderBottom: '1px solid #334155',
    paddingBottom: 10,
  },
  refreshBtn: {
    padding: '6px 12px',
    backgroundColor: '#3b82f6',
    color: 'white',
    border: 'none',
    borderRadius: 4,
    cursor: 'pointer',
  },
  content: {
    display: 'flex',
    gap: 24,
    flex: 1,
    minHeight: 0, 
  },
  listSection: {
    flex: 2,
    display: 'flex',
    flexDirection: 'column',
    minHeight: 0,
    backgroundColor: '#0f172a',
    padding: 16,
    borderRadius: 8,
  },
  tableContainer: {
    overflowY: 'auto',
    flex: 1,
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  th: {
    textAlign: 'left',
    padding: '12px 8px',
    borderBottom: '2px solid #334155',
    color: '#94a3b8',
    position: 'sticky',
    top: 0,
    backgroundColor: '#0f172a',
  },
  td: {
    padding: '12px 8px',
    borderBottom: '1px solid #1e293b',
  },
  deleteBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: '1.2rem',
    opacity: 0.7,
  },
  formSection: {
    flex: 1,
    backgroundColor: '#0f172a',
    padding: 20,
    borderRadius: 8,
    borderLeft: '1px solid #334155',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
    marginTop: 16,
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  },
  label: {
    fontSize: '0.9rem',
    color: '#94a3b8',
  },
  input: {
    padding: '10px',
    borderRadius: 6,
    border: '1px solid #334155',
    backgroundColor: '#1e293b',
    color: 'white',
    outline: 'none',
  },
  submitBtn: {
    padding: '12px',
    backgroundColor: '#10b981',
    color: 'white',
    border: 'none',
    borderRadius: 6,
    fontWeight: 'bold',
    cursor: 'pointer',
    marginTop: 10,
  },
  errorBanner: {
    backgroundColor: '#ef444433',
    color: '#ef4444',
    padding: 10,
    borderRadius: 6,
    marginBottom: 10,
  },
  errorMsg: {
    color: '#ef4444',
    fontSize: '0.9rem',
  },
  successMsg: {
    color: '#10b981',
    fontSize: '0.9rem',
  },
};
