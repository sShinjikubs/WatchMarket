import React, { useState, useEffect, useRef } from 'react';
import Header from '../components/Header';
import mermaid from 'mermaid';

mermaid.initialize({
  startOnLoad: false,
  theme: 'dark',
  securityLevel: 'loose',
  themeVariables: {
    background: '#1e1e2e',
    primaryColor: '#ff79c6',
    primaryTextColor: '#f8f8f2',
    lineColor: '#6272a4',
  }
});

function Mermaid({ chart }) {
  const ref = useRef(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (ref.current) {
      ref.current.innerHTML = '';
      setError(null);
      const uniqueId = 'mermaid-' + Math.floor(Math.random() * 1000000);
      mermaid.render(uniqueId, chart)
        .then(({ svg }) => {
          if (ref.current) {
            ref.current.innerHTML = svg;
          }
        })
        .catch((err) => {
          console.error(err);
          setError(err);
        });
    }
  }, [chart]);

  if (error) {
    return (
      <div className="mermaid-error" style={{ color: '#ff5555', padding: '1rem', background: 'rgba(255, 85, 85, 0.1)', borderRadius: '8px', margin: '1rem 0' }}>
        <strong>Error rendering diagram:</strong>
        <pre style={{ marginTop: '0.5rem', whiteSpace: 'pre-wrap', fontSize: '0.85rem' }}>{error.message || String(error)}</pre>
      </div>
    );
  }

  return (
    <div 
      className="mermaid-diagram" 
      ref={ref} 
      style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        margin: '1.5rem 0', 
        background: 'rgba(255,255,255,0.03)', 
        padding: '1.5rem', 
        borderRadius: '12px', 
        overflowX: 'auto' 
      }} 
    />
  );
}

export default function MarkdownViewer() {
  const [content, setContent] = useState('');
  const [fileName, setFileName] = useState('analysis_design.md');

  const loadDoc = async (name) => {
    try {
      const res = await fetch(`/${name}`);
      if (res.ok) {
        const text = await res.text();
        setContent(text);
        setFileName(name);
      } else {
        setContent('ไม่พบเอกสาร');
      }
    } catch (_) {
      setContent('ไม่สามารถโหลดเอกสารได้');
    }
  };

  useEffect(() => { loadDoc('analysis_design.md'); }, []);

  // Very basic Markdown → HTML renderer
  const renderMarkdown = (md) =>
    md
      .replace(/^### (.+)$/gm, '<h3>$1</h3>')
      .replace(/^## (.+)$/gm, '<h2>$1</h2>')
      .replace(/^# (.+)$/gm, '<h1>$1</h1>')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/`(.+?)`/g, '<code>$1</code>')
      .replace(/^---$/gm, '<hr>')
      .replace(/^- (.+)$/gm, '<li>$1</li>')
      .replace(/\n/g, '<br>');

  const parseMarkdownWithCodeBlocks = (md) => {
    if (!md) return [];
    const parts = md.split(/```/g);
    return parts.map((part, index) => {
      if (index % 2 === 0) {
        return { type: 'markdown', content: part };
      } else {
        const match = part.match(/^([a-zA-Z0-9_\-+]+)?\r?\n([\s\S]*)$/);
        const lang = match ? match[1] : '';
        const code = match ? match[2] : part;
        return { type: 'code', lang: (lang || '').trim().toLowerCase(), content: code.trim() };
      }
    });
  };

  const parsedParts = parseMarkdownWithCodeBlocks(content);

  return (
    <div className="page-wrapper">
      <Header />
      <main className="main-content">
        <div className="page-header">
          <h1 className="page-title">📖 System Documents</h1>
          <div style={{ display: 'flex', gap: '0.8rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
            <button className={`btn ${fileName === 'analysis_design.md' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => loadDoc('analysis_design.md')}>
              📐 Analysis & Design
            </button>
            <button className={`btn ${fileName === 'README.md' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => loadDoc('README.md')}>
              📋 README
            </button>
          </div>
        </div>
        <div className="glass-card markdown-viewer">
          {parsedParts.map((part, idx) => {
            if (part.type === 'markdown') {
              return (
                <div 
                  key={idx} 
                  dangerouslySetInnerHTML={{ __html: renderMarkdown(part.content) }} 
                />
              );
            } else if (part.type === 'code' && part.lang.toLowerCase() === 'mermaid') {
              return (
                <Mermaid key={idx} chart={part.content} />
              );
            } else {
              return (
                <pre 
                  key={idx} 
                  style={{ 
                    background: 'rgba(0,0,0,0.3)', 
                    padding: '1rem', 
                    borderRadius: '8px', 
                    overflowX: 'auto', 
                    margin: '1rem 0',
                    fontFamily: 'monospace'
                  }}
                >
                  <code>{part.content}</code>
                </pre>
              );
            }
          })}
        </div>
      </main>
    </div>
  );
}
