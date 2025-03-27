
import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { ConversationWithProfiles, Message } from "@/integrations/supabase/types-extension";
import { createNotification } from "@/lib/notification-service";

export function useMessaging() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [conversations, setConversations] = useState<ConversationWithProfiles[]>([]);
  const [conversation, setConversation] = useState<ConversationWithProfiles | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [messageLoading, setMessageLoading] = useState(false);
  const subscription = useRef<any>(null);
  
  // Fetch all conversations for the current user
  const fetchConversations = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      // Clear previous subscription
      if (subscription.current) {
        subscription.current.unsubscribe();
      }
      
      // Get all conversations for the current user as either tutor or student
      const { data, error } = await supabase
        .from('conversations')
        .select(`
          *,
          tutor:tutor_id(id, first_name, last_name, avatar_url, major, role),
          student:student_id(id, first_name, last_name, avatar_url, major, role)
        `)
        .or(`tutor_id.eq.${user.id},student_id.eq.${user.id}`)
        .order('last_message_time', { ascending: false });
        
      if (error) throw error;
      
      // For each conversation, calculate unread count
      const conversationsWithUnread = await Promise.all(data.map(async (conv) => {
        if (!user) return { ...conv, unread_count: 0 };
        
        const { count, error: countError } = await supabase
          .from('messages')
          .select('id', { count: 'exact', head: true })
          .eq('conversation_id', conv.id)
          .eq('read', false)
          .neq('sender_id', user.id);
          
        return {
          ...conv,
          unread_count: countError ? 0 : count || 0
        };
      }));
      
      // Cast the data to the expected type (with type assertion)
      const typedConversations = conversationsWithUnread as unknown as ConversationWithProfiles[];
      setConversations(typedConversations);
      
      // Set up real-time subscription for new messages
      subscription.current = supabase
        .channel('messages-channel')
        .on('postgres_changes', { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'messages'
        }, async (payload) => {
          const newMessage = payload.new as Message;
          
          // Only handle messages for conversations we're part of
          const relevantConversation = typedConversations.find(
            c => c.id === newMessage.conversation_id
          );
          
          if (relevantConversation) {
            // Update conversations list with new message info
            setConversations(prev => {
              // Find the conversation to update
              const index = prev.findIndex(c => c.id === newMessage.conversation_id);
              if (index === -1) return prev;
              
              // Create a copy of the conversations array
              const updated = [...prev];
              
              // Update the conversation with the new message info
              updated[index] = {
                ...updated[index],
                last_message_text: newMessage.content,
                last_message_time: newMessage.created_at,
                unread_count: newMessage.sender_id !== user?.id 
                  ? (updated[index].unread_count || 0) + 1
                  : updated[index].unread_count
              };
              
              // Sort by last message time
              return updated.sort((a, b) => {
                if (!a.last_message_time) return 1;
                if (!b.last_message_time) return -1;
                return new Date(b.last_message_time).getTime() - new Date(a.last_message_time).getTime();
              });
            });
            
            // If this is for the currently viewed conversation, add it to messages
            if (conversation?.id === newMessage.conversation_id) {
              setMessages(prev => [...prev, newMessage]);
              
              // Mark as read if not sent by us
              if (newMessage.sender_id !== user?.id) {
                markMessageAsRead(newMessage.id);
              }
            }
          }
        })
        .subscribe();
      
    } catch (error) {
      console.error('Error fetching conversations:', error);
      toast({
        title: 'Error',
        description: 'Failed to load conversations',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [user, conversation, toast]);
  
  // Load conversations on initial mount and when user changes
  useEffect(() => {
    if (user) {
      fetchConversations();
    } else {
      setConversations([]);
      setConversation(null);
      setMessages([]);
    }
    
    return () => {
      if (subscription.current) {
        subscription.current.unsubscribe();
      }
    };
  }, [user, fetchConversations]);
  
  // Select a conversation and load its messages
  const selectConversation = useCallback(async (conv: ConversationWithProfiles) => {
    if (!user) return;
    
    try {
      setConversation(conv);
      setMessageLoading(true);
      
      // Get messages for this conversation
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conv.id)
        .order('created_at', { ascending: true });
        
      if (error) throw error;
      
      setMessages(data);
      
      // Mark unread messages as read
      if (data.length > 0) {
        const unreadMessages = data.filter(
          m => !m.read && m.sender_id !== user.id
        );
        
        if (unreadMessages.length > 0) {
          const unreadIds = unreadMessages.map(m => m.id);
          
          await supabase
            .from('messages')
            .update({ read: true })
            .in('id', unreadIds);
            
          // Update unread count for this conversation in local state
          setConversations(prev => {
            const updatedConversations = [...prev];
            const index = updatedConversations.findIndex(c => c.id === conv.id);
            if (index !== -1) {
              updatedConversations[index] = {
                ...updatedConversations[index],
                unread_count: 0
              };
            }
            return updatedConversations;
          });
        }
      }
    } catch (error) {
      console.error('Error selecting conversation:', error);
      toast({
        title: 'Error',
        description: 'Failed to load messages',
        variant: 'destructive',
      });
    } finally {
      setMessageLoading(false);
    }
  }, [user, toast]);
  
  // Mark a message as read
  const markMessageAsRead = async (messageId: string) => {
    if (!user) return;
    
    try {
      await supabase
        .from('messages')
        .update({ read: true })
        .eq('id', messageId);
        
      // Update unread count in state
      if (conversation) {
        setConversations(prev => {
          const updatedConversations = [...prev];
          const index = updatedConversations.findIndex(c => c.id === conversation.id);
          if (index !== -1 && updatedConversations[index].unread_count && updatedConversations[index].unread_count > 0) {
            updatedConversations[index] = {
              ...updatedConversations[index],
              unread_count: updatedConversations[index].unread_count - 1
            };
          }
          return updatedConversations;
        });
      }
    } catch (error) {
      console.error('Error marking message as read:', error);
    }
  };
  
  // Send a message to a conversation
  const sendMessage = async (conversationId: string, content: string) => {
    if (!user || !content.trim()) return;
    
    try {
      // Insert the message
      const { data, error } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: user.id,
          content: content.trim(),
          read: false
        })
        .select()
        .single();
        
      if (error) throw error;
      
      // Update the conversation with the last message
      await supabase
        .from('conversations')
        .update({
          last_message_text: content.trim(),
          last_message_time: new Date().toISOString()
        })
        .eq('id', conversationId);
        
      // Find the conversation to get the recipient ID
      const selectedConv = conversations.find(c => c.id === conversationId);
      if (selectedConv) {
        const recipientId = selectedConv.tutor_id === user.id 
          ? selectedConv.student_id 
          : selectedConv.tutor_id;
          
        // Create a notification for the recipient
        await createNotification({
          userId: recipientId,
          title: "New Message",
          message: content.length > 30 ? `${content.substring(0, 30)}...` : content,
          type: "new_message",
          metadata: { conversationId }
        });
      }
      
      return data;
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: 'Error',
        description: 'Failed to send message',
        variant: 'destructive',
      });
    }
  };
  
  // Start a new conversation with a user
  const startConversationWithUser = async (userId: string, isUserTutor: boolean) => {
    if (!user) return;
    
    try {
      // Determine tutor and student IDs
      const tutorId = isUserTutor ? userId : user.id;
      const studentId = isUserTutor ? user.id : userId;
      
      // Check if a conversation already exists
      const { data: existingConvs, error: fetchError } = await supabase
        .from('conversations')
        .select(`
          *,
          tutor:tutor_id(id, first_name, last_name, avatar_url, major, role),
          student:student_id(id, first_name, last_name, avatar_url, major, role)
        `)
        .eq('tutor_id', tutorId)
        .eq('student_id', studentId);
        
      if (fetchError) throw fetchError;
      
      let conversationToSelect;
      
      if (existingConvs && existingConvs.length > 0) {
        // Use existing conversation
        conversationToSelect = existingConvs[0];
      } else {
        // Create new conversation
        const { data: newConv, error: insertError } = await supabase
          .from('conversations')
          .insert({
            tutor_id: tutorId,
            student_id: studentId
          })
          .select(`
            *,
            tutor:tutor_id(id, first_name, last_name, avatar_url, major, role),
            student:student_id(id, first_name, last_name, avatar_url, major, role)
          `)
          .single();
          
        if (insertError) throw insertError;
        conversationToSelect = newConv;
        
        // Refresh conversations list
        await fetchConversations();
      }
      
      // Select the conversation
      await selectConversation(conversationToSelect as unknown as ConversationWithProfiles);
    } catch (error) {
      console.error('Error starting conversation:', error);
      toast({
        title: 'Error',
        description: 'Failed to start conversation',
        variant: 'destructive',
      });
    }
  };
  
  return {
    conversations,
    conversation,
    messages,
    loading,
    messageLoading,
    selectConversation,
    sendMessage,
    startConversationWithUser
  };
}
