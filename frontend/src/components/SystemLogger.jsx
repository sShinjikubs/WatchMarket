import React, { useState, useEffect, useRef } from 'react';
import { api } from '../api';

export default function SystemLogger({ className }) {
  const [logs, setLogs] = useState([]);
  const listRef = useRef(null);

  const fetchLogs = async () => {
    try {
      const res = await api.getLogs();
      if (res.ok) {
        const data = await res.json();
        setLogs(data.reverse ? data.reverse() : data);
      }
    } catch (_) {}
  };

  useEffect(() => {
    fetchLogs();
    const interval = setInterval(fetchLogs, 4000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = 0;
    }
  }, [logs]);

  return (
    <div className={`system-logger ${className || ''}`}>
      <div className="logger-header">
        <span className="logger-indicator" />
        SYSTEM LOG
        <button className="refresh-btn" onClick={fetchLogs} title="Refresh">↻</button>
      </div>
      <ul className="log-list" ref={listRef}>
        {logs.length === 0 && (
          <li className="log-entry" style={{ color: 'var(--text-muted)' }}>
            ไม่มี log ในระบบ
          </li>
        )}
        {logs.map((log, i) => (
          <li key={i} className="log-entry">
            {typeof log === 'string' ? log : log.message || JSON.stringify(log)}
          </li>
        ))}
      </ul>
    </div>
  );
}
