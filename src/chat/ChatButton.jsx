import React, { useState } from 'react';
import ChatWindow from './ChatWindow';

const ChatButton = () => {
  console.log('ChatButton rendered!');
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div>
      {/* Chat Window */}
      {isOpen && (
        <div style={{
          position: 'fixed',
          bottom: '96px',
          right: '24px',
          width: '384px',
          height: '600px',
          zIndex: 9999
        }}>
          <ChatWindow onClose={() => {
            console.log('Closing chat...');
            setIsOpen(false);
          }} />
        </div>
      )}

      {/* Floating Chat Button */}
      {!isOpen && (
        <button
          onClick={() => {
            console.log('Opening chat...');
            setIsOpen(true);
          }}
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            backgroundColor: '#2563eb',
            color: 'white',
            border: 'none',
            cursor: 'pointer',
            zIndex: 9999,
            fontSize: '28px'
          }}
        >
          💬
        </button>
      )}
    </div>
  );
};

export default ChatButton;