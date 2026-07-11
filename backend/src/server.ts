import express from 'express';
import cors from 'cors';
import path from 'path';
import generatePayload from 'promptpay-qr';
import QRCode from 'qrcode';
import { db } from './database';
import { Product, Order, PendingWatch, User } from './types';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '10mb' })); // Support base64 image slips

// -------------------------------------------------------------
// Authentication Endpoints
// -------------------------------------------------------------

app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    await db.addLog(`[SECURITY]: พยายามเข้าสู่ระบบแต่ข้อมูลไม่ครบถ้วน`);
    return res.status(400).json({ error: 'Username and password are required.' });
  }

  const users = await db.getUsers();
  const matchedUser = users.find(
    u => u.username.toLowerCase() === username.toLowerCase()
  );

  let isValid = false;
  let finalRole = 'user';

  if (matchedUser) {
    if (matchedUser.password === password) {
      isValid = true;
      finalRole = matchedUser.role;
    }
  } else if (password === '123456') {
    // Legacy support: auto-create standard users that use default password
    const newUser: User = { username, password, role: 'user' };
    await db.addUser(newUser);
    isValid = true;
    finalRole = 'user';
    await db.addLog(`[AUTH]: สร้างบัญชีผู้ใช้ใหม่โดยอัตโนมัติ: ${username}`);
  }

  if (isValid) {
    await db.addLog(`[AUTH]: ผู้ใช้เข้าสู่ระบบสำเร็จในบทบาท ${finalRole.toUpperCase()} (${username})`);
    return res.json({ success: true, user: { username, role: finalRole } });
  } else {
    await db.addLog(`[SECURITY]: ความพยายามเข้าสู่ระบบล้มเหลว (ผู้ใช้: ${username})`);
    return res.status(401).json({ error: 'Invalid username or password' });
  }
});

app.post('/api/auth/register', async (req, res) => {
  const { username, password, firstname, lastname, email, phone, address } = req.body;
  if (!username || !password || !email) {
    return res.status(400).json({ error: 'Username, password, and email are required.' });
  }

  const users = await db.getUsers();
  const isUsernameExists = users.some(
    u => u.username.toLowerCase() === username.toLowerCase()
  ) || ['admin', 'manager', 'staff', 'buyer', 'seller'].includes(username.toLowerCase());

  if (isUsernameExists) {
    return res.status(400).json({ error: 'ชื่อผู้ใช้นี้ถูกใช้งานแล้วในระบบ!' });
  }

  // Save new user credentials
  const newUser: User = { username, password, role: 'user' };
  await db.addUser(newUser);

  // Save profile info
  await db.saveProfile(username, { firstname, lastname, email, phone, address });

  await db.addLog(`[AUTH]: บัญชีผู้ซื้อใหม่สมัครสำเร็จ: ${username}`);
  return res.json({ success: true, message: 'สมัครสมาชิกสำเร็จ!' });
});

app.get('/api/auth/profile/:username', async (req, res) => {
  const username = req.params.username;
  const profile = await db.getProfile(username);
  return res.json(profile || { firstname: '', lastname: '', email: '', phone: '', address: '', avatar: '' });
});

app.post('/api/auth/profile/:username', async (req, res) => {
  const username = req.params.username;
  const { firstname, lastname, email, phone, address, avatar } = req.body;
  await db.saveProfile(username, { firstname, lastname, email, phone, address, avatar });

  await db.addLog(`[PROFILE]: อัปเดตข้อมูลโปรไฟล์ของ ${username} เรียบร้อย`);
  return res.json({ success: true, message: 'บันทึกข้อมูลโปรไฟล์สำเร็จ' });
});

// -------------------------------------------------------------
// Products Catalog Endpoints
// -------------------------------------------------------------

app.get('/api/products', async (req, res) => {
  const products = await db.getProducts();
  const category = req.query.category as string;
  const search = req.query.search as string;

  let filtered = products;

  if (category && category !== 'all') {
    filtered = filtered.filter(p => p.category === category);
  }

  if (search) {
    const q = search.toLowerCase();
    filtered = filtered.filter(
      p => p.name.toLowerCase().includes(q) || p.brand.toLowerCase().includes(q)
    );
  }

  return res.json(filtered);
});

