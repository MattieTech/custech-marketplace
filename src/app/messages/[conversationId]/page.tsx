'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useParams } from 'next/navigation';
import { 
  ChevronLeft, SendHorizontal, ShieldAlert, ShieldCheck, 
  MoreVertical, Flag, Ban, Check, CheckCheck 
} from 'lucide-react';
import { useUser } from '@/hooks/use-user';
import { createClient } from '@/lib/supabase/client';
import { formatDate } from '@/lib/utils';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { LoadingState } from '@/components/ui/loading-state';
import { ErrorState } from '@/components/ui/error-state';
import { ReportDialog } from '@/components/marketplace/report-dialog';
import { sendMessage, markMessagesAsRead, getConversationDetails } from '../actions';
import { toast } from '@/components/ui/toast';

const supabase = createClient();

interface Message {
  id: string;
  content: string;
  created_at: string;
  sender_id: string;
  is_read: boolean;
}

export default function ConversationPage() {
  const { user, isLoading: userLoading } = useUser();
  const router = useRouter();
  const routeParams = useParams();
  const conversationId = routeParams?.conversationId as string;

  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [otherUser, setOtherUser] = useState<any>(null);
  const [listing, setListing] = useState<any>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (!user) {
      if (!userLoading) router.push('/login');
      return;
    }

    if (!conversationId) return;

    const loadConversation = async () => {
      try {
        setIsLoading(true);
        const data = await getConversationDetails(conversationId);
        setOtherUser(data.otherUser);
        setListing(data.listing);
        setMessages(data.messages as Message[]);
        
        // Mark as read
        await markMessagesAsRead(conversationId);
      } catch (err: any) {
        setError(err);
      } finally {
        setIsLoading(false);
        setTimeout(scrollToBottom, 80);
      }
    };

    loadConversation();

    // Realtime Supabase Subscription for incoming messages
    const channel = supabase
      .channel(`conversation:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`
        },
        (payload) => {
          const incoming = payload.new as Message;
          setMessages(prev => {
            // Replace any optimistic message with actual DB record
            const withoutTemp = prev.filter(m => !m.id.startsWith('temp-') || m.content !== incoming.content);
            if (withoutTemp.some(m => m.id === incoming.id)) return withoutTemp;
            return [...withoutTemp, incoming];
          });

          if (incoming.sender_id !== user.id) {
            markMessagesAsRead(conversationId);
          }
          setTimeout(scrollToBottom, 60);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`
        },
        (payload) => {
          const updated = payload.new as Message;
          setMessages(prev => prev.map(m => m.id === updated.id ? updated : m));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, userLoading, conversationId, router]);

  const handleSend = async () => {
    if (!newMessage.trim() || isSending || !user) return;
    
    const content = newMessage.trim();
    setNewMessage('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    // Optimistic message insertion for instant feedback
    const optimisticMsg: Message = {
      id: 'temp-' + Date.now(),
      content,
      created_at: new Date().toISOString(),
      sender_id: user.id,
      is_read: false,
    };
    setMessages(prev => [...prev, optimisticMsg]);
    setTimeout(scrollToBottom, 50);

    try {
      setIsSending(true);
      await sendMessage(conversationId, content);
    } catch (err: any) {
      console.error('Failed to send message:', err);
      toast.error(err.message || 'Failed to send message. Please try again.');
      // Remove optimistic message on failure
      setMessages(prev => prev.filter(m => m.id !== optimisticMsg.id));
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNewMessage(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
  };

  if (userLoading || isLoading) {
    return (
      <div className="h-[75vh] flex items-center justify-center">
        <LoadingState text="Loading conversation..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-[75vh] flex items-center justify-center">
        <ErrorState title="Conversation Error" message={error.message} />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] max-w-4xl mx-auto bg-gray-50 border-x border-gray-200 shadow-sm">
      {/* 1. Chat Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between sticky top-0 z-20 shadow-xs">
        <div className="flex items-center gap-3">
          <Link href="/messages" className="p-2 -ml-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </Link>
          {otherUser && (
            <Link href={`/profile/${otherUser.id}`} className="flex items-center gap-3 hover:opacity-85 transition-opacity">
              <Avatar className="w-10 h-10 border border-gray-200" src={otherUser.avatar_url} fallback={otherUser.display_name?.charAt(0) || 'U'} />
              <div>
                <div className="flex items-center gap-1.5 leading-tight">
                  <span className="font-bold text-gray-900 text-sm">{otherUser.display_name}</span>
                  {otherUser.trust_badge && (
                    <div className="flex items-center gap-0.5 text-[10px] font-bold text-green-700 bg-green-50 border border-green-200 px-1.5 rounded-full">
                      <ShieldCheck className="w-3 h-3 text-green-600" />
                      <span>Verified</span>
                    </div>
                  )}
                </div>
                {otherUser.department && (
                  <span className="text-[11px] text-gray-500 font-medium">
                    {otherUser.department}
                  </span>
                )}
              </div>
            </Link>
          )}
        </div>
        
        <div className="relative">
          <button 
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors"
            aria-label="Chat options"
          >
            <MoreVertical className="w-5 h-5" />
          </button>
          
          {isDropdownOpen && (
            <div className="absolute right-0 mt-1 w-48 bg-white rounded-xl shadow-lg border border-gray-200 py-1.5 z-50">
              <ReportDialog 
                reportedUserId={otherUser?.id}
                trigger={
                  <button className="w-full text-left px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                    <Flag className="w-4 h-4 text-gray-400" /> Report User
                  </button>
                }
              />
              <button 
                onClick={() => {
                  toast.info('User blocked from messaging.');
                  setIsDropdownOpen(false);
                }}
                className="w-full text-left px-4 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 flex items-center gap-2"
              >
                <Ban className="w-4 h-4" /> Block User
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 2. Safety Notice Banner */}
      <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 text-xs font-medium text-amber-900 flex items-center gap-2 justify-center text-center">
        <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
        <span>Campus Safety: Meet at official CUSTECH safe zones (Library, SUB, Main Gate). Never transfer money before inspecting items.</span>
      </div>

      {/* 3. Attached Listing Pill */}
      {listing && (
        <div className="bg-white border-b border-gray-200 px-4 py-2.5 flex items-center gap-3">
          {listing.thumbnail_url && (
            <div className="relative w-11 h-11 rounded-lg overflow-hidden border border-gray-200 shrink-0">
              <Image src={listing.thumbnail_url} alt={listing.title} fill className="object-cover" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h3 className="text-xs font-bold text-gray-900 truncate">{listing.title}</h3>
            <p className="text-xs text-green-700 font-extrabold">₦{listing.price?.toLocaleString()}</p>
          </div>
          <Link href={`/marketplace/${listing.id}`}>
            <Button variant="outline" size="sm" className="text-xs h-7 px-2.5 font-semibold">
              View Item
            </Button>
          </Link>
        </div>
      )}

      {/* 4. Chat Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center text-gray-400 p-8">
            <p className="text-sm font-medium">This is the start of your direct conversation.</p>
            <p className="text-xs text-gray-400 mt-1">Send a message to inquire about pricing, condition, or campus inspection.</p>
          </div>
        ) : (
          messages.map((msg, idx) => {
            const isMine = msg.sender_id === user?.id;
            const showDate = idx === 0 || new Date(msg.created_at).toDateString() !== new Date(messages[idx - 1].created_at).toDateString();
            
            return (
              <div key={msg.id} className="space-y-2">
                {showDate && (
                  <div className="flex justify-center my-3">
                    <span className="text-[11px] font-medium text-gray-500 bg-gray-200/70 px-3 py-0.5 rounded-full shadow-2xs">
                      {new Date(msg.created_at).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  </div>
                )}
                
                <div className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}>
                  <div 
                    className={`max-w-[80%] sm:max-w-[70%] rounded-2xl px-4 py-2.5 shadow-2xs text-sm ${
                      isMine 
                        ? 'bg-green-600 text-white rounded-br-xs font-normal' 
                        : 'bg-white border border-gray-200 text-gray-900 rounded-bl-xs'
                    }`}
                    style={{ wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}
                  >
                    {msg.content}
                  </div>
                  
                  <div className="flex items-center gap-1 mt-1 px-1">
                    <span className="text-[10px] text-gray-400 font-medium">
                      {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    {isMine && (
                      <span className="text-[11px] text-gray-400">
                        {msg.is_read ? (
                          <CheckCheck className="w-3.5 h-3.5 text-green-600 inline" />
                        ) : (
                          <Check className="w-3.5 h-3.5 text-gray-400 inline" />
                        )}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* 5. Chat Input Box */}
      <div className="bg-white border-t border-gray-200 p-3 sm:p-4 sticky bottom-0 z-10">
        <div className="flex items-end gap-2">
          <textarea
            ref={textareaRef}
            value={newMessage}
            onChange={handleTextareaChange}
            onKeyDown={handleKeyDown}
            placeholder="Type your message..."
            className="flex-1 max-h-[120px] min-h-[44px] bg-gray-50 border border-gray-200 rounded-2xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-600 resize-none text-sm placeholder:text-gray-400"
            rows={1}
            maxLength={2000}
          />
          <Button 
            onClick={handleSend} 
            disabled={!newMessage.trim() || isSending}
            size="icon"
            className="rounded-full w-11 h-11 bg-green-600 hover:bg-green-700 active:scale-95 text-white flex-shrink-0 shadow-sm"
            aria-label="Send message"
          >
            <SendHorizontal className="w-5 h-5" />
          </Button>
        </div>
        <div className="text-center mt-2 hidden sm:block">
          <span className="text-[10px] text-gray-400">Press Enter to send, Shift + Enter for new line</span>
        </div>
      </div>
    </div>
  );
}
