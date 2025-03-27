import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { ConversationWithProfiles, Message } from "@/integrations/supabase/types-extension";
import { createNotification } from "@/lib/notification-service";

export const useMessaging = (conversationId: string | undefined) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [inputValue, setInputValue] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(true);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conversation, setConversation] = useState<ConversationWithProfiles | null>(null);

  useEffect(() => {
    if (!conversationId) return;
    fetchConversation(conversationId);
    fetchMessages(conversationId);

    // Subscribe to changes in the messages table
    const messageSubscription = supabase
      .channel(`public:messages:conversation_id=eq.${conversationId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "messages" },
        (payload) => {
          if (payload.eventType === "INSERT") {
            // New message added
            setMessages((prev) => [...prev, payload.new as Message]);
          } else if (payload.eventType === "UPDATE") {
            // Message updated
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === payload.new.id ? (payload.new as Message) : msg
              )
            );
          } else if (payload.eventType === "DELETE") {
            // Message deleted
            setMessages((prev) => prev.filter((msg) => msg.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(messageSubscription);
    };
  }, [conversationId, user]);

  const fetchMessages = async (conversationId: string) => {
    if (!user) return;

    setLoadingMessages(true);
    try {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });

      if (error) throw error;

      setMessages(data || []);
    } catch (error) {
      console.error("Error fetching messages:", error);
      setError("Failed to fetch messages. Please try again.");
      toast({
        title: "Error",
        description: "Failed to fetch messages. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoadingMessages(false);
    }
  };

  const fetchConversation = async (conversationId: string) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("conversations")
        .select(
          `
          *,
          tutor: tutor_id (
            id,
            first_name,
            last_name,
            avatar_url
          ),
          student: student_id (
            id,
            first_name,
            last_name,
            avatar_url
          )
        `
        )
        .eq("id", conversationId)
        .single();

      if (error) throw error;

      setConversation(data as ConversationWithProfiles);
    } catch (error) {
      console.error("Error fetching conversation:", error);
      setError("Failed to fetch conversation. Please try again.");
      toast({
        title: "Error",
        description: "Failed to fetch conversation. Please try again.",
        variant: "destructive",
      });
    }
  };

  const sendMessage = async (conversationId: string, content: string) => {
    if (!user) return;

    try {
      setSendingMessage(true);
      
      const { data: messageData, error: messageError } = await supabase
        .from("messages")
        .insert({
          conversation_id: conversationId,
          sender_id: user.id,
          content,
        })
        .select()
        .single();

      if (messageError) throw messageError;

      // Get the conversation to see who is the recipient
      const { data: conversationData, error: conversationError } = await supabase
        .from("conversations")
        .select("*")
        .eq("id", conversationId)
        .single();

      if (conversationError) throw conversationError;

      // Determine recipient ID (the other user in the conversation)
      const recipientId = 
        conversationData.student_id === user.id
          ? conversationData.tutor_id
          : conversationData.student_id;

      // Create a notification for the recipient
      await createNotification({
        userId: recipientId,
        title: "New Message",
        message: `You have a new message`,
        type: "message",
        metadata: { conversationId }
      });

      // Update the conversations list with the last message
      const { error: updateError } = await supabase
        .from("conversations")
        .update({
          last_message_text: content,
          last_message_time: new Date().toISOString(),
        })
        .eq("id", conversationId);

      if (updateError) throw updateError;

      setMessages((prev) => [...prev, messageData]);
      setInputValue("");
    } catch (error) {
      console.error("Error sending message:", error);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSendingMessage(false);
    }
  };

  return {
    inputValue,
    setInputValue,
    messages,
    loadingMessages,
    sendingMessage,
    sendMessage,
    error,
    conversation,
  };
};
