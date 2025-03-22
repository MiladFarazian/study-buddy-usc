
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

  // Reset view state when conversation changes
  useEffect(() => {
    if (currentConversation && isMobile) {
      setShowChat(true);
    }
  }, [currentConversation, isMobile]);

  // Handle starting a new conversation if directed from another page
  useEffect(() => {
    const initConversation = async () => {
      if (targetUserId && user) {
        await startConversation(targetUserId, !isTargetTutor);
        setShowChat(true);
        // Clear the URL params after starting the conversation
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
    <div className="py-4 md:py-6">
      <div className="mb-4 md:mb-6">
        <h1 className="text-2xl md:text-3xl font-bold mb-1 md:mb-2">Messages</h1>
        <p className="text-sm md:text-base text-muted-foreground">
          {isStudent 
            ? "Connect with your tutors" 
            : isTutor 
              ? "Chat with your students"
              : "Communicate with tutors and students"}
        </p>
      </div>

      <div className="bg-white border rounded-lg shadow-sm overflow-hidden min-h-[500px] md:min-h-[600px] h-[calc(100vh-230px)] flex">
        {/* Conversations list - show on mobile only when not in chat view */}
        {(!isMobile || (isMobile && !showChat)) && (
          <div className={`${isMobile ? 'w-full' : 'w-1/3'} border-r`}>
            <ConversationList 
              conversations={conversations}
              currentConversation={currentConversation}
              onSelectConversation={handleSelectConversation}
              loading={loading}
            />
          </div>
        )}
        
        {/* Chat interface - show on mobile only when in chat view */}
        {(!isMobile || (isMobile && showChat)) && (
          <div className={`${isMobile ? 'w-full' : 'flex-1'}`}>
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
};
