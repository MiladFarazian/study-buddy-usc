
import { useState, useRef, useEffect } from "react";
import { format } from "date-fns";
import { Send, User, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";
import { ConversationWithProfiles, Message } from "@/integrations/supabase/types-extension";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface ChatInterfaceProps {
  conversation: ConversationWithProfiles | null;
  messages: Message[];
  loading: boolean;
  onSendMessage: (content: string) => Promise<{ success: boolean; error?: string }>;
}

export default function ChatInterface({
  conversation,
  messages,
  loading,
  onSendMessage,
}: ChatInterfaceProps) {
  const { user } = useAuth();
  const [messageInput, setMessageInput] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!messageInput.trim() || sendingMessage) return;

    setSendingMessage(true);
    const result = await onSendMessage(messageInput);
    setSendingMessage(false);
    
    if (result.success) {
      setMessageInput("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!conversation) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 text-center space-y-4">
        <Users className="h-12 w-12 text-muted-foreground" />
        <div>
          <h3 className="font-medium">Select a conversation</h3>
          <p className="text-sm text-muted-foreground">
            Choose a conversation from the list to start chatting
          </p>
        </div>
      </div>
    );
  }

  const isTutor = conversation.tutor_id === user?.id;
  const otherUser = isTutor ? conversation.student : conversation.tutor;

  if (loading) {
    return (
      <div className="flex flex-col h-full">
        <div className="border-b p-4 flex items-center space-x-3">
          <Skeleton className="h-10 w-10 rounded-full" />
          <Skeleton className="h-5 w-36" />
        </div>
        <div className="flex-1 p-4 space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className={`flex ${i % 2 ? "justify-end" : "justify-start"}`}>
              <div className="max-w-[80%]">
                <Skeleton className={`h-20 w-[200px] rounded-lg`} />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Chat header */}
      <div className="border-b p-4 flex items-center space-x-3">
        {!otherUser.avatar_url ? (
          <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
            <User className="h-5 w-5 text-muted-foreground" />
          </div>
        ) : (
          <img 
            src={otherUser.avatar_url} 
            alt={`${otherUser.first_name}'s avatar`}
            className="h-10 w-10 rounded-full object-cover"
          />
        )}
        <div>
          <h3 className="font-medium">
            {otherUser.first_name || ''} {otherUser.last_name || ''}
          </h3>
          <p className="text-xs text-muted-foreground">
            {isTutor ? "Student" : "Tutor"}
            {otherUser.major && ` • ${otherUser.major}`}
          </p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 p-4 overflow-y-auto">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-6 text-center space-y-4">
            <p className="text-sm text-muted-foreground">
              No messages yet. Send a message to start the conversation.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message, idx) => {
              const isCurrentUser = message.sender_id === user?.id;
              const showDate =
                idx === 0 ||
                new Date(message.created_at).toDateString() !==
                  new Date(messages[idx - 1].created_at).toDateString();

              return (
                <div key={message.id}>
                  {showDate && (
                    <div className="flex justify-center my-4">
                      <span className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded-full">
                        {format(new Date(message.created_at), "MMMM d, yyyy")}
                      </span>
                    </div>
                  )}
                  <div
                    className={cn(
                      "flex",
                      isCurrentUser ? "justify-end" : "justify-start"
                    )}
                  >
                    <div
                      className={cn(
                        "max-w-[80%] rounded-lg p-3",
                        isCurrentUser
                          ? "bg-usc-cardinal text-white rounded-br-none"
                          : "bg-muted rounded-bl-none"
                      )}
                    >
                      <p className="whitespace-pre-wrap break-words">{message.content}</p>
                      <div
                        className={cn(
                          "text-xs mt-1 flex justify-end",
                          isCurrentUser ? "text-usc-gold" : "text-muted-foreground"
                        )}
                      >
                        {format(new Date(message.created_at), "h:mm a")}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Message input */}
      <div className="border-t p-4">
        <div className="flex space-x-2">
          <Textarea
            placeholder="Type your message..."
            value={messageInput}
            onChange={(e) => setMessageInput(e.target.value)}
            onKeyDown={handleKeyDown}
            className="min-h-10 resize-none"
            disabled={sendingMessage}
          />
          <Button
            onClick={handleSendMessage}
            disabled={!messageInput.trim() || sendingMessage}
            className="flex-shrink-0"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
