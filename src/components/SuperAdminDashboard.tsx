import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { celebrationService } from '../lib/celebrationService';
import { UserProfile, CelebrationConfig } from '../types';
import {
  Users,
  Shield,
  Sparkles,
  ExternalLink,
  Trash2,
  Copy,
  Check,
  Search,
  Calendar,
  Heart,
  Mic,
  FileText,
  Music,
  ArrowLeft,
  RefreshCw,
} from 'lucide-react';

interface SuperAdminDashboardProps {
  onBackToApp: () => void;
  onPreviewCelebration: (id: string) => void;
}

export const SuperAdminDashboard: React.FC<SuperAdminDashboardProps> = ({
  onBackToApp,
  onPreviewCelebration,
}) => {
  const { user, userProfile } = useAuth();
  const [activeTab, setActiveTab] = useState<'users' | 'celebrations'>('users');
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [celebrations, setCelebrations] = useState<CelebrationConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const adminEmail = user?.email || userProfile?.email;
      const [usersList, celebrationsList] = await Promise.all([
        celebrationService.getAllUsers(adminEmail),
        celebrationService.getAllCelebrations(),
      ]);
      setUsers(usersList);
      setCelebrations(celebrationsList);
    } catch (err) {
      console.error('Failed to load admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCopy = (id: string) => {
    const link = `${window.location.origin}/?c=${id}`;
    navigator.clipboard.writeText(link);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handleDeleteCelebration = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete the celebration for "${name}"?`)) {
      return;
    }
    try {
      await celebrationService.deleteCelebration(id, {
        userId: user?.uid || userProfile?.uid,
        userEmail: user?.email || userProfile?.email,
      });
      setCelebrations((prev) => prev.filter((c) => c.id !== id));
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  const filteredUsers = users.filter((u) => {
    const q = searchQuery.toLowerCase();
    return (
      u.email.toLowerCase().includes(q) ||
      (u.displayName && u.displayName.toLowerCase().includes(q)) ||
      u.uid.toLowerCase().includes(q)
    );
  });

  const filteredCelebrations = celebrations.filter((c) => {
    const q = searchQuery.toLowerCase();
    return (
      c.recipientName.toLowerCase().includes(q) ||
      c.id.toLowerCase().includes(q) ||
      (c.userEmail && c.userEmail.toLowerCase().includes(q)) ||
      (c.nickname && c.nickname.toLowerCase().includes(q))
    );
  });

  const totalUsers = users.length;
  const totalCelebrations = celebrations.length;
  const voiceNotesCount = celebrations.filter((c) => c.voiceAudioUrl || c.letterType === 'voice' || c.letterType === 'both').length;

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#241318] flex flex-col font-sans">
      {/* Top Navbar */}
      <header className="bg-white/95 backdrop-blur-md border-b border-[#EADBDA] px-3.5 sm:px-8 py-3 sm:py-3.5 sticky top-0 z-30 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr from-[#8B1E3F] to-[#D4AF37] flex items-center justify-center text-white shadow-xs shrink-0">
            <Shield className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <h1 className="font-serif text-base sm:text-lg font-bold text-[#4A1525] truncate">
                <span className="hidden sm:inline">Eyan mi · </span>Admin
              </h1>
              <span className="px-2 py-0.5 rounded-full bg-[#FFF0F2] text-[#8B1E3F] text-[10px] font-bold uppercase tracking-wider border border-[#F5CDD3] shrink-0">
                Super Admin
              </span>
            </div>
            <p className="text-[11px] sm:text-xs text-[#8C6B73] truncate">
              Manage accounts, celebrations, and metrics
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          <button
            type="button"
            onClick={loadData}
            disabled={loading}
            className="p-1.5 sm:p-2 rounded-xl border border-[#EADBDA] bg-white text-[#6E4F57] hover:bg-[#FAF7F2] transition-colors cursor-pointer"
            title="Refresh data"
            aria-label="Refresh data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            type="button"
            onClick={onBackToApp}
            className="px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl bg-[#8B1E3F] text-white text-xs font-semibold hover:bg-[#721532] transition-colors flex items-center gap-1 cursor-pointer shadow-xs"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Return to App</span>
            <span className="sm:hidden">Exit</span>
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-8 space-y-6">
        {/* KPI Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl p-5 border border-[#EADBDA] shadow-xs flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-[#8C6B73] uppercase tracking-wider">
                Total Registered Users
              </span>
              <h3 className="font-serif text-3xl font-bold text-[#4A1525] mt-1">
                {totalUsers}
              </h3>
              <p className="text-[11px] text-[#6E4F57] mt-0.5">
                Accounts created across the platform
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-[#FFF0F2] text-[#8B1E3F] flex items-center justify-center">
              <Users className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-[#EADBDA] shadow-xs flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-[#8C6B73] uppercase tracking-wider">
                Total Celebrations
              </span>
              <h3 className="font-serif text-3xl font-bold text-[#4A1525] mt-1">
                {totalCelebrations}
              </h3>
              <p className="text-[11px] text-[#6E4F57] mt-0.5">
                Personalized pages & epistles created
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center">
              <Heart className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-[#EADBDA] shadow-xs flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-[#8C6B73] uppercase tracking-wider">
                Voice Narrations
              </span>
              <h3 className="font-serif text-3xl font-bold text-[#4A1525] mt-1">
                {voiceNotesCount}
              </h3>
              <p className="text-[11px] text-[#6E4F57] mt-0.5">
                Celebrations featuring recorded audio
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <Mic className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Tab Controls & Search */}
        <div className="bg-white rounded-2xl p-4 sm:p-6 border border-[#EADBDA] shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setActiveTab('users')}
                className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
                  activeTab === 'users'
                    ? 'bg-[#8B1E3F] text-white shadow-xs'
                    : 'bg-[#FAF7F2] text-[#6E4F57] hover:bg-[#F2EAE5]'
                }`}
              >
                <Users className="w-4 h-4" />
                <span>All Users ({users.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('celebrations')}
                className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
                  activeTab === 'celebrations'
                    ? 'bg-[#8B1E3F] text-white shadow-xs'
                    : 'bg-[#FAF7F2] text-[#6E4F57] hover:bg-[#F2EAE5]'
                }`}
              >
                <Heart className="w-4 h-4" />
                <span>All Celebrations ({celebrations.length})</span>
              </button>
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-[#8C6B73] absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={activeTab === 'users' ? 'Search by email or name...' : 'Search recipient or creator...'}
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-[#D5C2C6] bg-[#FAF7F2] text-xs font-medium focus:outline-[#8B1E3F]"
              />
            </div>
          </div>

          {/* TAB 1: USERS LIST */}
          {activeTab === 'users' && (
            <div className="overflow-x-auto">
              {loading ? (
                <div className="py-12 text-center text-xs text-[#8C6B73]">
                  Loading registered users...
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="py-12 text-center text-xs text-[#8C6B73]">
                  No users found matching "{searchQuery}"
                </div>
              ) : (
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-[#EADBDA] text-[#8C6B73] font-semibold uppercase tracking-wider">
                      <th className="py-3 px-3">User</th>
                      <th className="py-3 px-3">Email Address</th>
                      <th className="py-3 px-3">Role</th>
                      <th className="py-3 px-3">Celebrations</th>
                      <th className="py-3 px-3">Joined Date</th>
                      <th className="py-3 px-3">Last Active</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F2EAE5]">
                    {filteredUsers.map((u) => (
                      <tr key={u.uid} className="hover:bg-[#FAF7F2]/60 transition-colors">
                        <td className="py-3.5 px-3">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-[#8B1E3F]/10 text-[#8B1E3F] font-bold flex items-center justify-center shrink-0 uppercase">
                              {u.displayName ? u.displayName.charAt(0) : u.email.charAt(0)}
                            </div>
                            <div>
                              <div className="font-semibold text-[#4A1525]">
                                {u.displayName || 'Creator'}
                              </div>
                              <div className="text-[10px] text-[#8C6B73] font-mono">
                                {u.uid.slice(0, 12)}...
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-3 font-medium text-[#241318]">
                          {u.email}
                        </td>
                        <td className="py-3.5 px-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              u.role === 'admin'
                                ? 'bg-purple-100 text-purple-800'
                                : 'bg-gray-100 text-gray-700'
                            }`}
                          >
                            {u.role === 'admin' ? 'Super Admin' : 'User'}
                          </span>
                        </td>
                        <td className="py-3.5 px-3 font-semibold text-[#8B1E3F]">
                          {u.celebrationsCount || 0}
                        </td>
                        <td className="py-3.5 px-3 text-[#6E4F57]">
                          {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '—'}
                        </td>
                        <td className="py-3.5 px-3 text-[#6E4F57]">
                          {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleDateString() : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {/* TAB 2: CELEBRATIONS LIST */}
          {activeTab === 'celebrations' && (
            <div className="overflow-x-auto">
              {loading ? (
                <div className="py-12 text-center text-xs text-[#8C6B73]">
                  Loading celebrations...
                </div>
              ) : filteredCelebrations.length === 0 ? (
                <div className="py-12 text-center text-xs text-[#8C6B73]">
                  No celebrations found matching "{searchQuery}"
                </div>
              ) : (
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-[#EADBDA] text-[#8C6B73] font-semibold uppercase tracking-wider">
                      <th className="py-3 px-3">Celebrant</th>
                      <th className="py-3 px-3">Creator Email</th>
                      <th className="py-3 px-3">Occasion</th>
                      <th className="py-3 px-3">Format</th>
                      <th className="py-3 px-3">Soundtrack</th>
                      <th className="py-3 px-3">Photos</th>
                      <th className="py-3 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F2EAE5]">
                    {filteredCelebrations.map((c) => (
                      <tr key={c.id} className="hover:bg-[#FAF7F2]/60 transition-colors">
                        <td className="py-3.5 px-3">
                          <div className="font-semibold text-[#4A1525]">
                            {c.recipientName}
                          </div>
                          <div className="text-[10px] text-[#8C6B73]">
                            Slug: /{c.id}
                          </div>
                        </td>
                        <td className="py-3.5 px-3 font-medium text-[#241318]">
                          {c.userEmail || 'Anonymous'}
                        </td>
                        <td className="py-3.5 px-3">
                          <span className="capitalize px-2 py-0.5 rounded-full bg-[#FAF7F2] border border-[#EADBDA] text-[11px] font-medium text-[#6E4F57]">
                            {c.occasion || 'Birthday'}
                          </span>
                        </td>
                        <td className="py-3.5 px-3">
                          <div className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#8B1E3F]">
                            {c.letterType === 'voice' && <Mic className="w-3.5 h-3.5" />}
                            {c.letterType === 'typed' && <FileText className="w-3.5 h-3.5" />}
                            {(!c.letterType || c.letterType === 'both') && (
                              <>
                                <FileText className="w-3.5 h-3.5" />
                                <Mic className="w-3.5 h-3.5" />
                              </>
                            )}
                            <span className="capitalize">{c.letterType || 'Both'}</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-3 text-[#6E4F57] capitalize">
                          {c.soundtrackPreset || 'none'}
                        </td>
                        <td className="py-3.5 px-3 text-[#6E4F57]">
                          {(c.loaderPhotos?.length || 0) + (c.photos?.length || 0)} photos
                        </td>
                        <td className="py-3.5 px-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleCopy(c.id)}
                              className="p-1.5 rounded-lg border border-[#EADBDA] bg-white text-[#6E4F57] hover:text-[#8B1E3F] hover:bg-[#FAF7F2] transition-colors cursor-pointer"
                              title="Copy celebrant link"
                            >
                              {copiedId === c.id ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                            </button>
                            <button
                              type="button"
                              onClick={() => onPreviewCelebration(c.id)}
                              className="p-1.5 rounded-lg border border-[#EADBDA] bg-white text-[#6E4F57] hover:text-[#8B1E3F] hover:bg-[#FAF7F2] transition-colors cursor-pointer"
                              title="Open Celebrant Experience"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteCelebration(c.id, c.recipientName)}
                              className="p-1.5 rounded-lg border border-rose-200 bg-white text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                              title="Delete celebration"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};
