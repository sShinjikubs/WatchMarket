"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const path_1 = __importDefault(require("path"));
const database_1 = require("./database");
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3000;
app.use((0, cors_1.default)());
app.use(express_1.default.json({ limit: '10mb' })); // Support base64 image slips
// -------------------------------------------------------------
// Authentication Endpoints
// -------------------------------------------------------------
app.post('/api/auth/login', async (req, res) => {
    const { role, username, password } = req.body;
    if (!username || !password || !role) {
        await database_1.db.addLog(`[SECURITY]: พยายามเข้าสู่ระบบแต่ข้อมูลไม่ครบถ้วน`);
        return res.status(400).json({ error: 'Username, password, and role are required.' });
    }
    const users = await database_1.db.getUsers();
    const matchedUser = users.find(u => u.username.toLowerCase() === username.toLowerCase() && u.role === role);
    let isValid = false;
    if (matchedUser) {
        if (matchedUser.password === password) {
            isValid = true;
        }
    }
    else if (role === 'user' && password === '123456') {
        // Legacy support: auto-create standard users that use default password
        const newUser = { username, password, role: 'user' };
        await database_1.db.addUser(newUser);
        isValid = true;
        await database_1.db.addLog(`[AUTH]: สร้างบัญชีผู้ใช้ใหม่โดยอัตโนมัติ: ${username}`);
    }
    if (isValid) {
        await database_1.db.addLog(`[AUTH]: ผู้ใช้เข้าสู่ระบบสำเร็จในบทบาท ${role.toUpperCase()} (${username})`);
        return res.json({ success: true, user: { username, role } });
    }
    else {
        await database_1.db.addLog(`[SECURITY]: ความพยายามเข้าสู่ระบบล้มเหลวสำหรับบทบาท ${role.toUpperCase()} (ผู้ใช้: ${username})`);
        return res.status(401).json({ error: 'ชื่อผู้ใช้งานหรือรหัสผ่านไม่ถูกต้อง' });
    }
});
app.post('/api/auth/register', async (req, res) => {
    const { username, password, firstname, lastname, email, phone, address } = req.body;
    if (!username || !password || !email) {
        return res.status(400).json({ error: 'Username, password, and email are required.' });
    }
    const users = await database_1.db.getUsers();
    const isUsernameExists = users.some(u => u.username.toLowerCase() === username.toLowerCase()) || ['admin', 'manager', 'staff', 'buyer', 'seller'].includes(username.toLowerCase());
    if (isUsernameExists) {
        return res.status(400).json({ error: 'ชื่อผู้ใช้นี้ถูกใช้งานแล้วในระบบ!' });
    }
    // Save new user credentials
    const newUser = { username, password, role: 'user' };
    await database_1.db.addUser(newUser);
    // Save profile info
    await database_1.db.saveProfile(username, { firstname, lastname, email, phone, address });
    await database_1.db.addLog(`[AUTH]: บัญชีผู้ซื้อใหม่สมัครสำเร็จ: ${username}`);
    return res.json({ success: true, message: 'สมัครสมาชิกสำเร็จ!' });
});
app.get('/api/auth/profile/:username', async (req, res) => {
    const username = req.params.username;
    const profile = await database_1.db.getProfile(username);
    return res.json(profile || { firstname: '', lastname: '', email: '', phone: '', address: '' });
});
app.post('/api/auth/profile/:username', async (req, res) => {
    const username = req.params.username;
    const { firstname, lastname, email, phone, address } = req.body;
    await database_1.db.saveProfile(username, { firstname, lastname, email, phone, address });
    await database_1.db.addLog(`[PROFILE]: อัปเดตข้อมูลโปรไฟล์ของ ${username} เรียบร้อย`);
    return res.json({ success: true, message: 'บันทึกข้อมูลโปรไฟล์สำเร็จ' });
});
// -------------------------------------------------------------
// Products Catalog Endpoints
// -------------------------------------------------------------
app.get('/api/products', async (req, res) => {
    const products = await database_1.db.getProducts();
    const category = req.query.category;
    const search = req.query.search;
    let filtered = products;
    if (category && category !== 'all') {
        filtered = filtered.filter(p => p.category === category);
    }
    if (search) {
        const q = search.toLowerCase();
        filtered = filtered.filter(p => p.name.toLowerCase().includes(q) || p.brand.toLowerCase().includes(q));
    }
    return res.json(filtered);
});
app.post('/api/products', async (req, res) => {
    const { name, brand, category, price, stock, color, strokeColor } = req.body;
    if (!name || !brand || !category || isNaN(price) || isNaN(stock)) {
        return res.status(400).json({ error: 'Invalid product properties.' });
    }
    const newProduct = {
        id: "PROD-" + Date.now().toString().slice(-6),
        name,
        brand,
        category,
        price: Number(price),
        stock: Number(stock),
        color: color || "#2d3748",
        strokeColor: strokeColor || "#c5a880"
    };
    await database_1.db.addProduct(newProduct);
    await database_1.db.addLog(`[INVENTORY]: ผู้จัดการเพิ่มนาฬิการุ่นใหม่เข้าคลังสินค้า: ${name} (รหัส: ${newProduct.id})`);
    return res.status(211).json(newProduct); // Support status code or standard 201
});
app.put('/api/products/:id', async (req, res) => {
    const prodId = req.params.id;
    const { name, brand, category, price, stock, color, strokeColor } = req.body;
    const products = await database_1.db.getProducts();
    const exists = products.some(p => p.id === prodId);
    if (!exists) {
        return res.status(404).json({ error: 'Product not found.' });
    }
    await database_1.db.updateProduct(prodId, { name, brand, category, price, stock, color, strokeColor });
    await database_1.db.addLog(`[INVENTORY]: ผู้จัดการทำการอัปเดตข้อมูลนาฬิกา: ${name} (ID: ${prodId})`);
    return res.json({ id: prodId, name, brand, category, price, stock, color, strokeColor });
});
app.delete('/api/products/:id', async (req, res) => {
    const prodId = req.params.id;
    const products = await database_1.db.getProducts();
    const exists = products.some(p => p.id === prodId);
    if (!exists) {
        return res.status(404).json({ error: 'Product not found.' });
    }
    await database_1.db.deleteProduct(prodId);
    await database_1.db.addLog(`[INVENTORY]: ผู้จัดการลบสินค้าออกจากระบบ (รหัสสินค้า: ${prodId})`);
    return res.json({ success: true, message: 'ลบข้อมูลนาฬิกาสำเร็จ' });
});
// -------------------------------------------------------------
// Orders Endpoints
// -------------------------------------------------------------
app.get('/api/orders', async (req, res) => {
    return res.json(await database_1.db.getOrders());
});
app.post('/api/orders', async (req, res) => {
    const { items, email, address, payment, userId, slip } = req.body;
    if (!items || !Array.isArray(items) || items.length === 0 || !email || !address || !payment) {
        return res.status(400).json({ error: 'Invalid checkout parameters.' });
    }
    const products = await database_1.db.getProducts();
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
            await database_1.db.updateProduct(item.id, { stock: newStock });
        }
    }
    const totalPrice = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const newOrder = {
        id: "ORD-" + Math.floor(100000 + Math.random() * 900000),
        userId: userId || 'guest',
        items,
        total: totalPrice,
        email,
        address,
        payment,
        status: "paid", // Auto confirmed upon payment simulation
        date: new Date().toLocaleString(),
        slip: payment !== 'credit_card' ? slip : null
    };
    await database_1.db.addOrder(newOrder);
    // Simulated integrations logging
    await database_1.db.addLog(`[DATABASE]: บันทึกประวัติใบสั่งซื้อลง PostgreSQL สำเร็จ (ID: ${newOrder.id})`);
    if (payment === 'promptpay') {
        await database_1.db.addLog(`[API Trigger]: เรียกใช้ Easy Donate API (Bank Gateway) จำลอง เพื่อออก QR Code และตรวจรับยอดชำระสำเร็จ`);
    }
    if (newOrder.slip && payment !== 'promptpay') {
        await database_1.db.addLog(`[STORAGE]: จัดเก็บไฟล์สลิปหลักฐานใน AWS S3 bucket จำลองสำเร็จ`);
    }
    await database_1.db.addLog(`[API Trigger]: ยิงคำสั่ง POST ไปยัง LINE Notify API เรียบร้อย -> "มีคำสั่งซื้อใหม่ ยอดเงิน ฿${totalPrice.toLocaleString()}"`);
    await database_1.db.addLog(`[Email Service]: ส่งรายละเอียดหลักฐานการสั่งซื้อไปยังกล่องจดหมาย: ${email} สำเร็จ`);
    return res.status(201).json(newOrder);
});
app.post('/api/orders/:id/cancel', async (req, res) => {
    const orderId = req.params.id;
    const orders = await database_1.db.getOrders();
    const idx = orders.findIndex(o => o.id === orderId);
    if (idx === -1) {
        return res.status(404).json({ error: 'Order not found.' });
    }
    if (orders[idx].status === 'cancelled') {
        return res.status(400).json({ error: 'Order is already cancelled.' });
    }
    await database_1.db.updateOrderStatus(orderId, 'cancelled');
    // Return Stocks back
    const products = await database_1.db.getProducts();
    for (const item of orders[idx].items) {
        const prod = products.find(p => p.id === item.id);
        if (prod) {
            const newStock = prod.stock + item.quantity;
            await database_1.db.updateProduct(item.id, { stock: newStock });
        }
    }
    await database_1.db.addLog(`[ORDER]: ลูกค้ายกเลิกคำสั่งซื้อ ${orderId} สินค้าถูกส่งกลับเข้าสต็อก`);
    await database_1.db.addLog(`[LINE Notify API]: แจ้งเตือนข้อความเตือนไปแจ้ง Manager -> "คำสั่งซื้อ ${orderId} ถูกยกเลิกโดยผู้ใช้"`);
    return res.json({ success: true });
});
app.post('/api/orders/:id/ship', async (req, res) => {
    const orderId = req.params.id;
    const orders = await database_1.db.getOrders();
    const idx = orders.findIndex(o => o.id === orderId);
    if (idx === -1) {
        return res.status(404).json({ error: 'Order not found.' });
    }
    await database_1.db.updateOrderStatus(orderId, 'shipped');
    await database_1.db.addLog(`[SHIPPING]: พนักงานเตรียมพัสดุและนำจ่ายส่งสถานะจัดส่งสำเร็จ (ออเดอร์: ${orderId})`);
    await database_1.db.addLog(`[Email Service]: แจ้งเตือนเลขพัสดุจำลองส่งตรงหาอีเมลลูกค้า: ${orders[idx].email}`);
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
    const blacklist = await database_1.db.getBlacklist();
    const isBlacklisted = blacklist.some(b => b.email.toLowerCase() === email.toLowerCase() || b.nationalId === nationalId);
    if (isBlacklisted) {
        await database_1.db.addLog(`[SECURITY]: การสมัครลงทะเบียนผู้ขายปฏิเสธ เนื่องจากข้อมูลติดบัญชีดำ (Blacklist Verification Failed - Email: ${email})`);
        return res.status(403).json({ error: 'ขออภัย ข้อมูลของท่านอยู่ในบัญชีดำแบล็คลิสต์!' });
    }
    await database_1.db.addLog(`[SECURITY]: สมัครลงทะเบียนผู้ขายสำเร็จ ผ่านการคัดกรองประวัติแบล็คลิสต์ (ผู้ขาย: ${name}, Email: ${email})`);
    return res.json({ success: true, message: 'ยืนยันตัวตนสำเร็จและเป็นผู้ขายได้รับการอนุมัติ!' });
});
app.get('/api/pending-watches', async (req, res) => {
    return res.json(await database_1.db.getPendingWatches());
});
app.post('/api/pending-watches', async (req, res) => {
    const { brand, model, price, proposedBanding, dialColor, description, sellerName, sellerEmail } = req.body;
    if (!brand || !model || isNaN(price) || !proposedBanding) {
        return res.status(400).json({ error: 'Invalid proposal properties.' });
    }
    const newWatch = {
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
    await database_1.db.addPendingWatch(newWatch);
    await database_1.db.addLog(`[STORAGE]: จัดเก็บไฟล์รูปภาพสินค้าจำลองใน Storage Data สำเร็จ (นาฬิกา: ${brand} ${model})`);
    await database_1.db.addLog(`[API Trigger]: ยิงการแจ้งเตือนขอตรวจสอบนาฬิกาไปหาผู้ดูแลระบบ (Admin Notification: New Watch Pending Inspection)`);
    return res.status(201).json(newWatch);
});
app.post('/api/pending-watches/inspect', async (req, res) => {
    const { id, result } = req.body; // result: 'passed' | 'failed'
    if (!id || !result || !['passed', 'failed'].includes(result)) {
        return res.status(400).json({ error: 'ID and valid result are required.' });
    }
    const watches = await database_1.db.getPendingWatches();
    const watch = watches.find(w => w.id === id);
    if (!watch) {
        return res.status(404).json({ error: 'Watch proposal not found.' });
    }
    await database_1.db.updatePendingWatchInspection(id, result);
    await database_1.db.addLog(`[ADMIN]: ผู้ดูแลระบบตรวจสอบสภาพนาฬิกา ID ${id} (${watch.brand} ${watch.model}) -> ผลลัพธ์: ${result === 'passed' ? 'ผ่านเกณฑ์ตรวจสภาพจริง' : 'ไม่ผ่านเกณฑ์ตรวจสภาพจริง'}`);
    return res.json({ id, inspectionStatus: result });
});
app.post('/api/pending-watches/import', async (req, res) => {
    const { id } = req.body;
    if (!id) {
        return res.status(400).json({ error: 'ID is required.' });
    }
    const watches = await database_1.db.getPendingWatches();
    const watch = watches.find(w => w.id === id);
    if (!watch) {
        return res.status(404).json({ error: 'Watch proposal not found.' });
    }
    if (watch.inspectionStatus !== 'passed') {
        return res.status(400).json({ error: 'Only passed watches can be imported.' });
    }
    await database_1.db.updatePendingWatchImport(id, 'imported');
    // Add product into catalog database
    const newProduct = {
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
    await database_1.db.addProduct(newProduct);
    await database_1.db.addLog(`[DATABASE]: บันทึกข้อมูลนาฬิกาใหม่ลง PostgreSQL สำเร็จ (รหัสผลิตภัณฑ์: ${watch.id})`);
    await database_1.db.addLog(`[INVENTORY]: อัปเดตคลังระดับราคากลาง (${watch.proposedBanding.toUpperCase()}) สำเร็จ (สินค้าพร้อมวางขาย)`);
    await database_1.db.addLog(`[API Trigger]: ยิงการแจ้งเตือน Line Notify เพื่อโฆษณาสินค้าเข้าใหม่หากลุ่มลูกค้าเรียบร้อย`);
    return res.json({ success: true, product: newProduct });
});
// -------------------------------------------------------------
// Blacklist & Logs Endpoints
// -------------------------------------------------------------
app.get('/api/blacklist', async (req, res) => {
    return res.json(await database_1.db.getBlacklist());
});
app.get('/api/logs', async (req, res) => {
    return res.json(await database_1.db.getLogs());
});
app.post('/api/logs', async (req, res) => {
    const { message } = req.body;
    if (message) {
        await database_1.db.addLog(message);
        return res.json({ success: true });
    }
    return res.status(400).json({ error: 'Message is required.' });
});
// -------------------------------------------------------------
// Admin User Management Endpoints
// -------------------------------------------------------------
app.get('/api/admin/users', async (req, res) => {
    try {
        const users = await database_1.db.getUsers();
        // Exclude password or send it empty, send for display
        const safeUsers = users.map(u => ({ username: u.username, role: u.role }));
        return res.json(safeUsers);
    }
    catch (err) {
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
        await database_1.db.updateUser(username, role, password);
        await database_1.db.addLog(`[ADMIN]: อัปเดตข้อมูลผู้ใช้ ${username} (Role: ${role})`);
        return res.json({ success: true });
    }
    catch (err) {
        return res.status(500).json({ error: 'Failed to update user.' });
    }
});
app.delete('/api/admin/users/:username', async (req, res) => {
    const { username } = req.params;
    try {
        await database_1.db.deleteUser(username);
        await database_1.db.addLog(`[ADMIN]: ลบผู้ใช้ ${username} ออกจากระบบ`);
        return res.json({ success: true });
    }
    catch (err) {
        return res.status(500).json({ error: 'Failed to delete user.' });
    }
});
// Force reseed products (Admin only)
app.post('/api/admin/force-reseed', async (req, res) => {
    try {
        await database_1.db.forceReseedProducts();
        return res.json({ success: true, message: 'Products reseeded with LUMINOX & SEIKO collections!' });
    }
    catch (err) {
        console.error('Force reseed error:', err);
        return res.status(500).json({ error: 'Failed to reseed products.' });
    }
});
// -------------------------------------------------------------
// Reviews Endpoints
// -------------------------------------------------------------
app.get('/api/reviews/:productId', async (req, res) => {
    try {
        const reviews = await database_1.db.getReviews(req.params.productId);
        return res.json(reviews);
    }
    catch (err) {
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
        await database_1.db.addReview({ productId, username, rating: Number(rating), comment, date });
        await database_1.db.addLog(`[REVIEW]: ผู้ใช้ ${username} ได้เขียนรีวิวให้สินค้า ID ${productId} ด้วยคะแนน ${rating} ดาว`);
        return res.json({ success: true });
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Failed to add review.' });
    }
});
// Custom routes to serve docs kept in the root folder
app.get('/analysis_design.md', (req, res) => {
    res.sendFile(path_1.default.join(__dirname, '..', '..', 'analysis_design.md'));
});
app.get('/README.md', (req, res) => {
    res.sendFile(path_1.default.join(__dirname, '..', '..', 'README.md'));
});
// Serve frontend static files
app.use(express_1.default.static(path_1.default.join(__dirname, '..', '..', 'frontend')));
// Fallback to client routing
app.get('*', (req, res) => {
    res.sendFile(path_1.default.join(__dirname, '..', '..', 'frontend', 'index.html'));
});
// Initialize database tables, then start listening
database_1.db.initDb().then(() => {
    app.listen(PORT, () => {
        console.log(`WatchMart backend server running on port ${PORT}`);
    });
}).catch(err => {
    console.error("Failed to initialize database:", err);
});
