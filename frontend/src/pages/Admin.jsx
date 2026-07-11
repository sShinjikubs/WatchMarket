import React, { useState, useEffect, useRef, useCallback } from 'react';
import { api } from '../api';
import { useAuth } from '../App';
import Header from '../components/Header';
import { Icons } from '../components/Icons';
import SystemLogger from '../components/SystemLogger';

// ─── Canvas Chart helpers (vanilla rendering) ─────────────────────────────────
function drawBarChart(canvas, products, orders) {
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const brands = { luminox: 0, seiko: 0, 'tag heuer': 0 };
  orders.filter(o => o.status !== 'cancelled').forEach((ord) => {
    ord.items?.forEach((i) => {
      const match = products.find((p) => p.name === i.name);
      if (match) {
        const brandKey = match.brand.toLowerCase();
        if (brandKey in brands) {
          brands[brandKey] += match.price * i.quantity;
        }
      }
    });
  });

  const data = [
    { label: 'LUMINOX', val: brands.luminox, color: '#ff6b6b' },
    { label: 'SEIKO', val: brands.seiko, color: 'var(--accent-gold)' },
    { label: 'TAG HEUER', val: brands['tag heuer'], color: '#4dabf7' }
  ];

  const maxVal = Math.max(...data.map(d => d.val), 10000);
  const chartHeight = 160;
  const chartWidth = 380;
  const padding = 50;

  ctx.strokeStyle = 'rgba(255,255,255,0.08)'; ctx.lineWidth = 1;
  for (let i = 0; i <= 4; i++) {
    const y = padding + (chartHeight / 4) * i;
    ctx.beginPath(); ctx.moveTo(padding, y); ctx.lineTo(padding + chartWidth, y); ctx.stroke();
    ctx.fillStyle = '#86868b'; ctx.font = '10px Outfit'; ctx.textAlign = 'right';
    ctx.fillText(`฿${Math.round(maxVal - (maxVal / 4) * i).toLocaleString()}`, padding - 10, y + 4);
  }

  const barWidth = 45;
  const gap = 60;
  data.forEach((d, idx) => {
    const x = padding + 40 + idx * (barWidth + gap);
    const pct = d.val / maxVal;
    const h = chartHeight * pct;
    const y = padding + chartHeight - h;

    ctx.fillStyle = d.color;
    ctx.fillRect(x, y, barWidth, h);

    ctx.fillStyle = '#f5f5f7'; ctx.font = '11px Outfit'; ctx.textAlign = 'center';
    ctx.fillText(d.label, x + barWidth / 2, padding + chartHeight + 16);
  });
}

function drawTrendChart(canvas, orders) {
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i);
    const str = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    days.push({ day: str, val: 0 });
  }

  orders.filter(o => o.status !== 'cancelled').forEach((o) => {
    const match = days.find((d) => d.day === o.date);
    if (match) match.val += o.total;
  });

  const maxVal = Math.max(...days.map(d => d.val), 5000);
  const chartHeight = 160;
  const chartWidth = 380;
  const padding = 50;

  ctx.strokeStyle = 'rgba(255,255,255,0.08)'; ctx.lineWidth = 1;
  for (let i = 0; i <= 4; i++) {
    const y = padding + (chartHeight / 4) * i;
    ctx.beginPath(); ctx.moveTo(padding, y); ctx.lineTo(padding + chartWidth, y); ctx.stroke();
  }

  const points = days.map((d, idx) => {
    const x = padding + 25 + idx * 50;
    const pct = d.val / maxVal;
    const y = padding + chartHeight - (chartHeight * pct);
    return { x, y, ...d };
  });

  ctx.strokeStyle = 'var(--accent-gold)'; ctx.lineWidth = 3.5; ctx.lineJoin = 'round';
  ctx.beginPath();
  points.forEach((p, idx) => {
    if (idx === 0) ctx.moveTo(p.x, p.y);
    else ctx.lineTo(p.x, p.y);
  });
  ctx.stroke();

  points.forEach((c) => {
    ctx.fillStyle = '#0f172a'; ctx.strokeStyle = 'var(--accent-gold)'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(c.x, c.y, 5, 0, Math.PI * 2); ctx.fill(); ctx.stroke();

    if (c.val > 0) {
      ctx.fillStyle = '#f5f5f7'; ctx.font = '9px Outfit'; ctx.textAlign = 'center';
      ctx.fillText(`฿${Math.round(c.val).toLocaleString()}`, c.x, c.y - 8);
    }
    ctx.fillStyle = '#86868b'; ctx.font = '10px Outfit'; ctx.textBaseline = 'top';
    ctx.fillText(c.day, c.x, padding + chartHeight + 8);
  });
}

