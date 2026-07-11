import React, { useState, useEffect, useRef, useCallback } from 'react';
import { api } from '../api';
import Header from '../components/Header';
import SystemLogger from '../components/SystemLogger';

// ─── Canvas Chart helpers ─────────────────────────────────────────────────────
function drawBarChart(canvas, products, orders) {
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const categories = { classic: 0, sport: 0, elegant: 0 };
  orders.filter((o) => o.status !== 'cancelled').forEach((ord) => {
    ord.items.forEach((item) => {
      const prod = products.find((p) => p.id === item.id);
      const cat = prod ? prod.category : 'classic';
      if (categories[cat] !== undefined) categories[cat] += item.price * item.quantity;
    });
  });

  const data = [
    { name: 'Classic', value: categories.classic, color: '#c5a880' },
    { name: 'Sport', value: categories.sport, color: '#ff6b6b' },
    { name: 'Elegant', value: categories.elegant, color: '#4dabf7' },
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

  // Stats
  const totalSales = orders.filter((o) => o.status !== 'cancelled').reduce((s, o) => s + o.total, 0);

  // Price Compliance
  const priceCompliance = products.map((p) => {
    let range = '', compliant = false;
    if (p.category === 'classic') { range = 'ต่ำกว่า 25,000'; compliant = p.price < 25000; }
    else if (p.category === 'sport') { range = '25,000 - 100,000'; compliant = p.price >= 25000 && p.price <= 100000; }
    else { range = '100,000+'; compliant = p.price >= 100000; }
    return { ...p, range, compliant };
  });

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
          <h1 className="page-title">📊 Manager Dashboard</h1>
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
            <h2 className="card-title">📊 ยอดขายแยกตาม Category</h2>
            <canvas ref={barRef} id="salesChart" width="460" height="260" style={{ width: '100%' }} />
          </div>
          <div className="glass-card">
            <h2 className="card-title">📈 แนวโน้มยอดขาย 7 วันล่าสุด</h2>
            <canvas ref={trendRef} id="salesTrendChart" width="460" height="260" style={{ width: '100%' }} />
          </div>
        </div>

        {/* Inventory Table */}
        <div className="content-grid two-col">

          {/* Inventory Table */}
          <div className="glass-card">
            <h2 className="card-title">📦 สินค้าคงคลัง</h2>
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr><th>⌚</th><th>สินค้า</th><th>หมวด</th><th>ราคา</th><th>สต็อก</th><th>จัดการ</th></tr>
                </thead>
                <tbody id="manager-inventory-table">
                  {products.length === 0 ? (
                    <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>ไม่มีสินค้าในคลัง</td></tr>
                  ) : products.map((p) => (
                    <tr key={p.id}>
                      <td style={{ textAlign: 'center' }}>
                        {p.image ? (
                          <img src={p.image} alt={p.name} style={{ width: '40px', height: '40px', objectFit: 'contain', background: 'rgba(255,255,255,0.02)', borderRadius: '6px', border: '1px solid var(--glass-border)' }} />
                        ) : (
                          '⌚'
                        )}
                      </td>
                      <td><strong>{p.name}</strong><br /><span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{p.brand}</span></td>
                      <td><span className="badge" style={{ background: 'rgba(197,168,128,0.1)', color: 'var(--accent-gold)' }}>{p.category.toUpperCase()}</span></td>
                      <td><strong>฿ {p.price?.toLocaleString()}</strong></td>
                      <td><span style={{ fontWeight: 700, color: p.stock <= 3 ? '#ff6b6b' : '#f5f5f7' }}>{p.stock} เรือน</span>{p.stock <= 3 && <><br /><small style={{ color: '#ff6b6b' }}>⚠️ ใกล้หมด</small></>}</td>
                      <td>
                        <div className="btn-group">
                          <button className="btn btn-secondary" style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem' }} onClick={() => startEdit(p)}>แก้ไข</button>
                          <button className="btn btn-danger" style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem' }} onClick={() => handleDelete(p.id)}>ลบ</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Price Compliance */}
        <div className="glass-card">
          <h2 className="card-title">⚖️ Price Compliance Audit</h2>
          <div className="table-responsive">
            <table className="data-table">
              <thead><tr><th>สินค้า</th><th>ราคาปัจจุบัน</th><th>หมวด</th><th>ช่วงราคากลาง</th><th>สถานะ</th></tr></thead>
              <tbody id="manager-price-compliance-table">
                {priceCompliance.map((p) => (
                  <tr key={p.id}>
                    <td><strong>{p.brand}</strong> {p.name}</td>
                    <td><strong>฿ {p.price?.toLocaleString()}</strong></td>
                    <td><span className="badge" style={{ background: 'rgba(197,168,128,0.1)', color: 'var(--accent-gold)' }}>{p.category.toUpperCase()}</span></td>
                    <td>{p.range}</td>
                    <td>{p.compliant ? <span className="badge badge-paid">✅ ถูกต้อง</span> : <span className="badge badge-cancelled">⚠️ เบี่ยงเบน</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>



        {/* Orders Table */}
        <div className="glass-card">
          <h2 className="card-title">🧾 รายการใบสั่งซื้อและการจัดส่ง</h2>
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
                      {ord.slip && <><br /><button className="btn btn-secondary" style={{ padding: '0.15rem 0.4rem', fontSize: '0.75rem', marginTop: '0.3rem' }} onClick={() => { const w = window.open(); w.document.write(`<img src="${ord.slip}" style="max-width:100%">`); }}>📄 ดูสลิป</button></>}
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

        <SystemLogger />
      </main>
    </div>
  );
}