app.post('/api/products', async (req, res) => {
  const { name, brand, category, price, stock, color, strokeColor, image, imageBack } = req.body;
  if (!name || !brand || !category || isNaN(price) || isNaN(stock)) {
    return res.status(400).json({ error: 'Invalid product properties.' });
  }

  const newProduct: Product = {
    id: "PROD-" + Date.now().toString().slice(-6),
    name,
    brand,
    category,
    price: Number(price),
    stock: Number(stock),
    color: color || "#2d3748",
    strokeColor: strokeColor || "#c5a880",
    image: image || "",
    imageBack: imageBack || ""
  };

  await db.addProduct(newProduct);

  await db.addLog(`[INVENTORY]: ผู้จัดการเพิ่มนาฬิการุ่นใหม่เข้าคลังสินค้า: ${name} (รหัส: ${newProduct.id})`);
  return res.status(211).json(newProduct); // Support status code or standard 201
});

app.put('/api/products/:id', async (req, res) => {
  const prodId = req.params.id;
  const { name, brand, category, price, stock, color, strokeColor, image, imageBack } = req.body;

  const products = await db.getProducts();
  const exists = products.some(p => p.id === prodId);

  if (!exists) {
    return res.status(404).json({ error: 'Product not found.' });
  }

  await db.updateProduct(prodId, { name, brand, category, price, stock, color, strokeColor, image, imageBack });
  await db.addLog(`[INVENTORY]: ผู้จัดการทำการอัปเดตข้อมูลนาฬิกา: ${name} (ID: ${prodId})`);
  return res.json({ id: prodId, name, brand, category, price, stock, color, strokeColor, image, imageBack });
});

app.delete('/api/products/:id', async (req, res) => {
  const prodId = req.params.id;
  const products = await db.getProducts();
  const exists = products.some(p => p.id === prodId);

  if (!exists) {
    return res.status(404).json({ error: 'Product not found.' });
  }

  await db.deleteProduct(prodId);
  await db.addLog(`[INVENTORY]: ผู้จัดการลบสินค้าออกจากระบบ (รหัสสินค้า: ${prodId})`);
  return res.json({ success: true, message: 'ลบข้อมูลนาฬิกาสำเร็จ' });
});

// GET /api/payment/qr - Generate PromptPay QR code
app.get('/api/payment/qr', async (req, res) => {
  const amountStr = req.query.amount as string;
  const amount = parseFloat(amountStr);

  if (isNaN(amount) || amount <= 0) {
    return res.status(400).json({ error: 'Invalid amount.' });
  }

  try {
    const DEMO_PROMPTPAY_ID = '0000000000'; // Demo ID
    const payload = generatePayload(DEMO_PROMPTPAY_ID, { amount });
    const qrDataUri = await QRCode.toDataURL(payload, {
      errorCorrectionLevel: 'M',
      type: 'image/png',
      margin: 2,
      width: 300,
    });
    return res.json({ qrCode: qrDataUri });
  } catch (err) {
    console.error('QR generation error:', err);
    return res.status(500).json({ error: 'Failed to generate PromptPay QR.' });
  }
});

// -------------------------------------------------------------
// Orders Endpoints
// -------------------------------------------------------------

app.get('/api/orders', async (req, res) => {
  return res.json(await db.getOrders());
});

