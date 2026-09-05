'use server';

import { createClient, createAdminClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function getOrCreateConversation(recipientId: string, listingId?: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) throw new Error('Please sign in to send messages.');

  const admin = await createAdminClient();

  // Resolve recipientId to valid auth user_id
  let targetUserId = recipientId;
  const { data: recipientProfile } = await admin
    .from('profiles')
    .select('user_id, id')
    .or(`user_id.eq.${recipientId},id.eq.${recipientId}`)
    .maybeSingle();

  if (recipientProfile?.user_id) {
    targetUserId = recipientProfile.user_id;
  }

  if (user.id === targetUserId) {
    throw new Error('You cannot message yourself.');
  }

  // Look for existing conversation between these two users
  const { data: myParticipations } = await admin
    .from('conversation_participants')
    .select('conversation_id')
    .eq('user_id', user.id);

  if (myParticipations && myParticipations.length > 0) {
    const myConvIds = myParticipations.map(p => p.conversation_id);

    // Check which of these conversations also has the recipient
    const { data: sharedParticipations } = await admin
      .from('conversation_participants')
      .select('conversation_id')
      .eq('user_id', targetUserId)
      .in('conversation_id', myConvIds);

    if (sharedParticipations && sharedParticipations.length > 0) {
      // If listingId is specified, check for conversation matching listingId
      if (listingId) {
        const { data: matchingConv } = await admin
          .from('conversations')
          .select('id')
          .in('id', sharedParticipations.map(s => s.conversation_id))
          .eq('listing_id', listingId)
          .maybeSingle();

        if (matchingConv) {
          return matchingConv.id;
        }
      }

      // Return the most recent shared conversation
      const { data: latestConv } = await admin
        .from('conversations')
        .select('id')
        .in('id', sharedParticipations.map(s => s.conversation_id))
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (latestConv) {
        return latestConv.id;
      }
    }
  }

  // Create new conversation
  const { data: newConv, error: createError } = await admin
    .from('conversations')
    .insert([{ listing_id: listingId || null }])
    .select('id')
    .single();

  if (createError || !newConv) {
    throw new Error('Failed to create conversation: ' + (createError?.message || 'Database error'));
  }

  // Add participants
  const { error: partError } = await admin
    .from('conversation_participants')
    .insert([
      { conversation_id: newConv.id, user_id: user.id },
      { conversation_id: newConv.id, user_id: targetUserId }
    ]);

  if (partError) {
    throw new Error('Failed to add participants: ' + partError.message);
  }

  revalidatePath('/messages');
  return newConv.id;
}

export async function getUserConversations() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const admin = await createAdminClient();

  const { data: participations } = await admin
    .from('conversation_participants')
    .select('conversation_id')
    .eq('user_id', user.id);

  if (!participations || participations.length === 0) return [];

  const convIds = participations.map(p => p.conversation_id);

  const { data: conversations } = await admin
    .from('conversations')
    .select('id, updated_at, listing_id')
    .in('id', convIds)
    .order('updated_at', { ascending: false });

  if (!conversations || conversations.length === 0) return [];

  const results = await Promise.all(
    conversations.map(async (conv) => {
      // Find other participant
      const { data: participants } = await admin
        .from('conversation_participants')
        .select('user_id')
        .eq('conversation_id', conv.id);

      const otherUserId = participants?.find(p => p.user_id !== user.id)?.user_id;

      let otherParticipant = {
        id: otherUserId || '',
        display_name: 'Campus Member',
        avatar_url: '',
        trust_badge: '',
        department: '',
      };

      if (otherUserId) {
        const { data: profile } = await admin
          .from('profiles')
          .select('id, user_id, display_name, avatar_url, trust_level, department, verification_status')
          .eq('user_id', otherUserId)
          .maybeSingle();

        if (profile) {
          otherParticipant = {
            id: profile.user_id || profile.id,
            display_name: profile.display_name || 'Campus Student',
            avatar_url: profile.avatar_url || '',
            trust_badge: profile.verification_status === 'approved' ? 'Verified Student' : '',
            department: profile.department || '',
          };
        }
      }

      // Find last message
      const { data: lastMessages } = await admin
        .from('messages')
        .select('content, created_at, is_read, sender_id')
        .eq('conversation_id', conv.id)
        .order('created_at', { ascending: false })
        .limit(1);

      const lastMessage = lastMessages?.[0] || null;

      // Find listing if present
      let listingData = null;
      if (conv.listing_id) {
        const { data: listing } = await admin
          .from('listings')
          .select('id, title, price, thumbnail_url')
          .eq('id', conv.listing_id)
          .maybeSingle();
        listingData = listing;
      }

      return {
        id: conv.id,
        updated_at: conv.updated_at,
        other_participant: otherParticipant,
        last_message: lastMessage,
        listing: listingData,
      };
    })
  );

  return results.filter(c => c.other_participant.id);
}

