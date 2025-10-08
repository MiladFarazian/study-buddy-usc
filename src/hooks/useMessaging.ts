
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
      
      // Get all conversations for the current user
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

      // Fetch all profiles involved in these conversations
      const profileIds = new Set<string>();
      conversationsData.forEach(conversation => {
        profileIds.add(conversation.tutor_id);
        profileIds.add(conversation.student_id);
      });

      // Use safe_profiles to exclude Stripe IDs and sensitive data
      const { data: profilesData, error: profilesError } = await supabase
        .from("safe_profiles")
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

      // Create a map of profiles by ID for quick lookup
      const profilesMap = new Map<string, Profile>();
      profilesData?.forEach(profile => {
        profilesMap.set(profile.id, profile as Profile);
      });

      // Count unread messages for each conversation
      const conversationsWithProfiles = await Promise.all(
        conversationsData.map(async (conversation) => {
          const { count, error: countError } = await supabase
            .from("messages")
            .select("*", { count: "exact" })
            .eq("conversation_id", conversation.id)
            .eq("read", false)
            .not("sender_id", "eq", user.id);
          
          // Map the tutor and student profiles
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
      
      // Filter out any null values (in case a profile was missing)
      const validConversations = conversationsWithProfiles.filter(
        (c): c is ConversationWithProfiles => c !== null
      );
      
      setConversations(validConversations);
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
    const { data: existingConversationData, error: fetchError } = await supabase
      .from("conversations")
      .select("*")
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

    // If conversation exists, fetch the complete profiles and set it as current
    if (existingConversationData) {
      // Fetch tutor and student profiles using safe_profiles
      const { data: tutorData } = await supabase
        .from("safe_profiles")
        .select("*")
        .eq("id", tutorId)
        .single();
        
      const { data: studentData } = await supabase
        .from("safe_profiles")
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

    // Create new conversation if it doesn't exist
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

    // Fetch the tutor and student profiles using safe_profiles
    const { data: tutorData } = await supabase
      .from("safe_profiles")
      .select("*")
      .eq("id", tutorId)
      .single();
      
    const { data: studentData } = await supabase
      .from("safe_profiles")
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
