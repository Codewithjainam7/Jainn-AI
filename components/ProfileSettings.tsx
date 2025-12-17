import React, { useState } from 'react';
import { User } from '../types';
import { Edit2, Camera, Mail, Calendar, Award, Crown, Check, X } from 'lucide-react';

interface ProfileSettingsProps {
  user: User;
  userProfile: any;
  onSave: (displayName: string, themeColor: string) => Promise<void>;
}

export const ProfileSettings: React.FC<ProfileSettingsProps> = ({ user, userProfile, onSave }) => {
  const [editMode, setEditMode] = useState(false);
  const [editDisplayName, setEditDisplayName] = useState(user.displayName || user.email.split('@')[0]);
  const [selectedThemeColor, setSelectedThemeColor] = useState(user.themeColor);
  const [saving, setSaving] = useState(false);

  const themeColors = [
    '#3B82F6', // Blue
    '#8B5CF6', // Purple
    '#EC4899', // Pink
    '#F59E0B', // Amber
    '#10B981', // Green
    '#EF4444', // Red
    '#6366F1', // Indigo
    '#14B8A6'  // Teal
  ];

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(editDisplayName, selectedThemeColor);
      setEditMode(false);
    } catch (error) {
      console.error('Failed to save profile:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditDisplayName(user.displayName || user.email.split('@')[0]);
    setSelectedThemeColor(user.themeColor);
    setEditMode(false);
  };

  const getUserInitials = () => {
    if (userProfile?.name) {
      const names = userProfile.name.split(' ');
      if (names.length >= 2) {
        return (names[0][0] + names[1][0]).toUpperCase();
      }
      return userProfile.name.substring(0, 2).toUpperCase();
    }
    if (user.displayName) {
      return user.displayName.substring(0, 2).toUpperCase();
    }
    return user.email.substring(0, 2).toUpperCase();
  };

  const getUserAvatar = () => {
    return userProfile?.avatar || null;
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h3 className="text-2xl font-bold mb-2 dark:text-white">Profile Settings</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Manage your account information and preferences</p>
        
        {/* Profile Picture & Info */}
        <div className="flex flex-col sm:flex-row items-center gap-6 p-6 bg-gray-50 dark:bg-[#0D1117] rounded-2xl border border-gray-200 dark:border-white/5 mb-6">
          <div className="relative flex-shrink-0">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-3xl shadow-xl overflow-hidden">
              {getUserAvatar() ? (
                <img src={getUserAvatar()!} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                getUserInitials()
              )}
            </div>
            <button 
              className="absolute bottom-0 right-0 p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 shadow-lg transition-colors"
              disabled={user.tier === 'guest'}
            >
              <Camera size={16} />
            </button>
          </div>
          
          <div className="flex-1 text-center sm:text-left">
            <h4 className="text-lg font-bold dark:text-white mb-1">
              {user.displayName || userProfile?.name || user.email.split('@')[0]}
            </h4>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">{user.email}</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mb-3 flex items-center justify-center sm:justify-start gap-2">
              {user.tier === 'pro' && <Crown size={14} className="text-yellow-500" />}
              {user.tier === 'ultra' && <Crown size={14} className="text-purple-500" />}
              {user.tier.toUpperCase()} Plan
              {userProfile?.provider === 'google' && (
                <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-full">
                  Google
                </span>
              )}
            </p>
            
            {!editMode ? (
              <button 
                onClick={() => setEditMode(true)}
                className="text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 mx-auto sm:mx-0"
              >
                <Edit2 size={12} /> Edit Profile
              </button>
            ) : (
              <div className="flex gap-2 justify-center sm:justify-start">
                <button 
                  onClick={handleSave}
                  disabled={saving}
                  className="px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium transition-colors disabled:opacity-50 flex items-center gap-1"
                >
                  <Check size={14} /> {saving ? 'Saving...' : 'Save'}
                </button>
                <button 
                  onClick={handleCancel}
                  className="px-3 py-1 bg-gray-200 dark:bg-white/10 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-white/20 text-sm font-medium transition-colors flex items-center gap-1"
                >
                  <X size={14} /> Cancel
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Editable Fields */}
        {editMode && (
          <div className="space-y-4 mb-6">
            <div className="p-4 bg-gray-50 dark:bg-[#0D1117] rounded-xl border border-gray-200 dark:border-white/5">
              <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-2 mb-2">
                Display Name
              </label>
              <input 
                type="text" 
                value={editDisplayName}
                onChange={(e) => setEditDisplayName(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-white dark:bg-[#161B22] border border-gray-200 dark:border-white/10 text-sm dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="Your display name"
              />
            </div>

            <div className="p-4 bg-gray-50 dark:bg-[#0D1117] rounded-xl border border-gray-200 dark:border-white/5">
              <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-2 mb-3">
                Theme Color
              </label>
              <div className="grid grid-cols-8 gap-3">
                {themeColors.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setSelectedThemeColor(color)}
                    className={`w-full aspect-square rounded-xl transition-all hover:scale-110 ${
                      selectedThemeColor === color ? 'ring-2 ring-offset-2 ring-blue-500 dark:ring-offset-[#161B22]' : ''
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Account Information (Read-only) */}
        <div className="space-y-4">
          <div className="p-4 bg-gray-50 dark:bg-[#0D1117] rounded-xl border border-gray-200 dark:border-white/5">
            <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-2 mb-2">
              <Mail size={14} /> Email Address
            </label>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <p className="text-sm font-medium dark:text-white break-all">{user.email}</p>
              {user.tier !== 'guest' && (
                <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 px-2 py-1 rounded-full w-fit">
                  Verified
                </span>
              )}
            </div>
          </div>

          <div className="p-4 bg-gray-50 dark:bg-[#0D1117] rounded-xl border border-gray-200 dark:border-white/5">
  <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-2 mb-2">
    <Calendar size={14} /> Member Since
  </label>
  <p className="text-sm font-medium dark:text-white">
    {userProfile?.created_at 
      ? new Date(userProfile.created_at).toLocaleDateString('en-US', { 
          month: 'long', 
          year: 'numeric' 
        })
      : 'December 2025'
    }
  </p>
</div>

          {/* Usage Stats */}
          <div className="p-4 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl border border-blue-200 dark:border-blue-500/30">
            <h4 className="text-sm font-bold dark:text-white mb-4 flex items-center gap-2">
              <Award size={16} className="text-blue-600 dark:text-blue-400" />
              Usage Statistics
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Tokens Used</p>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{user.tokensUsed.toLocaleString()}</p>
                <p className="text-xs text-gray-500 dark:text-gray-500">
                  {user.tier === 'free' && '/ 5,000 daily'}
                  {user.tier === 'pro' && '/ 50,000 daily'}
                  {user.tier === 'ultra' && 'Unlimited'}
                  {user.tier === 'guest' && '/ Limited'}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Images Generated</p>
                <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{user.imagesGenerated}</p>
                <p className="text-xs text-gray-500 dark:text-gray-500">
                  {user.tier === 'free' && '/ 3 daily'}
                  {user.tier === 'pro' && '/ 20 daily'}
                  {user.tier === 'ultra' && '/ 30 daily'}
                  {user.tier === 'guest' && '/ 0 daily'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