export async function sendMessage(conversationId: string, content: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) throw new Error('Unauthorized');
  if (!content.trim()) throw new Error('Message cannot be empty');

  const admin = await createAdminClient();

  // Verify participant
  const { data: participants } = await admin
    .from('conversation_participants')
    .select('user_id')
    .eq('conversation_id', conversationId);

  const isParticipant = participants?.some(p => p.user_id === user.id);
  if (!isParticipant) throw new Error('Not a participant in this conversation');

  const recipientUserId = participants?.find(p => p.user_id !== user.id)?.user_id;

  const { data: newMsg, error } = await admin
    .from('messages')
    .insert([{
      conversation_id: conversationId,
      sender_id: user.id,
      content: content.trim()
    }])
    .select('*')
    .single();

  if (error) throw new Error('Failed to send message: ' + error.message);
  
  // Update conversation updated_at
  await admin
    .from('conversations')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', conversationId);

  // Send notification to recipient
  if (recipientUserId) {
    const { data: senderProfile } = await admin
      .from('profiles')
      .select('display_name')
      .eq('user_id', user.id)
      .maybeSingle();

    try {
      await admin
        .from('notifications')
        .insert([{
          user_id: recipientUserId,
          type: 'chat_message',
          title: 'New message from ' + (senderProfile?.display_name || 'Campus Student'),
          body: content.slice(0, 80),
          data: { conversation_id: conversationId },
          is_read: false
        }]);
    } catch {
      // Non-critical notification failure
    }
  }

  revalidatePath(`/messages/${conversationId}`);
  revalidatePath('/messages');
  return newMsg;
}

export async function markMessagesAsRead(conversationId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return;

  const admin = await createAdminClient();

  await admin
    .from('messages')
    .update({ is_read: true })
    .eq('conversation_id', conversationId)
    .neq('sender_id', user.id)
    .eq('is_read', false);
}

export async function getConversationDetails(conversationId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Please sign in to view messages.');

  const admin = await createAdminClient();

  // 1. Verify user is participant
  const { data: participants } = await admin
    .from('conversation_participants')
    .select('user_id')
    .eq('conversation_id', conversationId);

  const isParticipant = participants?.some(p => p.user_id === user.id);
  if (!isParticipant) {
    throw new Error('You are not a participant in this conversation');
  }

  // 2. Get conversation
  const { data: conv } = await admin
    .from('conversations')
    .select('id, listing_id, created_at, updated_at')
    .eq('id', conversationId)
    .single();

  if (!conv) throw new Error('Conversation not found');

  // 3. Get other participant profile
  const otherUserId = participants?.find(p => p.user_id !== user.id)?.user_id;
  let otherUser = null;

  if (otherUserId) {
    const { data: profile } = await admin
      .from('profiles')
      .select('id, user_id, display_name, avatar_url, trust_level, department, verification_status')
      .eq('user_id', otherUserId)
      .maybeSingle();

    if (profile) {
      otherUser = {
        id: profile.user_id || profile.id,
        display_name: profile.display_name || 'Campus Member',
        avatar_url: profile.avatar_url || '',
        trust_badge: profile.verification_status === 'approved' ? 'Verified Student' : '',
        department: profile.department || '',
      };
    }
  }

  // 4. Get listing if present
  let listing = null;
  if (conv.listing_id) {
    const { data: listingData } = await admin
      .from('listings')
      .select('id, title, price, thumbnail_url')
      .eq('id', conv.listing_id)
      .maybeSingle();
    listing = listingData;
  }

  // 5. Get messages
  const { data: messages } = await admin
    .from('messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true });

  return {
    conversation: conv,
    otherUser,
    listing,
    messages: messages || [],
  };
}


