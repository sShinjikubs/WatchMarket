import React, { useState, useEffect, useRef, useCallback } from 'react';
import { api } from '../api';
import { useAuth, useLanguage } from '../App';
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
  const { t, lang } = useLanguage();
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
  const [slipModal, setSlipModal] = useState(null); // orderId whose slip is open in Admin view

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
        res = await api.addProduct(payload);
      }

      if (res.ok) {
        showNotif(editingProduct ? t('updateWatchSuccessToast') : t('addWatchSuccessToast'));
        resetForm();
        refreshData();
      } else {
        showNotif(t('saveFailed'), false);
      }
    } catch (_) {
      showNotif(t('serverErrorGeneric'), false);
    }
  };

  const handleDeleteProduct = async (id) => {
    if (!window.confirm(t('confirmDeleteProduct'))) return;
    try {
      const res = await api.deleteProduct(id);
      if (res.ok) {
        showNotif(t('deleteProductSuccessToast'));
        refreshData();
      } else {
        showNotif(t('deleteProductFailToast'), false);
      }
    } catch (_) {
      showNotif(t('serverErrorGeneric'), false);
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
        showNotif(t('updateUserSuccessToast').replace('{username}', editingUser));
        cancelEditUser();
        refreshData();
      } else {
        showNotif(t('updateUserFailToast'), false);
      }
    } catch (_) {
      showNotif(t('serverErrorGeneric'), false);
    }
  };

  const handleDeleteUser = async (username) => {
    if (username === currentUser?.username) {
      showNotif(t('deleteSelfFailToast'), false);
      return;
    }
    if (!window.confirm(t('confirmDeleteUser').replace('{username}', username))) return;
    try {
      const res = await api.deleteUser(username);
      if (res.ok) {
        showNotif(t('deleteUserSuccessToast').replace('{username}', username));
        refreshData();
      } else {
        showNotif(t('deleteUserFailToast'), false);
      }
    } catch (_) {
      showNotif(t('serverErrorGeneric'), false);
    }
  };

  // Inspect customer watches
  const handleInspect = async (id, result) => {
    const res = await api.inspectWatch(id, result);
    if (res.ok) {
      showNotif(t('inspectResultToast').replace('{result}', result === 'passed' ? t('inspectPass') : t('inspectFail')));
      refreshData();
    } else showNotif(t('inspectFailToast'), false);
  };

  const handleImport = async (id) => {
    const res = await api.importWatch(id);
    if (res.ok) {
      showNotif(t('importSuccessToast'));
      refreshData();
    } else showNotif(t('importFailToast'), false);
  };

  // Shipment fulfillment
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

  const confirmOrder = async (id) => {
    const res = await api.adminConfirmOrder(id);
    if (res.ok) {
      showNotif(t('confirmOrderSuccessToast'));
      refreshData();
    } else {
      const d = await res.json();
      showNotif(d.error || t('confirmOrderFailToast'), false);
    }
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
            <span>{t('adminDashboardTitle')}</span>
          </h1>
          <p className="page-subtitle">{t('adminDashboardSubtitle')}</p>
        </div>

        {/* Unified Tab Bar controls */}
        <div className="filter-controls" style={{ marginBottom: '2.5rem', display: 'flex', gap: '0.8rem', flexWrap: 'wrap' }}>
          <button className={`filter-btn ${activeTab === 'sales' ? 'active' : ''}`} onClick={() => setActiveTab('sales')}>
            <Icons.Chart style={{ marginRight: '6px' }} />
            <span>{t('tabSales')}</span>
          </button>
          <button className={`filter-btn ${activeTab === 'inventory' ? 'active' : ''}`} onClick={() => setActiveTab('inventory')}>
            <Icons.Package style={{ marginRight: '6px' }} />
            <span>{t('tabInventory')}</span>
          </button>
          <button className={`filter-btn ${activeTab === 'orders' ? 'active' : ''}`} onClick={() => setActiveTab('orders')}>
            <Icons.Book style={{ marginRight: '6px' }} />
            <span>{t('tabOrders')}</span>
          </button>
          <button className={`filter-btn ${activeTab === 'users' ? 'active' : ''}`} onClick={() => setActiveTab('users')}>
            <Icons.User style={{ marginRight: '6px' }} />
            <span>{t('tabUsers')} ({users.length})</span>
          </button>
        </div>

        {/* Tab contents */}
        {activeTab === 'sales' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
            {/* Sales Stats Cards */}
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-value">฿ {totalSales.toLocaleString()}</div>
                <div className="stat-label">{t('totalSalesLabel')}</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{t('orderCount').replace('{count}', orders.length)}</div>
                <div className="stat-label">{t('totalOrdersLabel')}</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{t('productModelCount').replace('{count}', products.length)}</div>
                <div className="stat-label">{t('inventoryProductsLabel')}</div>
              </div>
            </div>

            {/* Sales Analytics Charts */}
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
                    <span>{t('editProductTitle').replace('{name}', productForm.name)}</span>
                  </span>
                ) : (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Icons.Plus style={{ color: 'var(--accent-gold)' }} />
                    <span>{t('addNewProductTitle')}</span>
                  </span>
                )}
              </h2>
              <form onSubmit={handleProductSubmit} className="form-stack" id="product-form">
                <div className="form-group">
                  <label className="form-label">{t('productNameLabel')}</label>
                  <input className="form-input" value={productForm.name} onChange={setProductFormValue('name')} required />
                </div>
                <div className="form-group">
                  <label className="form-label">{t('brandLabel')}</label>
                  <input className="form-input" value={productForm.brand} onChange={setProductFormValue('brand')} required />
                </div>
                <div className="form-group">
                  <label className="form-label">{t('priceThbLabel')}</label>
                  <input type="number" className="form-input" value={productForm.price} onChange={setProductFormValue('price')} required />
                </div>
                <div className="form-group">
                  <label className="form-label">{t('stockQtyLabel')}</label>
                  <input type="number" className="form-input" value={productForm.stock} onChange={setProductFormValue('stock')} required />
                </div>
                <div className="form-group">
                  <label className="form-label">{t('frontImageLabel')}</label>
                  <input className="form-input" value={productForm.image} onChange={setProductFormValue('image')} />
                </div>
                <div className="form-group">
                  <label className="form-label">{t('backImageLabel')}</label>
                  <input className="form-input" value={productForm.imageBack} onChange={setProductFormValue('imageBack')} />
                </div>
                <div className="btn-group">
                  <button type="submit" className="btn btn-primary">
                    {editingProduct ? t('updateDataBtn') : t('saveProductInfoBtn')}
                  </button>
                  {editingProduct && <button type="button" className="btn btn-secondary" onClick={resetForm}>{t('cancelBtn')}</button>}
                </div>
              </form>
            </div>

            {/* Inventory table */}
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
                  <tbody>
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
                        <td>
                          <span style={{ fontWeight: 700, color: p.stock <= 3 ? '#ff6b6b' : '#f5f5f7' }}>{t('stockLeft').replace('{count}', p.stock)}</span>
                          {p.stock <= 3 && <><br /><small style={{ color: '#ff6b6b', display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}><Icons.Info style={{ width: '12px', height: '12px' }} /> {t('lowStockWarning')}</small></>}
                        </td>
                        <td>
                          <div className="btn-group">
                            <button className="btn btn-secondary" style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem' }} onClick={() => startEditProduct(p)}>{t('editBtn')}</button>
                            <button className="btn btn-danger" style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem' }} onClick={() => handleDeleteProduct(p.id)}>{t('deleteBtn')}</button>
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
                <tbody>
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
                        {ord.status === 'pending_review' && <span className="badge" style={{ background: 'rgba(255,165,0,0.18)', color: '#ffa94d', border: '1px solid #ffa94d55' }}>{t('statusPendingReviewAdmin')}</span>}
                        {ord.status === 'manager_approved' && <span className="badge" style={{ background: 'rgba(59,130,246,0.18)', color: '#60a5fa', border: '1px solid #60a5fa55' }}>{t('statusManagerApprovedAdmin')}</span>}
                        {ord.status === 'confirmed' && <span className="badge badge-paid">{t('statusConfirmedReadyToShip')}</span>}
                        {ord.status === 'shipped' && <span className="badge badge-shipped">{t('statusShipped')}</span>}
                        {ord.status === 'cancelled' && <span className="badge badge-cancelled">{t('statusCancelled')}</span>}
                        {ord.status === 'paid' && <span className="badge badge-paid">{t('statusPaidReadyToShip')}</span>}
                      </td>
                      <td>
                        <small style={{ color: 'var(--text-muted)', fontFamily: 'monospace' }}>{ord.payment?.toUpperCase()}</small>
                        {ord.slip && <><br /><button className="btn btn-secondary" style={{ padding: '0.15rem 0.4rem', fontSize: '0.75rem', marginTop: '0.3rem' }} onClick={() => setSlipModal(slipModal === ord.id ? null : ord.id)}>{t('viewSlipBtn')}</button></>}
                      </td>
                      <td style={{ minWidth: '180px' }}>
                        {ord.slip && slipModal === ord.id && (
                          <div style={{ marginBottom: '0.4rem', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--glass-border)', maxWidth: '160px' }}>
                            <img src={ord.slip} alt="slip" style={{ width: '100%', display: 'block' }} />
                          </div>
                        )}
                        {ord.status === 'pending_payment' ? (
                          <span style={{ color: '#ffa94d', fontSize: '0.8rem' }}>{t('statusPendingPayment')}</span>
                        ) : ord.status === 'pending_review' ? (
                          <span style={{ color: '#ffa94d', fontSize: '0.8rem' }}>{t('waitingManagerReviewText')}</span>
                        ) : ord.status === 'manager_approved' ? (
                          <button className="btn btn-primary" style={{ padding: '0.25rem 0.6rem', fontSize: '0.8rem', background: 'linear-gradient(135deg, var(--accent-gold), #b58900)', border: 'none', color: '#000', fontWeight: 'bold' }} onClick={() => confirmOrder(ord.id)}>
                            {t('finalConfirmBtn')}
                          </button>
                        ) : ord.status === 'confirmed' || ord.status === 'paid' ? (
                          <span style={{ color: '#51cf66', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}>
                            <Icons.Check /><span>{t('paymentConfirmedText')}</span>
                          </span>
                        ) : ord.status === 'shipped' ? (
                          <span style={{ color: '#4ade80', fontSize: '0.8rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}>
                            <Icons.Check />
                            <span>{t('deliveredStatusLabel')}</span>
                          </span>
                        ) : (
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{t('cancelledStatusLabel')}</span>
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
                  <span>{t('inspectQueueTitle')}</span>
                </h2>
                <div className="table-responsive">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>{t('sellerCol')}</th>
                        <th>{t('brandModelCol')}</th>
                        <th>{t('desiredPriceCol')}</th>
                        <th>{t('evalConditionCol')}</th>
                        <th>{t('inspectActionCol')}</th>
                        <th>{t('importActionCol')}</th>
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
                                <button className="btn btn-success" style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem' }} onClick={() => handleInspect(w.id, 'passed')}>{t('passBtn')}</button>
                                <button className="btn btn-danger" style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem' }} onClick={() => handleInspect(w.id, 'failed')}>{t('failBtn')}</button>
                              </div>
                            ) : w.inspectionStatus === 'passed' ? (
                              <span className="badge badge-watch-passed">{t('inspectPass')}</span>
                            ) : (
                              <span className="badge badge-watch-failed">{t('inspectFail')}</span>
                            )}
                          </td>
                          <td>
                            {w.inspectionStatus === 'passed' && w.importStatus === 'pending' ? (
                              <button className="btn btn-primary" style={{ padding: '0.25rem 0.6rem', fontSize: '0.8rem' }} onClick={() => handleImport(w.id)}>{t('importActionCol')}</button>
                            ) : w.importStatus === 'imported' ? (
                              <span className="badge badge-watch-imported">{t('importedLabel')}</span>
                            ) : (
                              <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{t('waitingProcessText')}</span>
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
                  <span>{t('systemUsersTitle')} ({users.length})</span>
                </h2>
                <div className="table-responsive">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>{t('usernameCol')}</th>
                        <th>{t('roleCol')}</th>
                        <th>{t('manageCol')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((u) => (
                        <tr key={u.username}>
                          <td>
                            <strong>{u.username}</strong>
                            {u.username === currentUser?.username && (
                              <span className="badge" style={{ background: 'rgba(81,207,102,0.1)', color: '#51cf66', marginLeft: '0.5rem' }}>{t('youBadge')}</span>
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
                              <button className="btn btn-secondary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem' }} onClick={() => startEditUser(u)}>{t('editBtn')}</button>
                              <button className="btn btn-danger" style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem' }} disabled={u.username === currentUser?.username} onClick={() => handleDeleteUser(u.username)}>{t('deleteBtn')}</button>
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
                  <span>{editingUser ? t('editUserPrivilegeTitle').replace('{username}', editingUser) : t('selectUserToEditTitle')}</span>
                </h2>
                {editingUser ? (
                  <form onSubmit={handleUpdateUser} className="form-stack">
                    <div className="form-group">
                      <label className="form-label">{t('accessPrivilegeLabel')}</label>
                      <select className="form-select" value={userForm.role} onChange={(e) => setUserForm((prev) => ({ ...prev, role: e.target.value }))}>
                        <option value="user">{t('roleUserOption')}</option>
                        <option value="manager">{t('roleManagerOption')}</option>
                        <option value="admin">{t('roleAdminOption')}</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">{t('changePasswordLabel')}</label>
                      <input type="password" className="form-input" placeholder={t('newPasswordPlaceholder')} value={userForm.password} onChange={(e) => setUserForm((prev) => ({ ...prev, password: e.target.value }))} />
                    </div>
                    <div className="btn-group">
                      <button type="submit" className="btn btn-primary">{t('updateDataBtn')}</button>
                      <button type="button" className="btn btn-secondary" onClick={cancelEditUser}>{t('cancelBtn')}</button>
                    </div>
                  </form>
                ) : (
                  <p style={{ color: 'var(--text-muted)', fontStyle: 'italic', fontSize: '0.88rem' }}>
                    {t('editUserInstruction')}
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
