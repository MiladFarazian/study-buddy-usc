import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { 
  Conversation, 
  ConversationWithProfiles, 
  Message, 
  MessageInsert,
  Profile
} from "@/integrations/supabase/types-extension";
import { useToast } from "@/hooks/use-toast";
import { createNotification } from "@/lib/notification-service";

export function useMessaging() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [conversations, setConversations] = useState<ConversationWithProfiles[]>([]);
  const [currentConversation, setCurrentConversation] = useState<ConversationWithProfiles | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [messageLoading, setMessageLoading] = useState(false);

  useEffect(() => {
    if (!user) {
      setConversations([]);
      setLoading(false);
      return;
    }

    const fetchConversations = async () => {
      setLoading(true);
      
      const { data: conversationsData, error: conversationsError } = await supabase
        .from("conversations")
        .select("*")
        .or(`tutor_id.eq.${user.id},student_id.eq.${user.id}`)
        .order("updated_at", { ascending: false });
      
      if (conversationsError) {
        console.error("Error fetching conversations:", conversationsError);
        toast({
          title: "Error fetching conversations",
          description: conversationsError.message,
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      if (!conversationsData || conversationsData.length === 0) {
        setConversations([]);
        setLoading(false);
        return;
      }

      const profileIds = new Set<string>();
      conversationsData.forEach(conversation => {
        profileIds.add(conversation.tutor_id);
        profileIds.add(conversation.student_id);
      });

      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select("*")
        .in("id", Array.from(profileIds));

      if (profilesError) {
        console.error("Error fetching profiles:", profilesError);
        toast({
          title: "Error fetching profiles",
          description: profilesError.message,
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      const profilesMap = new Map<string, Profile>();
      profilesData?.forEach(profile => {
        profilesMap.set(profile.id, profile as Profile);
      });

      const conversationsWithProfiles = await Promise.all(
        conversationsData.map(async (conversation) => {
          const { count, error: countError } = await supabase
            .from("messages")
            .select("*", { count: "exact" })
            .eq("conversation_id", conversation.id)
            .eq("read", false)
            .not("sender_id", "eq", user.id);
          
          const tutorProfile = profilesMap.get(conversation.tutor_id);
          const studentProfile = profilesMap.get(conversation.student_id);
          
          if (!tutorProfile || !studentProfile) {
            console.error("Missing profile for conversation:", conversation.id);
            return null;
          }
          
          return {
            ...conversation,
            tutor: tutorProfile,
            student: studentProfile,
            unread_count: count || 0
          } as ConversationWithProfiles;
        })
      );
      
      const validConversations = conversationsWithProfiles.filter(
        (c): c is ConversationWithProfiles => c !== null
      );
      
      setConversations(validConversations);
      setLoading(false);
    };

    fetchConversations();

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
          const newMessage = payload.new as Message;
          setMessages((prev) => [...prev, newMessage]);
          
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

    await supabase
      .from("conversations")
      .update({
        last_message_text: content.trim(),
        last_message_time: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", currentConversation.id);

    const recipientId = user.id === currentConversation.tutor.id 
      ? currentConversation.student.id 
      : currentConversation.tutor.id;
    
    const senderName = user.id === currentConversation.tutor.id
      ? `${currentConversation.tutor.first_name || ''} ${currentConversation.tutor.last_name || ''}`.trim()
      : `${currentConversation.student.first_name || ''} ${currentConversation.student.last_name || ''}`.trim();
    
    try {
      await createNotification({
        userId: recipientId,
        title: 'New Message',
        message: `${senderName || 'Someone'} sent you a message: "${content.length > 50 ? content.substring(0, 50) + '...' : content}"`,
        type: 'message',
        metadata: {
          conversationId: currentConversation.id,
          messageId: data.id
        }
      });
    } catch (notifError) {
      console.error("Error creating message notification:", notifError);
    }

    return { success: true, message: data };
  };

  const startConversation = async (participantId: string, isStudent: boolean) => {
    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    const tutorId = isStudent ? participantId : user.id;
    const studentId = isStudent ? user.id : participantId;

    const { data: existingConversationData, error: fetchError } = await supabase
      .from("conversations")
      .select("*")
      .eq("tutor_id", tutorId)
      .eq("student_id", studentId)
      .single();

    if (fetchError && fetchError.code !== "PGRST116") {
      console.error("Error checking existing conversation:", fetchError);
      toast({
        title: "Error starting conversation",
        description: fetchError.message,
        variant: "destructive",
      });
      return { success: false, error: fetchError.message };
    }

    if (existingConversationData) {
      const { data: tutorData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", tutorId)
        .single();
        
      const { data: studentData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", studentId)
        .single();
        
      if (tutorData && studentData) {
        const existingConversation: ConversationWithProfiles = {
          ...existingConversationData,
          tutor: tutorData as Profile,
          student: studentData as Profile,
          unread_count: 0
        };
        
        setCurrentConversation(existingConversation);
        return { success: true, conversation: existingConversation };
      }
    }

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

    const { data: tutorData } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", tutorId)
      .single();
      
    const { data: studentData } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", studentId)
      .single();
      
    if (tutorData && studentData) {
      const completeConversation: ConversationWithProfiles = {
        ...newConversation,
        tutor: tutorData as Profile,
        student: studentData as Profile,
        unread_count: 0
      };
      
      setCurrentConversation(completeConversation);
      setConversations((prev) => [completeConversation, ...prev]);
      
      return { success: true, conversation: completeConversation };
    }
    
    return { success: false, error: "Could not fetch user profiles" };
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
