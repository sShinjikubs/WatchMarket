import React, { useState, useEffect, useRef, useCallback } from 'react';
import { api } from '../api';
import { useAuth } from '../App';
import Header from '../components/Header';
import { Icons } from '../components/Icons';
import SystemLogger from '../components/SystemLogger';

// ─── Canvas Chart helpers ─────────────────────────────────────────────────────
function drawBarChart(canvas, products, orders) {
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const brands = { luminox: 0, seiko: 0, 'tag heuer': 0 };
  orders.filter((o) => o.status !== 'cancelled').forEach((ord) => {
    ord.items.forEach((item) => {
      const prod = products.find((p) => p.id === item.id);
      const brand = prod ? prod.brand.toLowerCase() : '';
      if (brand && brands[brand] !== undefined) {
        brands[brand] += item.price * item.quantity;
      }
    });
  });

  const data = [
    { name: 'Luminox', value: brands.luminox, color: '#c5a880' },
    { name: 'Seiko', value: brands.seiko, color: '#ff6b6b' },
    { name: 'Tag Heuer', value: brands['tag heuer'], color: '#4dabf7' },
  ];

  const maxValue = Math.max(...data.map((d) => d.value), 10000);
  const padding = 40, chartWidth = canvas.width - padding * 2, chartHeight = canvas.height - padding * 2;
  const barWidth = 60, gap = 40;
  const startX = padding + (chartWidth - (barWidth * data.length + gap * (data.length - 1))) / 2;

  ctx.strokeStyle = 'rgba(134,134,139,0.2)'; ctx.lineWidth = 1;
  ctx.fillStyle = '#86868b'; ctx.font = '10px Outfit'; ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
  for (let i = 0; i <= 4; i++) {
    const y = padding + chartHeight - (chartHeight / 4) * i;
    const v = (maxValue / 4) * i;
    ctx.beginPath(); ctx.moveTo(padding, y); ctx.lineTo(canvas.width - padding, y); ctx.stroke();
    ctx.fillText(`฿${Math.round(v).toLocaleString()}`, padding - 5, y);
  }

  data.forEach((d, idx) => {
    const x = startX + idx * (barWidth + gap);
    const barHeight = d.value > 0 ? (d.value / maxValue) * chartHeight : 5;
    const y = padding + chartHeight - barHeight;
    ctx.fillStyle = d.color;
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(x, y, barWidth, barHeight, [4, 4, 0, 0]);
    else ctx.rect(x, y, barWidth, barHeight);
    ctx.fill();
    ctx.fillStyle = '#f5f5f7'; ctx.font = '12px Outfit'; ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    ctx.fillText(d.name, x + barWidth / 2, padding + chartHeight + 5);
    ctx.font = 'bold 10px Outfit'; ctx.textBaseline = 'bottom';
    ctx.fillText(`฿${Math.round(d.value).toLocaleString()}`, x + barWidth / 2, y - 2);
  });
}

