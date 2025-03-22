
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { 
  Conversation, 
  ConversationWithProfiles, 
  Message, 
  MessageInsert 
} from "@/integrations/supabase/types-extension";
import { useToast } from "@/hooks/use-toast";

export function useMessaging() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [conversations, setConversations] = useState<ConversationWithProfiles[]>([]);
  const [currentConversation, setCurrentConversation] = useState<ConversationWithProfiles | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [messageLoading, setMessageLoading] = useState(false);

  // Fetch user conversations
  useEffect(() => {
    if (!user) {
      setConversations([]);
      setLoading(false);
      return;
    }

    const fetchConversations = async () => {
      setLoading(true);
      
      const { data, error } = await supabase
        .from("conversations")
        .select(`
          *,
          tutor:tutor_id(*),
          student:student_id(*)
        `)
        .or(`tutor_id.eq.${user.id},student_id.eq.${user.id}`)
        .order("updated_at", { ascending: false });
      
      if (error) {
        console.error("Error fetching conversations:", error);
        toast({
          title: "Error fetching conversations",
          description: error.message,
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      // Count unread messages for each conversation
      const conversationsWithUnreadCount = await Promise.all(
        data.map(async (conversation) => {
          const { count, error: countError } = await supabase
            .from("messages")
            .select("*", { count: "exact" })
            .eq("conversation_id", conversation.id)
            .eq("read", false)
            .not("sender_id", "eq", user.id);
          
          return {
            ...conversation,
            unread_count: count || 0
          };
        })
      );
      
      setConversations(conversationsWithUnreadCount);
      setLoading(false);
    };

    fetchConversations();

    // Subscribe to changes in conversations
    const channel = supabase
      .channel("conversations-channel")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "conversations",
          filter: `tutor_id=eq.${user.id}:student_id=eq.${user.id}`,
        },
        () => {
          fetchConversations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, toast]);

  // Fetch messages for current conversation and set up real-time updates
  useEffect(() => {
    if (!currentConversation) {
      setMessages([]);
      return;
    }

    const fetchMessages = async () => {
      setMessageLoading(true);
      
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", currentConversation.id)
        .order("created_at", { ascending: true });
      
      if (error) {
        console.error("Error fetching messages:", error);
        toast({
          title: "Error fetching messages",
          description: error.message,
          variant: "destructive",
        });
        setMessageLoading(false);
        return;
      }
      
      setMessages(data || []);
      setMessageLoading(false);

      // Mark messages as read
      if (data && data.length > 0) {
        const unreadMessages = data.filter(
          msg => !msg.read && msg.sender_id !== user?.id
        );

        if (unreadMessages.length > 0) {
          await supabase
            .from("messages")
            .update({ read: true })
            .in(
              "id", 
              unreadMessages.map(msg => msg.id)
            );
        }
      }
    };

    fetchMessages();

    // Subscribe to new messages
    const channel = supabase
      .channel(`messages-${currentConversation.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${currentConversation.id}`,
        },
        (payload) => {
          // Add new message to the list
          const newMessage = payload.new as Message;
          setMessages((prev) => [...prev, newMessage]);
          
          // Mark message as read if from the other user
          if (newMessage.sender_id !== user?.id) {
            supabase
              .from("messages")
              .update({ read: true })
              .eq("id", newMessage.id);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentConversation, user, toast]);

  // Send a message
  const sendMessage = async (content: string) => {
    if (!user || !currentConversation || !content.trim()) {
      return { success: false, error: "Cannot send empty message" };
    }

    const newMessage: MessageInsert = {
      conversation_id: currentConversation.id,
      sender_id: user.id,
      content: content.trim(),
    };

    const { data, error } = await supabase
      .from("messages")
      .insert(newMessage)
      .select()
      .single();

    if (error) {
      console.error("Error sending message:", error);
      toast({
        title: "Error sending message",
        description: error.message,
        variant: "destructive",
      });
      return { success: false, error: error.message };
    }

    // Update conversation's last message
    await supabase
      .from("conversations")
      .update({
        last_message_text: content.trim(),
        last_message_time: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", currentConversation.id);

    return { success: true, message: data };
  };

  // Create a new conversation or get existing one
  const startConversation = async (participantId: string, isStudent: boolean) => {
    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    const tutorId = isStudent ? participantId : user.id;
    const studentId = isStudent ? user.id : participantId;

    // Check if conversation already exists
    const { data: existingConversation, error: fetchError } = await supabase
      .from("conversations")
      .select(`
        *,
        tutor:tutor_id(*),
        student:student_id(*)
      `)
      .eq("tutor_id", tutorId)
      .eq("student_id", studentId)
      .single();

    if (fetchError && fetchError.code !== "PGRST116") {
      // PGRST116 is the error code for no rows returned
      console.error("Error checking existing conversation:", fetchError);
      toast({
        title: "Error starting conversation",
        description: fetchError.message,
        variant: "destructive",
      });
      return { success: false, error: fetchError.message };
    }

    if (existingConversation) {
      setCurrentConversation(existingConversation);
      return { success: true, conversation: existingConversation };
    }

    // Create new conversation
    const { data: newConversation, error: insertError } = await supabase
      .from("conversations")
      .insert({
        tutor_id: tutorId,
        student_id: studentId,
      })
      .select()
      .single();

    if (insertError) {
      console.error("Error creating conversation:", insertError);
      toast({
        title: "Error starting conversation",
        description: insertError.message,
        variant: "destructive",
      });
      return { success: false, error: insertError.message };
    }

    // Fetch the complete conversation with profiles
    const { data: completeConversation, error: completeError } = await supabase
      .from("conversations")
      .select(`
        *,
        tutor:tutor_id(*),
        student:student_id(*)
      `)
      .eq("id", newConversation.id)
      .single();

    if (completeError) {
      console.error("Error fetching complete conversation:", completeError);
      return { success: false, error: completeError.message };
    }

    setCurrentConversation(completeConversation);
    setConversations((prev) => [completeConversation, ...prev]);
    
    return { success: true, conversation: completeConversation };
  };

  return {
    conversations,
    currentConversation,
    setCurrentConversation,
    messages,
    loading,
    messageLoading,
    sendMessage,
    startConversation
  };
}