app.post('/api/orders', async (req, res) => {
  const { items, email, address, payment, userId, slip } = req.body;
  if (!items || !Array.isArray(items) || items.length === 0 || !email || !address || !payment) {
    return res.status(400).json({ error: 'Invalid checkout parameters.' });
  }

  const products = await db.getProducts();

  // Validate stock
  for (const item of items) {
    const matched = products.find(p => p.id === item.id);
    if (!matched) {
      return res.status(400).json({ error: `ไม่พบสินค้ารหัส ${item.id} ในสต็อก` });
    }
    if (matched.stock < item.quantity) {
      return res.status(400).json({ error: `สินค้า "${matched.name}" มีจำนวนในคลังไม่เพียงพอ (สูงสุด: ${matched.stock} เรือน)` });
    }
  }

  // Deduct stock
  for (const item of items) {
    const matched = products.find(p => p.id === item.id);
    if (matched) {
      const newStock = Math.max(0, matched.stock - item.quantity);
      await db.updateProduct(item.id, { stock: newStock });
    }
  }

  const totalPrice = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const newOrder: Order = {
    id: "ORD-" + Math.floor(100000 + Math.random() * 900000),
    userId: userId || 'guest',
    items,
    total: totalPrice,
    email,
    address,
    payment,
    // COD is confirmed instantly. PromptPay & Bank Transfer start at pending_review if slip is attached, otherwise pending_payment
    status: payment === 'cod' ? 'confirmed' : (slip ? 'pending_review' : 'pending_payment'),
    date: new Date().toISOString(),
    slip: payment !== 'cod' ? slip : null
  };

  await db.addOrder(newOrder);

  await db.addLog(`[ORDER]: บันทึกออเดอร์ใหม่ (ID: ${newOrder.id}) สถานะ: ${newOrder.status}`);
  if (payment === 'promptpay') {
    if (newOrder.status === 'pending_review') {
      await db.addLog(`[PAYMENT]: PromptPay QR Code ชำระเสร็จสิ้น — รอ Manager ตรวจสลิป`);
    } else {
      await db.addLog(`[PAYMENT]: รอชำระเงินภายใน 24 ชม. ผ่าน PromptPay QR (ออเดอร์: ${newOrder.id})`);
    }
  } else if (payment === 'bank_transfer') {
    if (newOrder.status === 'pending_review') {
      await db.addLog(`[PAYMENT]: ได้รับสลิปโอนเงิน — รอ Manager ตรวจสอบความถูกต้อง`);
    } else {
      await db.addLog(`[PAYMENT]: รอชำระเงินภายใน 24 ชม. ผ่านธนาคาร (ออเดอร์: ${newOrder.id})`);
    }
  } else {
    await db.addLog(`[PAYMENT]: COD ยืนยันทันที — ชำระเงินเมื่อรับสินค้า`);
  }
  
  if (newOrder.status === 'pending_review') {
    await db.addLog(`[LINE Notify]: แจ้ง Manager มีออเดอร์ใหม่รอตรวจสลิป → ออเดอร์ ${newOrder.id} ยอด ฿${totalPrice.toLocaleString()}`);
  }

  return res.status(201).json(newOrder);
});

app.post('/api/orders/:id/submit-slip', async (req, res) => {
  const orderId = req.params.id;
  const { slip } = req.body;
  if (!slip) {
    return res.status(400).json({ error: 'กรุณาแนบสลิปการโอนเงิน' });
  }

  try {
    const orders = await db.getOrders();
    const ord = orders.find(o => o.id === orderId);
    if (!ord) {
      return res.status(404).json({ error: 'ไม่พบออเดอร์นี้ในระบบ' });
    }
    if (ord.status !== 'pending_payment') {
      return res.status(400).json({ error: 'ออเดอร์นี้ไม่ได้อยู่ในสถานะรอชำระเงิน' });
    }

    await db.updateOrderSlip(orderId, slip, 'pending_review');
    await db.addLog(`[PAYMENT]: ลูกค้าแนบสลิปการชำระเงินเรียบร้อยสำหรับออเดอร์ ${orderId} — รอ Manager ตรวจสอบ`);
    await db.addLog(`[LINE Notify]: แจ้ง Manager มีการอัปโหลดสลิปใหม่ → ออเดอร์ ${orderId} ยอด ฿${ord.total.toLocaleString()}`);
    return res.json({ success: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'เกิดข้อผิดพลาดกับเซิร์ฟเวอร์' });
  }
});

app.post('/api/orders/:id/cancel', async (req, res) => {
  const orderId = req.params.id;
  const orders = await db.getOrders();
  const idx = orders.findIndex(o => o.id === orderId);

  if (idx === -1) {
    return res.status(404).json({ error: 'Order not found.' });
  }

  if (orders[idx].status === 'cancelled') {
    return res.status(400).json({ error: 'Order is already cancelled.' });
  }

  await db.updateOrderStatus(orderId, 'cancelled');

  // Return Stocks back
  const products = await db.getProducts();
  for (const item of orders[idx].items) {
    const prod = products.find(p => p.id === item.id);
    if (prod) {
      const newStock = prod.stock + item.quantity;
      await db.updateProduct(item.id, { stock: newStock });
    }
  }

  await db.addLog(`[ORDER]: ลูกค้ายกเลิกคำสั่งซื้อ ${orderId} สินค้าถูกส่งกลับเข้าสต็อก`);
  await db.addLog(`[LINE Notify API]: แจ้งเตือนข้อความเตือนไปแจ้ง Manager -> "คำสั่งซื้อ ${orderId} ถูกยกเลิกโดยผู้ใช้"`);

  return res.json({ success: true });
});