function drawTrendChart(canvas, orders) {
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const salesData = {};
  const days = [];
  const today = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(); d.setDate(today.getDate() - i);
    const s = d.toLocaleDateString('th-TH', { day: 'numeric', month: 'short' });
    days.push(s); salesData[s] = 0;
  }
  orders.filter((o) => o.status !== 'cancelled').forEach((ord) => {
    try {
      const s = new Date(ord.date).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' });
      if (salesData[s] !== undefined) salesData[s] += ord.total;
    } catch (_) { }
  });

  const points = days.map((d) => salesData[d]);
  const maxValue = Math.max(...points, 20000);
  const padding = 40, chartWidth = canvas.width - padding * 2, chartHeight = canvas.height - padding * 2;

  ctx.strokeStyle = 'rgba(134,134,139,0.2)'; ctx.lineWidth = 1;
  ctx.fillStyle = '#86868b'; ctx.font = '10px Outfit'; ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
  for (let i = 0; i <= 4; i++) {
    const y = padding + chartHeight - (chartHeight / 4) * i;
    ctx.beginPath(); ctx.moveTo(padding, y); ctx.lineTo(canvas.width - padding, y); ctx.stroke();
    ctx.fillText(`฿${Math.round((maxValue / 4) * i).toLocaleString()}`, padding - 5, y);
  }

  const stepX = chartWidth / (days.length - 1);
  const coords = days.map((day, idx) => ({
    x: padding + idx * stepX,
    y: padding + chartHeight - (salesData[day] / maxValue) * chartHeight,
    val: salesData[day], day,
  }));

  ctx.beginPath(); ctx.strokeStyle = '#c5a880'; ctx.lineWidth = 3.5; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  coords.forEach((c, i) => i === 0 ? ctx.moveTo(c.x, c.y) : ctx.lineTo(c.x, c.y));
  ctx.stroke();

  ctx.lineTo(padding + chartWidth, padding + chartHeight);
  ctx.lineTo(padding, padding + chartHeight); ctx.closePath();
  const grad = ctx.createLinearGradient(0, padding, 0, padding + chartHeight);
  grad.addColorStop(0, 'rgba(197,168,128,0.35)'); grad.addColorStop(1, 'rgba(197,168,128,0)');
  ctx.fillStyle = grad; ctx.fill();

  coords.forEach((c) => {
    ctx.beginPath(); ctx.arc(c.x, c.y, 5, 0, 2 * Math.PI);
    ctx.fillStyle = '#c5a880'; ctx.fill();
    ctx.strokeStyle = '#0f172a'; ctx.lineWidth = 2; ctx.stroke();
    if (c.val > 0) {
      ctx.fillStyle = '#f5f5f7'; ctx.font = 'bold 9px Outfit'; ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
      ctx.fillText(`฿${Math.round(c.val).toLocaleString()}`, c.x, c.y - 8);
    }
    ctx.fillStyle = '#86868b'; ctx.font = '10px Outfit'; ctx.textBaseline = 'top';
    ctx.fillText(c.day, c.x, padding + chartHeight + 8);
  });
}

