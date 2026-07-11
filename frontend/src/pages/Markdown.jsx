import React, { useState, useEffect } from 'react';
import Header from '../components/Header';

export default function MarkdownViewer() {
  const [content, setContent] = useState('');
  const [fileName, setFileName] = useState('analysis_design.md');
  const [renderedHtml, setRenderedHtml] = useState('');

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

  useEffect(() => {
    if (!content) {
      setRenderedHtml('');
      return;
    }

    let html = '';
    if (window.marked) {
      html = window.marked.parse(content);
    } else {
      // Fallback simple renderer
      html = content
        .replace(/^### (.+)$/gm, '<h3>$1</h3>')
        .replace(/^## (.+)$/gm, '<h2>$1</h2>')
        .replace(/^# (.+)$/gm, '<h1>$1</h1>')
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.+?)\*/g, '<em>$1</em>')
        .replace(/`(.+?)`/g, '<code>$1</code>')
        .replace(/^---$/gm, '<hr>')
        .replace(/^- (.+)$/gm, '<li>$1</li>')
        .replace(/\n/g, '<br>');
    }
    setRenderedHtml(html);
  }, [content]);

  useEffect(() => {
    if (renderedHtml) {
      // Add a tiny delay to ensure elements are inserted in DOM
      const timer = setTimeout(() => {
        // Find and replace code blocks with div.mermaid containing unescaped code
        const codeEls = document.querySelectorAll('pre code.language-mermaid');
        codeEls.forEach((codeEl) => {
          const rawCode = codeEl.textContent;
          const preEl = codeEl.parentElement;
          if (preEl) {
            const div = document.createElement('div');
            div.className = 'mermaid';
            div.textContent = rawCode;
            preEl.replaceWith(div);
          }
        });

        if (window.mermaid) {
          try {
            window.mermaid.initialize({
              startOnLoad: false,
              theme: 'dark',
              themeVariables: {
                primaryColor: '#c5a880',
                primaryTextColor: '#fff',
                primaryBorderColor: '#c5a880',
                lineColor: '#c5a880',
                secondaryColor: '#151c2c',
                tertiaryColor: '#0f172a'
              },
              securityLevel: 'loose',
            });
            
            if (typeof window.mermaid.run === 'function') {
              window.mermaid.run();
            } else if (typeof window.mermaid.init === 'function') {
              window.mermaid.init(undefined, '.mermaid');
            }
          } catch (err) {
            console.error('Mermaid render error:', err);
          }
        }
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [renderedHtml]);

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
          <div dangerouslySetInnerHTML={{ __html: renderedHtml }} />
        </div>
      </main>
    </div>
  );
}
