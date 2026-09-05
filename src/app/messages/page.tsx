'use client';

import { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search, ShieldCheck, MessageSquare, PlusCircle } from 'lucide-react';
import { useUser } from '@/hooks/use-user';
import { createClient } from '@/lib/supabase/client';
import { formatDate } from '@/lib/utils';
import { Avatar } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { PageContainer } from '@/components/layout/page-container';
import { EmptyState } from '@/components/ui/empty-state';
import { LoadingState } from '@/components/ui/loading-state';
import { ErrorState } from '@/components/ui/error-state';
import { getUserConversations, getOrCreateConversation } from './actions';

const supabase = createClient();

interface Conversation {
  id: string;
  updated_at: string;
  other_participant: {
    id: string;
    display_name: string;
    avatar_url: string;
    trust_badge: string;
    department?: string;
  };
  last_message: {
    content: string;
    created_at: string;
    is_read: boolean;
    sender_id: string;
  } | null;
  listing?: {
    id: string;
    title: string;
    price?: number;
    thumbnail_url: string;
  } | null;
}

function MessagesContent() {
  const { user, isLoading: userLoading } = useUser();
  const searchParams = useSearchParams();
  const router = useRouter();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // 1. Handle auto-routing when ?user=... or ?to=... is provided
  useEffect(() => {
    const targetUser = searchParams.get('user') || searchParams.get('to');
    const listingId = searchParams.get('listing') || undefined;

    if (targetUser && user && !userLoading) {
      setIsRedirecting(true);
      getOrCreateConversation(targetUser, listingId)
        .then((convId) => {
          router.replace(`/messages/${convId}`);
        })
        .catch((err) => {
          console.error('Failed to open chat:', err);
          setIsRedirecting(false);
          setError(err);
        });
    }
  }, [searchParams, user, userLoading, router]);

  // 2. Fetch conversation list
  useEffect(() => {
    if (!user) {
      if (!userLoading) {
        router.push('/login');
      }
      return;
    }

    const loadData = async () => {
      try {
        setIsLoading(true);
        const list = await getUserConversations();
        setConversations(list as Conversation[]);
      } catch (err: any) {
        setError(err);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();

    // Live real-time subscription for incoming messages
    const channel = supabase
      .channel('public:messages_feed')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
        },
        () => {
          loadData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, userLoading, router]);

  const filteredConversations = conversations.filter(c =>
    c.other_participant.display_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.listing?.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.other_participant.department?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (userLoading || isRedirecting) {
    return (
      <PageContainer>
        <LoadingState text={isRedirecting ? 'Connecting to seller...' : 'Loading messages...'} />
      </PageContainer>
    );
  }

  if (isLoading) {
    return (
      <PageContainer>
        <LoadingState text="Loading your conversations..." />
      </PageContainer>
    );
  }

  if (error) {
    return (
      <PageContainer>
        <ErrorState title="Failed to load conversations" message={error.message} />
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Campus Messages</h1>
            <p className="text-xs text-gray-500 mt-0.5">Secure direct chat with verified CUSTECH buyers & sellers</p>
          </div>
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Search chats by name, item..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-white"
            />
          </div>
        </div>

        {conversations.length === 0 ? (
          <EmptyState
            title="No conversations yet"
            description="Find an item or service on the marketplace and tap 'Message Seller' to start chatting safely."
            icon={MessageSquare}
          />
        ) : filteredConversations.length === 0 ? (
          <div className="text-center py-12 text-gray-500 bg-white rounded-xl border p-8">
            No conversations match your search query.
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100 overflow-hidden shadow-xs">
            {filteredConversations.map((conversation) => {
              const hasUnread = conversation.last_message && 
                               !conversation.last_message.is_read && 
                               conversation.last_message.sender_id !== user?.id;

              return (
                <Link
                  key={conversation.id}
                  href={`/messages/${conversation.id}`}
                  className="flex items-start gap-4 p-4 hover:bg-gray-50/80 transition-colors group"
                >
                  <div className="relative shrink-0">
                    <Avatar 
                      className="w-12 h-12 border border-gray-200" 
                      src={conversation.other_participant.avatar_url} 
                      fallback={conversation.other_participant.display_name?.charAt(0) || 'U'} 
                    />
                    {hasUnread && (
                      <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-green-600 border-2 border-white rounded-full"></span>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <div className="flex items-center gap-1.5 truncate">
                        <span className="font-bold text-gray-900 truncate group-hover:text-green-700 transition-colors">
                          {conversation.other_participant.display_name}
                        </span>
                        {conversation.other_participant.trust_badge && (
                          <div className="flex items-center gap-0.5 text-[10px] font-bold text-green-700 bg-green-50 border border-green-200 px-1.5 py-0.2 rounded-full shrink-0">
                            <ShieldCheck className="w-3 h-3 text-green-600" />
                            <span>Verified</span>
                          </div>
                        )}
                        {conversation.other_participant.department && (
                          <span className="text-xs text-gray-400 truncate hidden sm:inline">
                            • {conversation.other_participant.department}
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-gray-400 font-medium shrink-0">
                        {conversation.last_message ? formatDate(conversation.last_message.created_at) : formatDate(conversation.updated_at)}
                      </span>
                    </div>

                    {conversation.listing && (
                      <div className="text-xs font-semibold text-green-700 truncate mb-1">
                        Re: {conversation.listing.title}
                      </div>
                    )}

                    <p className={`text-sm truncate ${hasUnread ? 'text-gray-950 font-semibold' : 'text-gray-500'}`}>
                      {conversation.last_message ? (
                        <>
                          {conversation.last_message.sender_id === user?.id ? (
                            <span className="text-gray-400 font-normal">You: </span>
                          ) : null}
                          {conversation.last_message.content}
                        </>
                      ) : (
                        <span className="italic text-gray-400">Conversation started. Say hello!</span>
                      )}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </PageContainer>
  );
}

export default function MessagesPage() {
  return (
    <Suspense fallback={<PageContainer><LoadingState text="Loading messages..." /></PageContainer>}>
      <MessagesContent />
    </Suspense>
  );
}
