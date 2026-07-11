import React, { useState, useEffect } from 'react';
import Header from '../components/Header';

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
          <div dangerouslySetInnerHTML={{ __html: renderMarkdown(content) }} />
        </div>
      </main>
    </div>
  );
}
