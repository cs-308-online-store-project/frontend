import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { userAPI } from '../services/api';

export default function Profile() {
  const navigate = useNavigate();
  
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    tax_id: '',
    address: '',
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await userAPI.getProfile();
      const user = response.data.data;
      
      setProfile(user);
      setFormData({
        name: user.name || '',
        tax_id: user.tax_id || '',
        address: user.address || '',
      });
    } catch (error) {
      console.error('Fetch profile error:', error);
      alert('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      alert('Name is required');
      return;
    }

    setSaving(true);

    try {
      const response = await userAPI.updateProfile(formData);
      
      if (response.data.success) {
        setProfile(response.data.data);
        setEditing(false);
        alert('✅ Profile updated successfully!');
        
        // Update localStorage user
        const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
        localStorage.setItem('user', JSON.stringify({
          ...storedUser,
          name: response.data.data.name,
        }));
        window.dispatchEvent(new Event('loginStateChanged'));
      }
    } catch (error) {
      console.error('Update profile error:', error);
      alert(error.response?.data?.error || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      name: profile.name || '',
      tax_id: profile.tax_id || '',
      address: profile.address || '',
    });
    setEditing(false);
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loading}>Loading profile...</div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div style={styles.container}>
        <div style={styles.error}>Failed to load profile</div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>My Profile</h1>
        <button style={styles.backBtn} onClick={() => navigate('/products')}>
          ← Back to Store
        </button>
      </div>

      <div style={styles.card}>
        {!editing ? (
          // View Mode
          <div>
            <div style={styles.section}>
              <div style={styles.field}>
                <label style={styles.label}>User ID</label>
                <p style={styles.value}>#{profile.id}</p>
              </div>

              <div style={styles.field}>
                <label style={styles.label}>Name</label>
                <p style={styles.value}>{profile.name}</p>
              </div>

              <div style={styles.field}>
                <label style={styles.label}>Tax ID</label>
                <p style={styles.value}>{profile.tax_id || 'Not provided'}</p>
              </div>

              <div style={styles.field}>
                <label style={styles.label}>Email</label>
                <p style={styles.value}>{profile.email}</p>
              </div>

              <div style={styles.field}>
                <label style={styles.label}>Home Address</label>
                <p style={styles.value}>{profile.address || 'Not provided'}</p>
              </div>

              <div style={styles.field}>
                <label style={styles.label}>Role</label>
                <p style={styles.value}>
                  {profile.role.replace('_', ' ').toUpperCase()}
                </p>
              </div>
            </div>

            <button 
              style={styles.editBtn} 
              onClick={() => setEditing(true)}
            >
              Edit Profile
            </button>
          </div>
        ) : (
          // Edit Mode
          <form onSubmit={handleSubmit}>
            <div style={styles.section}>
              <div style={styles.field}>
                <label style={styles.label}>User ID</label>
                <p style={styles.valueDisabled}>#{profile.id}</p>
              </div>

              <div style={styles.field}>
                <label style={styles.label}>Name *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  style={styles.input}
                  required
                />
              </div>

              <div style={styles.field}>
                <label style={styles.label}>Tax ID</label>
                <input
                  type="text"
                  name="tax_id"
                  value={formData.tax_id}
                  onChange={handleChange}
                  style={styles.input}
                  placeholder="Enter your tax ID"
                />
              </div>

              <div style={styles.field}>
                <label style={styles.label}>Email</label>
                <p style={styles.valueDisabled}>{profile.email}</p>
              </div>

              <div style={styles.field}>
                <label style={styles.label}>Home Address</label>
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  style={styles.textarea}
                  placeholder="Enter your home address"
                  rows="3"
                />
              </div>
            </div>

            <div style={styles.actions}>
              <button 
                type="submit" 
                style={styles.saveBtn}
                disabled={saving}
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
              <button 
                type="button" 
                style={styles.cancelBtn}
                onClick={handleCancel}
                disabled={saving}
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

const styles = {
  container: {
    maxWidth: '800px',
    margin: '0 auto',
    padding: '2rem 1.5rem',
    fontFamily: "'Inter', system-ui, sans-serif",
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '2rem',
  },
  title: {
    fontSize: '2rem',
    fontWeight: 800,
    margin: 0,
    color: '#0f172a',
  },
  backBtn: {
    background: 'white',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    padding: '0.6rem 1rem',
    cursor: 'pointer',
    fontWeight: 600,
    color: '#0f172a',
  },
  loading: {
    textAlign: 'center',
    padding: '3rem',
    color: '#64748b',
  },
  error: {
    textAlign: 'center',
    padding: '3rem',
    color: '#ef4444',
  },
  card: {
    background: 'white',
    border: '1px solid #e2e8f0',
    borderRadius: '12px',
    padding: '2rem',
  },
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem',
    marginBottom: '2rem',
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  label: {
    fontSize: '0.875rem',
    fontWeight: 700,
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  value: {
    fontSize: '1rem',
    color: '#0f172a',
    margin: 0,
  },
  valueDisabled: {
    fontSize: '1rem',
    color: '#94a3b8',
    margin: 0,
  },
  input: {
    padding: '0.75rem',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    fontSize: '1rem',
    fontFamily: 'inherit',
  },
  textarea: {
    padding: '0.75rem',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    fontSize: '1rem',
    fontFamily: 'inherit',
    resize: 'vertical',
  },
  editBtn: {
    background: '#111827',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    padding: '0.75rem 1.5rem',
    cursor: 'pointer',
    fontWeight: 600,
    fontSize: '1rem',
    width: '100%',
  },
  actions: {
    display: 'flex',
    gap: '1rem',
  },
  saveBtn: {
    flex: 1,
    background: '#111827',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    padding: '0.75rem 1.5rem',
    cursor: 'pointer',
    fontWeight: 600,
    fontSize: '1rem',
  },
  cancelBtn: {
    flex: 1,
    background: 'white',
    color: '#0f172a',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    padding: '0.75rem 1.5rem',
    cursor: 'pointer',
    fontWeight: 600,
    fontSize: '1rem',
  },
};