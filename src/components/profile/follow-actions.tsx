'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  UserPlus, UserCheck, Users, ShieldCheck, 
  X, Search, ArrowRight, Loader2 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar } from '@/components/ui/avatar';
import { CustechLogoLoader } from '@/components/ui/custech-loader';
import { toast } from '@/components/ui/toast';
import { 
  toggleFollowUser, 
  getFollowStats, 
  getFollowersAndFollowingUsers 
} from '@/app/profile/actions';

interface FollowActionsProps {
  targetUserId: string;
  isOwnProfile: boolean;
  initialStats?: {
    followersCount: number;
    followingCount: number;
    isFollowing: boolean;
  };
}

export function FollowActions({ 
  targetUserId, 
  isOwnProfile, 
  initialStats = { followersCount: 0, followingCount: 0, isFollowing: false } 
}: FollowActionsProps) {
  const [isFollowing, setIsFollowing] = useState(initialStats.isFollowing);
  const [followersCount, setFollowersCount] = useState(initialStats.followersCount);
  const [followingCount, setFollowingCount] = useState(initialStats.followingCount);
  const [isPending, setIsPending] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'followers' | 'following'>('followers');
  const [usersList, setUsersList] = useState<{ followers: any[]; following: any[] }>({
    followers: [],
    following: [],
  });
  const [loadingList, setLoadingList] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch initial live stats
  useEffect(() => {
    getFollowStats(targetUserId)
      .then((stats) => {
        setIsFollowing(stats.isFollowing);
        setFollowersCount(stats.followersCount);
        setFollowingCount(stats.followingCount);
      })
      .catch((err) => console.error('Failed to get follow stats:', err));
  }, [targetUserId]);

  const handleToggleFollow = async () => {
    if (isPending) return;

    // Optimistic update
    const previousFollowingState = isFollowing;
    const previousFollowersCount = followersCount;

    setIsFollowing(!previousFollowingState);
    setFollowersCount(prev => previousFollowingState ? Math.max(0, prev - 1) : prev + 1);
    setIsPending(true);

    try {
      const res = await toggleFollowUser(targetUserId);
      setIsFollowing(res.isFollowing);
      toast.success(res.message);
    } catch (err: any) {
      // Revert on error
      setIsFollowing(previousFollowingState);
      setFollowersCount(previousFollowersCount);
      toast.error(err.message || 'Failed to update follow status.');
    } finally {
      setIsPending(false);
    }
  };

  const handleOpenModal = (tab: 'followers' | 'following') => {
    setActiveTab(tab);
    setModalOpen(true);
    setLoadingList(true);

    getFollowersAndFollowingUsers(targetUserId)
      .then((data) => {
        setUsersList(data);
      })
      .catch((err) => {
        console.error('Failed to load user list:', err);
      })
      .finally(() => {
        setLoadingList(false);
      });
  };

  const currentList = activeTab === 'followers' ? usersList.followers : usersList.following;
  const filteredList = currentList.filter(u => 
    u.display_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.department?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      <div className="flex flex-wrap items-center gap-3">
        {/* Follow Stats Pills (Clickable) */}
        <button
          type="button"
          onClick={() => handleOpenModal('followers')}
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors"
        >
          <Users className="w-3.5 h-3.5 text-gray-500" />
          <span className="font-bold text-gray-900">{followersCount}</span>
          <span>Followers</span>
        </button>

        <button
          type="button"
          onClick={() => handleOpenModal('following')}
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors"
        >
          <span className="font-bold text-gray-900">{followingCount}</span>
          <span>Following</span>
        </button>

        {/* Follow / Unfollow Action Button (Only shown on other users' profiles) */}
        {!isOwnProfile && (
          <Button
            type="button"
            size="sm"
            onClick={handleToggleFollow}
            disabled={isPending}
            className={`gap-1.5 font-bold text-xs h-8 px-3.5 transition-all shadow-xs ${
              isFollowing
                ? 'bg-gray-100 hover:bg-red-50 text-gray-700 hover:text-red-700 border border-gray-300'
                : 'bg-green-600 hover:bg-green-700 text-white'
            }`}
          >
            {isPending ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : isFollowing ? (
              <>
                <UserCheck className="w-3.5 h-3.5 text-green-600" />
                <span>Following</span>
              </>
            ) : (
              <>
                <UserPlus className="w-3.5 h-3.5" />
                <span>Follow</span>
              </>
            )}
          </Button>
        )}
      </div>

      {/* Followers & Following Modal */}
      {modalOpen && (
        <div 
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-gray-200 overflow-hidden flex flex-col max-h-[80vh]">
            {/* Modal Header with Tabs */}
            <div className="border-b border-gray-200 p-4 pb-0 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-base text-gray-900">Campus Network</h3>
                <button
                  onClick={() => setModalOpen(false)}
                  className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors"
                  aria-label="Close modal"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Tabs */}
              <div className="flex border-b border-gray-200">
                <button
                  onClick={() => setActiveTab('followers')}
                  className={`flex-1 pb-3 text-xs font-bold border-b-2 transition-colors ${
                    activeTab === 'followers'
                      ? 'border-green-600 text-green-700'
                      : 'border-transparent text-gray-500 hover:text-gray-900'
                  }`}
                >
                  Followers ({followersCount})
                </button>
                <button
                  onClick={() => setActiveTab('following')}
                  className={`flex-1 pb-3 text-xs font-bold border-b-2 transition-colors ${
                    activeTab === 'following'
                      ? 'border-green-600 text-green-700'
                      : 'border-transparent text-gray-500 hover:text-gray-900'
                  }`}
                >
                  Following ({followingCount})
                </button>
              </div>

              {/* Search Bar */}
              <div className="relative pb-3">
                <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search students..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-gray-50 rounded-lg border border-gray-200 focus:outline-none focus:ring-1 focus:ring-green-500"
                />
              </div>
            </div>

            {/* Modal Body: Users List */}
            <div className="flex-1 overflow-y-auto p-4 divide-y divide-gray-100">
              {loadingList ? (
                <div className="py-8 flex flex-col items-center justify-center text-center">
                  <CustechLogoLoader mode="in-app" size="sm" message="Loading campus members..." />
                </div>
              ) : filteredList.length === 0 ? (
                <div className="py-12 text-center text-gray-500 text-xs">
                  {searchTerm 
                    ? 'No students found matching your search.' 
                    : activeTab === 'followers' 
                      ? 'No followers yet. Be the first to follow!' 
                      : 'Not following anyone yet.'
                  }
                </div>
              ) : (
                filteredList.map((member) => (
                  <div key={member.id} className="py-3 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <Avatar 
                        className="w-10 h-10 border border-gray-200" 
                        src={member.avatar_url} 
                        fallback={member.display_name?.charAt(0) || 'U'} 
                      />
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-gray-900 text-xs sm:text-sm">
                            {member.display_name}
                          </span>
                          {member.verification_status === 'approved' && (
                            <ShieldCheck className="w-3.5 h-3.5 text-green-600" />
                          )}
                        </div>
                        {member.department && (
                          <p className="text-[11px] text-gray-500">
                            {member.department}
                          </p>
                        )}
                      </div>
                    </div>

                    <Link
                      href={`/profile/${member.user_id || member.id}`}
                      onClick={() => setModalOpen(false)}
                      className="text-xs font-semibold text-green-700 hover:text-green-800 bg-green-50 hover:bg-green-100 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 shrink-0"
                    >
                      <span>Profile</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
