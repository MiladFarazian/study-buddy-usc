
import React, { createContext, useContext, useState, ReactNode } from 'react';

interface Message {
  id: string;
  content: string;
  senderId: string;
  receiverId: string;
  timestamp: Date;
  read: boolean;
}

interface Conversation {
  id: string;
  participants: string[];
  lastMessage?: Message;
  unreadCount: number;
}

interface MessageContextType {
  conversations: Conversation[];
  messages: Record<string, Message[]>;
  sendMessage: (conversationId: string, content: string, receiverId: string) => void;
  markAsRead: (conversationId: string) => void;
}

const MessageContext = createContext<MessageContextType | undefined>(undefined);

export const MessageProvider = ({ children }: { children: ReactNode }) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Record<string, Message[]>>({});

  const sendMessage = (conversationId: string, content: string, receiverId: string) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      content,
      senderId: 'currentUser', // In a real app, this would come from auth context
      receiverId,
      timestamp: new Date(),
      read: false
    };

    // Update messages for this conversation
    setMessages(prev => ({
      ...prev,
      [conversationId]: [...(prev[conversationId] || []), newMessage]
    }));

    // Update conversation with last message and unread count
    setConversations(prev => {
      const existingConvIndex = prev.findIndex(c => c.id === conversationId);
      if (existingConvIndex >= 0) {
        const newConversations = [...prev];
        newConversations[existingConvIndex] = {
          ...newConversations[existingConvIndex],
          lastMessage: newMessage,
          unreadCount: newConversations[existingConvIndex].unreadCount + 1
        };
        return newConversations;
      } else {
        return [
          ...prev,
          {
            id: conversationId,
            participants: ['currentUser', receiverId],
            lastMessage: newMessage,
            unreadCount: 1
          }
        ];
      }
    });
  };

  const markAsRead = (conversationId: string) => {
    // Mark all messages in this conversation as read
    setMessages(prev => {
      if (!prev[conversationId]) return prev;
      
      return {
        ...prev,
        [conversationId]: prev[conversationId].map(msg => ({
          ...msg,
          read: true
        }))
      };
    });

    // Update unread count in the conversation
    setConversations(prev => 
      prev.map(conv => 
        conv.id === conversationId 
          ? { ...conv, unreadCount: 0 } 
          : conv
      )
    );
  };

  return (
    <MessageContext.Provider value={{ conversations, messages, sendMessage, markAsRead }}>
      {children}
    </MessageContext.Provider>
  );
};

export const useMessage = () => {
  const context = useContext(MessageContext);
  if (context === undefined) {
    throw new Error('useMessage must be used within a MessageProvider');
  }
  return context;
};