// ─── Manager Component ────────────────────────────────────────────────────────
export default function Manager() {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [pendingWatches, setPendingWatches] = useState([]);
  const [notification, setNotification] = useState(null);
  const [auditSearch, setAuditSearch] = useState('');
  const [editingProduct, setEditingProduct] = useState(null);
  const [productForm, setProductForm] = useState({ name: '', brand: '', category: 'classic', price: '', stock: '', image: '', imageBack: '' });
  const barRef = useRef(null);
  const trendRef = useRef(null);

  const showNotif = (msg, ok = true) => {
    setNotification({ msg, ok });
    setTimeout(() => setNotification(null), 3000);
  };

  const refreshData = useCallback(async () => {
    try {
      const [pRes, oRes, wRes] = await Promise.all([api.getProducts(), api.getOrders(), api.getPendingWatches()]);
      if (pRes.ok) setProducts(await pRes.json());
      if (oRes.ok) setOrders(await oRes.json());
      if (wRes.ok) setPendingWatches(await wRes.json());
    } catch (_) { }
  }, []);

  useEffect(() => { refreshData(); }, [refreshData]);

  useEffect(() => {
    if (products.length || orders.length) {
      drawBarChart(barRef.current, products, orders);
      drawTrendChart(trendRef.current, orders);
    }
  }, [products, orders]);

  const setForm = (f) => (e) => setProductForm((prev) => ({ ...prev, [f]: e.target.value }));

  const startEdit = (prod) => {
    setEditingProduct(prod.id);
    setProductForm({
      name: prod.name,
      brand: prod.brand,
      category: prod.category,
      price: prod.price,
      stock: prod.stock,
      image: prod.image || '',
      imageBack: prod.imageBack || ''
    });
  };

  const resetForm = () => {
    setEditingProduct(null);
    setProductForm({ name: '', brand: '', category: 'classic', price: '', stock: '', image: '', imageBack: '' });
  };

  const handleProductSubmit = async (e) => {
    e.preventDefault();
    const payload = { ...productForm, price: parseFloat(productForm.price), stock: parseInt(productForm.stock) };
    try {
      const res = editingProduct ? await api.updateProduct(editingProduct, payload) : await api.addProduct(payload);
      if (res.ok) {
        showNotif(editingProduct ? 'อัปเดตสำเร็จ!' : 'เพิ่มสินค้าสำเร็จ!');
        refreshData(); resetForm();
      } else { const d = await res.json(); showNotif(d.error || 'บันทึกไม่สำเร็จ', false); }
    } catch (_) { showNotif('เซิร์ฟเวอร์ขัดข้อง', false); }
  };

  const handleDelete = async (id) => {
    const prod = products.find((p) => p.id === id);
    if (!confirm(`ลบ "${prod?.name}"?`)) return;
    const res = await api.deleteProduct(id);
    if (res.ok) { showNotif('ลบสำเร็จ', false); refreshData(); }
    else showNotif('ลบไม่สำเร็จ', false);
  };

  const shipOrder = async (id) => {
    const res = await api.shipOrder(id);
    if (res.ok) { showNotif('จัดส่งพัสดุสำเร็จ!'); refreshData(); }
    else showNotif('อัปเดตสถานะล้มเหลว', false);
  };

  const totalSales = orders.filter((o) => o.status !== 'cancelled').reduce((s, o) => s + o.total, 0);

  // Audit
  const filteredAudit = products
    .filter((p) => p.name.toLowerCase().includes(auditSearch.toLowerCase()) || p.id.toLowerCase().includes(auditSearch.toLowerCase()))
    .map((p) => {
      const origin = pendingWatches.find((w) => w.id === p.id);
      return {
        ...p,
        history: origin
          ? [`ผู้เสนอขาย: ${origin.sellerName} (${origin.sellerEmail}) เมื่อ ${origin.date}`, 'ผู้ตรวจสภาพ: เจ้าหน้าที่ฝ่ายประเมิน (APPROVED)', 'ผู้นำเข้า: Admin บันทึกเข้าคลังแล้ว']
          : ['ผู้เสนอขาย: สินค้าระบบดั้งเดิม (Initial Inventory)', 'ผู้ตรวจสภาพ: เจ้าหน้าที่ตรวจระบบคลัง', 'ผู้นำเข้า: Manager CRUD'],
      };
    });

  return (
    <div className="page-wrapper">
      {notification && <div className={`notification ${notification.ok ? '' : 'error'}`}>{notification.msg}</div>}
      <Header />

      <main className="main-content">
        <div className="page-header">
          <h1 className="page-title" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.6rem' }}>
            <Icons.Chart style={{ color: 'var(--accent-gold)', width: '24px', height: '24px' }} />
            <span>Manager Dashboard</span>
          </h1>
          <p className="page-subtitle">บริหารสินค้าคงคลัง วิเคราะห์ยอดขาย และตรวจสอบราคา</p>
        </div>

        {/* Stats */}
        <div className="stats-grid">
          <div className="stat-card"><div className="stat-value" id="mgr-total-sales">฿ {totalSales.toLocaleString()}</div><div className="stat-label">ยอดขายรวม</div></div>
          <div className="stat-card"><div className="stat-value" id="mgr-total-orders">{orders.length} รายการ</div><div className="stat-label">คำสั่งซื้อทั้งหมด</div></div>
          <div className="stat-card"><div className="stat-value" id="mgr-product-types">{products.length} รุ่น</div><div className="stat-label">สินค้าในคลัง</div></div>
        </div>

        {/* Charts */}
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

        <div className="content-grid two-col">
          {user?.role === 'manager' && !editingProduct ? (
            <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '3rem', minHeight: '350px', textAlign: 'center', color: 'var(--text-muted)' }}>
              <Icons.Watch style={{ width: '48px', height: '48px', color: 'rgba(255,255,255,0.15)', marginBottom: '1.5rem' }} />
              <h3 style={{ color: 'var(--accent-gold)', marginBottom: '0.5rem' }}>ระบบจัดการคลังสำหรับผู้จัดการ</h3>
              <p style={{ fontStyle: 'italic', fontSize: '0.88rem', maxWidth: '300px', lineHeight: 1.5 }}>กรุณากดปุ่ม "แก้ไขสต็อก" ท้ายรายชื่อสินค้าในตารางด้านขวา เพื่อปรับปรุงจำนวนสต็อกสินค้าคงเหลือ</p>
            </div>
          ) : (
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
              {user?.role !== 'admin' && (
                <div style={{ padding: '0.6rem 0.8rem', background: 'rgba(255,107,107,0.06)', border: '1px solid rgba(255,107,107,0.15)', borderRadius: '8px', color: '#ff6b6b', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '1.2rem' }}>
                  <Icons.Info style={{ flexShrink: 0 }} />
                  <span>สิทธิ์ผู้จัดการ: แก้ไขได้เฉพาะสต็อกสินค้าเท่านั้น ช่องอื่นสามารถแก้ไขได้โดยแอดมิน</span>
                </div>
              )}
              <form onSubmit={handleProductSubmit} className="form-stack" id="product-form">
                <div className="form-group">
                  <label className="form-label">ชื่อสินค้า</label>
                  <input className="form-input" value={productForm.name} onChange={setForm('name')} required id="prod-name" disabled={user?.role !== 'admin'} />
                </div>
                <div className="form-group">
                  <label className="form-label">แบรนด์</label>
                  <input className="form-input" value={productForm.brand} onChange={setForm('brand')} required id="prod-brand" disabled={user?.role !== 'admin'} />
                </div>
                <div className="form-group">
                  <label className="form-label">ราคา (บาท)</label>
                  <input type="number" className="form-input" value={productForm.price} onChange={setForm('price')} required id="prod-price" disabled={user?.role !== 'admin'} />
                </div>
                <div className="form-group">
                  <label className="form-label">สต็อก (เรือน)</label>
                  <input type="number" className="form-input" value={productForm.stock} onChange={setForm('stock')} required id="prod-stock" />
                </div>
                <div className="form-group">
                  <label className="form-label">รูปภาพหน้าปัด (เช่น /images/LUMINOX/name.webp)</label>
                  <input className="form-input" value={productForm.image} onChange={setForm('image')} id="prod-image" disabled={user?.role !== 'admin'} />
                </div>
                <div className="form-group">
                  <label className="form-label">รูปภาพฝาหลัง (เช่น /images/LUMINOX/name_back.webp)</label>
                  <input className="form-input" value={productForm.imageBack} onChange={setForm('imageBack')} id="prod-image-back" disabled={user?.role !== 'admin'} />
                </div>
                <div className="btn-group">
                  <button type="submit" className="btn btn-primary" id="btn-submit-form">
                    {editingProduct ? (user?.role === 'admin' ? 'อัปเดตข้อมูล' : 'บันทึกสต็อกสินค้า') : 'บันทึกข้อมูลสินค้า'}
                  </button>
                  {editingProduct && <button type="button" className="btn btn-secondary" onClick={resetForm}>ยกเลิก</button>}
                </div>
              </form>
            </div>
          )}

          {/* Inventory Table */}
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
                <tbody id="manager-inventory-table">
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
                      <td><span style={{ fontWeight: 700, color: p.stock <= 3 ? '#ff6b6b' : '#f5f5f7' }}>{p.stock} เรือน</span>{p.stock <= 3 && <><br /><small style={{ color: '#ff6b6b', display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}><Icons.Info style={{ width: '12px', height: '12px' }} /> ใกล้หมด</small></>}</td>
                      <td>
                        <div className="btn-group">
                          <button className="btn btn-secondary" style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem' }} onClick={() => startEdit(p)}>
                            {user?.role === 'admin' ? 'แก้ไข' : 'แก้ไขสต็อก'}
                          </button>
                          {user?.role === 'admin' && (
                            <button className="btn btn-danger" style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem' }} onClick={() => handleDelete(p.id)}>ลบ</button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Orders Table */}
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
              <tbody id="manager-orders-table">
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

        <SystemLogger />
      </main>
    </div>
  );
}
