import React, { useState, useEffect, useRef } from 'react';
import { api } from '../api';
import Header from '../components/Header';
import SystemLogger from '../components/SystemLogger';

const MOCK_CHATS = [
  { from: 'customer', name: 'Customer-1', msg: 'สวัสดีครับ ต้องการสอบถามเรื่องการจัดส่ง' },
  { from: 'customer', name: 'Customer-2', msg: 'นาฬิกาสินค้ารหัส #WT-001 มีสีอื่นไหมครับ?' },
  { from: 'customer', name: 'Customer-3', msg: 'ส่ง EMS ได้ไหมครับ ต้องการเร่งด่วน' },
];

export default function Staff() {
  const [orders, setOrders] = useState([]);
  const [chats, setChats] = useState(MOCK_CHATS);
  const [chatInput, setChatInput] = useState('');
  const [notification, setNotification] = useState(null);
  const chatRef = useRef(null);

  const showNotif = (msg, ok = true) => {
    setNotification({ msg, ok });
    setTimeout(() => setNotification(null), 3000);
  };

  const refreshData = async () => {
    try {
      const res = await api.getOrders();
      if (res.ok) setOrders(await res.json());
    } catch (_) {}
  };

  useEffect(() => { refreshData(); }, []);

  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [chats]);

  const shipOrder = async (id) => {
    const res = await api.shipOrder(id);
    if (res.ok) { showNotif('จัดส่งพัสดุสำเร็จ!'); refreshData(); }
    else showNotif('อัปเดตสถานะล้มเหลว', false);
  };

  const sendChat = () => {
    if (!chatInput.trim()) return;
    setChats((prev) => [...prev, { from: 'staff', name: 'Staff-99', msg: chatInput.trim() }]);
    api.addLog(`[SUPPORT]: Staff-99 replied: "${chatInput.trim()}"`).catch(() => {});
    setChatInput('');
  };

  const pendingCount = orders.filter((o) => o.status === 'paid').length;
  const shippedCount = orders.filter((o) => o.status === 'shipped').length;

  return (
    <div className="page-wrapper">
      {notification && <div className={`notification ${notification.ok ? '' : 'error'}`}>{notification.msg}</div>}
      <Header />

      <main className="main-content">
        <div className="page-header">
          <h1 className="page-title">🧑‍💼 Staff Portal</h1>
          <p className="page-subtitle">จัดการการจัดส่งและสนับสนุนลูกค้า</p>
        </div>

        {/* Stats */}
        <div className="stats-grid">
          <div className="stat-card"><div className="stat-value" id="staff-pending-count">{pendingCount}</div><div className="stat-label">รอจัดส่ง</div></div>
          <div className="stat-card"><div className="stat-value" id="staff-shipped-count">{shippedCount}</div><div className="stat-label">จัดส่งแล้ว</div></div>
        </div>

        <div className="content-grid two-col">
          {/* Shipping Orders Table */}
          <div className="glass-card">
            <h2 className="card-title">🚚 จัดการการจัดส่ง</h2>
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr><th>Order ID</th><th>สินค้า / ที่อยู่</th><th>ยอดรวม</th><th>สถานะ</th><th>ดำเนินการ</th></tr>
                </thead>
                <tbody id="staff-orders-table">
                  {orders.length === 0 ? (
                    <tr><td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>ไม่มีใบสั่งซื้อ</td></tr>
                  ) : orders.map((ord) => (
                    <tr key={ord.id}>
                      <td><strong>{ord.id}</strong></td>
                      <td>
                        <div style={{ fontSize: '0.85rem' }}>{ord.items?.map((i) => `${i.name} (${i.quantity} เรือน)`).join(', ')}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                          ผู้ซื้อ: {ord.email} | ที่อยู่: {ord.address}
                        </div>
                      </td>
                      <td>฿ {ord.total?.toLocaleString()}</td>
                      <td>
                        <span className={`badge ${ord.status === 'paid' ? 'badge-paid' : ord.status === 'shipped' ? 'badge-shipped' : 'badge-cancelled'}`}>
                          {ord.status === 'paid' ? 'เตรียมส่ง' : ord.status === 'shipped' ? 'ส่งแล้ว' : 'ยกเลิก'}
                        </span>
                      </td>
                      <td>
                        {ord.status === 'paid' ? (
                          <button className="btn btn-primary" style={{ padding: '0.25rem 0.6rem', fontSize: '0.8rem' }} onClick={() => shipOrder(ord.id)}>
                            จัดส่ง 🚚
                          </button>
                        ) : ord.status === 'shipped' ? (
                          <span style={{ color: '#4ade80', fontSize: '0.8rem', fontWeight: 700 }}>✔️ นำจ่ายแล้ว</span>
                        ) : (
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>ยกเลิกแล้ว</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Live Chat Support */}
          <div className="glass-card" style={{ display: 'flex', flexDirection: 'column' }}>
            <h2 className="card-title">💬 Live Chat Support</h2>
            <div
              ref={chatRef}
              id="chat-messages-container"
              style={{ flex: 1, minHeight: '260px', maxHeight: '340px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.6rem', padding: '0.5rem', background: 'rgba(0,0,0,0.1)', borderRadius: '8px' }}
            >
              {chats.map((c, i) => (
                <div key={i} className={`chat-msg ${c.from === 'staff' ? 'staff' : ''}`}>
                  <strong>[{c.name}]:</strong> {c.msg}
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '0.6rem', marginTop: '1rem' }}>
              <input
                className="form-input"
                style={{ flex: 1 }}
                placeholder="พิมพ์ข้อความตอบกลับ..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendChat()}
                id="chat-staff-input"
              />
              <button className="btn btn-primary" onClick={sendChat}>ส่ง</button>
            </div>
          </div>
        </div>

        <SystemLogger />
      </main>
    </div>
  );
}