app.post('/api/orders/:id/ship', async (req, res) => {
  const orderId = req.params.id;
  const orders = await db.getOrders();
  const idx = orders.findIndex(o => o.id === orderId);

  if (idx === -1) {
    return res.status(404).json({ error: 'Order not found.' });
  }

  if (orders[idx].status !== 'confirmed') {
    return res.status(400).json({ error: 'สามารถจัดส่งได้เฉพาะออเดอร์ที่ Admin ยืนยันแล้วเท่านั้น' });
  }

  await db.updateOrderStatus(orderId, 'shipped');
  await db.addLog(`[SHIPPING]: Manager ยืนยันจัดส่งพัสดุ (ออเดอร์: ${orderId})`);
  await db.addLog(`[Email Service]: แจ้งเตือนเลขพัสดุส่งหาลูกค้า: ${orders[idx].email}`);
  return res.json({ success: true });
});

// Manager approves payment slip → manager_approved
app.post('/api/orders/:id/manager-approve', async (req, res) => {
  const orderId = req.params.id;
  const orders = await db.getOrders();
  const idx = orders.findIndex(o => o.id === orderId);
  if (idx === -1) return res.status(404).json({ error: 'Order not found.' });
  if (orders[idx].status !== 'pending_review') {
    return res.status(400).json({ error: 'ออเดอร์นี้ไม่ได้อยู่ในสถานะรอตรวจสลิป' });
  }
  await db.updateOrderStatus(orderId, 'manager_approved');
  await db.addLog(`[PAYMENT REVIEW]: Manager อนุมัติสลิปการชำระเงิน (ออเดอร์: ${orderId}) — รอ Admin ยืนยันขั้นสุดท้าย`);
  await db.addLog(`[LINE Notify]: แจ้ง Admin สลิปถูกตรวจสอบแล้ว รอการยืนยัน → ออเดอร์ ${orderId}`);
  return res.json({ success: true });
});

// Manager rejects payment slip → cancelled
app.post('/api/orders/:id/manager-reject', async (req, res) => {
  const orderId = req.params.id;
  const { note } = req.body;
  const orders = await db.getOrders();
  const idx = orders.findIndex(o => o.id === orderId);
  if (idx === -1) return res.status(404).json({ error: 'Order not found.' });
  if (orders[idx].status !== 'pending_review') {
    return res.status(400).json({ error: 'ออเดอร์นี้ไม่ได้อยู่ในสถานะรอตรวจสลิป' });
  }

  // Restore stock
  const products = await db.getProducts();
  for (const item of orders[idx].items) {
    const prod = products.find(p => p.id === item.id);
    if (prod) await db.updateProduct(item.id, { stock: prod.stock + item.quantity });
  }

  await db.updateOrderStatus(orderId, 'cancelled');
  await db.addLog(`[PAYMENT REVIEW]: Manager ปฏิเสธสลิป (ออเดอร์: ${orderId}) เหตุผล: ${note || 'ไม่ระบุ'} — คืนสต็อกสินค้าแล้ว`);
  await db.addLog(`[Email Service]: แจ้งลูกค้า ${orders[idx].email} ว่าสลิปถูกปฏิเสธ เหตุผล: ${note || 'กรุณาส่งสลิปใหม่'}`);
  return res.json({ success: true });
});

// Admin gives final confirmation → confirmed
app.post('/api/orders/:id/admin-confirm', async (req, res) => {
  const orderId = req.params.id;
  const orders = await db.getOrders();
  const idx = orders.findIndex(o => o.id === orderId);
  if (idx === -1) return res.status(404).json({ error: 'Order not found.' });
  if (orders[idx].status !== 'manager_approved') {
    return res.status(400).json({ error: 'ออเดอร์นี้ยังไม่ผ่านการอนุมัติจาก Manager' });
  }
  await db.updateOrderStatus(orderId, 'confirmed');
  await db.addLog(`[PAYMENT REVIEW]: Admin ยืนยันขั้นสุดท้าย (ออเดอร์: ${orderId}) — พร้อมจัดส่งสินค้า`);
  await db.addLog(`[Email Service]: แจ้งลูกค้า ${orders[idx].email} ว่าการชำระเงินได้รับการยืนยันแล้ว`);
  return res.json({ success: true });
});

// -------------------------------------------------------------
// Seller & Inspection Endpoints
// -------------------------------------------------------------

