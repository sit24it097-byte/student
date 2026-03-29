import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  User, 
  Mail, 
  Calendar, 
  Shield, 
  LogOut, 
  Settings,
  Camera,
  CheckCircle2,
  Clock,
  BookOpen
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { format } from 'date-fns';
import { cn } from '../lib/utils';

export default function Profile() {
  const { profile, logout, updateProfile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [displayName, setDisplayName] = useState(profile?.displayName || '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateProfile({ displayName });
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update profile:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-10">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold tracking-tight mb-2 text-zinc-900">Profile</h1>
        <p className="text-zinc-500 text-lg">Manage your account and study preferences.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Profile Card */}
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="lg:col-span-1 bg-white border border-zinc-200 p-8 rounded-[40px] shadow-sm relative overflow-hidden"
        >
          <div className="relative z-10 flex flex-col items-center text-center">
            <div className="relative group mb-6">
              <div className="w-32 h-32 rounded-full bg-zinc-50 border-4 border-white flex items-center justify-center overflow-hidden shadow-xl">
                {profile?.photoURL ? (
                  <img src={profile.photoURL} alt={profile.displayName} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <User className="w-12 h-12 text-zinc-300" />
                )}
              </div>
              <button className="absolute bottom-0 right-0 p-2.5 bg-zinc-900 text-white rounded-full shadow-lg hover:scale-110 transition-transform">
                <Camera className="w-4 h-4" />
              </button>
            </div>

            {isEditing ? (
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="text-2xl font-bold mb-1 text-zinc-900 bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2 w-full text-center focus:outline-none focus:ring-2 focus:ring-zinc-900/10"
                placeholder="Enter display name"
              />
            ) : (
              <h2 className="text-3xl font-bold mb-1 text-zinc-900">{profile?.displayName || 'Student'}</h2>
            )}
            <p className="text-zinc-400 font-medium mb-8">{profile?.email}</p>

            <div className="w-full grid grid-cols-2 gap-4 mb-8">
              <div className="bg-zinc-50 p-4 rounded-2xl border border-zinc-100">
                <p className="text-zinc-400 text-[10px] font-black uppercase tracking-widest mb-1">Joined</p>
                <p className="text-sm font-bold text-zinc-900">{profile?.createdAt ? format(new Date(profile.createdAt), 'MMM yyyy') : 'N/A'}</p>
              </div>
              <div className="bg-zinc-50 p-4 rounded-2xl border border-zinc-100">
                <p className="text-zinc-400 text-[10px] font-black uppercase tracking-widest mb-1">Status</p>
                <p className="text-sm font-bold text-emerald-600">Active</p>
              </div>
            </div>

            {isEditing ? (
              <div className="w-full space-y-3 mb-4">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="w-full py-4 bg-zinc-900 text-white font-bold rounded-2xl hover:bg-zinc-800 transition-all active:scale-[0.98] disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
                <button
                  onClick={() => setIsEditing(false)}
                  className="w-full py-4 bg-zinc-100 text-zinc-900 font-bold rounded-2xl hover:bg-zinc-200 transition-all active:scale-[0.98]"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className="w-full py-4 bg-zinc-900 text-white font-bold rounded-2xl hover:bg-zinc-800 transition-all active:scale-[0.98] mb-4"
              >
                Edit Profile
              </button>
            )}
            <button
              onClick={logout}
              className="w-full py-4 bg-rose-50 text-rose-600 font-bold rounded-2xl hover:bg-rose-100 transition-all active:scale-[0.98]"
            >
              Sign Out
            </button>
          </div>

          {/* Background pattern */}
          <div className="absolute inset-0 opacity-5 pointer-events-none">
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-zinc-200 via-transparent to-transparent" />
          </div>
        </motion.div>

        {/* Settings / Info Section */}
        <div className="lg:col-span-2 space-y-8">
          {/* Account Details */}
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="bg-white border border-zinc-200 p-8 rounded-[40px] shadow-sm"
          >
            <div className="flex items-center gap-3 mb-8">
              <Settings className="w-6 h-6 text-zinc-900" />
              <h2 className="text-2xl font-bold text-zinc-900">Account Settings</h2>
            </div>

            <div className="space-y-6">
              <div className="flex items-center justify-between p-5 bg-zinc-50 rounded-3xl border border-zinc-100">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-100 rounded-xl">
                    <Mail className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-bold text-zinc-900">Email Address</p>
                    <p className="text-sm text-zinc-400">{profile?.email}</p>
                  </div>
                </div>
                <span className="px-3 py-1 bg-emerald-100 text-emerald-600 text-[10px] font-black uppercase rounded-full">Verified</span>
              </div>

              <div className="flex items-center justify-between p-5 bg-zinc-50 rounded-3xl border border-zinc-100">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-amber-100 rounded-xl">
                    <Shield className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="font-bold text-zinc-900">Security</p>
                    <p className="text-sm text-zinc-400">Two-factor authentication is active</p>
                  </div>
                </div>
                <button className="text-xs font-bold text-zinc-400 hover:text-zinc-900 transition-colors">Manage</button>
              </div>

              <div className="flex items-center justify-between p-5 bg-zinc-50 rounded-3xl border border-zinc-100">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-purple-100 rounded-xl">
                    <Calendar className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="font-bold text-zinc-900">Timezone</p>
                    <p className="text-sm text-zinc-400">UTC {new Date().getTimezoneOffset() / -60 >= 0 ? '+' : ''}{new Date().getTimezoneOffset() / -60}:00</p>
                  </div>
                </div>
                <button className="text-xs font-bold text-zinc-400 hover:text-zinc-900 transition-colors">Change</button>
              </div>
            </div>
          </motion.div>

          {/* Study Preferences */}
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="bg-white border border-zinc-200 p-8 rounded-[40px] shadow-sm"
          >
            <div className="flex items-center gap-3 mb-8">
              <BookOpen className="w-6 h-6 text-zinc-900" />
              <h2 className="text-2xl font-bold text-zinc-900">Study Preferences</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="p-6 bg-zinc-50 rounded-3xl border border-zinc-100">
                <p className="text-zinc-400 text-[10px] font-black uppercase tracking-widest mb-2">Daily Goal</p>
                <p className="text-3xl font-black text-zinc-900">4 Hours</p>
              </div>
              <div className="p-6 bg-zinc-50 rounded-3xl border border-zinc-100">
                <p className="text-zinc-400 text-[10px] font-black uppercase tracking-widest mb-2">Focus Mode</p>
                <p className="text-3xl font-black text-emerald-600">Enabled</p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
