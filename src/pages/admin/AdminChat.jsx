import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useChat } from '../../chat/useChat';
import io from 'socket.io-client';

const API_URL = 'http://localhost:9000';

const AdminChat = () => {
  const [waitingChats, setWaitingChats] = useState([]);
  const [activeChats, setActiveChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [customerDetails, setCustomerDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [showCustomerPanel, setShowCustomerPanel] = useState(false);
  
  const fileInputRef = useRef(null);
  const socketRef = useRef(null);

  const { messages: socketMessages, isConnected } = useChat(selectedChat?.id);

  // Socket connection ve event listeners
  useEffect(() => {
    // Connect to socket
    socketRef.current = io(API_URL);

    // Listen for new conversations
    socketRef.current.on('new_conversation_waiting', (conversation) => {
      console.log('🔔 New conversation waiting:', conversation);
      setWaitingChats(prev => [conversation, ...prev]);
    });

    // Cleanup
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  // Listen for socket messages and add to messages state (avoid duplicates)
  useEffect(() => {
    if (socketMessages.length > 0) {
      console.log('📨 Agent received socket messages:', socketMessages);
      
      setMessages(prev => {
        const existingIds = new Set(prev.map(m => m.id));
        const newMessages = socketMessages.filter(m => !existingIds.has(m.id));
        if (newMessages.length > 0) {
          console.log('➕ Agent adding new messages:', newMessages);
        }
        return [...prev, ...newMessages];
      });
    }
  }, [socketMessages]);

  // Reset messages when conversation changes
  useEffect(() => {
    if (!selectedChat) {
      setMessages([]);
      setCustomerDetails(null);
      setShowCustomerPanel(false);
    }
  }, [selectedChat]);

  // Load waiting conversations
  const loadWaitingChats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/api/chat/conversations/waiting`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setWaitingChats(response.data.data || []);
    } catch (error) {
      console.error('Error loading waiting chats:', error);
    }
  };

  // Load agent's active conversations
  const loadActiveChats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/api/chat/conversations/my-active`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setActiveChats(response.data.data || []);
    } catch (error) {
      console.error('Error loading active chats:', error);
    }
  };

  // Load customer details
  const loadCustomerDetails = async (conversationId) => {
    setLoadingDetails(true);
    try {
      const token = localStorage.getItem('token');
      
      // First get the conversation to find customer_id
      const convResponse = await axios.get(`${API_URL}/api/chat/conversations/${conversationId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const customerId = convResponse.data.data.customer_id;
      
      if (!customerId) {
        console.log('No customer ID - this is a guest user');
        setCustomerDetails(null);
        return;
      }

      // Get customer details
      const detailsResponse = await axios.get(`${API_URL}/api/chat/customers/${customerId}/details`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setCustomerDetails(detailsResponse.data.data);
      console.log('Customer details loaded:', detailsResponse.data.data);
    } catch (error) {
      console.error('Error loading customer details:', error);
      setCustomerDetails(null);
    } finally {
      setLoadingDetails(false);
    }
  };

  // Claim a conversation
  const claimConversation = async (conversationId) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API_URL}/api/chat/conversations/${conversationId}/claim`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Refresh lists
      await loadWaitingChats();
      await loadActiveChats();
      
      // Select this conversation and load messages
      const response = await axios.get(`${API_URL}/api/chat/conversations/${conversationId}/messages`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSelectedChat({ id: conversationId });
      setMessages(response.data.data || []);
      
      // Load customer details
      loadCustomerDetails(conversationId);
    } catch (error) {
      console.error('Error claiming conversation:', error);
      alert('Could not claim conversation');
    } finally {
      setLoading(false);
    }
  };

  // Load messages for a conversation
  const loadMessages = async (conversationId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/api/chat/conversations/${conversationId}/messages`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessages(response.data.data || []);
      setSelectedChat({ id: conversationId });
      
      // Load customer details
      loadCustomerDetails(conversationId);
    } catch (error) {
      console.error('Error loading messages:', error);
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

  // Send message as agent
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if ((!inputMessage.trim() && selectedFiles.length === 0) || !selectedChat) return;

    const messageText = inputMessage;
    const filesToSend = selectedFiles;

    console.log('📤 Agent sending message:', messageText, 'Files:', filesToSend.length);
    setInputMessage('');
    setSelectedFiles([]);

    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      
      // If no files, send as regular text message
      if (filesToSend.length === 0) {
        await axios.post(`${API_URL}/api/chat/messages`, {
          conversation_id: selectedChat.id,
          message: messageText,
          sender_type: 'agent'
        }, { headers });
      } else {
        // Send with attachments using FormData
        const formData = new FormData();
        formData.append('conversation_id', selectedChat.id);
        formData.append('message', messageText);
        formData.append('sender_type', 'agent');
        
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

      console.log('✅ Agent message sent successfully');
      // Socket.io will handle adding the message via broadcast
    } catch (error) {
      console.error('Error sending message:', error);
      setInputMessage(messageText);
      setSelectedFiles(filesToSend);
    }
  };

  // Load data on mount
  useEffect(() => {
    loadWaitingChats();
    loadActiveChats();
    
    // Refresh every 5 seconds
    const interval = setInterval(() => {
      loadWaitingChats();
      loadActiveChats();
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 100px)', gap: '20px' }}>
      {/* Sidebar - Chat Lists */}
      <div style={{ width: '300px', backgroundColor: 'white', borderRadius: '8px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', overflowY: 'auto' }}>
        <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '20px', color: '#111827' }}>Chat Dashboard</h2>
        
        {/* Waiting Chats */}
        <div style={{ marginBottom: '30px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#dc2626', marginBottom: '12px' }}>
            Waiting ({waitingChats.length})
          </h3>
          {waitingChats.length === 0 ? (
            <p style={{ fontSize: '14px', color: '#6b7280' }}>No waiting chats</p>
          ) : (
            waitingChats.map(chat => (
              <div 
                key={chat.id}
                onClick={() => claimConversation(chat.id)}
                style={{ 
                  padding: '12px', 
                  backgroundColor: '#fef2f2', 
                  borderRadius: '6px', 
                  marginBottom: '8px', 
                  cursor: 'pointer',
                  border: '1px solid #fecaca'
                }}
              >
                <p style={{ margin: 0, fontSize: '14px', fontWeight: '600', color: '#991b1b' }}>
                  {chat.guest_name || 'Guest'}
                </p>
                <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#6b7280' }}>
                  {new Date(chat.started_at).toLocaleTimeString()}
                </p>
              </div>
            ))
          )}
        </div>

        {/* Active Chats */}
        <div>
          <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#059669', marginBottom: '12px' }}>
            Active ({activeChats.length})
          </h3>
          {activeChats.length === 0 ? (
            <p style={{ fontSize: '14px', color: '#6b7280' }}>No active chats</p>
          ) : (
            activeChats.map(chat => (
              <div 
                key={chat.id}
                onClick={() => loadMessages(chat.id)}
                style={{ 
                  padding: '12px', 
                  backgroundColor: selectedChat?.id === chat.id ? '#dcfce7' : '#f0fdf4', 
                  borderRadius: '6px', 
                  marginBottom: '8px', 
                  cursor: 'pointer',
                  border: selectedChat?.id === chat.id ? '2px solid #059669' : '1px solid #bbf7d0'
                }}
              >
                <p style={{ margin: 0, fontSize: '14px', fontWeight: '600', color: '#065f46' }}>
                  {chat.guest_name || `Chat #${chat.id}`}
                </p>
                <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#6b7280' }}>
                  {new Date(chat.started_at).toLocaleTimeString()}
                </p>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Chat Window */}
      <div style={{ flex: 1, backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', display: 'flex', flexDirection: 'column' }}>
        {!selectedChat ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ textAlign: 'center' }}>
              <p style={{ color: '#6b7280', fontSize: '16px', marginBottom: '8px' }}>Select a conversation to start chatting</p>
              <p style={{ color: '#9ca3af', fontSize: '14px' }}>Waiting chats will appear on the left</p>
            </div>
          </div>
        ) : (
          <>
            {/* Header */}
            <div style={{ padding: '20px', borderBottom: '1px solid #e5e7eb', backgroundColor: '#f9fafb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: '#111827' }}>
                  Conversation #{selectedChat.id}
                </h3>
                <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: isConnected ? '#059669' : '#dc2626', fontWeight: '500' }}>
                  {isConnected ? '🟢 Connected' : '🔴 Disconnected'}
                </p>
              </div>
              
              {/* Customer Details Button */}
              {customerDetails && (
                <button
                  onClick={() => setShowCustomerPanel(!showCustomerPanel)}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: showCustomerPanel ? '#2563eb' : '#f3f4f6',
                    color: showCustomerPanel ? 'white' : '#374151',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '500'
                  }}
                >
                  {showCustomerPanel ? 'Hide' : 'Show'} Customer Details
                </button>
              )}
            </div>

            <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
              {/* Messages Area */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                {/* Messages */}
                <div style={{ flex: 1, padding: '20px', overflowY: 'auto', backgroundColor: '#f9fafb' }}>
                  {messages.length === 0 ? (
                    <p style={{ textAlign: 'center', color: '#9ca3af', fontSize: '14px' }}>No messages yet</p>
                  ) : (
                    messages.map(msg => (
                      <div 
                        key={msg.id}
                        style={{ 
                          display: 'flex', 
                          justifyContent: msg.sender_type === 'agent' ? 'flex-end' : 'flex-start',
                          marginBottom: '12px'
                        }}
                      >
                        <div style={{
                          maxWidth: '70%',
                          padding: '12px 16px',
                          borderRadius: '12px',
                          backgroundColor: msg.sender_type === 'agent' ? '#2563eb' : '#e5e7eb',
                          color: msg.sender_type === 'agent' ? 'white' : '#1f2937'
                        }}>
                          <p style={{ margin: '0 0 4px 0', fontSize: '11px', opacity: 0.8, fontWeight: '600' }}>
                            {msg.sender_type === 'agent' ? 'You (Agent)' : 'Customer'}
                          </p>
                          
                          {msg.message && (
                            <p style={{ margin: 0, fontSize: '14px' }}>{msg.message}</p>
                          )}

                          {/* Show attachments */}
                          {msg.attachments && msg.attachments.length > 0 && (
                            <div style={{ marginTop: msg.message ? '8px' : '0' }}>
                              {msg.attachments.map((attachment, index) => (
                                <div key={index} style={{ marginBottom: '6px' }}>
                                  {attachment.file_type?.startsWith('image/') ? (
                                    <img 
                                      src={`${API_URL}${attachment.file_url}`}
                                      alt={attachment.file_name}
                                      style={{ maxWidth: '200px', borderRadius: '8px', cursor: 'pointer' }}
                                      onClick={() => window.open(`${API_URL}${attachment.file_url}`, '_blank')}
                                    />
                                  ) : attachment.file_type === 'application/pdf' ? (
                                    <a 
                                      href={`${API_URL}${attachment.file_url}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      style={{ 
                                        display: 'inline-flex', 
                                        alignItems: 'center', 
                                        gap: '6px',
                                        padding: '8px 12px',
                                        backgroundColor: msg.sender_type === 'agent' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)',
                                        borderRadius: '6px',
                                        textDecoration: 'none',
                                        color: msg.sender_type === 'agent' ? 'white' : '#1f2937',
                                        fontSize: '13px'
                                      }}
                                    >
                                      📄 {attachment.file_name}
                                    </a>
                                  ) : attachment.file_type?.startsWith('video/') ? (
                                    <video 
                                      src={`${API_URL}${attachment.file_url}`}
                                      controls
                                      style={{ maxWidth: '200px', borderRadius: '8px' }}
                                    />
                                  ) : (
                                    <a 
                                      href={`${API_URL}${attachment.file_url}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      style={{ color: msg.sender_type === 'agent' ? 'white' : '#2563eb', textDecoration: 'underline' }}
                                    >
                                      📎 {attachment.file_name}
                                    </a>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}

                          <p style={{ margin: '4px 0 0 0', fontSize: '11px', opacity: 0.7 }}>
                            {new Date(msg.created_at).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Selected Files Preview */}
                {selectedFiles.length > 0 && (
                  <div style={{ padding: '12px 20px', borderTop: '1px solid #e5e7eb', backgroundColor: '#f9fafb' }}>
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

                {/* Input */}
                <form onSubmit={handleSendMessage} style={{ padding: '20px', borderTop: '1px solid #e5e7eb', display: 'flex', gap: '12px', backgroundColor: 'white' }}>
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
                      borderRadius: '8px',
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
                    onChange={(e) => setInputMessage(e.target.value)}
                    placeholder="Type your message..."
                    style={{ 
                      flex: 1, 
                      padding: '12px 16px', 
                      border: '1px solid #d1d5db', 
                      borderRadius: '8px',
                      fontSize: '14px',
                      outline: 'none'
                    }}
                  />
                  <button
                    type="submit"
                    disabled={!inputMessage.trim() && selectedFiles.length === 0}
                    style={{
                      padding: '12px 24px',
                      backgroundColor: '#2563eb',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: '500',
                      opacity: (!inputMessage.trim() && selectedFiles.length === 0) ? 0.5 : 1
                    }}
                  >
                    Send
                  </button>
                </form>
              </div>

              {/* Customer Details Panel */}
              {showCustomerPanel && customerDetails && (
                <div style={{ width: '320px', borderLeft: '1px solid #e5e7eb', backgroundColor: 'white', overflowY: 'auto', padding: '20px' }}>
                  <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '600', color: '#111827' }}>Customer Details</h3>
                  
                  {/* Customer Info */}
                  <div style={{ marginBottom: '24px', padding: '12px', backgroundColor: '#f9fafb', borderRadius: '8px' }}>
                    <p style={{ margin: '0 0 6px 0', fontSize: '14px', fontWeight: '600', color: '#111827' }}>
                      {customerDetails.customer.name}
                    </p>
                    <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: '#6b7280' }}>
                      📧 {customerDetails.customer.email}
                    </p>
                    {customerDetails.customer.home_address && (
                      <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#6b7280' }}>
                        📍 {customerDetails.customer.home_address}
                      </p>
                    )}
                  </div>

                  {/* Orders */}
                  <div style={{ marginBottom: '24px' }}>
                    <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: '600', color: '#111827' }}>
                      Recent Orders ({customerDetails.orders.length})
                    </h4>
                    {customerDetails.orders.length === 0 ? (
                      <p style={{ fontSize: '13px', color: '#9ca3af' }}>No orders yet</p>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {customerDetails.orders.slice(0, 5).map(order => (
                          <div key={order.id} style={{ padding: '10px', backgroundColor: '#f9fafb', borderRadius: '6px', border: '1px solid #e5e7eb' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                              <span style={{ fontSize: '12px', fontWeight: '600', color: '#111827' }}>
                                Order #{order.id}
                              </span>
                              <span style={{ 
                                fontSize: '11px', 
                                padding: '2px 8px', 
                                borderRadius: '12px',
                                backgroundColor: order.status === 'delivered' ? '#dcfce7' : order.status === 'in-transit' ? '#dbeafe' : '#fef3c7',
                                color: order.status === 'delivered' ? '#065f46' : order.status === 'in-transit' ? '#1e40af' : '#92400e'
                              }}>
                                {order.status}
                              </span>
                            </div>
                            <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#6b7280' }}>
                              ${order.total_price} • {new Date(order.created_at).toLocaleDateString()}
                            </p>
                            {order.items && order.items.length > 0 && (
                              <p style={{ margin: '6px 0 0 0', fontSize: '11px', color: '#9ca3af' }}>
                                {order.items.length} item(s)
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Wishlist */}
                  <div>
                    <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: '600', color: '#111827' }}>
                      Wishlist ({customerDetails.wishlist.length})
                    </h4>
                    {customerDetails.wishlist.length === 0 ? (
                      <p style={{ fontSize: '13px', color: '#9ca3af' }}>No wishlist items</p>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {customerDetails.wishlist.slice(0, 5).map(item => (
                          <div key={item.id} style={{ padding: '10px', backgroundColor: '#f9fafb', borderRadius: '6px', border: '1px solid #e5e7eb' }}>
                            <p style={{ margin: '0 0 4px 0', fontSize: '12px', fontWeight: '600', color: '#111827' }}>
                              {item.product_name}
                            </p>
                            <p style={{ margin: 0, fontSize: '12px', color: '#2563eb', fontWeight: '500' }}>
                              ${item.price}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AdminChat;