app.post('/api/pending-watches/register-seller', async (req, res) => {
  const { name, email, nationalId } = req.body;
  if (!email || !nationalId) {
    return res.status(400).json({ error: 'Email and National ID are required.' });
  }

  const blacklist = await db.getBlacklist();
  const isBlacklisted = blacklist.some(
    b => b.email.toLowerCase() === email.toLowerCase() || b.nationalId === nationalId
  );

  if (isBlacklisted) {
    await db.addLog(`[SECURITY]: การสมัครลงทะเบียนผู้ขายปฏิเสธ เนื่องจากข้อมูลติดบัญชีดำ (Blacklist Verification Failed - Email: ${email})`);
    return res.status(403).json({ error: 'ขออภัย ข้อมูลของท่านอยู่ในบัญชีดำแบล็คลิสต์!' });
  }

  await db.addLog(`[SECURITY]: สมัครลงทะเบียนผู้ขายสำเร็จ ผ่านการคัดกรองประวัติแบล็คลิสต์ (ผู้ขาย: ${name}, Email: ${email})`);
  return res.json({ success: true, message: 'ยืนยันตัวตนสำเร็จและเป็นผู้ขายได้รับการอนุมัติ!' });
});

app.get('/api/pending-watches', async (req, res) => {
  return res.json(await db.getPendingWatches());
});

app.post('/api/pending-watches', async (req, res) => {
  const { brand, model, price, proposedBanding, dialColor, description, sellerName, sellerEmail } = req.body;
  
  if (!brand || !model || isNaN(price) || !proposedBanding) {
    return res.status(400).json({ error: 'Invalid proposal properties.' });
  }

  const newWatch: PendingWatch = {
    id: "WSH-" + Math.floor(100000 + Math.random() * 900000),
    brand,
    model,
    price: Number(price),
    proposedBanding,
    dialColor: dialColor || "#2d3748",
    description: description || "",
    sellerName: sellerName || "ผู้ขายยืนยันตัวตน",
    sellerEmail: sellerEmail || "seller@email.com",
    inspectionStatus: "pending",
    importStatus: "pending",
    date: new Date().toLocaleString()
  };

  await db.addPendingWatch(newWatch);

  await db.addLog(`[STORAGE]: จัดเก็บไฟล์รูปภาพสินค้าจำลองใน Storage Data สำเร็จ (นาฬิกา: ${brand} ${model})`);
  await db.addLog(`[API Trigger]: ยิงการแจ้งเตือนขอตรวจสอบนาฬิกาไปหาผู้ดูแลระบบ (Admin Notification: New Watch Pending Inspection)`);

  return res.status(201).json(newWatch);
});

app.post('/api/pending-watches/inspect', async (req, res) => {
  const { id, result } = req.body; // result: 'passed' | 'failed'
  if (!id || !result || !['passed', 'failed'].includes(result)) {
    return res.status(400).json({ error: 'ID and valid result are required.' });
  }

  const watches = await db.getPendingWatches();
  const watch = watches.find(w => w.id === id);

  if (!watch) {
    return res.status(404).json({ error: 'Watch proposal not found.' });
  }

  await db.updatePendingWatchInspection(id, result);

  await db.addLog(`[ADMIN]: ผู้ดูแลระบบตรวจสอบสภาพนาฬิกา ID ${id} (${watch.brand} ${watch.model}) -> ผลลัพธ์: ${result === 'passed' ? 'ผ่านเกณฑ์ตรวจสภาพจริง' : 'ไม่ผ่านเกณฑ์ตรวจสภาพจริง'}`);
  return res.json({ id, inspectionStatus: result });
});

app.post('/api/pending-watches/import', async (req, res) => {
  const { id } = req.body;
  if (!id) {
    return res.status(400).json({ error: 'ID is required.' });
  }

  const watches = await db.getPendingWatches();
  const watch = watches.find(w => w.id === id);

  if (!watch) {
    return res.status(404).json({ error: 'Watch proposal not found.' });
  }

  if (watch.inspectionStatus !== 'passed') {
    return res.status(400).json({ error: 'Only passed watches can be imported.' });
  }

  await db.updatePendingWatchImport(id, 'imported');

  // Add product into catalog database
  const newProduct: Product = {
    id: watch.id,
    name: watch.model,
    brand: watch.brand,
    category: watch.proposedBanding,
    price: watch.price,
    stock: 1,
    color: watch.dialColor || "#2d3748",
    strokeColor: "#c5a880",
    isGoldFace: watch.dialColor === "#fcfcfc"
  };

  await db.addProduct(newProduct);

  await db.addLog(`[DATABASE]: บันทึกข้อมูลนาฬิกาใหม่ลง PostgreSQL สำเร็จ (รหัสผลิตภัณฑ์: ${watch.id})`);
  await db.addLog(`[INVENTORY]: อัปเดตคลังระดับราคากลาง (${watch.proposedBanding.toUpperCase()}) สำเร็จ (สินค้าพร้อมวางขาย)`);
  await db.addLog(`[API Trigger]: ยิงการแจ้งเตือน Line Notify เพื่อโฆษณาสินค้าเข้าใหม่หากลุ่มลูกค้าเรียบร้อย`);

  return res.json({ success: true, product: newProduct });
});

