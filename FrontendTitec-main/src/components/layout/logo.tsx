import React from 'react';

export default function Logo() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
      <svg 
        width="32" 
        height="32" 
        viewBox="0 0 32 32" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        style={{ filter: "drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2))" }}
      >
        <path 
          d="M3 12C4.65685 12 6 10.6569 6 9C6 7.89543 6.89543 7 8 7H24C25.1046 7 26 7.89543 26 9C26 10.6569 27.3431 12 29 12C29.5523 12 30 12.4477 30 13V19C30 19.5523 29.5523 20 29 20C27.3431 20 26 21.3431 26 23C26 24.1046 25.1046 25 24 25H8C6.89543 25 6 24.1046 6 23C6 21.3431 4.65685 20 3 20C2.44772 20 2 19.5523 2 19V13C2 12.4477 2.44772 12 3 12Z" 
          stroke="white" 
          strokeWidth="2" 
          strokeLinecap="round" 
          strokeLinejoin="round"
          fill="rgba(255, 255, 255, 0.12)"
        />
        <line 
          x1="18" 
          y1="8" 
          x2="18" 
          y2="24" 
          stroke="white" 
          strokeWidth="1.8" 
          strokeLinecap="round" 
          strokeDasharray="2.5 3"
        />
        <circle cx="11" cy="16" r="2.2" stroke="white" strokeWidth="1.5" />
      </svg>
      <div style={{ 
        color: '#FFFFFF', 
        fontFamily: "'Poppins', sans-serif",
        fontSize: '22px', 
        fontWeight: 800,
        letterSpacing: '1.5px',
        textShadow: '0 2px 4px rgba(0, 0, 0, 0.2)'
      }}>
        TICKET-U
      </div>
    </div>
  );
}
