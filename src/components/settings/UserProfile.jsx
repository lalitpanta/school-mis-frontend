import { useState, useEffect } from 'react';
import { User, Mail, Shield, Key, LogOut, ChevronDown, ChevronUp, Eye, EyeOff, AlertCircle, CheckCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../api/axiosInstance';
import { changeTenantPassword, changeTenantEmail, changeStaffPassword, changeStaffEmail } from '../../api/authApi';
import toast from 'react-hot-toast';
import clsx from 'clsx';

const UserProfile = () => {
  const { user, logout, userType } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expandedSections, setExpandedSections] = useState({
    profile: true,
    password: true,
    email: true,
    roles: true,
    permissions: true,
  });
  
  // Password change state
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwdLoading, setPwdLoading] = useState(false);
  const [showPasswords, setShowPasswords] = useState({ old: false, new: false, confirm: false });
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  
  // Email change state
  const [newEmail, setNewEmail] = useState('');
  const [emailPassword, setEmailPassword] = useState('');
  const [emailLoading, setEmailLoading] = useState(false);
  const [showEmailPassword, setShowEmailPassword] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [emailSuccess, setEmailSuccess] = useState('');

  // Fetch current user profile
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const response = await axiosInstance.get('/v1/users/me');
        if (response.data?.data) {
          setProfile(response.data.data);
        }
      } catch (err) {
        console.error('Failed to fetch profile:', err);
        toast.error('Failed to load profile');
      } finally {
        setLoading(false);
      }
    };

    if (user?.id) {
      fetchProfile();
    }
  }, [user?.id]);

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-muted">Loading profile...</div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-muted">Profile not found</div>
      </div>
    );
  }

  // Group permissions by resource
  const permissionsByResource = {};
  (profile.permissions || []).forEach(perm => {
    const [resource, action] = perm.split('.');
    if (!permissionsByResource[resource]) {
      permissionsByResource[resource] = [];
    }
    permissionsByResource[resource].push(action);
  });

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Header Card */}
      <div className="bg-subtle border border-default rounded-2xl p-8 mb-6">
        <div className="flex items-start gap-6">
          {/* Avatar */}
          <div className="w-24 h-24 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center flex-shrink-0 shadow-lg">
            <span className="text-3xl font-bold text-primary">
              {(profile.name || profile.email)
                .split(' ')
                .map((n) => n[0])
                .join('')
                .toUpperCase()
                .slice(0, 2)}
            </span>
          </div>

          {/* User Info */}
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-primary mb-1">
              {profile.name || 'User'}
            </h1>
            <div className="flex items-center gap-2 text-muted mb-4">
              <Mail size={16} />
              <span className="text-sm">{profile.email}</span>
            </div>

            {/* Roles */}
            {profile.roles && profile.roles.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {profile.roles.map((role) => (
                  <span
                    key={role.id}
                    className="px-3 py-1 rounded-full bg-accent-soft border border-accent text-accent text-xs font-medium"
                  >
                    {role.role_name}
                  </span>
                ))}
              </div>
            )}

            {/* Status */}
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-success" />
              <span className="text-xs text-muted">
                Account {profile.is_active ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="px-4 py-2 rounded-lg bg-danger-soft hover:bg-danger-soft border border-danger text-danger text-sm font-medium transition-colors flex items-center gap-2"
          >
            <LogOut size={16} />
            Logout
          </button>
        </div>
      </div>

      {/* Collapse/Expand All Buttons */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setExpandedSections({ profile: false, password: false, email: false, roles: false, permissions: false })}
          className="px-4 py-2 rounded-lg bg-subtle hover:bg-subtle border border-default text-muted text-sm font-medium transition-colors"
        >
          Collapse All
        </button>
        <button
          onClick={() => setExpandedSections({ profile: true, password: true, email: true, roles: true, permissions: true })}
          className="px-4 py-2 rounded-lg bg-accent hover:bg-accent border border-accent text-accent text-sm font-medium transition-colors"
        >
          Expand All
        </button>
      </div>

      {/* Roles Section */}
      <div className="bg-subtle border border-default rounded-2xl overflow-hidden mb-6">
        <button
          onClick={() => toggleSection('roles')}
          className="w-full px-8 py-4 flex items-center justify-between hover:bg-surface/5 transition-colors border-b border-default"
        >
          <div className="flex items-center gap-3">
            <Shield size={18} className="text-accent" />
            <h2 className="text-lg font-semibold text-primary">Assigned Roles</h2>
          </div>
          {expandedSections.roles ? (
            <ChevronUp size={18} className="text-muted" />
          ) : (
            <ChevronDown size={18} className="text-muted" />
          )}
        </button>

        {expandedSections.roles && (
          <div className="px-8 py-6">
            {profile.roles && profile.roles.length > 0 ? (
              <div className="space-y-4">
                {profile.roles.map((role) => (
                  <div
                    key={role.id}
                    className="bg-subtle rounded-lg p-4 border border-default"
                  >
                    <h3 className="text-base font-semibold text-primary mb-1">
                      {role.role_name}
                    </h3>
                    {role.description && (
                      <p className="text-xs text-muted leading-relaxed">
                        {role.description}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-muted text-sm">No roles assigned</div>
            )}
          </div>
        )}
      </div>

      {/* Permissions Section */}
      <div className="bg-subtle border border-default rounded-2xl overflow-hidden">
        <button
          onClick={() => toggleSection('permissions')}
          className="w-full px-8 py-4 flex items-center justify-between hover:bg-surface/5 transition-colors border-b border-default"
        >
          <div className="flex items-center gap-3">
            <Key size={18} className="text-success" />
            <h2 className="text-lg font-semibold text-primary">
              Permissions
              <span className="ml-2 text-sm font-normal text-muted">
                ({profile.permissions?.length || 0})
              </span>
            </h2>
          </div>
          {expandedSections.permissions ? (
            <ChevronUp size={18} className="text-muted" />
          ) : (
            <ChevronDown size={18} className="text-muted" />
          )}
        </button>

        {expandedSections.permissions && (
          <div className="px-8 py-6">
            {profile.permissions && profile.permissions.length > 0 ? (
              <div className="space-y-6">
                {Object.entries(permissionsByResource).map(([resource, actions]) => (
                  <div key={resource}>
                    <h3 className="text-sm font-semibold text-primary mb-3 capitalize">
                      {resource}
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                      {actions.map((action) => (
                        <div
                          key={`${resource}.${action}`}
                          className={clsx(
                            'px-3 py-2 rounded-lg text-xs font-medium text-center transition-colors',
                            action === 'view'
                              ? 'bg-accent-soft text-accent border border-accent'
                              : action === 'create'
                                ? 'bg-success text-success border border-success'
                                : action === 'edit'
                                  ? 'bg-warning-soft text-warning border border-warning'
                                  : action === 'delete'
                                    ? 'bg-danger-soft text-danger border border-danger'
                                    : 'bg-subtle text-muted border border-default'
                          )}
                        >
                          {action}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-muted text-sm">No permissions assigned</div>
            )}
          </div>
        )}
      </div>

      {/* Info Box */}
      <div className="mt-6 bg-subtle border border-default rounded-lg p-4 text-xs text-muted">
        <p>
          <strong>Note:</strong> Your profile shows the roles and permissions assigned to your account. Permissions control what actions you can perform in each feature. Contact your administrator if you need additional access.
        </p>
      </div>

      {/* Change Password Section */}
      <div className="mt-6 bg-subtle border border-default rounded-2xl overflow-hidden">
        <div className="w-full px-8 py-4 border-b border-default">
          <div className="flex items-center gap-3">
            <Key size={18} className="text-success" />
            <h2 className="text-lg font-semibold text-primary">Change Password</h2>
          </div>
        </div>
        <div className="px-8 py-6">
          <div className="space-y-4 max-w-md">
            <div>
              <label className="text-xs text-muted mb-1 block">Current Password</label>
              <input
                type="password"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-surface border border-default text-primary"
              />
            </div>

            <div>
              <label className="text-xs text-muted mb-1 block">New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-surface border border-default text-primary"
              />
            </div>

            <div>
              <label className="text-xs text-muted mb-1 block">Confirm New Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-surface border border-default text-primary"
              />
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={async () => {
                  // Client side validation
                  if (!oldPassword || !newPassword || !confirmPassword) {
                    toast.error('Please fill all fields');
                    return;
                  }
                  if (newPassword !== confirmPassword) {
                    toast.error('New passwords do not match');
                    return;
                  }
                  if (newPassword.length < 6) {
                    toast.error('New password must be at least 6 characters');
                    return;
                  }

                  try {
                    setPwdLoading(true);
                    const res = await axiosInstance.post('/v1/users/me/change-password', {
                      oldPassword,
                      newPassword,
                    });
                    toast.success(res.data?.message || 'Password changed successfully');
                    setOldPassword('');
                    setNewPassword('');
                    setConfirmPassword('');
                  } catch (err) {
                    console.error('Change password error', err);
                    const msg = err?.response?.data?.error || err?.response?.data?.message || 'Failed to change password';
                    toast.error(msg);
                  } finally {
                    setPwdLoading(false);
                  }
                }}
                disabled={pwdLoading}
                className="px-4 py-2 rounded-lg bg-success hover:bg-success text-primary text-sm font-medium"
              >
                {pwdLoading ? 'Saving...' : 'Change Password'}
              </button>

              <button
                onClick={() => {
                  setOldPassword('');
                  setNewPassword('');
                  setConfirmPassword('');
                }}
                className="px-4 py-2 rounded-lg bg-subtle text-muted text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Change Email Section */}
      <div className="mt-6 bg-subtle border border-default rounded-2xl overflow-hidden">
        <div className="w-full px-8 py-4 border-b border-default">
          <div className="flex items-center gap-3">
            <Mail size={18} className="text-accent" />
            <h2 className="text-lg font-semibold text-primary">Change Email</h2>
          </div>
        </div>
        <div className="px-8 py-6">
          <div className="space-y-4 max-w-md">
            <div>
              <label className="text-xs text-muted mb-1 block">New Email Address</label>
              <input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder={profile.email}
                className="w-full px-3 py-2 rounded-lg bg-surface border border-default text-primary"
              />
            </div>

            <div>
              <label className="text-xs text-muted mb-1 block">Current Password (for verification)</label>
              <input
                type={showEmailPassword ? "text" : "password"}
                value={emailPassword}
                onChange={(e) => setEmailPassword(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-surface border border-default text-primary"
              />
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={async () => {
                  // Client side validation
                  if (!newEmail || !emailPassword) {
                    toast.error('Please fill all fields');
                    return;
                  }
                  if (!newEmail.includes('@')) {
                    toast.error('Please enter a valid email');
                    return;
                  }
                  if (newEmail === profile.email) {
                    toast.error('New email must be different from current email');
                    return;
                  }

                  try {
                    setEmailLoading(true);
                    const res = await axiosInstance.post('/v1/users/me/change-email', {
                      newEmail,
                      password: emailPassword,
                    });
                    toast.success(res.data?.message || 'Email changed successfully');
                    setNewEmail('');
                    setEmailPassword('');
                    // Update profile email
                    setProfile(prev => ({...prev, email: newEmail}));
                  } catch (err) {
                    console.error('Change email error', err);
                    const msg = err?.response?.data?.error || err?.response?.data?.message || 'Failed to change email';
                    toast.error(msg);
                  } finally {
                    setEmailLoading(false);
                  }
                }}
                disabled={emailLoading}
                className="px-4 py-2 rounded-lg bg-accent hover:bg-accent text-primary text-sm font-medium"
              >
                {emailLoading ? 'Saving...' : 'Change Email'}
              </button>

              <button
                onClick={() => {
                  setNewEmail('');
                  setEmailPassword('');
                }}
                className="px-4 py-2 rounded-lg bg-subtle text-muted text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
