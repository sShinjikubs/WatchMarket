import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { useAuth } from '../App';
import Header from '../components/Header';
import SystemLogger from '../components/SystemLogger';

export default function Admin() {
  const { user: currentUser } = useAuth();
  
  // Navigation tabs
  const [activeTab, setActiveTab] = useState('inspection'); // 'inspection' | 'users'
  
  // Watch inspection state
  const [pendingWatches, setPendingWatches] = useState([]);
  
  // User management state
  const [users, setUsers] = useState([]);
  const [editingUser, setEditingUser] = useState(null); // username of user being edited
  const [userForm, setUserForm] = useState({ role: 'user', password: '' });
  
  const [notification, setNotification] = useState(null);

  const showNotif = (msg, ok = true) => {
    setNotification({ msg, ok });
    setTimeout(() => setNotification(null), 3000);
  };

  const refreshWatches = async () => {
    try {
      const res = await api.getPendingWatches();
      if (res.ok) setPendingWatches(await res.json());
    } catch (_) {}
  };

  const refreshUsers = async () => {
    try {
      const res = await api.getUsers();
      if (res.ok) setUsers(await res.json());
    } catch (_) {}
  };

  useEffect(() => {
    refreshWatches();
    refreshUsers();
  }, []);

  // Watch inspection actions
  const handleInspect = async (id, result) => {
    const res = await api.inspectWatch(id, result);
    if (res.ok) {
      showNotif(`ตรวจสภาพ: ${result === 'passed' ? 'ผ่านเกณฑ์' : 'ไม่ผ่านเกณฑ์'}`);
      refreshWatches();
    } else showNotif('ตรวจสภาพล้มเหลว', false);
  };

  const handleImport = async (id) => {
    const res = await api.importWatch(id);
    if (res.ok) { showNotif('นำเข้าคลังสำเร็จ!'); refreshWatches(); }
    else showNotif('นำเข้าล้มเหลว', false);
  };

  // User management actions
  const startEditUser = (userObj) => {
    setEditingUser(userObj.username);
    setUserForm({ role: userObj.role, password: '' });
  };

  const cancelEditUser = () => {
    setEditingUser(null);
    setUserForm({ role: 'user', password: '' });
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    if (!editingUser) return;
    try {
      const payload = { role: userForm.role };
      if (userForm.password.trim()) {
        payload.password = userForm.password.trim();
      }
      const res = await api.updateUser(editingUser, payload);
      if (res.ok) {
        showNotif(`อัปเดตผู้ใช้ "${editingUser}" สำเร็จ! 🎉`);
        cancelEditUser();
        refreshUsers();
      } else {
        showNotif('ไม่สามารถอัปเดตข้อมูลผู้ใช้ได้', false);
      }
    } catch (_) {
      showNotif('เกิดข้อผิดพลาดกับเซิร์ฟเวอร์', false);
    }
  };

  const handleDeleteUser = async (username) => {
    if (username === currentUser?.username) {
      showNotif('ไม่สามารถลบบัญชีของคุณเองได้!', false);
      return;
    }
    if (!window.confirm(`คุณแน่ใจหรือไม่ว่าต้องการลบผู้ใช้ "${username}"?`)) return;
    try {
      const res = await api.deleteUser(username);
      if (res.ok) {
        showNotif(`ลบผู้ใช้ "${username}" เรียบร้อยแล้ว`);
        refreshUsers();
      } else {
        showNotif('ไม่สามารถลบผู้ใช้ได้', false);
      }
    } catch (_) {
      showNotif('เกิดข้อผิดพลาดกับเซิร์ฟเวอร์', false);
    }
  };

  const pendingIns = pendingWatches.filter((w) => w.inspectionStatus === 'pending').length;
  const passed = pendingWatches.filter((w) => w.inspectionStatus === 'passed').length;
  const imported = pendingWatches.filter((w) => w.importStatus === 'imported').length;

  return (
    <div className="page-wrapper">
      {notification && <div className={`notification ${notification.ok ? '' : 'error'}`}>{notification.msg}</div>}
      <Header />

      <main className="main-content">
        <div className="page-header">
          <h1 className="page-title">👑 Admin Dashboard</h1>
          <p className="page-subtitle">จัดการระบบประเมินนาฬิกา และบริหารบัญชีผู้ใช้งาน</p>
        </div>

        {/* Navigation Tabs */}
        <div className="filter-controls" style={{ marginBottom: '2rem' }}>
          <button
            className={`filter-btn ${activeTab === 'inspection' ? 'active' : ''}`}
            onClick={() => setActiveTab('inspection')}
          >
            📋 คิวตรวจสอบและนำเข้าคลัง
          </button>
          <button
            className={`filter-btn ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}
          >
            👥 บัญชีผู้ใช้งาน ({users.length})
          </button>
        </div>

        {activeTab === 'inspection' ? (
          <>
            {/* Stats */}
            <div className="stats-grid">
              <div className="stat-card"><div className="stat-value" id="admin-pending-ins-count">{pendingIns}</div><div className="stat-label">รอตรวจสภาพ</div></div>
              <div className="stat-card"><div className="stat-value" id="admin-passed-count">{passed}</div><div className="stat-label">ผ่านเกณฑ์</div></div>
              <div className="stat-card"><div className="stat-value" id="admin-imported-total">{imported}</div><div className="stat-label">นำเข้าคลังแล้ว</div></div>
            </div>

            {/* Inspection Queue Table */}
            <div className="glass-card">
              <h2 className="card-title">📋 คิวตรวจสอบนาฬิกา</h2>
              <div className="table-responsive">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>ผู้เสนอขาย</th>
                      <th>นาฬิกา</th>
                      <th>ราคา</th>
                      <th>Banding</th>
                      <th>ตรวจสภาพ</th>
                      <th>นำเข้าคลัง</th>
                    </tr>
                  </thead>
                  <tbody id="admin-inspection-table">
                    {pendingWatches.length === 0 ? (
                      <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>ไม่มีรายการในคิว</td></tr>
                    ) : pendingWatches.map((w) => (
                      <tr key={w.id}>
                        <td>
                          <strong>{w.sellerName}</strong><br />
                          <small style={{ color: 'var(--text-muted)' }}>{w.sellerEmail}</small>
                        </td>
                        <td><strong>{w.brand}</strong> {w.model}</td>
                        <td>฿ {w.price?.toLocaleString()}</td>
                        <td><span className="badge" style={{ background: 'rgba(197,168,128,0.1)', color: 'var(--accent-gold)' }}>{w.proposedBanding?.toUpperCase()}</span></td>
                        <td>
                          {w.inspectionStatus === 'pending' ? (
                            <div className="btn-group">
                              <button className="btn btn-success" style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem' }} onClick={() => handleInspect(w.id, 'passed')}>ผ่านเกณฑ์ ✔️</button>
                              <button className="btn btn-danger" style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem' }} onClick={() => handleInspect(w.id, 'failed')}>ตกเกณฑ์ ✖️</button>
                            </div>
                          ) : w.inspectionStatus === 'passed' ? (
                            <span className="badge badge-watch-passed">ผ่านเกณฑ์</span>
                          ) : (
                            <span className="badge badge-watch-failed">ไม่ผ่านเกณฑ์</span>
                          )}
                        </td>
                        <td>
                          {w.inspectionStatus === 'passed' && w.importStatus === 'pending' ? (
                            <button className="btn btn-primary" style={{ padding: '0.25rem 0.6rem', fontSize: '0.8rem' }} onClick={() => handleImport(w.id)}>นำเข้าคลัง 📦</button>
                          ) : w.importStatus === 'imported' ? (
                            <span className="badge badge-watch-imported">นำเข้าแล้ว</span>
                          ) : (
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>รอกระบวนการ</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        ) : (
          <div className="content-grid two-col">
            {/* Users Table */}
            <div className="glass-card">
              <h2 className="card-title">👥 บัญชีผู้ใช้ในระบบ</h2>
              <div className="table-responsive">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>ชื่อผู้ใช้งาน (Username)</th>
                      <th>บทบาท (Role)</th>
                      <th>การจัดการ (Actions)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.length === 0 ? (
                      <tr><td colSpan={3} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>ไม่มีข้อมูลบัญชีผู้ใช้</td></tr>
                    ) : users.map((u) => (
                      <tr key={u.username}>
                        <td>
                          <strong>{u.username}</strong>
                          {u.username === currentUser?.username && (
                            <span className="badge" style={{ background: 'rgba(81,207,102,0.1)', color: '#51cf66', marginLeft: '0.5rem' }}>คุณ</span>
                          )}
                        </td>
                        <td>
                          <span
                            className="badge"
                            style={{
                              background: u.role === 'admin' ? 'rgba(197,168,128,0.15)' : u.role === 'manager' ? 'rgba(77,171,247,0.15)' : 'rgba(255,255,255,0.05)',
                              color: u.role === 'admin' ? 'var(--accent-gold)' : u.role === 'manager' ? '#4dabf7' : 'var(--text-muted)'
                            }}
                          >
                            {u.role.toUpperCase()}
                          </span>
                        </td>
                        <td>
                          <div className="btn-group">
                            <button
                              className="btn btn-secondary"
                              style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem' }}
                              onClick={() => startEditUser(u)}
                            >
                              แก้ไข ✏️
                            </button>
                            <button
                              className="btn btn-danger"
                              style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem' }}
                              disabled={u.username === currentUser?.username}
                              onClick={() => handleDeleteUser(u.username)}
                            >
                              ลบ 🗑️
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Edit User Form Panel */}
            <div className="glass-card">
              <h2 className="card-title">
                {editingUser ? `✏️ แก้ไขผู้ใช้: ${editingUser}` : 'ℹ️ เลือกแก้ไขบัญชีผู้ใช้'}
              </h2>
              {editingUser ? (
                <form onSubmit={handleUpdateUser} className="form-stack">
                  <div className="form-group">
                    <label className="form-label">ระดับสิทธิ์การใช้งาน (Role)</label>
                    <select
                      className="form-select"
                      value={userForm.role}
                      onChange={(e) => setUserForm((prev) => ({ ...prev, role: e.target.value }))}
                    >
                      <option value="user">USER (ลูกค้า / ผู้เสนอขาย)</option>
                      <option value="manager">MANAGER (ผู้จัดการคลังสินค้า)</option>
                      <option value="admin">ADMIN (ผู้ดูแลระบบสูงสุด)</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">เปลี่ยนรหัสผ่าน (เว้นว่างไว้หากไม่ต้องการเปลี่ยน)</label>
                    <input
                      type="password"
                      className="form-input"
                      placeholder="กรอกรหัสผ่านใหม่"
                      value={userForm.password}
                      onChange={(e) => setUserForm((prev) => ({ ...prev, password: e.target.value }))}
                    />
                  </div>

                  <div className="btn-group" style={{ marginTop: '1rem' }}>
                    <button type="submit" className="btn btn-primary">
                      บันทึกการเปลี่ยนแปลง 💾
                    </button>
                    <button type="button" className="btn btn-secondary" onClick={cancelEditUser}>
                      ยกเลิก
                    </button>
                  </div>
                </form>
              ) : (
                <p style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>
                  กดปุ่ม "แก้ไข" ท้ายชื่อบัญชีผู้ใช้ที่ต้องการเปลี่ยนบทบาทสิทธิ์การเข้าถึงระบบ หรือรีเซ็ตรหัสผ่านใหม่
                </p>
              )}
            </div>
          </div>
        )}

        <SystemLogger />
      </main>
    </div>
  );
}
