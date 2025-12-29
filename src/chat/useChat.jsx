import { useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';

const SOCKET_URL = 'http://localhost:9000';

export const useChat = (conversationId) => {
  const [messages, setMessages] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const socketRef = useRef(null);

  // Initialize socket only once
  useEffect(() => {
    if (socketRef.current) return; // Skip if already initialized

    socketRef.current = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    });

    socketRef.current.on('connect', () => {
      console.log('✅ Socket connected');
      setIsConnected(true);
    });

    socketRef.current.on('disconnect', () => {
      console.log('❌ Socket disconnected');
      setIsConnected(false);
    });

    // Listen for new messages
    socketRef.current.on('new_message', async (message) => {
      console.log('📩 New message received:', message);
      
      // Eğer attachment yoksa veya boşsa, API'den fetch et
      if (!message.attachments || message.attachments.length === 0) {
        try {
          const response = await fetch(`${SOCKET_URL}/api/chat/messages/${message.id}/attachments`);
          const data = await response.json();
          message.attachments = data.data || [];
        } catch (error) {
          console.error('Error fetching attachments:', error);
          message.attachments = [];
        }
      }
      
      setMessages((prev) => [...prev, message]);
    });

    // Listen for typing indicators
    socketRef.current.on('user_typing', () => {
      setIsTyping(true);
    });

    socketRef.current.on('user_stop_typing', () => {
      setIsTyping(false);
    });

    socketRef.current.on('agent_joined', (conversation) => {
      console.log('👤 Agent joined:', conversation);
    });

    socketRef.current.on('conversation_closed', (conversation) => {
      console.log('🔒 Conversation closed:', conversation);
    });

    // Cleanup ONLY on component unmount
    return () => {
      if (socketRef.current) {
        console.log('🔌 Disconnecting socket on unmount');
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, []); // Empty dependency array - only run once!

  // Join conversation room when conversationId changes
  useEffect(() => {
    if (conversationId && socketRef.current?.connected) {
      console.log('🚪 Joining conversation:', conversationId);
      socketRef.current.emit('join_conversation', conversationId);
    }
  }, [conversationId]);

  const sendMessage = (message, sender_id, sender_type) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('send_message', {
        conversation_id: conversationId,
        sender_id,
        sender_type,
        message
      });
    }
  };

  const emitTyping = (user_name) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('typing', {
        conversation_id: conversationId,
        user_name
      });
    }
  };

  const emitStopTyping = () => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('stop_typing', {
        conversation_id: conversationId
      });
    }
  };

  return {
    messages,
    setMessages,
    isConnected,
    isTyping,
    sendMessage,
    emitTyping,
    emitStopTyping,
    socketRef
  };
};