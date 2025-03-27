
import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useMessaging } from "@/hooks/useMessaging";
import { useAuth } from "@/contexts/AuthContext";
import ConversationList from "@/components/messaging/ConversationList";
import ChatInterface from "@/components/messaging/ChatInterface";
import { useIsMobile } from "@/hooks/use-mobile";

export default function Messages() {
  const { isStudent, isTutor, user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const targetUserId = searchParams.get("user");
  const isTargetTutor = searchParams.get("isTutor") === "true";
  const isMobile = useIsMobile();
  const [showChat, setShowChat] = useState(!isMobile);
  
  // Fix the useMessaging hook usage to match the actual implementation
  const messaging = useMessaging();
  const { 
    conversation, 
    messages, 
    loading: messageLoading, 
    sendMessage: sendMessageToConversation 
  } = messaging;
  
  // Reset view state when conversation changes
  useEffect(() => {
    if (conversation && isMobile) {
      setShowChat(true);
    }
  }, [conversation, isMobile]);

  // Handle starting a new conversation if directed from another page
  useEffect(() => {
    const initConversation = async () => {
      if (targetUserId && user) {
        // We need to adapt to the useMessaging API here
        // You might need to implement this in useMessaging.ts
        await messaging.startConversationWithUser(targetUserId, isTargetTutor);
        setShowChat(true);
        // Clear the URL params after starting the conversation
        navigate("/messages", { replace: true });
      }
    };
    
    if (targetUserId && user && !messageLoading) {
      initConversation();
    }
  }, [targetUserId, isTargetTutor, user, messageLoading, navigate, messaging]);

  const handleSelectConversation = (conversation: any) => {
    // Need to adapt to the useMessaging API here
    messaging.selectConversation(conversation);
    if (isMobile) {
      setShowChat(true);
    }
  };

  const handleBackToList = () => {
    if (isMobile) {
      setShowChat(false);
    }
  };

  // Create a wrapper for the sendMessage function to match the expected signature
  const handleSendMessage = async (content: string): Promise<{ success: boolean; error?: string }> => {
    try {
      if (!conversation) {
        return { success: false, error: "No active conversation" };
      }
      await sendMessageToConversation(conversation.id, content);
      return { success: true };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  };

  return (
    <div className={`${isMobile ? 'py-3' : 'py-4 md:py-6'}`}>
      <div className={`mb-3 ${isMobile ? '' : 'md:mb-6'}`}>
        <h1 className={`${isMobile ? 'text-xl' : 'text-2xl md:text-3xl'} font-bold mb-1 md:mb-2`}>Messages</h1>
        <p className={`${isMobile ? 'text-xs' : 'text-sm md:text-base'} text-muted-foreground`}>
          {isStudent 
            ? "Connect with your tutors" 
            : isTutor 
              ? "Chat with your students"
              : "Communicate with tutors and students"}
        </p>
      </div>

      <div className={`bg-white border rounded-lg shadow-sm overflow-hidden ${isMobile ? 'min-h-[400px] h-[calc(100vh-180px)]' : 'min-h-[500px] md:min-h-[600px] h-[calc(100vh-230px)]'} flex`}>
        {/* Conversations list - show on mobile only when not in chat view */}
        {(!isMobile || (isMobile && !showChat)) && (
          <div className={`${isMobile ? 'w-full' : 'w-1/3'} border-r`}>
            <ConversationList 
              conversations={messaging.conversations || []}
              currentConversation={conversation}
              onSelectConversation={handleSelectConversation}
              loading={messageLoading}
            />
          </div>
        )}
        
        {/* Chat interface - show on mobile only when in chat view */}
        {(!isMobile || (isMobile && showChat)) && (
          <div className={`${isMobile ? 'w-full' : 'flex-1'}`}>
            <ChatInterface 
              conversation={conversation}
              messages={messages}
              loading={messageLoading}
              onSendMessage={handleSendMessage}
              onBackClick={handleBackToList}
              isMobile={isMobile}
            />
          </div>
        )}
      </div>
    </div>
  );
};
