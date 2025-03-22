
import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useMessaging } from "@/hooks/useMessaging";
import { useAuth } from "@/contexts/AuthContext";
import ConversationList from "@/components/messaging/ConversationList";
import ChatInterface from "@/components/messaging/ChatInterface";

export default function Messages() {
  const { isStudent, isTutor, user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const targetUserId = searchParams.get("user");
  const isTargetTutor = searchParams.get("isTutor") === "true";
  
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

  // Handle starting a new conversation if directed from another page
  useEffect(() => {
    const initConversation = async () => {
      if (targetUserId && user) {
        await startConversation(targetUserId, !isTargetTutor);
        
        // Clear the URL params after starting the conversation
        navigate("/messages", { replace: true });
      }
    };
    
    if (targetUserId && user && !loading) {
      initConversation();
    }
  }, [targetUserId, isTargetTutor, user, loading, startConversation, navigate]);

  return (
    <div className="py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Messages</h1>
        <p className="text-muted-foreground">
          {isStudent 
            ? "Connect with your tutors" 
            : isTutor 
              ? "Chat with your students"
              : "Communicate with tutors and students"}
        </p>
      </div>

      <div className="bg-white border rounded-lg shadow-sm overflow-hidden min-h-[600px] h-[calc(100vh-230px)] flex">
        {/* Conversations list */}
        <div className="w-1/3 border-r">
          <ConversationList 
            conversations={conversations}
            currentConversation={currentConversation}
            onSelectConversation={setCurrentConversation}
            loading={loading}
          />
        </div>
        
        {/* Chat interface */}
        <div className="flex-1">
          <ChatInterface 
            conversation={currentConversation}
            messages={messages}
            loading={messageLoading}
            onSendMessage={sendMessage}
          />
        </div>
      </div>
    </div>
  );
}