// -------------------------------------------------------------
// Blacklist & Logs Endpoints
// -------------------------------------------------------------

app.get('/api/blacklist', async (req, res) => {
  return res.json(await db.getBlacklist());
});

app.get('/api/logs', async (req, res) => {
  return res.json(await db.getLogs());
});

app.post('/api/logs', async (req, res) => {
  const { message } = req.body;
  if (message) {
    await db.addLog(message);
    return res.json({ success: true });
  }
  return res.status(400).json({ error: 'Message is required.' });
});

// -------------------------------------------------------------
// Admin User Management Endpoints
// -------------------------------------------------------------
app.get('/api/admin/users', async (req, res) => {
  try {
    const users = await db.getUsers();
    // Exclude password or send it empty, send for display
    const safeUsers = users.map(u => ({ username: u.username, role: u.role }));
    return res.json(safeUsers);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to retrieve users.' });
  }
});

app.put('/api/admin/users/:username', async (req, res) => {
  const { username } = req.params;
  const { role, password } = req.body;
  if (!role) {
    return res.status(400).json({ error: 'Role is required.' });
  }
  try {
    await db.updateUser(username, role, password);
    await db.addLog(`[ADMIN]: อัปเดตข้อมูลผู้ใช้ ${username} (Role: ${role})`);
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to update user.' });
  }
});

app.delete('/api/admin/users/:username', async (req, res) => {
  const { username } = req.params;
  try {
    await db.deleteUser(username);
    await db.addLog(`[ADMIN]: ลบผู้ใช้ ${username} ออกจากระบบ`);
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to delete user.' });
  }
});

// Force reseed products (Admin only)
app.post('/api/admin/force-reseed', async (req, res) => {
  try {
    await db.forceReseedProducts();
    return res.json({ success: true, message: 'Products reseeded with LUMINOX, SEIKO & TAG Heuer collections!' });
  } catch (err) {
    console.error('Force reseed error:', err);
    return res.status(500).json({ error: 'Failed to reseed products.' });
  }
});

// -------------------------------------------------------------
// Reviews Endpoints
// -------------------------------------------------------------
app.get('/api/reviews/:productId', async (req, res) => {
  try {
    const reviews = await db.getReviews(req.params.productId);
    return res.json(reviews);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to get reviews.' });
  }
});

app.post('/api/reviews', async (req, res) => {
  const { productId, username, rating, comment } = req.body;
  if (!productId || !username || !rating || !comment) {
    return res.status(400).json({ error: 'productId, username, rating, and comment are required.' });
  }
  try {
    const date = new Date().toLocaleString('th-TH');
    await db.addReview({ productId, username, rating: Number(rating), comment, date });
    await db.addLog(`[REVIEW]: ผู้ใช้ ${username} ได้เขียนรีวิวให้สินค้า ID ${productId} ด้วยคะแนน ${rating} ดาว`);
    return res.json({ success: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to add review.' });
  }
});


// Custom routes to serve docs kept in the root folder
app.get('/analysis_design.md', (req, res) => {
  res.sendFile(path.join(__dirname, '..', '..', 'analysis_design.md'));
});

app.get('/README.md', (req, res) => {
  res.sendFile(path.join(__dirname, '..', '..', 'README.md'));
});

// Serve frontend static files
app.use(express.static(path.join(__dirname, '..', 'public')));

// Fallback to client routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

// Initialize database tables, then start listening
db.initDb().then(() => {
  app.listen(PORT, () => {
    console.log(`WatchMart backend server running on port ${PORT}`);
  });
}).catch(err => {
  console.error("Failed to initialize database:", err);
});
