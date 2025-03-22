
import { useState } from "react";
import { format } from "date-fns";
import { Mail, Search, Users } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ConversationWithProfiles } from "@/integrations/supabase/types-extension";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

interface ConversationListProps {
  conversations: ConversationWithProfiles[];
  currentConversation: ConversationWithProfiles | null;
  onSelectConversation: (conversation: ConversationWithProfiles) => void;
  loading: boolean;
}

export default function ConversationList({
  conversations,
  currentConversation,
  onSelectConversation,
  loading
}: ConversationListProps) {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");

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

  if (loading) {
    return (
      <div className="flex flex-col space-y-4 p-4">
        <div className="flex items-center space-x-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search conversations..." 
            className="h-9"
            disabled
          />
        </div>
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex items-center space-x-3 p-3">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-full" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 text-center space-y-4">
        <Mail className="h-12 w-12 text-muted-foreground" />
        <div>
          <h3 className="font-medium text-muted-foreground">No conversations yet</h3>
          <p className="text-sm text-muted-foreground">
            Start a conversation with a tutor or student
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search conversations..." 
            className="pl-9 h-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto">
        {filteredConversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-6 text-center">
            <p className="text-sm text-muted-foreground">No matching conversations</p>
          </div>
        ) : (
          filteredConversations.map(conversation => {
            const isTutor = conversation.tutor_id === user?.id;
            const otherUser = isTutor ? conversation.student : conversation.tutor;
            const isActive = currentConversation?.id === conversation.id;
            
            return (
              <Button
                key={conversation.id}
                variant="ghost"
                className={cn(
                  "w-full justify-start text-left p-3 h-auto rounded-none",
                  isActive && "bg-accent",
                  conversation.unread_count && conversation.unread_count > 0 && "font-medium"
                )}
                onClick={() => onSelectConversation(conversation)}
              >
                <div className="flex items-start space-x-3 w-full">
                  <div className="relative">
                    {!otherUser.avatar_url ? (
                      <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                        <Users className="h-5 w-5 text-muted-foreground" />
                      </div>
                    ) : (
                      <img 
                        src={otherUser.avatar_url} 
                        alt={`${otherUser.first_name || 'User'}'s avatar`}
                        className="h-10 w-10 rounded-full object-cover"
                      />
                    )}
                    {conversation.unread_count && conversation.unread_count > 0 && (
                      <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-usc-cardinal text-white text-xs flex items-center justify-center">
                        {conversation.unread_count}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <div className="flex justify-between items-baseline">
                      <h4 className="font-medium truncate">
                        {otherUser.first_name || ''} {otherUser.last_name || ''}
                      </h4>
                      {conversation.last_message_time && (
                        <span className="text-xs text-muted-foreground whitespace-nowrap ml-2">
                          {format(new Date(conversation.last_message_time), "MMM d")}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground truncate">
                      {conversation.last_message_text || "No messages yet"}
                    </p>
                  </div>
                </div>
              </Button>
            );
          })
        )}
      </div>
    </div>
  );
}
