import React from 'react';
import './FloatingWatch.css';

export default function FloatingWatch() {
  return (
    <div className="floating-watch-container">
      <div className="floating-watch-wrapper">
        <svg viewBox="0 0 400 400" width="100%" height="100%" className="floating-watch-svg">
          <defs>
            {/* Gradients for metallic look */}
            <linearGradient id="case-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#f8f9fa" />
              <stop offset="50%" stopColor="#adb5bd" />
              <stop offset="100%" stopColor="#495057" />
            </linearGradient>
            
            <linearGradient id="dial-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#1a1c23" />
              <stop offset="50%" stopColor="#2c303a" />
              <stop offset="100%" stopColor="#0f1115" />
            </linearGradient>

            <linearGradient id="gold-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#f5d682" />
              <stop offset="50%" stopColor="#c5a880" />
              <stop offset="100%" stopColor="#8c734b" />
            </linearGradient>

            {/* Reflection on glass */}
            <linearGradient id="glass-reflection" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="rgba(255,255,255,0.4)" />
              <stop offset="40%" stopColor="rgba(255,255,255,0.05)" />
              <stop offset="50%" stopColor="rgba(255,255,255,0)" />
              <stop offset="100%" stopColor="rgba(255,255,255,0)" />
            </linearGradient>
          </defs>

          {/* Straps */}
          <path d="M 140 20 L 260 20 L 250 80 L 150 80 Z" fill="url(#case-grad)" className="watch-strap" />
          <path d="M 140 380 L 260 380 L 250 320 L 150 320 Z" fill="url(#case-grad)" className="watch-strap" />
          
          <path d="M 155 0 L 245 0 L 245 30 L 155 30 Z" fill="#1a1c23" />
          <path d="M 155 370 L 245 370 L 245 400 L 155 400 Z" fill="#1a1c23" />

          {/* Watch Case Background */}
          <circle cx="200" cy="200" r="145" fill="url(#case-grad)" filter="drop-shadow(0px 20px 30px rgba(0,0,0,0.8))" />
          
          {/* Bezel */}
          <circle cx="200" cy="200" r="130" fill="url(#dial-grad)" stroke="url(#gold-grad)" strokeWidth="6" />

          {/* Inner Dial details */}
          {[...Array(12)].map((_, i) => {
            const rot = i * 30;
            return (
              <g key={i} transform={`rotate(${rot} 200 200)`}>
                <rect x="196" y="80" width="8" height="24" rx="4" fill="url(#gold-grad)" />
              </g>
            );
          })}
          
          {[...Array(60)].map((_, i) => {
            if (i % 5 === 0) return null;
            const rot = i * 6;
            return (
              <g key={'min'+i} transform={`rotate(${rot} 200 200)`}>
                <rect x="198" y="85" width="4" height="8" rx="2" fill="#adb5bd" />
              </g>
            );
          })}

          {/* Chronograph dials */}
          <circle cx="150" cy="200" r="25" fill="#15171e" stroke="url(#gold-grad)" strokeWidth="2" />
          <circle cx="250" cy="200" r="25" fill="#15171e" stroke="url(#gold-grad)" strokeWidth="2" />
          <circle cx="200" cy="260" r="25" fill="#15171e" stroke="url(#gold-grad)" strokeWidth="2" />

          <g className="chrono-hand-1">
            <line x1="150" y1="200" x2="150" y2="185" stroke="#ff4757" strokeWidth="2" strokeLinecap="round" />
          </g>
          <g className="chrono-hand-2">
            <line x1="250" y1="200" x2="250" y2="185" stroke="#ff4757" strokeWidth="2" strokeLinecap="round" />
          </g>
          <g className="chrono-hand-3">
            <line x1="200" y1="260" x2="200" y2="245" stroke="#ff4757" strokeWidth="2" strokeLinecap="round" />
          </g>

          {/* Crown and Buttons */}
          <rect x="340" y="185" width="18" height="30" rx="4" fill="url(#gold-grad)" />
          <rect x="330" y="130" width="14" height="18" rx="3" fill="url(#case-grad)" className="watch-button btn-top" />
          <rect x="330" y="252" width="14" height="18" rx="3" fill="url(#case-grad)" className="watch-button btn-bottom" />

          {/* Hands */}
          <g className="watch-hour-hand">
            <line x1="200" y1="210" x2="200" y2="120" stroke="url(#gold-grad)" strokeWidth="12" strokeLinecap="round" />
            <line x1="200" y1="210" x2="200" y2="130" stroke="#fff" strokeWidth="4" strokeLinecap="round" />
          </g>
          
          <g className="watch-minute-hand">
            <line x1="200" y1="215" x2="200" y2="90" stroke="url(#gold-grad)" strokeWidth="8" strokeLinecap="round" />
            <line x1="200" y1="215" x2="200" y2="100" stroke="#fff" strokeWidth="3" strokeLinecap="round" />
          </g>

          {/* Sweeping Second hand */}
          <g className="watch-second-hand">
            <line x1="200" y1="225" x2="200" y2="90" stroke="#ff4757" strokeWidth="3" strokeLinecap="round" />
            <circle cx="200" cy="200" r="6" fill="#ff4757" />
            <circle cx="200" cy="200" r="2" fill="#fff" />
          </g>

          {/* Glass Reflection */}
          <circle cx="200" cy="200" r="128" fill="url(#glass-reflection)" />
        </svg>
      </div>
      <div className="watch-shadow"></div>
    </div>
  );
}
