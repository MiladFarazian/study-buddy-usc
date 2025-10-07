
import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useMessaging } from "@/hooks/useMessaging";
import { useAuth } from "@/contexts/AuthContext";
import { useAdminRedirect } from "@/hooks/useAdminRedirect";
import ConversationList from "@/components/messaging/ConversationList";
import ChatInterface from "@/components/messaging/ChatInterface";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

export default function Messages() {
  const { isStudent, isTutor, user } = useAuth();
  const { loading: adminLoading } = useAdminRedirect();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const targetUserId = searchParams.get("user");
  const isTargetTutor = searchParams.get("isTutor") === "true";
  const isMobile = useIsMobile();
  const [showChat, setShowChat] = useState(false);
  
  if (adminLoading) return null;
  
  const {
    conversations,
    currentConversation,
    setCurrentConversation,
    messages,
    loading,
    messageLoading,
    sendMessage,
    startConversation
  } = useMessaging();

  // Handle mobile view transitions
  useEffect(() => {
    if (currentConversation && isMobile) {
      setShowChat(true);
    }
  }, [currentConversation, isMobile]);

  // Auto-select most recent conversation for desktop
  useEffect(() => {
    if (!loading && conversations.length > 0 && !currentConversation && !isMobile) {
      setCurrentConversation(conversations[0]); // conversations are already sorted by most recent
    }
  }, [loading, conversations, currentConversation, isMobile, setCurrentConversation]);

  // Handle conversation initialization from other pages
  useEffect(() => {
    const initConversation = async () => {
      if (targetUserId && user) {
        await startConversation(targetUserId, !isTargetTutor);
        setShowChat(true);
        navigate("/messages", { replace: true });
      }
    };
    
    if (targetUserId && user && !loading) {
      initConversation();
    }
  }, [targetUserId, isTargetTutor, user, loading, startConversation, navigate]);

  const handleSelectConversation = (conversation: any) => {
    setCurrentConversation(conversation);
    if (isMobile) {
      setShowChat(true);
    }
  };

  const handleBackToList = () => {
    if (isMobile) {
      setShowChat(false);
    }
  };

  return (
    <div className="h-[calc(100vh-4rem)]">
      <div className="h-full flex">
        {(!isMobile || (isMobile && !showChat)) && (
          <div className={cn(
            "h-full border-r bg-background",
            isMobile ? "w-full" : "w-[320px]"
          )}>
            <ConversationList 
              conversations={conversations}
              currentConversation={currentConversation}
              onSelectConversation={handleSelectConversation}
              loading={loading}
            />
          </div>
        )}
        
        {(!isMobile || (isMobile && showChat)) && (
          <div className={cn(
            "h-full bg-background",
            isMobile ? "w-full" : "flex-1"
          )}>
            <ChatInterface 
              conversation={currentConversation}
              messages={messages}
              loading={messageLoading}
              onSendMessage={sendMessage}
              onBackClick={handleBackToList}
              isMobile={isMobile}
            />
          </div>
        )}
      </div>
    </div>
  );
}
