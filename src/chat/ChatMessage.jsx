import React from 'react';

const ChatMessage = ({ message, isAgent = false }) => {
  const isOwnMessage = isAgent 
    ? message.sender_type === 'agent' 
    : message.sender_type !== 'agent';

  return (
    <div 
      style={{ 
        display: 'flex', 
        justifyContent: isOwnMessage ? 'flex-end' : 'flex-start',
        marginBottom: '12px'
      }}
    >
      <div style={{
        maxWidth: '70%',
        padding: '12px 16px',
        borderRadius: '12px',
        backgroundColor: isOwnMessage ? '#2563eb' : '#e5e7eb',
        color: isOwnMessage ? 'white' : '#1f2937'
      }}>
        <p style={{ margin: '0 0 4px 0', fontSize: '11px', opacity: 0.8, fontWeight: '600' }}>
          {message.sender_type === 'agent' ? 'Support Agent' : 'You'}
        </p>
        
        {message.message && (
          <p style={{ margin: 0, fontSize: '14px' }}>{message.message}</p>
        )}

        {/* Show attachments */}
        {message.attachments && message.attachments.length > 0 && (
          <div style={{ marginTop: message.message ? '8px' : '0' }}>
            {message.attachments.map((attachment, index) => (
              <div key={index} style={{ marginBottom: '6px' }}>
                {attachment.file_type?.startsWith('image/') ? (
                  <img 
                    src={`http://localhost:9000${attachment.file_url}`}
                    alt={attachment.file_name}
                    style={{ maxWidth: '200px', borderRadius: '8px', cursor: 'pointer' }}
                    onClick={() => window.open(`http://localhost:9000${attachment.file_url}`, '_blank')}
                  />
                ) : attachment.file_type === 'application/pdf' ? (
                  <a 
                    href={`http://localhost:9000${attachment.file_url}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ 
                      display: 'inline-flex', 
                      alignItems: 'center', 
                      gap: '6px',
                      padding: '8px 12px',
                      backgroundColor: isOwnMessage ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)',
                      borderRadius: '6px',
                      textDecoration: 'none',
                      color: isOwnMessage ? 'white' : '#1f2937',
                      fontSize: '13px'
                    }}
                  >
                    📄 {attachment.file_name}
                  </a>
                ) : attachment.file_type?.startsWith('video/') ? (
                  <video 
                    src={`http://localhost:9000${attachment.file_url}`}
                    controls
                    style={{ maxWidth: '200px', borderRadius: '8px' }}
                  />
                ) : (
                  <a 
                    href={`http://localhost:9000${attachment.file_url}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: isOwnMessage ? 'white' : '#2563eb', textDecoration: 'underline' }}
                  >
                    📎 {attachment.file_name}
                  </a>
                )}
              </div>
            ))}
          </div>
        )}

        <p style={{ margin: '4px 0 0 0', fontSize: '11px', opacity: 0.7 }}>
          {new Date(message.created_at).toLocaleTimeString()}
        </p>
      </div>
    </div>
  );
};

export default ChatMessage;