// ─── Unified Admin Dashboard Component ─────────────────────────────────────────
export default function Admin() {
  const { user: currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState('sales'); // 'sales' | 'inventory' | 'orders' | 'users'

  // Data states
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [pendingWatches, setPendingWatches] = useState([]);
  const [users, setUsers] = useState([]);
  const [notification, setNotification] = useState(null);

  // Product CRUD states
  const [editingProduct, setEditingProduct] = useState(null);
  const [productForm, setProductForm] = useState({ name: '', brand: '', category: 'classic', price: '', stock: '', image: '', imageBack: '' });

  // User management states
  const [editingUser, setEditingUser] = useState(null);
  const [userForm, setUserForm] = useState({ role: 'user', password: '' });

  const barRef = useRef(null);
  const trendRef = useRef(null);

  const showNotif = (msg, ok = true) => {
    setNotification({ msg, ok });
    setTimeout(() => setNotification(null), 3000);
  };

  const refreshData = useCallback(async () => {
    try {
      const [pRes, oRes, wRes, uRes] = await Promise.all([
        api.getProducts(),
        api.getOrders(),
        api.getPendingWatches(),
        api.getUsers()
      ]);
      if (pRes.ok) setProducts(await pRes.json());
      if (oRes.ok) setOrders(await oRes.json());
      if (wRes.ok) setPendingWatches(await wRes.json());
      if (uRes.ok) setUsers(await uRes.json());
    } catch (_) {}
  }, []);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  // Handle charts rendering on Tab Change
  useEffect(() => {
    if (activeTab === 'sales' && (products.length || orders.length)) {
      const timer = setTimeout(() => {
        if (barRef.current && trendRef.current) {
          drawBarChart(barRef.current, products, orders);
          drawTrendChart(trendRef.current, orders);
        }
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [activeTab, products, orders]);

  // Product CRUD submit
  const handleProductSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...productForm,
        price: parseFloat(productForm.price),
        stock: parseInt(productForm.stock, 10),
      };
      let res;
      if (editingProduct) {
        res = await api.updateProduct(editingProduct, payload);
      } else {
        res = await api.saveProduct(payload);
      }

      if (res.ok) {
        showNotif(editingProduct ? 'อัปเดตข้อมูลนาฬิกาสำเร็จ!' : 'บันทึกนาฬิกาใหม่สำเร็จ!');
        resetForm();
        refreshData();
      } else {
        showNotif('บันทึกข้อมูลไม่สำเร็จ', false);
      }
    } catch (_) {
      showNotif('เกิดข้อผิดพลาดกับเซิร์ฟเวอร์', false);
    }
  };

  const handleDeleteProduct = async (id) => {
    if (!window.confirm('คุณแน่ใจหรือไม่ที่จะลบสินค้านี้ออกจากระบบ?')) return;
    try {
      const res = await api.deleteProduct(id);
      if (res.ok) {
        showNotif('ลบสินค้าสำเร็จ!');
        refreshData();
      } else {
        showNotif('ไม่สามารถลบสินค้าได้', false);
      }
    } catch (_) {
      showNotif('เกิดข้อผิดพลาดกับเซิร์ฟเวอร์', false);
    }
  };

  const startEditProduct = (prod) => {
    setEditingProduct(prod.id);
    setProductForm({
      name: prod.name || '',
      brand: prod.brand || '',
      category: prod.category || 'classic',
      price: prod.price || '',
      stock: prod.stock || '',
      image: prod.image || '',
      imageBack: prod.imageBack || '',
    });
  };

  const resetForm = () => {
    setEditingProduct(null);
    setProductForm({ name: '', brand: '', category: 'classic', price: '', stock: '', image: '', imageBack: '' });
  };

  // User Administration
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
        showNotif(`อัปเดตผู้ใช้ "${editingUser}" สำเร็จ!`);
        cancelEditUser();
        refreshData();
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
        refreshData();
      } else {
        showNotif('ไม่สามารถลบผู้ใช้ได้', false);
      }
    } catch (_) {
      showNotif('เกิดข้อผิดพลาดกับเซิร์ฟเวอร์', false);
    }
  };

  // Inspect customer watches
  const handleInspect = async (id, result) => {
    const res = await api.inspectWatch(id, result);
    if (res.ok) {
      showNotif(`ตรวจสภาพ: ${result === 'passed' ? 'ผ่านเกณฑ์' : 'ไม่ผ่านเกณฑ์'}`);
      refreshData();
    } else showNotif('ตรวจสภาพล้มเหลว', false);
  };

  const handleImport = async (id) => {
    const res = await api.importWatch(id);
    if (res.ok) {
      showNotif('นำเข้าคลังสำเร็จ!');
      refreshData();
    } else showNotif('นำเข้าล้มเหลว', false);
  };

  // Shipment fulfillment
  const shipOrder = async (id) => {
    const res = await api.shipOrder(id);
    if (res.ok) {
      showNotif('จัดส่งพัสดุสำเร็จ!');
      refreshData();
    } else showNotif('อัปเดตสถานะล้มเหลว', false);
  };

  // Computations
  const totalSales = orders.filter((o) => o.status !== 'cancelled').reduce((s, o) => s + o.total, 0);
  const pendingIns = pendingWatches.filter((w) => w.inspectionStatus === 'pending').length;
  const passed = pendingWatches.filter((w) => w.inspectionStatus === 'passed').length;
  const imported = pendingWatches.filter((w) => w.importStatus === 'imported').length;

  const setProductFormValue = (f) => (e) => setProductForm((prev) => ({ ...prev, [f]: e.target.value }));

  return (
    <div className="page-wrapper">
      {notification && <div className={`notification ${notification.ok ? '' : 'error'}`}>{notification.msg}</div>}
      <Header />

      <main className="main-content">
        {/* Title */}
        <div className="page-header">
          <h1 className="page-title" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.6rem' }}>
            <Icons.Crown style={{ color: 'var(--accent-gold)', width: '24px', height: '24px' }} />
            <span>Admin Dashboard</span>
          </h1>
          <p className="page-subtitle">แผงควบคุมระบบคลังสินค้า จัดการธุรกรรม บัญชีผู้ใช้ และประเมินระบบงานรวม</p>
        </div>

        {/* Unified Tab Bar controls */}
        <div className="filter-controls" style={{ marginBottom: '2.5rem', display: 'flex', gap: '0.8rem', flexWrap: 'wrap' }}>
          <button className={`filter-btn ${activeTab === 'sales' ? 'active' : ''}`} onClick={() => setActiveTab('sales')}>
            <Icons.Chart style={{ marginRight: '6px' }} />
            <span>วิเคราะห์ยอดขาย</span>
          </button>
          <button className={`filter-btn ${activeTab === 'inventory' ? 'active' : ''}`} onClick={() => setActiveTab('inventory')}>
            <Icons.Package style={{ marginRight: '6px' }} />
            <span>จัดการสินค้า</span>
          </button>
          <button className={`filter-btn ${activeTab === 'orders' ? 'active' : ''}`} onClick={() => setActiveTab('orders')}>
            <Icons.Book style={{ marginRight: '6px' }} />
            <span>ใบสั่งซื้อและการจัดส่ง</span>
          </button>
          <button className={`filter-btn ${activeTab === 'users' ? 'active' : ''}`} onClick={() => setActiveTab('users')}>
            <Icons.User style={{ marginRight: '6px' }} />
            <span>สิทธิ์ผู้ใช้และระบบ ({users.length})</span>
          </button>
        </div>

        {/* Tab contents */}
        {activeTab === 'sales' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
            {/* Sales Stats Cards */}
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-value">฿ {totalSales.toLocaleString()}</div>
                <div className="stat-label">ยอดขายรวม</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{orders.length} รายการ</div>
                <div className="stat-label">คำสั่งซื้อทั้งหมด</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{products.length} รุ่น</div>
                <div className="stat-label">สินค้าในคลัง</div>
              </div>
            </div>

            {/* Sales Analytics Charts */}
            <div className="content-grid two-col">
              <div className="glass-card">
                <h2 className="card-title" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Icons.Chart style={{ color: 'var(--accent-gold)' }} />
                  <span>ยอดขายแยกตามแบรนด์</span>
                </h2>
                <canvas ref={barRef} id="salesChart" width="460" height="260" style={{ width: '100%' }} />
              </div>
              <div className="glass-card">
                <h2 className="card-title" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Icons.Chart style={{ color: 'var(--accent-gold)' }} />
                  <span>แนวโน้มยอดขาย 7 วันล่าสุด</span>
                </h2>
                <canvas ref={trendRef} id="salesTrendChart" width="460" height="260" style={{ width: '100%' }} />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'inventory' && (
          <div className="content-grid two-col">
            {/* Product CRUD Form */}
            <div className="glass-card">
              <h2 className="card-title" id="form-action-title">
                {editingProduct ? (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Icons.Edit style={{ color: 'var(--accent-gold)' }} />
                    <span>แก้ไข: {productForm.name}</span>
                  </span>
                ) : (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Icons.Plus style={{ color: 'var(--accent-gold)' }} />
                    <span>เพิ่มสินค้าใหม่</span>
                  </span>
                )}
              </h2>
              <form onSubmit={handleProductSubmit} className="form-stack" id="product-form">
                <div className="form-group">
                  <label className="form-label">ชื่อสินค้า</label>
                  <input className="form-input" value={productForm.name} onChange={setProductFormValue('name')} required />
                </div>
                <div className="form-group">
                  <label className="form-label">แบรนด์</label>
                  <input className="form-input" value={productForm.brand} onChange={setProductFormValue('brand')} required />
                </div>
                <div className="form-group">
                  <label className="form-label">ราคา (บาท)</label>
                  <input type="number" className="form-input" value={productForm.price} onChange={setProductFormValue('price')} required />
                </div>
                <div className="form-group">
                  <label className="form-label">สต็อก (เรือน)</label>
                  <input type="number" className="form-input" value={productForm.stock} onChange={setProductFormValue('stock')} required />
                </div>
                <div className="form-group">
                  <label className="form-label">รูปภาพหน้าปัด (เช่น /images/LUMINOX/name.webp)</label>
                  <input className="form-input" value={productForm.image} onChange={setProductFormValue('image')} />
                </div>
                <div className="form-group">
                  <label className="form-label">รูปภาพฝาหลัง (เช่น /images/LUMINOX/name_back.webp)</label>
                  <input className="form-input" value={productForm.imageBack} onChange={setProductFormValue('imageBack')} />
                </div>
                <div className="btn-group">
                  <button type="submit" className="btn btn-primary">
                    {editingProduct ? 'อัปเดตข้อมูล' : 'บันทึกข้อมูลสินค้า'}
                  </button>
                  {editingProduct && <button type="button" className="btn btn-secondary" onClick={resetForm}>ยกเลิก</button>}
                </div>
              </form>
            </div>

            {/* Inventory table */}
            <div className="glass-card">
              <h2 className="card-title" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                <Icons.Package style={{ color: 'var(--accent-gold)' }} />
                <span>สินค้าคงคลัง</span>
              </h2>
              <div className="table-responsive">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>
                        <Icons.Watch style={{ width: '16px', height: '16px', color: 'var(--accent-gold)' }} />
                      </th>
                      <th>สินค้า</th>
                      <th>ราคา</th>
                      <th>สต็อก</th>
                      <th>จัดการ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.length === 0 ? (
                      <tr><td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>ไม่มีสินค้าในคลัง</td></tr>
                    ) : [...products].sort((a, b) => {
                      if (a.id === editingProduct) return -1;
                      if (b.id === editingProduct) return 1;
                      return 0;
                    }).map((p) => (
                      <tr 
                        key={p.id}
                        style={{ 
                          outline: p.id === editingProduct ? '2px solid #51cf66' : 'none', 
                          outlineOffset: '-2px', 
                          background: p.id === editingProduct ? 'rgba(81, 207, 102, 0.05)' : 'none',
                          transition: 'background 0.25s, outline 0.25s' 
                        }}
                      >
                        <td style={{ textAlign: 'center' }}>
                          {p.image ? (
                            <img src={p.image} alt={p.name} style={{ width: '40px', height: '40px', objectFit: 'contain', background: 'rgba(255,255,255,0.02)', borderRadius: '6px', border: '1px solid var(--glass-border)' }} />
                          ) : (
                            <Icons.Watch style={{ width: '22px', height: '22px', color: 'rgba(255,255,255,0.15)' }} />
                          )}
                        </td>
                        <td><strong>{p.name}</strong><br /><span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{p.brand}</span></td>
                        <td><strong>฿ {p.price?.toLocaleString()}</strong></td>
                        <td>
                          <span style={{ fontWeight: 700, color: p.stock <= 3 ? '#ff6b6b' : '#f5f5f7' }}>{p.stock} เรือน</span>
                          {p.stock <= 3 && <><br /><small style={{ color: '#ff6b6b', display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}><Icons.Info style={{ width: '12px', height: '12px' }} /> ใกล้หมด</small></>}
                        </td>
                        <td>
                          <div className="btn-group">
                            <button className="btn btn-secondary" style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem' }} onClick={() => startEditProduct(p)}>แก้ไข</button>
                            <button className="btn btn-danger" style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem' }} onClick={() => handleDeleteProduct(p.id)}>ลบ</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'orders' && (
          <div className="glass-card">
            <h2 className="card-title" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
              <Icons.Book style={{ color: 'var(--accent-gold)' }} />
              <span>รายการใบสั่งซื้อและการจัดส่ง</span>
            </h2>
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Order ID</th>
                    <th>สินค้า / ที่อยู่</th>
                    <th>ยอดรวม</th>
                    <th>สถานะ</th>
                    <th>ช่องทาง</th>
                    <th>ดำเนินการ</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.length === 0 ? (
                    <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>ไม่มีรายการใบสั่งซื้อ</td></tr>
                  ) : orders.map((ord) => (
                    <tr key={ord.id}>
                      <td><strong>{ord.id}</strong></td>
                      <td>
                        <div style={{ fontSize: '0.85rem' }}>{ord.items?.map((i) => `${i.name} (${i.quantity} เรือน)`).join(', ')}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                          ผู้ซื้อ: {ord.email} | ที่อยู่: {ord.address}
                        </div>
                      </td>
                      <td><strong>฿ {ord.total?.toLocaleString()}</strong></td>
                      <td>
                        <span className={`badge ${ord.status === 'paid' ? 'badge-paid' : ord.status === 'shipped' ? 'badge-shipped' : 'badge-cancelled'}`}>
                          {ord.status === 'paid' ? 'เตรียมส่ง' : ord.status === 'shipped' ? 'ส่งแล้ว' : 'ยกเลิก'}
                        </span>
                      </td>
                      <td>
                        <small style={{ color: 'var(--text-muted)', fontFamily: 'monospace' }}>{ord.payment?.toUpperCase()}</small>
                        {ord.slip && <><br /><button className="btn btn-secondary" style={{ padding: '0.15rem 0.4rem', fontSize: '0.75rem', marginTop: '0.3rem' }} onClick={() => { const w = window.open(); w.document.write(`<img src="${ord.slip}" style="max-width:100%">`); }}>ดูสลิป</button></>}
                      </td>
                      <td>
                        {ord.status === 'paid' ? (
                          <button className="btn btn-primary" style={{ padding: '0.25rem 0.6rem', fontSize: '0.8rem' }} onClick={() => shipOrder(ord.id)}>
                            จัดส่ง
                          </button>
                        ) : ord.status === 'shipped' ? (
                          <span style={{ color: '#4ade80', fontSize: '0.8rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}>
                            <Icons.Check />
                            <span>นำจ่ายแล้ว</span>
                          </span>
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
        )}

        {activeTab === 'users' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {/* Seller Watch Inspection Panel */}
            {pendingWatches.filter((w) => w.inspectionStatus === 'pending' || w.importStatus === 'pending').length > 0 && (
              <div className="glass-card">
                <h2 className="card-title" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Icons.Settings style={{ color: 'var(--accent-gold)' }} />
                  <span>คิวประเมินสภาพนาฬิกา (ข้อเสนอขายจากลูกค้า)</span>
                </h2>
                <div className="table-responsive">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>ผู้เสนอขาย</th>
                        <th>แบรนด์/รุ่น</th>
                        <th>ราคาที่ต้องการ</th>
                        <th>สภาพประเมิน</th>
                        <th>ตรวจสภาพ</th>
                        <th>นำเข้าคลัง</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pendingWatches.map((w) => (
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
                                <button className="btn btn-success" style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem' }} onClick={() => handleInspect(w.id, 'passed')}>ผ่าน</button>
                                <button className="btn btn-danger" style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem' }} onClick={() => handleInspect(w.id, 'failed')}>ตกเกณฑ์</button>
                              </div>
                            ) : w.inspectionStatus === 'passed' ? (
                              <span className="badge badge-watch-passed">ผ่านเกณฑ์</span>
                            ) : (
                              <span className="badge badge-watch-failed">ไม่ผ่านเกณฑ์</span>
                            )}
                          </td>
                          <td>
                            {w.inspectionStatus === 'passed' && w.importStatus === 'pending' ? (
                              <button className="btn btn-primary" style={{ padding: '0.25rem 0.6rem', fontSize: '0.8rem' }} onClick={() => handleImport(w.id)}>นำเข้าคลัง</button>
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
            )}

            <div className="content-grid two-col">
              {/* Users list */}
              <div className="glass-card">
                <h2 className="card-title" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Icons.User style={{ color: 'var(--accent-gold)' }} />
                  <span>บัญชีผู้ใช้ในระบบ ({users.length})</span>
                </h2>
                <div className="table-responsive">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>ชื่อผู้ใช้งาน</th>
                        <th>ระดับสิทธิ์</th>
                        <th>จัดการ</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((u) => (
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
                              <button className="btn btn-secondary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem' }} onClick={() => startEditUser(u)}>แก้ไข</button>
                              <button className="btn btn-danger" style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem' }} disabled={u.username === currentUser?.username} onClick={() => handleDeleteUser(u.username)}>ลบ</button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Edit user detail panel */}
              <div className="glass-card">
                <h2 className="card-title" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Icons.Edit style={{ color: 'var(--accent-gold)' }} />
                  <span>{editingUser ? `แก้ไขสิทธิ์: ${editingUser}` : 'เลือกบัญชีผู้ใช้เพื่อแก้ไข'}</span>
                </h2>
                {editingUser ? (
                  <form onSubmit={handleUpdateUser} className="form-stack">
                    <div className="form-group">
                      <label className="form-label">สิทธิ์การเข้าถึงระบบ</label>
                      <select className="form-select" value={userForm.role} onChange={(e) => setUserForm((prev) => ({ ...prev, role: e.target.value }))}>
                        <option value="user">USER (ลูกค้า / ผู้ซื้อ)</option>
                        <option value="manager">MANAGER (ผู้จัดการ)</option>
                        <option value="admin">ADMIN (ผู้ดูแลระบบสูงสุด)</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">เปลี่ยนรหัสผ่านใหม่ (หากไม่เปลี่ยนให้เว้นว่าง)</label>
                      <input type="password" className="form-input" placeholder="กรอกรหัสผ่านใหม่" value={userForm.password} onChange={(e) => setUserForm((prev) => ({ ...prev, password: e.target.value }))} />
                    </div>
                    <div className="btn-group">
                      <button type="submit" className="btn btn-primary">บันทึกข้อมูล</button>
                      <button type="button" className="btn btn-secondary" onClick={cancelEditUser}>ยกเลิก</button>
                    </div>
                  </form>
                ) : (
                  <p style={{ color: 'var(--text-muted)', fontStyle: 'italic', fontSize: '0.88rem' }}>
                    กดปุ่มแก้ไขท้ายชื่อบัญชีผู้ใช้งานที่ต้องการปรับบทบาทสิทธิ์การเข้าถึงระบบ หรือรีเซ็ตรหัสผ่านใหม่
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        <SystemLogger />
      </main>
    </div>
  );
}
