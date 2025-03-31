
import React from 'react';
import { useParams } from 'react-router-dom';

const Conversation = () => {
  const { conversationId } = useParams<{ conversationId: string }>();
  
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Conversation</h1>
      <p>Conversation ID: {conversationId}</p>
    </div>
  );
};

export default Conversation;
