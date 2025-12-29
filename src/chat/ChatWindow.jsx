import React, { useState, useEffect, useRef } from 'react';
import { useChat } from './useChat';
import ChatMessage from './ChatMessage';
import axios from 'axios';

const API_URL = 'http://localhost:9000';

const ChatWindow = ({ onClose }) => {
  // conversationId'yi localStorage'dan oku
  const [conversationId, setConversationId] = useState(() => {
    return localStorage.getItem('currentConversationId') || null;
  });
  
  const [inputMessage, setInputMessage] = useState('');
  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [showGuestForm, setShowGuestForm] = useState(!conversationId);
  const [allMessages, setAllMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const fileInputRef = useRef(null);
  
  const { messages, isConnected, isTyping, sendMessage, emitTyping, emitStopTyping, socketRef } = useChat(conversationId);

  // conversationId değişince localStorage'a kaydet
  useEffect(() => {
    if (conversationId) {
      localStorage.setItem('currentConversationId', conversationId);
      setShowGuestForm(false);
    } else {
      localStorage.removeItem('currentConversationId');
    }
  }, [conversationId]);

  // Update messages when socket receives new ones (avoid duplicates)
  useEffect(() => {
    if (messages.length > 0) {
      console.log('📨 Socket messages received:', messages);
      
      setAllMessages(prev => {
        const existingIds = new Set(prev.map(m => m.id));
        const newMessages = messages.filter(m => !existingIds.has(m.id));
        if (newMessages.length > 0) {
          console.log('➕ Adding new messages:', newMessages);
        }
        return [...prev, ...newMessages];
      });
    }
  }, [messages]);

  // Load message history when conversation starts
  useEffect(() => {
    const loadMessageHistory = async () => {
      if (!conversationId) return;

      console.log('🔍 Loading message history for conversation:', conversationId);

      try {
        const token = localStorage.getItem('token');
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        
        const response = await axios.get(
          `${API_URL}/api/chat/conversations/${conversationId}/messages`,
          { headers }
        );
        
        console.log('📜 Message history loaded:', response.data.data);
        setAllMessages(response.data.data || []);
      } catch (error) {
        console.error('❌ Error loading message history:', error);
      }
    };

    loadMessageHistory();
  }, [conversationId]);

  // Reset messages when conversation changes
  useEffect(() => {
    if (!conversationId) {
      setAllMessages([]);
    }
  }, [conversationId]);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [allMessages, isTyping]);

  // Start conversation
  const handleStartChat = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const response = await axios.post(
        `${API_URL}/api/chat/conversations`,
        { guest_name: guestName, guest_email: guestEmail },
        { headers }
      );

      const newConversationId = response.data.data.id;
      console.log('✅ Conversation started:', newConversationId);
      
      setConversationId(newConversationId);
    } catch (error) {
      console.error('Error starting chat:', error);
      alert('Could not start chat. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle file selection
  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    
    // Validate file types and size
    const validFiles = files.filter(file => {
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'application/pdf', 'video/mp4', 'video/quicktime', 'video/x-msvideo'];
      const maxSize = 10 * 1024 * 1024; // 10MB
      
      if (!validTypes.includes(file.type)) {
        alert(`${file.name} is not a valid file type`);
        return false;
      }
      
      if (file.size > maxSize) {
        alert(`${file.name} is too large (max 10MB)`);
        return false;
      }
      
      return true;
    });
    
    setSelectedFiles(prev => [...prev, ...validFiles].slice(0, 5)); // Max 5 files
  };

  // Remove file from selection
  const removeFile = (index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  // Send message with or without attachments
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if ((!inputMessage.trim() && selectedFiles.length === 0) || !conversationId) return;

    const token = localStorage.getItem('token');
    const sender_type = token ? 'customer' : 'guest';
    const messageText = inputMessage;
    const filesToSend = selectedFiles;

    console.log('📤 Sending message:', messageText, 'Files:', filesToSend.length);
    setInputMessage('');
    setSelectedFiles([]);

    try {
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      // If no files, send as regular text message
      if (filesToSend.length === 0) {
        await axios.post(`${API_URL}/api/chat/messages`, {
          conversation_id: conversationId,
          message: messageText,
          sender_type
        }, { headers });
      } else {
        // Send with attachments using FormData
        const formData = new FormData();
        formData.append('conversation_id', conversationId);
        formData.append('message', messageText);
        formData.append('sender_type', sender_type);
        
        filesToSend.forEach(file => {
          formData.append('attachments', file);
        });

        await axios.post(`${API_URL}/api/chat/messages/with-attachments`, formData, {
          headers: {
            ...headers,
            'Content-Type': 'multipart/form-data'
          }
        });
      }

      console.log('✅ Message sent successfully');
      emitStopTyping();
    } catch (error) {
      console.error('Error sending message:', error);
      setInputMessage(messageText);
      setSelectedFiles(filesToSend);
    }
  };

  // Handle typing
  const handleTyping = () => {
    emitTyping(guestName || 'Customer');

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      emitStopTyping();
    }, 1000);
  };

  // Close chat and clear conversation
  const handleClose = () => {
    localStorage.removeItem('currentConversationId');
    onClose();
  };

  if (showGuestForm) {
    return (
      <div style={{ width: '100%', height: '100%', backgroundColor: 'white', borderRadius: '8px', display: 'flex', flexDirection: 'column', boxShadow: '0 10px 40px rgba(0,0,0,0.2)' }}>
        <div style={{ backgroundColor: '#2563eb', color: 'white', padding: '16px', borderTopLeftRadius: '8px', borderTopRightRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>Live Support</h3>
          <button 
            onClick={handleClose} 
            style={{ 
              background: 'none', 
              border: 'none', 
              color: 'white', 
              fontSize: '24px', 
              cursor: 'pointer',
              padding: '0',
              lineHeight: '1',
              width: '24px',
              height: '24px'
            }}
          >
            ✕
          </button>
        </div>
        
        <div style={{ flex: 1, padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <h4 style={{ marginBottom: '16px', fontSize: '16px', color: '#1f2937' }}>Hello! How can we help you?</h4>
          <form onSubmit={handleStartChat}>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500', color: '#374151' }}>Your Name</label>
              <input
                type="text"
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                required
                placeholder="Enter your name"
                style={{ width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px', outline: 'none' }}
              />
            </div>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500', color: '#374151' }}>Email (Optional)</label>
              <input
                type="email"
                value={guestEmail}
                onChange={(e) => setGuestEmail(e.target.value)}
                placeholder="example@email.com"
                style={{ width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px', outline: 'none' }}
              />
            </div>
            <button
              type="submit"
              disabled={isLoading || !guestName.trim()}
              style={{
                width: '100%',
                padding: '12px',
                backgroundColor: '#2563eb',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '15px',
                fontWeight: '500',
                opacity: (isLoading || !guestName.trim()) ? 0.5 : 1,
                transition: 'all 0.2s'
              }}
            >
              {isLoading ? 'Starting...' : 'Start Chat'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div style={{ width: '100%', height: '100%', backgroundColor: 'white', borderRadius: '8px', display: 'flex', flexDirection: 'column', boxShadow: '0 10px 40px rgba(0,0,0,0.2)' }}>
      <div style={{ backgroundColor: '#2563eb', color: 'white', padding: '16px', borderTopLeftRadius: '8px', borderTopRightRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>Live Support</h3>
          <p style={{ margin: '4px 0 0 0', fontSize: '12px', opacity: 0.9 }}>{isConnected ? '🟢 Connected' : '🔴 Connecting...'}</p>
        </div>
        <button 
          onClick={handleClose} 
          style={{ 
            background: 'none', 
            border: 'none', 
            color: 'white', 
            fontSize: '28px', 
            cursor: 'pointer',
            padding: '0',
            lineHeight: '1',
            width: '28px',
            height: '28px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          ✕
        </button>
      </div>
      
      <div style={{ flex: 1, padding: '16px', backgroundColor: '#f9fafb', overflowY: 'auto' }}>
        {allMessages.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 20px' }}>
            <p style={{ color: '#6b7280', fontSize: '14px', margin: 0 }}>A support agent will assist you shortly.</p>
            <p style={{ color: '#9ca3af', fontSize: '13px', marginTop: '8px' }}>Please wait...</p>
          </div>
        ) : (
          allMessages.map((msg) => (
            <ChatMessage key={msg.id} message={msg} isAgent={false} />
          ))
        )}

        {isTyping && (
          <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: '16px' }}>
            <div style={{ backgroundColor: '#e5e7eb', color: '#374151', padding: '10px 16px', borderRadius: '12px', fontSize: '14px' }}>
              <span>Agent is typing...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Selected Files Preview */}
      {selectedFiles.length > 0 && (
        <div style={{ padding: '12px 16px', borderTop: '1px solid #e5e7eb', backgroundColor: '#f9fafb' }}>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {selectedFiles.map((file, index) => (
              <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 10px', backgroundColor: '#e0e7ff', borderRadius: '6px', fontSize: '12px' }}>
                <span style={{ maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {file.name}
                </span>
                <button
                  onClick={() => removeFile(index)}
                  style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', fontSize: '16px', padding: '0', lineHeight: '1' }}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <form onSubmit={handleSendMessage} style={{ padding: '16px', borderTop: '1px solid #e5e7eb', display: 'flex', gap: '8px', backgroundColor: 'white', borderBottomLeftRadius: '8px', borderBottomRightRadius: '8px' }}>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          multiple
          accept="image/*,application/pdf,video/*"
          style={{ display: 'none' }}
        />
        
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={selectedFiles.length >= 5}
          style={{
            padding: '10px',
            backgroundColor: '#f3f4f6',
            border: '1px solid #d1d5db',
            borderRadius: '20px',
            cursor: 'pointer',
            fontSize: '18px',
            opacity: selectedFiles.length >= 5 ? 0.5 : 1
          }}
          title="Attach file"
        >
          📎
        </button>

        <input
          type="text"
          value={inputMessage}
          onChange={(e) => {
            setInputMessage(e.target.value);
            handleTyping();
          }}
          placeholder="Type your message..."
          style={{ 
            flex: 1, 
            padding: '10px 16px', 
            border: '1px solid #d1d5db', 
            borderRadius: '20px',
            fontSize: '14px',
            outline: 'none'
          }}
        />
        <button
          type="submit"
          disabled={!inputMessage.trim() && selectedFiles.length === 0}
          style={{
            padding: '10px 24px',
            backgroundColor: '#2563eb',
            color: 'white',
            border: 'none',
            borderRadius: '20px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '500',
            opacity: (!inputMessage.trim() && selectedFiles.length === 0) ? 0.5 : 1,
            transition: 'all 0.2s'
          }}
        >
          Send
        </button>
      </form>
    </div>
  );
};

export default ChatWindow;