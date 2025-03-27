
import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useMessaging } from "@/hooks/useMessaging";
import { useAuth } from "@/contexts/AuthContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { Phone, Video, MoreVertical, Paperclip, Send, Search, ArrowLeft } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { format } from "date-fns";

export default function Messages() {
  const { isStudent, isTutor, user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const targetUserId = searchParams.get("user");
  const isTargetTutor = searchParams.get("isTutor") === "true";
  const isMobile = useIsMobile();
  const [showChat, setShowChat] = useState(!isMobile);
  const [searchQuery, setSearchQuery] = useState("");
  const messageInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
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

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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

  const handleSendMessage = async () => {
    if (messageInputRef.current && messageInputRef.current.value.trim()) {
      await sendMessage(messageInputRef.current.value);
      messageInputRef.current.value = "";
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Filter conversations based on search query
  const filteredConversations = conversations.filter(conversation => {
    if (!searchQuery.trim()) return true;
    
    const searchLower = searchQuery.toLowerCase();
    const isTutor = conversation.tutor_id === user?.id;
    const otherUser = isTutor ? conversation.student : conversation.tutor;
    
    return (
      (otherUser.first_name || "").toLowerCase().includes(searchLower) ||
      (otherUser.last_name || "").toLowerCase().includes(searchLower) ||
      (conversation.last_message_text || "").toLowerCase().includes(searchLower)
    );
  });

  const getInitials = (firstName?: string, lastName?: string) => {
    if (!firstName && !lastName) return "U";
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
  };

  return (
    <div className="page-container">
      <div className="mb-4">
        <h1 className="font-playfair font-bold text-3xl">Messages</h1>
        <p className="text-muted-foreground">Communicate with your tutors and manage your sessions.</p>
      </div>

      <div className="bg-white rounded-lg border shadow-sm overflow-hidden" style={{ minHeight: "calc(100vh - 250px)" }}>
        <div className="flex h-full">
          {/* Conversation List - Show on desktop or on mobile when chat is not active */}
          {(!isMobile || (isMobile && !showChat)) && (
            <div className={`${isMobile ? 'w-full' : 'w-1/3 max-w-xs'} border-r`}>
              <div className="p-4 border-b">
                <div className="relative">
                  <Input
                    className="pl-10"
                    placeholder="Search messages..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                </div>
              </div>

              <div className="overflow-y-auto" style={{ height: "calc(100vh - 320px)" }}>
                {loading ? (
                  <div className="p-4 text-center text-muted-foreground">Loading conversations...</div>
                ) : filteredConversations.length === 0 ? (
                  <div className="p-4 text-center text-muted-foreground">
                    {searchQuery ? "No matching conversations" : "No conversations yet"}
                  </div>
                ) : (
                  filteredConversations.map((conversation) => {
                    const isCurrTutor = conversation.tutor_id === user?.id;
                    const otherUser = isCurrTutor ? conversation.student : conversation.tutor;
                    const isActive = currentConversation?.id === conversation.id;
                    
                    return (
                      <div
                        key={conversation.id}
                        className={`p-3 border-b cursor-pointer hover:bg-gray-50 ${isActive ? 'bg-gray-50' : ''}`}
                        onClick={() => handleSelectConversation(conversation)}
                      >
                        <div className="flex items-center">
                          <div className="relative mr-3">
                            <Avatar className="h-12 w-12">
                              <AvatarImage src={otherUser.avatar_url || ''} />
                              <AvatarFallback>
                                {getInitials(otherUser.first_name, otherUser.last_name)}
                              </AvatarFallback>
                            </Avatar>
                            {conversation.unread_count > 0 && (
                              <span className="absolute -top-1 -right-1 w-5 h-5 bg-usc-cardinal text-white rounded-full flex items-center justify-center text-xs">
                                {conversation.unread_count}
                              </span>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between">
                              <h3 className="font-medium truncate">
                                {otherUser.first_name} {otherUser.last_name}
                              </h3>
                              {conversation.last_message_time && (
                                <span className="text-xs text-muted-foreground">
                                  {format(new Date(conversation.last_message_time), conversation.last_message_time.includes(new Date().toISOString().split('T')[0]) ? 'h:mm a' : 'MMM d')}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center">
                              <p className="text-sm text-muted-foreground truncate">
                                {conversation.last_message_text || "No messages yet"}
                              </p>
                            </div>
                            {otherUser.major && (
                              <div className="mt-1">
                                <span className="text-xs text-muted-foreground">
                                  {otherUser.major}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
          
          {/* Chat Interface - Show on desktop or on mobile when chat is active */}
          {(!isMobile || (isMobile && showChat)) && (
            <div className={`${isMobile ? 'w-full' : 'flex-1'} flex flex-col`}>
              {currentConversation ? (
                <>
                  {/* Chat Header */}
                  <div className="border-b p-4 flex items-center justify-between">
                    <div className="flex items-center">
                      {isMobile && (
                        <Button variant="ghost" size="icon" onClick={handleBackToList} className="mr-2">
                          <ArrowLeft className="h-5 w-5" />
                        </Button>
                      )}
                      
                      {(() => {
                        const isCurrTutor = currentConversation.tutor_id === user?.id;
                        const otherUser = isCurrTutor ? currentConversation.student : currentConversation.tutor;
                        
                        return (
                          <div className="flex items-center">
                            <Avatar className="h-10 w-10 mr-3">
                              <AvatarImage src={otherUser.avatar_url || ''} />
                              <AvatarFallback>
                                {getInitials(otherUser.first_name, otherUser.last_name)}
                              </AvatarFallback>
                            </Avatar>
                            
                            <div>
                              <h3 className="font-medium">
                                {otherUser.first_name} {otherUser.last_name}
                              </h3>
                              <p className="text-xs text-muted-foreground">
                                {otherUser.major || (isCurrTutor ? 'Student' : 'Tutor')}
                              </p>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="icon">
                        <Phone className="h-5 w-5" />
                      </Button>
                      <Button variant="ghost" size="icon">
                        <Video className="h-5 w-5" />
                      </Button>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="h-5 w-5" />
                      </Button>
                    </div>
                  </div>
                  
                  {/* Messages Area */}
                  <div className="flex-1 p-4 overflow-y-auto" style={{ height: "calc(100vh - 400px)" }}>
                    {messageLoading ? (
                      <div className="text-center py-4">Loading messages...</div>
                    ) : messages.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        No messages yet. Start the conversation!
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
                              
                              <div className={`flex ${isCurrentUser ? "justify-end" : "justify-start"}`}>
                                <div className={isCurrentUser ? "message-user" : "message-other"}>
                                  <p>{message.content}</p>
                                  <div className={`message-timestamp ${isCurrentUser ? "text-usc-gold" : "text-muted-foreground"}`}>
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
                  
                  {/* Message Input */}
                  <div className="border-t p-4">
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="icon">
                        <Paperclip className="h-5 w-5" />
                      </Button>
                      <Input
                        ref={messageInputRef}
                        placeholder="Type a message..."
                        className="flex-1"
                        onKeyDown={handleKeyDown}
                      />
                      <Button onClick={handleSendMessage} className="bg-usc-cardinal hover:bg-usc-cardinal-dark">
                        <Send className="h-5 w-5" />
                      </Button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <h3 className="text-lg font-medium mb-2">Select a conversation</h3>
                    <p className="text-muted-foreground">Choose a conversation from the list or start a new one</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
