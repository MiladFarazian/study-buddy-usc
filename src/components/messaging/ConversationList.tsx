
import { useState } from "react";
import { format } from "date-fns";
import { Search, Users, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ConversationWithProfiles } from "@/integrations/supabase/types-extension";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useIsMobile } from "@/hooks/use-mobile";

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
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [conversationToDelete, setConversationToDelete] = useState<ConversationWithProfiles | null>(null);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [swipeOffset, setSwipeOffset] = useState<number>(0);
  const [conversationBeingSwiped, setConversationBeingSwiped] = useState<string | null>(null);

  const handleTouchStart = (e: React.TouchEvent, conversationId: string) => {
    setTouchStart(e.touches[0].clientX);
    setConversationBeingSwiped(conversationId);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStart) return;
    
    const currentTouch = e.touches[0].clientX;
    const diff = touchStart - currentTouch;
    
    // Limit swipe to left direction only and max offset
    if (diff > 0 && diff <= 100) {
      setSwipeOffset(diff);
    }
  };

  const handleTouchEnd = (conversation: ConversationWithProfiles) => {
    if (swipeOffset > 50) { // If swiped more than 50px, show delete dialog
      setConversationToDelete(conversation);
      setDeleteDialogOpen(true);
    } else {
      // Add a bounce-back effect
      setSwipeOffset(0);
    }
    
    // Reset states
    setTouchStart(null);
    setTimeout(() => {
      setConversationBeingSwiped(null);
    }, 300); // Match the transition duration
  };

  const handleDeleteConversation = async () => {
    if (!conversationToDelete) return;

    try {
      // Delete messages first
      await supabase
        .from('messages')
        .delete()
        .eq('conversation_id', conversationToDelete.id);
      
      // Then delete the conversation
      await supabase
        .from('conversations')
        .delete()
        .eq('id', conversationToDelete.id);

      toast({
        title: "Chat deleted",
        description: "The conversation has been deleted successfully.",
      });
    } catch (error) {
      console.error('Error deleting conversation:', error);
      toast({
        title: "Error",
        description: "Failed to delete the conversation. Please try again.",
        variant: "destructive",
      });
    }

    setDeleteDialogOpen(false);
    setConversationToDelete(null);
  };

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
        <div className="sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-10 p-4 pb-3 -mx-4 -mt-4 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input disabled placeholder="Search conversations..." className="pl-9" />
          </div>
        </div>
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-start space-x-4 px-4 py-3">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-4 w-[120px]" />
              <Skeleton className="h-3 w-full max-w-[180px]" />
            </div>
            <Skeleton className="h-4 w-[60px]" />
          </div>
        ))}
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 text-center space-y-4">
        <div className="rounded-full bg-muted p-3">
          <Users className="h-6 w-6 text-muted-foreground" />
        </div>
        <div>
          <h3 className="font-medium mb-1">No conversations yet</h3>
          <p className="text-sm text-muted-foreground">
            Start chatting with your tutors or students
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-10 p-4 pb-3 border-b">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search conversations..." 
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto divide-y">
        {filteredConversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-6 text-center">
            <p className="text-sm text-muted-foreground">No matching conversations</p>
          </div>
        ) : (
          filteredConversations.map(conversation => {
            const isTutor = conversation.tutor_id === user?.id;
            const otherUser = isTutor ? conversation.student : conversation.tutor;
            const isActive = currentConversation?.id === conversation.id;
            const isBeingSwiped = conversationBeingSwiped === conversation.id;
            
            return (
              <div 
                key={conversation.id}
                className="relative overflow-hidden"
                onTouchStart={isMobile ? (e) => handleTouchStart(e, conversation.id) : undefined}
                onTouchMove={isMobile && isBeingSwiped ? handleTouchMove : undefined}
                onTouchEnd={isMobile && isBeingSwiped ? () => handleTouchEnd(conversation) : undefined}
              >
                {/* Delete action area - initially hidden and revealed on swipe */}
                <div 
                  className={cn(
                    "absolute inset-y-0 right-0 flex items-center bg-destructive w-[100px] transition-transform duration-300",
                    isBeingSwiped ? `transform translate-x-[-${swipeOffset}px]` : "transform translate-x-[100px]"
                  )}
                >
                  <div className="flex items-center justify-center w-full">
                    <Trash2 className="h-6 w-6 text-white" />
                  </div>
                </div>
                
                <Button
                  variant="ghost"
                  className={cn(
                    "w-full justify-start text-left p-4 h-auto rounded-none relative transition-transform duration-300",
                    isActive && "bg-accent",
                    isBeingSwiped && `transform translate-x-[-${swipeOffset}px]`
                  )}
                  onClick={() => onSelectConversation(conversation)}
                >
                  <div className="flex items-start space-x-4 w-full">
                    <div className="relative">
                      <Avatar className="h-10 w-10">
                        {otherUser.avatar_url ? (
                          <AvatarImage 
                            src={otherUser.avatar_url} 
                            alt={`${otherUser.first_name || 'User'}'s avatar`}
                          />
                        ) : (
                          <AvatarFallback>
                            <Users className="h-5 w-5" />
                          </AvatarFallback>
                        )}
                      </Avatar>
                      {conversation.unread_count > 0 && (
                        <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-usc-cardinal text-[11px] font-medium text-white flex items-center justify-center z-50">
                          {conversation.unread_count}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-baseline mb-1">
                        <h4 className={cn(
                          "font-medium truncate",
                          conversation.unread_count > 0 && "font-semibold"
                        )}>
                          {otherUser.first_name || ''} {otherUser.last_name || ''}
                        </h4>
                        {conversation.last_message_time && (
                          <span className="text-xs text-muted-foreground whitespace-nowrap ml-2">
                            {format(new Date(conversation.last_message_time), "MMM d")}
                          </span>
                        )}
                      </div>
                      <p className={cn(
                        "text-sm text-muted-foreground truncate",
                        conversation.unread_count > 0 && "text-foreground font-medium"
                      )}>
                        {conversation.last_message_text || "No messages yet"}
                      </p>
                    </div>
                  </div>
                </Button>
              </div>
            );
          })
        )}
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Conversation</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this conversation and all its messages.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteConversation}
              className="bg-destructive hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
