import React, { useState, useEffect, useRef, useCallback } from 'react';
import { api } from '../api';
import { useAuth, useLanguage } from '../App';
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
  const { t, lang } = useLanguage();
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [pendingWatches, setPendingWatches] = useState([]);
  const [notification, setNotification] = useState(null);
  const [auditSearch, setAuditSearch] = useState('');
  const [editingProduct, setEditingProduct] = useState(null);
  const [productForm, setProductForm] = useState({ name: '', brand: '', category: 'classic', price: '', stock: '', image: '', imageBack: '' });
  const [rejectNotes, setRejectNotes] = useState({}); // orderId -> note text
  const [slipModal, setSlipModal] = useState(null);   // orderId whose slip is open
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
        showNotif(editingProduct ? t('updateSuccess') : t('addProductSuccess'));
        refreshData(); resetForm();
      } else { const d = await res.json(); showNotif(d.error || t('saveFailed'), false); }
    } catch (_) { showNotif(t('serverErrorGeneric'), false); }
  };

  const handleDelete = async (id) => {
    const prod = products.find((p) => p.id === id);
    if (!confirm(t('deleteConfirm').replace('{name}', prod?.name))) return;
    const res = await api.deleteProduct(id);
    if (res.ok) { showNotif(t('deleteSuccess'), false); refreshData(); }
    else showNotif(t('deleteFailed'), false);
  };

  const shipOrder = async (id) => {
    const res = await api.shipOrder(id);
    if (res.ok) {
      showNotif(t('shipSuccess'));
      refreshData();
    } else {
      const d = await res.json();
      showNotif(d.error || t('updateStatusFail'), false);
    }
  };

  const approveSlip = async (id) => {
    const res = await api.managerApproveOrder(id);
    if (res.ok) {
      showNotif(t('approveSlipSuccess'));
      refreshData();
    } else {
      const d = await res.json();
      showNotif(d.error || t('approveSlipFail'), false);
    }
  };

  const rejectSlip = async (id) => {
    const note = rejectNotes[id] || '';
    if (!note.trim()) {
      showNotif(t('rejectReasonRequired'), false);
      return;
    }
    const res = await api.managerRejectOrder(id, note);
    if (res.ok) {
      showNotif(t('rejectSlipSuccess'), false);
      refreshData();
      setRejectNotes(prev => {
        const n = {...prev};
        delete n[id];
        return n;
      });
    } else {
      const d = await res.json();
      showNotif(d.error || t('rejectSlipFail'), false);
    }
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
          ? [t('auditSellerOrigin').replace('{name}', origin.sellerName).replace('{email}', origin.sellerEmail).replace('{date}', origin.date), t('auditInspectorApproved'), t('auditImporterAdmin')]
          : [t('auditInitialOrigin'), t('auditInitialInspector'), t('auditInitialImporter')],
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
            <span>{t('mgrDashboardTitle')}</span>
          </h1>
          <p className="page-subtitle">{t('mgrDashboardSubtitle')}</p>
        </div>

        {/* Stats */}
        <div className="stats-grid">
          <div className="stat-card"><div className="stat-value" id="mgr-total-sales">฿ {totalSales.toLocaleString()}</div><div className="stat-label">{t('totalSalesLabel')}</div></div>
          <div className="stat-card"><div className="stat-value" id="mgr-total-orders">{t('orderCount').replace('{count}', orders.length)}</div><div className="stat-label">{t('totalOrdersLabel')}</div></div>
          <div className="stat-card"><div className="stat-value" id="mgr-product-types">{t('productModelCount').replace('{count}', products.length)}</div><div className="stat-label">{t('inventoryProductsLabel')}</div></div>
        </div>

        {/* Charts */}
        <div className="content-grid two-col">
          <div className="glass-card">
            <h2 className="card-title" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
              <Icons.Chart style={{ color: 'var(--accent-gold)' }} />
              <span>{t('salesByBrandTitle')}</span>
            </h2>
            <canvas ref={barRef} id="salesChart" width="460" height="260" style={{ width: '100%' }} />
          </div>
          <div className="glass-card">
            <h2 className="card-title" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
              <Icons.Chart style={{ color: 'var(--accent-gold)' }} />
              <span>{t('salesTrend7DaysTitle')}</span>
            </h2>
            <canvas ref={trendRef} id="salesTrendChart" width="460" height="260" style={{ width: '100%' }} />
          </div>
        </div>

        <div className="content-grid two-col">
          {user?.role === 'manager' && !editingProduct ? (
            <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '3rem', minHeight: '350px', textAlign: 'center', color: 'var(--text-muted)' }}>
              <Icons.Watch style={{ width: '48px', height: '48px', color: 'rgba(255,255,255,0.15)', marginBottom: '1.5rem' }} />
              <h3 style={{ color: 'var(--accent-gold)', marginBottom: '0.5rem' }}>{t('mgrInventorySystemTitle')}</h3>
              <p style={{ fontStyle: 'italic', fontSize: '0.88rem', maxWidth: '300px', lineHeight: 1.5 }}>{t('mgrInventorySystemDesc')}</p>
            </div>
          ) : (
            <div className="glass-card">
              <h2 className="card-title" id="form-action-title">
                {editingProduct ? (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Icons.Edit style={{ color: 'var(--accent-gold)' }} />
                    <span>{t('editProductTitle').replace('{name}', productForm.name)}</span>
                  </span>
                ) : (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Icons.Plus style={{ color: 'var(--accent-gold)' }} />
                    <span>{t('addNewProductTitle')}</span>
                  </span>
                )}
              </h2>
              {user?.role !== 'admin' && (
                <div style={{ padding: '0.6rem 0.8rem', background: 'rgba(255,107,107,0.06)', border: '1px solid rgba(255,107,107,0.15)', borderRadius: '8px', color: '#ff6b6b', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '1.2rem' }}>
                  <Icons.Info style={{ flexShrink: 0 }} />
                  <span>{t('mgrPermissionWarning')}</span>
                </div>
              )}
              <form onSubmit={handleProductSubmit} className="form-stack" id="product-form">
                <div className="form-group">
                  <label className="form-label">{t('productNameLabel')}</label>
                  <input className="form-input" value={productForm.name} onChange={setForm('name')} required id="prod-name" disabled={user?.role !== 'admin'} />
                </div>
                <div className="form-group">
                  <label className="form-label">{t('brandLabel')}</label>
                  <input className="form-input" value={productForm.brand} onChange={setForm('brand')} required id="prod-brand" disabled={user?.role !== 'admin'} />
                </div>
                <div className="form-group">
                  <label className="form-label">{t('priceThbLabel')}</label>
                  <input type="number" className="form-input" value={productForm.price} onChange={setForm('price')} required id="prod-price" disabled={user?.role !== 'admin'} />
                </div>
                <div className="form-group">
                  <label className="form-label">{t('stockQtyLabel')}</label>
                  <input type="number" className="form-input" value={productForm.stock} onChange={setForm('stock')} required id="prod-stock" />
                </div>
                <div className="form-group">
                  <label className="form-label">{t('frontImageLabel')}</label>
                  <input className="form-input" value={productForm.image} onChange={setForm('image')} id="prod-image" disabled={user?.role !== 'admin'} />
                </div>
                <div className="form-group">
                  <label className="form-label">{t('backImageLabel')}</label>
                  <input className="form-input" value={productForm.imageBack} onChange={setForm('imageBack')} id="prod-image-back" disabled={user?.role !== 'admin'} />
                </div>
                <div className="btn-group">
                  <button type="submit" className="btn btn-primary" id="btn-submit-form">
                    {editingProduct ? (user?.role === 'admin' ? t('updateDataBtn') : t('saveStockBtn')) : t('saveProductInfoBtn')}
                  </button>
                  {editingProduct && <button type="button" className="btn btn-secondary" onClick={resetForm}>{t('cancelBtn')}</button>}
                </div>
              </form>
            </div>
          )}

          {/* Inventory Table */}
          <div className="glass-card">
            <h2 className="card-title" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
              <Icons.Package style={{ color: 'var(--accent-gold)' }} />
              <span>{t('inventoryTitle')}</span>
            </h2>
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>
                      <Icons.Watch style={{ width: '16px', height: '16px', color: 'var(--accent-gold)' }} />
                    </th>
                    <th>{t('productCol')}</th>
                    <th>{t('priceCol')}</th>
                    <th>{t('stockCol')}</th>
                    <th>{t('manageCol')}</th>
                  </tr>
                </thead>
                <tbody id="manager-inventory-table">
                  {products.length === 0 ? (
                    <tr><td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>{t('noProductsInInventory')}</td></tr>
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
                          <img src={p.image} alt={lang === 'en' && p.nameEn ? p.nameEn : p.name} style={{ width: '40px', height: '40px', objectFit: 'contain', background: 'rgba(255,255,255,0.02)', borderRadius: '6px', border: '1px solid var(--glass-border)' }} />
                        ) : (
                          <Icons.Watch style={{ width: '22px', height: '22px', color: 'rgba(255,255,255,0.15)' }} />
                        )}
                      </td>
                      <td><strong>{lang === 'en' && p.nameEn ? p.nameEn : p.name}</strong><br /><span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{p.brand}</span></td>
                      <td><strong>฿ {p.price?.toLocaleString()}</strong></td>
                      <td><span style={{ fontWeight: 700, color: p.stock <= 3 ? '#ff6b6b' : '#f5f5f7' }}>{t('stockLeft').replace('{count}', p.stock)}</span>{p.stock <= 3 && <><br /><small style={{ color: '#ff6b6b', display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}><Icons.Info style={{ width: '12px', height: '12px' }} /> {t('lowStockWarning')}</small></>}</td>
                      <td>
                        <div className="btn-group">
                          <button className="btn btn-secondary" style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem' }} onClick={() => startEdit(p)}>
                            {user?.role === 'admin' ? t('editBtn') : t('editStockBtn')}
                          </button>
                          {user?.role === 'admin' && (
                            <button className="btn btn-danger" style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem' }} onClick={() => handleDelete(p.id)}>{t('deleteBtn')}</button>
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
            <span>{t('ordersAndShippingTitle')}</span>
          </h2>
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>{t('productAddressCol')}</th>
                  <th>{t('totalAmountCol')}</th>
                  <th>{t('statusCol')}</th>
                  <th>{t('channelCol')}</th>
                  <th>{t('actionCol')}</th>
                </tr>
              </thead>
              <tbody id="manager-orders-table">
                {orders.length === 0 ? (
                  <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>{t('noOrdersList')}</td></tr>
                ) : orders.map((ord) => (
                  <tr key={ord.id}>
                    <td><strong>{ord.id}</strong></td>
                    <td>
                      <div style={{ fontSize: '0.85rem' }}>{ord.items?.map((i) => `${lang === 'en' && i.nameEn ? i.nameEn : i.name} (${t('stockLeft').replace('{count}', i.quantity)})`).join(', ')}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                        {t('buyerAddressLabel').replace('{email}', ord.email).replace('{address}', ord.address)}
                      </div>
                    </td>
                    <td><strong>฿ {ord.total?.toLocaleString()}</strong></td>
                    <td>
                      {ord.status === 'pending_payment' && <span className="badge" style={{ background: 'rgba(255,165,0,0.18)', color: '#ffa94d', border: '1px solid #ffa94d55' }}>{t('statusPendingPayment')}</span>}
                      {ord.status === 'pending_review' && <span className="badge" style={{ background: 'rgba(59,130,246,0.18)', color: '#60a5fa', border: '1px solid #60a5fa55' }}>{t('statusPendingReview')}</span>}
                      {ord.status === 'manager_approved' && <span className="badge" style={{ background: 'rgba(59,130,246,0.18)', color: '#60a5fa', border: '1px solid #60a5fa55' }}>{t('statusManagerApproved')}</span>}
                      {ord.status === 'confirmed' && <span className="badge badge-paid">{t('statusConfirmedReadyToShip')}</span>}
                      {ord.status === 'shipped' && <span className="badge badge-shipped">{t('statusShipped')}</span>}
                      {ord.status === 'cancelled' && <span className="badge badge-cancelled">{t('statusCancelled')}</span>}
                      {ord.status === 'paid' && <span className="badge badge-paid">{t('statusPaidReadyToShip')}</span>}
                    </td>
                    <td>
                      <small style={{ color: 'var(--text-muted)', fontFamily: 'monospace' }}>{ord.payment?.toUpperCase()}</small>
                      {ord.slip && <><br /><button className="btn btn-secondary" style={{ padding: '0.15rem 0.4rem', fontSize: '0.75rem', marginTop: '0.3rem' }} onClick={() => setSlipModal(slipModal === ord.id ? null : ord.id)}>{t('viewSlipBtn')}</button></>}
                    </td>
                    <td style={{ minWidth: '220px' }}>
                      {ord.slip && slipModal === ord.id && (
                        <div style={{ marginBottom: '0.4rem', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--glass-border)', maxWidth: '180px' }}>
                          <img src={ord.slip} alt="slip" style={{ width: '100%', display: 'block' }} />
                        </div>
                      )}
                      {ord.status === 'pending_payment' && (
                        <span style={{ color: '#ffa94d', fontSize: '0.8rem' }}>{t('customerPendingTransfer')}</span>
                      )}
                      {ord.status === 'pending_review' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                            <button className="btn btn-primary" style={{ padding: '0.25rem 0.6rem', fontSize: '0.8rem', background: 'linear-gradient(135deg,#22c55e,#16a34a)', border: 'none' }} onClick={() => approveSlip(ord.id)}>{t('approveSlipBtn')}</button>
                            <button className="btn btn-secondary" style={{ padding: '0.25rem 0.6rem', fontSize: '0.8rem', background: 'rgba(239,68,68,0.15)', color: '#f87171', border: '1px solid #f8717155' }} onClick={() => rejectSlip(ord.id)}>{t('rejectSlipBtn')}</button>
                          </div>
                          <input
                            type="text"
                            placeholder={t('rejectReasonPlaceholder')}
                            value={rejectNotes[ord.id] || ''}
                            onChange={e => setRejectNotes(prev => ({...prev, [ord.id]: e.target.value}))}
                            style={{ padding: '0.3rem 0.5rem', fontSize: '0.78rem', borderRadius: '6px', border: '1px solid var(--glass-border)', background: 'rgba(255,255,255,0.05)', color: 'var(--text-primary)', width: '100%' }}
                          />
                        </div>
                      )}
                      {ord.status === 'manager_approved' && (
                        <span style={{ color: '#60a5fa', fontSize: '0.8rem' }}>{t('waitAdminFinalConfirm')}</span>
                      )}
                      {(ord.status === 'confirmed' || ord.status === 'paid') && (
                        <button className="btn btn-primary" style={{ padding: '0.25rem 0.6rem', fontSize: '0.8rem' }} onClick={() => shipOrder(ord.id)}>{t('shipBtn')}</button>
                      )}
                      {ord.status === 'shipped' && (
                        <span style={{ color: '#4ade80', fontSize: '0.8rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}>
                          <Icons.Check /><span>{t('deliveredStatusLabel')}</span>
                        </span>
                      )}
                      {ord.status === 'cancelled' && (
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{t('cancelledStatusLabel')}</span>
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
