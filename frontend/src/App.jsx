import React, { createContext, useContext, useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Storefront from './pages/Storefront';
import Profile from './pages/Profile';
import Seller from './pages/Seller';
import Admin from './pages/Admin';
import Manager from './pages/Manager';
import MarkdownViewer from './pages/Markdown';
import ProductDetail from './pages/ProductDetail';
import Checkout from './pages/Checkout';
import MyOrders from './pages/MyOrders';
import { CartProvider } from './CartContext';
import { WishlistProvider } from './WishlistContext';
import CartDrawer from './components/CartDrawer';
import WishlistDrawer from './components/WishlistDrawer';
import { api } from './api';

// ─── Theme Context ───────────────────────────────────────────────────────────
export const ThemeContext = createContext(null);

export function useTheme() {
  return useContext(ThemeContext);
}

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(() => {
    const stored = localStorage.getItem('watchmart_theme');
    if (stored) return stored;
    return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setThemeState(newTheme);
    localStorage.setItem('watchmart_theme', newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

// ─── Language Context ────────────────────────────────────────────────────────
export const LanguageContext = createContext(null);

export function useLanguage() {
  return useContext(LanguageContext);
}

const translations = {
  th: {
    home: "หน้าแรก",
    admin: "แอดมิน",
    docs: "เอกสาร",
    manager: "จัดการระบบ",
    staff: "พนักงาน",
    newArrivals: "สินค้าใหม่",
    recommended: "สินค้าแนะนำ",
    promotions: "โปรโมชั่น",
    notifications: "การแจ้งเตือน",
    help: "ช่วยเหลือ",
    lang: "ไทย",
    searchPlaceholder: "ค้นหานาฬิกาหรูสไตล์คุณ...",
    callCenter: "📞 ศูนย์บริการลูกค้า: 02-123-4567",
    project: "✨ โครงงาน CSI204 ระดับพรีเมียม",
    myProfile: "👤 โปรไฟล์ของฉัน",
    signOut: "🚪 ออกจากระบบ",
    all: "ทั้งหมด",
    cart: "ตะกร้าสินค้า",
    wishlist: "รายการโปรด",
    checkout: "ดำเนินการชำระเงิน 💳",
    role: "บทบาท",
    welcome: "ยินดีต้อนรับ",
    cancel: "ยกเลิก",
    productsTitle: "สินค้าทั้งหมด",
    myOrders: "ประวัติใบสั่งซื้อของฉัน",
    noOrders: "ไม่มีรายการคำสั่งซื้อในขณะนี้",
    stock: "สต็อก",
    outOfStock: "หมดสต็อก",
    addToCart: "ใส่ตะกร้าสินค้า 🛒",
    tempOutOfStock: "สินค้าหมดชั่วคราว",
    price: "ราคา",
    noSystemLogs: "ไม่มี log ในระบบ",
    itemsCount: "({count} รายการ)",
    noWishlistItems: "ไม่มีรายการโปรดในขณะนี้",
    outOfStockShort: "หมด",
    addToCartShort: "ใส่ตะกร้า",
    remove: "ลบ",
    selectedCount: "({selected}/{total} เลือก)",
    emptyCart: "ตะกร้าสินค้าว่างเปล่า",
    selectedTotal: "ยอดรวมที่เลือก",
    adminConfirmNotif: "ออเดอร์ {id} ผ่านการตรวจสลิปแล้ว รอคุณยืนยันขั้นสุดท้าย",
    managerReviewNotif: "มีออเดอร์ใหม่ {id} รอตรวจสอบสลิปชำระเงิน",
    userManagerApproveNotif: "ออเดอร์ {id} ผ่านการตรวจสอบสลิปจาก Manager แล้ว (รอ Admin ยืนยัน)",
    userConfirmNotif: "ออเดอร์ {id} ได้รับการยืนยันการชำระเงินจาก Admin แล้ว (เตรียมจัดส่ง)",
    userShippedNotif: "ออเดอร์ {id} จัดส่งสินค้าเรียบร้อยแล้ว!",
    userCancelNotif: "ออเดอร์ {id} ปฏิเสธสลิปการชำระเงิน โปรดส่งสลิปใหม่",
    logoutLog: "[AUTH]: ผู้ใช้ {username} ออกจากระบบ",
    roleAdminDesc: "สิทธิ์การเข้าถึง: Admin (ผู้ดูแลระบบสูงสุด สามารถจัดการผู้ใช้งาน จัดการฐานข้อมูล และเข้าถึงหน้ารายงานสรุปโครงงานได้)",
    roleManagerDesc: "สิทธิ์การเข้าถึง: Manager (ผู้จัดการ สามารถเพิ่ม ลบ แก้ไขนาฬิกาในระบบ รวมถึงดูรายงานยอดขายได้)",
    roleUserDesc: "สิทธิ์การเข้าถึง: User (ลูกค้า/ผู้ซื้อทั่วไป สามารถเลือกซื้อนาฬิกา ใส่ตะกร้า และบันทึกคำสั่งซื้อได้)",
    switchRole: "สลับบทบาทผู้ใช้",
    language: "ภาษา",
    langTh: "ไทย (TH)",
    langEn: "English (EN)",
    themeTitle: "ธีม",
    themeDark: "มืด",
    themeLight: "สว่าง",
    welcomeSys: "ยินดีต้อนรับสู่ WatchMart! ระบบออนไลน์สมบูรณ์แบบ",
    dbConnectedSys: "ฐานข้อมูล PostgreSQL (Neon) เชื่อมต่อใช้งานสำเร็จ",
    loginRegister: "เข้าสู่ระบบ / สมัครสมาชิก",
    newItemsCount: "{count} รายการใหม่",
    noNewNotifications: "ไม่มีการแจ้งเตือนใหม่ในขณะนี้",
    helpFaq: "ความช่วยเหลือและคำถามที่พบบ่อย",
    howToSearch: "ค้นหาสินค้าอย่างไร?",
    searchHelp: "คุณสามารถพิมพ์ชื่อนาฬิกาหรือแบรนด์ในแถบค้นหาเพื่อทำการกรอง หรือคลิกที่แบรนด์ฮิตด้านล่างของแถบค้นหาเพื่อกรองทันที",
    testingPayment: "การทดสอบจ่ายเงินชำระเงิน",
    paymentHelp: "เมื่อเลือกสินค้าลงตะกร้าแล้ว สามารถเข้าสู่หน้าชำระเงิน โดยระบบจะทำการอัปเดตสต็อกสินค้าหักออกจากระบบทันทีหลังจากสั่งซื้อสำเร็จ",
    testingRoles: "การเปลี่ยนบทบาทเพื่อทดสอบสิทธิ์",
    rolesHelp: "ล็อกเอ้าท์ออกจากระบบ แล้วเลือก Sign In ด้วยบัญชีที่มีบทบาทแตกต่างกัน (Admin, Manager, User) เพื่อทดสอบขอบเขตการเข้าถึง",
    accountRolePrivileges: "ข้อมูลสิทธิ์บัญชีผู้ใช้",
    okButton: "รับทราบ",
    viewProductDetails: "ดูข้อมูลสินค้าข้อมือ",
    recommendedDesc: "นาฬิกาหรูคัดสรรระดับพรีเมียมที่เป็นที่นิยมที่สุด",
    stockLeft: "สต็อก: {count} เรือน",
    addToCartNoEmoji: "ใส่ตะกร้าสินค้า",
    newArrivalsDesc: "นาฬิกาดีไซน์ใหม่ล่าสุดที่อัปเดตลงระบบ",
    promotionsDesc: "โปรโมชั่นลดสูงสุดถึง 15% วันนี้เท่านั้น",
    searchResultsFor: "ผลการค้นหาสำหรับ \"{search}\"",
    noProductsFound: "ไม่พบสินค้าตรงตามเงื่อนไข",
    zeroReviews: "0 รีวิว",
    heroDesc1: "ดีไซน์สปอร์ตหรูหราสะท้อนประวัติศาสตร์ความเร็ว คอนเซปต์ระดับเวิลด์คลาสในหน้าปัดกลไกโครโนกราฟคาลิเบอร์สุดหรู",
    heroDesc2: "รุ่นลิมิเต็ดเอดิชันฉลองครบรอบ 60 ปี รังสรรค์ความแข็งแกร่งด้วยกลไกจักรกลและวัสดุสแตนเลสสตีลชั้นเลิศ",
    heroDesc3: "นาฬิกายอดมนุษย์ผู้รอดชีวิต ดำน้ำลึก 200 เมตร พร้อมเทคโนโลยีหลอดแก๊สเรืองแสงทริเทียมสว่างไร้ขีดจำกัดนาน 25 ปี",
    sellerVerifySuccess: "ยืนยันตัวตนสำเร็จ!",
    sellerBlacklisted: "ข้อมูลอยู่ในบัญชีดำ!",
    serverError: "เซิร์ฟเวอร์ขัดข้อง",
    proposeSuccess: "ส่งเสนอขายนาฬิกาสำเร็จ!",
    proposeFailed: "ส่งข้อมูลไม่สำเร็จ",
    sellerPortalTitle: "🛍️ Seller Portal",
    sellerPortalSubtitle: "พอร์ทัลสำหรับผู้เสนอขายนาฬิกาหรูเข้าสู่ WatchMart",
    verifySellerTitle: "ยืนยันตัวตนผู้ขาย",
    blacklistWarning: "⚠️ ตรวจพบประวัติแบล็คลิสต์! ไม่สามารถเข้าสู่ระบบผู้ขายได้",
    fullName: "ชื่อ-นามสกุล",
    fullNamePlaceholder: "ชื่อเต็ม",
    email: "อีเมล",
    nationalId: "เลขบัตรประชาชน",
    verifySubmit: "ยืนยันตัวตนและสมัครเป็นผู้ขาย",
    totalProposedLabel: "เสนอขายทั้งหมด",
    pendingLabel: "รอดำเนินการ",
    importedLabel: "นำเข้าแล้ว",
    proposeWatchTitle: "➕ เสนอขายนาฬิกา",
    watchBrand: "แบรนด์นาฬิกา",
    watchModel: "รุ่น / Model",
    proposePrice: "ราคาเสนอขาย (บาท)",
    priceBanding: "กลุ่มราคา (Banding)",
    bandingClassic: "Classic (ต่ำกว่า 25,000)",
    bandingSport: "Sport (25,000 - 100,000)",
    bandingElegant: "Elegant (100,000+)",
    dialColor: "สีหน้าปัด",
    watchCondition: "รายละเอียด / Condition",
    watchConditionPlaceholder: "อธิบายสภาพนาฬิกา...",
    submitProposalBtn: "ส่งข้อเสนอขายนาฬิกา 📨",
    myProposalsTitle: "📋 รายการเสนอขายของฉัน",
    watchCol: "นาฬิกา",
    conditionCol: "สภาพ",
    statusCol: "สถานะ",
    noProposals: "ยังไม่มีการเสนอขาย",
    statusPendingCheck: "รอตรวจ",
    statusPassed: "ผ่านเกณฑ์",
    statusFailed: "ตกเกณฑ์",
    statusPendingImport: "รอนำเข้า",
    priceCol: "ราคา",
    profileSaveSuccess: "บันทึกข้อมูลโปรไฟล์สำเร็จ!",
    profileSaveFail: "บันทึกข้อมูลไม่สำเร็จ",
    imageUploadOnly: "กรุณาอัปโหลดไฟล์รูปภาพเท่านั้น",
    fileSizeLimit: "ขนาดไฟล์ต้องไม่เกิน 2MB",
    avatarUploadSuccess: "อัปโหลดรูปโปรไฟล์สำเร็จ!",
    avatarUploadFail: "อัปโหลดไม่สำเร็จ",
    serverConnError: "เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์",
    avatarDeleteSuccess: "ลบรูปโปรไฟล์สำเร็จ!",
    avatarDeleteFail: "ลบรูปโปรไฟล์ไม่สำเร็จ",
    myProfileTitle: "โปรไฟล์ของฉัน",
    profileSubtitle: "จัดการข้อมูลส่วนตัวและที่อยู่จัดส่ง",
    personalInfo: "ข้อมูลส่วนตัว",
    firstName: "ชื่อจริง",
    lastName: "นามสกุล",
    phoneNumber: "เบอร์โทรศัพท์",
    phonePlaceholder: "08X-XXX-XXXX",
    shippingAddress: "ที่อยู่จัดส่ง",
    addressPlaceholder: "บ้านเลขที่ ถนน แขวง/ตำบล เขต/อำเภอ จังหวัด รหัสไปรษณีย์",
    saveDataBtn: "บันทึกข้อมูล",
    accountInfo: "ข้อมูลบัญชี",
    clickToChangeAvatar: "คลิกเพื่อเปลี่ยนรูปโปรไฟล์",
    deleteAvatarBtn: "ลบรูปโปรไฟล์",
    cancelOrderConfirm: "ยกเลิกออเดอร์ \"{id}\" ใช่หรือไม่?",
    cancelSuccess: "ยกเลิกสำเร็จ",
    cancelFail: "ยกเลิกไม่สำเร็จ",
    paymentExpired: "หมดเวลาชำระเงิน",
    paymentRemaining: "ชำระเงินภายใน {hours} ชม. {minutes} นาที",
    slipUploadSuccess: "อัปโหลดสลิปสำเร็จ! รอผู้จัดการตรวจสอบ 🎉",
    slipUploadFail: "ไม่สามารถอัปโหลดสลิปได้",
    serverErrorGeneric: "เกิดข้อผิดพลาดกับเซิร์ฟเวอร์",
    homeBreadcrumb: "🏠 หน้าหลัก",
    myOrdersSubtitle: "คุณสามารถแนบหลักฐานชำระเงินและตรวจสอบสถานะพัสดุสินค้าที่สั่งซื้อทั้งหมดได้ที่นี่",
    noOrdersHistory: "ไม่มีรายการคำสั่งซื้อในประวัติของคุณขณะนี้",
    statusPendingPayment: "รอชำระเงิน",
    statusPendingReview: "รอตรวจสลิป",
    statusConfirmed: "ยืนยันแล้ว",
    statusPaid: "ชำระเงินแล้ว",
    statusShipped: "จัดส่งแล้ว",
    statusCancelled: "ยกเลิก",
    itemsListLabel: "รายการสินค้า:",
    itemPriceQty: "฿ {price} x {qty} เรือน",
    totalPriceLabel: "ราคารวมทั้งหมด:",
    paymentMethod: "วิธีชำระเงิน",
    pleaseTransfer: "กรุณาโอนเงินและแนบหลักฐานสลิป",
    slipUploadTip: "* แนะนำให้โอนผ่านบัญชีของร้าน และนำภาพสลิปที่ชัดเจนมาแนบตรงนี้",
    orderExpired: "❌ ออเดอร์นี้หมดเวลาชำระเงินแล้ว (เกิน 24 ชม.)",
    cancelOrderBtn: "ยกเลิกออเดอร์",
    addedToCartToast: "เพิ่ม \"{name}\" × {qty} เข้าตะกร้าแล้ว!",
    outOfStockToast: "สินค้าในคลังหมดแล้ว!",
    loginToReviewToast: "โปรดเข้าสู่ระบบเพื่อเขียนรีวิว",
    enterReviewToast: "โปรดกรอกข้อคิดเห็นรีวิว",
    reviewSubmitSuccess: "ส่งรีวิวสำเร็จ! 🎉",
    reviewSubmitFail: "ไม่สามารถส่งรีวิวได้",
    loadingProduct: "กำลังโหลดข้อมูลสินค้า...",
    viewFrontImage: "🔍 ดูภาพหน้าปัด",
    viewBackImage: "🔍 ดูภาพฝาหลัง",
    reviewsCount: "({count} รีวิวจากผู้ใช้)",
    inStockCount: "มีสินค้า {count} เรือน",
    outOfStockText: "สินค้าหมดชั่วคราว",
    priceVatFreeShipping: "ราคารวม VAT 7% · จัดส่งฟรี",
    guaranteeAuthentic: "🛡️ รับประกันของแท้ 100%",
    guaranteeReturn: "🔄 คืนสินค้าภายใน 15 วัน",
    guaranteeShipping: "🚚 จัดส่งถึงมือ 1–3 วัน",
    quantityLabel: "จำนวน",
    stockAvailable: "สต็อกมี {count} เรือน",
    addedBtn: "เพิ่มแล้ว!",
    addToCartBtn: "เพิ่มในตะกร้า",
    buyNowBtn: "ซื้อเลย",
    categoryLabelText: "หมวด:",
    productDetailTitle: "รายละเอียดสินค้า",
    productDescText: "{brand} {name} เป็นนาฬิกาหรูระดับ {level} ในกลุ่ม {cat} จาก WatchMart Premium Collection",
    levelHigh: "สูงสุด",
    levelMedium: "กลางถึงสูง",
    levelEntry: "เริ่มต้น",
    brandLabel: "แบรนด์",
    modelLabel: "รุ่น",
    categoryLabelSpec: "หมวดหมู่",
    stockLabel: "สต็อก",
    stockCount: "{count} เรือน",
    reviewsTitle: "💬 รีวิวสินค้า ({count})",
    writeReviewTitle: "✍️ เขียนรีวิวของคุณ",
    rateProductLabel: "ให้คะแนนสินค้า",
    commentLabel: "ความคิดเห็น",
    commentPlaceholder: "บอกเล่าความรู้สึกและประสบการณ์เกี่ยวกับนาฬิกาเรือนนี้...",
    submitReviewBtn: "ส่งรีวิว",
    please: "โปรด",
    loginLink: "เข้าสู่ระบบ",
    toWriteReview: "เพื่อร่วมเขียนรีวิวสินค้า",
    allCustomerReviews: "รีวิวทั้งหมดจากลูกค้า",
    noReviewsYet: "ยังไม่มีใครรีวิวสินค้านี้ มาร่วมเป็นคนแรกที่รีวิวกัน!",
    docNotFound: "ไม่พบเอกสาร",
    docLoadFail: "ไม่สามารถโหลดเอกสารได้",
    systemDocsTitle: "📖 System Documents",
    analysisDesignDocBtn: "📐 Analysis & Design",
    readmeDocBtn: "📋 README",
    updateSuccess: "อัปเดตสำเร็จ!",
    addProductSuccess: "เพิ่มสินค้าสำเร็จ!",
    saveFailed: "บันทึกไม่สำเร็จ",
    deleteConfirm: "ลบ \"{name}\"?",
    deleteSuccess: "ลบสำเร็จ",
    deleteFailed: "ลบไม่สำเร็จ",
    shipSuccess: "จัดส่งพัสดุสำเร็จ!",
    updateStatusFail: "อัปเดตสถานะล้มเหลว",
    approveSlipSuccess: "อนุมัติสลิปสำเร็จ — รอ Admin ยืนยัน",
    approveSlipFail: "ไม่สามารถอนุมัติได้",
    rejectReasonRequired: "กรุณาระบุเหตุผลการปฏิเสธ",
    rejectSlipSuccess: "ปฏิเสธสลิปแล้ว — ออเดอร์ถูกยกเลิก",
    rejectSlipFail: "ไม่สามารถปฏิเสธได้",
    auditSellerOrigin: "ผู้เสนอขาย: {name} ({email}) เมื่อ {date}",
    auditInspectorApproved: "ผู้ตรวจสภาพ: เจ้าหน้าที่ฝ่ายประเมิน (APPROVED)",
    auditImporterAdmin: "ผู้นำเข้า: Admin บันทึกเข้าคลังแล้ว",
    auditInitialOrigin: "ผู้เสนอขาย: สินค้าระบบดั้งเดิม (Initial Inventory)",
    auditInitialInspector: "ผู้ตรวจสภาพ: เจ้าหน้าที่ตรวจระบบคลัง",
    auditInitialImporter: "ผู้นำเข้า: Manager CRUD",
    mgrDashboardTitle: "Manager Dashboard",
    mgrDashboardSubtitle: "บริหารสินค้าคงคลัง วิเคราะห์ยอดขาย และตรวจสอบราคา",
    totalSalesLabel: "ยอดขายรวม",
    totalOrdersLabel: "คำสั่งซื้อทั้งหมด",
    orderCount: "{count} รายการ",
    inventoryProductsLabel: "สินค้าในคลัง",
    productModelCount: "{count} รุ่น",
    salesByBrandTitle: "ยอดขายแยกตามแบรนด์",
    salesTrend7DaysTitle: "แนวโน้มยอดขาย 7 วันล่าสุด",
    mgrInventorySystemTitle: "ระบบจัดการคลังสำหรับผู้จัดการ",
    mgrInventorySystemDesc: "กรุณากดปุ่ม \"แก้ไขสต็อก\" ท้ายรายชื่อสินค้าในตารางด้านขวา เพื่อปรับปรุงจำนวนสต็อกสินค้าคงเหลือ",
    editProductTitle: "แก้ไข: {name}",
    addNewProductTitle: "เพิ่มสินค้าใหม่",
    mgrPermissionWarning: "สิทธิ์ผู้จัดการ: แก้ไขได้เฉพาะสต็อกสินค้าเท่านั้น ช่องอื่นสามารถแก้ไขได้โดยแอดมิน",
    productNameLabel: "ชื่อสินค้า",
    priceThbLabel: "ราคา (บาท)",
    stockQtyLabel: "สต็อก (เรือน)",
    frontImageLabel: "รูปภาพหน้าปัด (เช่น /images/LUMINOX/name.webp)",
    backImageLabel: "รูปภาพฝาหลัง (เช่น /images/LUMINOX/name_back.webp)",
    updateDataBtn: "อัปเดตข้อมูล",
    saveStockBtn: "บันทึกสต็อกสินค้า",
    saveProductInfoBtn: "บันทึกข้อมูลสินค้า",
    cancelBtn: "ยกเลิก",
    inventoryTitle: "สินค้าคงคลัง",
    productCol: "สินค้า",
    stockCol: "สต็อก",
    manageCol: "จัดการ",
    noProductsInInventory: "ไม่มีสินค้าในคลัง",
    lowStockWarning: "ใกล้หมด",
    editBtn: "แก้ไข",
    editStockBtn: "แก้ไขสต็อก",
    deleteBtn: "ลบ",
    ordersAndShippingTitle: "รายการใบสั่งซื้อและการจัดส่ง",
    productAddressCol: "สินค้า / ที่อยู่",
    totalAmountCol: "ยอดรวม",
    channelCol: "ช่องทาง",
    actionCol: "ดำเนินการ",
    noOrdersList: "ไม่มีรายการใบสั่งซื้อ",
    buyerAddressLabel: "ผู้ซื้อ: {email} | ที่อยู่: {address}",
    statusManagerApproved: "รอ Admin ยืนยัน",
    statusConfirmedReadyToShip: "เตรียมส่ง (ยืนยันแล้ว)",
    statusPaidReadyToShip: "เตรียมส่ง",
    viewSlipBtn: "ดูสลิป",
    customerPendingTransfer: "ลูกค้ายกยอดรอโอนเงิน (ภายใน 24 ชม.)",
    approveSlipBtn: "อนุมัติสลิป",
    rejectSlipBtn: "ปฏิเสธ",
    rejectReasonPlaceholder: "เหตุผลปฏิเสธ...",
    waitAdminFinalConfirm: "รอ Admin ยืนยันขั้นสุดท้าย...",
    shipBtn: "จัดส่ง",
    deliveredStatusLabel: "นำจ่ายแล้ว",
    cancelledStatusLabel: "ยกเลิกแล้ว",
    checkoutConfirmTitle: "💳 ชำระเงินและยืนยันคำสั่งซื้อ",
    contactInfoTitle: "📋 ข้อมูลติดต่อ",
    contactEmailLabel: "อีเมลติดต่อ *",
    shippingAddressLabel: "ที่อยู่จัดส่ง *",
    addressPlaceholderCheckout: "บ้านเลขที่, ถนน, แขวง, เขต, จังหวัด, รหัสไปรษณีย์",
    paymentMethodTitle: "วิธีชำระเงิน",
    paymentPromptPay: "PromptPay QR Code",
    paymentPromptPayDesc: "สแกน QR แล้วแนบสลิป",
    paymentBank: "โอนเงินผ่านธนาคาร",
    paymentBankDesc: "โอนแล้วแนบสลิปยืนยัน",
    paymentCOD: "ชำระเงินปลายทาง (COD)",
    paymentCODDesc: "ชำระเงินเมื่อรับสินค้า",
    generatingQR: "กำลังสร้าง QR Code...",
    loadQRFail: "❌ ไม่สามารถโหลด QR Code ได้",
    scanQRInstruction: "สแกน QR Code ด้านบนเพื่อชำระเงินและแนบสลิปด้านล่าง",
    qrMockWarning: "⚠️ นี่คือระบบจำลองสำหรับโครงงาน CSI204 เท่านั้น ห้ามสแกนเพื่อโอนเงินจริง",
    attachSlipOptional: "แนบสลิปการโอนเงิน (ไม่บังคับ — แนบภายหลังได้จากประวัติสั่งซื้อภายใน 24 ชม.)",
    attachSlipRequired: "แนบสลิปการโอนเงิน",
    processingLabel: "กำลังดำเนินการ...",
    confirmOrderBtn: "ยืนยันการสั่งซื้อ",
    orderSummaryTitle: "สรุปคำสั่งซื้อ",
    productPriceTotalLabel: "ราคาสินค้า",
    shippingFeeLabel: "ค่าจัดส่ง",
    freeLabel: "ฟรี",
    grandTotalLabel: "ยอดรวม",
    checkoutFailedToast: "การสั่งซื้อล้มเหลว",
    orderSuccessTitle1: "สั่งซื้อสำเร็จ! 🎉",
    orderSuccessDesc1: "ระบบได้รับคำสั่งซื้อของท่านเรียบร้อยแล้ว<br />ขอบพระคุณที่ไว้วางใจเลือกซื้อสินค้ากับ WatchMart",
    orderSuccessTitle2: "ส่งหลักฐานสำเร็จ! ⏳",
    orderSuccessDesc2: "ระบบได้รับหลักฐานการชำระเงินของท่านแล้ว<br />กำลังอยู่ระหว่างการตรวจสอบความถูกต้องโดย Manager & Admin",
    orderSuccessTitle3: "สั่งซื้อสำเร็จ! 💸",
    orderSuccessDesc3: "กรุณาชำระเงินและแนบสลิปการโอนเงิน**ภายใน 24 ชั่วโมง**<br />โดยท่านสามารถแนบสลิปได้ที่หน้า <strong>\"ประวัติใบสั่งซื้อของฉัน\"</strong>",
    orderSuccessTitle4: "สั่งซื้อสำเร็จ! 📦",
    orderSuccessDesc4: "เรากำลังเตรียมจัดส่งสินค้าของท่าน<br />กรุณาชำระเงินสดปลายทางเมื่อพัสดุจัดส่งถึงมือท่าน",
    orderIdLabel: "หมายเลขออเดอร์ของคุณ",
    backToStoreBtn: "กลับไปที่ร้านค้า 🏠",
    adminDashboardTitle: "Admin Dashboard",
    adminDashboardSubtitle: "แผงควบคุมระบบคลังสินค้า จัดการธุรกรรม บัญชีผู้ใช้ และประเมินระบบงานรวม",
    tabSales: "วิเคราะห์ยอดขาย",
    tabInventory: "จัดการสินค้า",
    tabOrders: "ใบสั่งซื้อและการจัดส่ง",
    tabUsers: "สิทธิ์ผู้ใช้และระบบ",
    deleteProductSuccessToast: "ลบสินค้าสำเร็จ!",
    deleteProductFailToast: "ไม่สามารถลบสินค้าได้",
    confirmDeleteProduct: "คุณแน่ใจหรือไม่ที่จะลบสินค้านี้ออกจากระบบ?",
    updateWatchSuccessToast: "อัปเดตข้อมูลนาฬิกาสำเร็จ!",
    addWatchSuccessToast: "บันทึกนาฬิกาใหม่สำเร็จ!",
    updateUserSuccessToast: "อัปเดตผู้ใช้ \"{username}\" สำเร็จ!",
    updateUserFailToast: "ไม่สามารถอัปเดตข้อมูลผู้ใช้ได้",
    deleteSelfFailToast: "ไม่สามารถลบบัญชีของคุณเองได้!",
    confirmDeleteUser: "คุณแน่ใจหรือไม่ว่าต้องการลบผู้ใช้ \"{username}\"?",
    deleteUserSuccessToast: "ลบผู้ใช้ \"{username}\" เรียบร้อยแล้ว",
    deleteUserFailToast: "ไม่สามารถลบผู้ใช้ได้",
    inspectResultToast: "ตรวจสภาพ: {result}",
    inspectPass: "ผ่านเกณฑ์",
    inspectFail: "ไม่ผ่านเกณฑ์",
    inspectFailToast: "ตรวจสภาพล้มเหลว",
    importSuccessToast: "นำเข้าคลังสำเร็จ!",
    importFailToast: "นำเข้าล้มเหลว",
    confirmOrderSuccessToast: "ยืนยันความถูกต้องและชำระเงินเรียบร้อยแล้ว!",
    confirmOrderFailToast: "การยืนยันล้มเหลว",
    inspectQueueTitle: "คิวประเมินสภาพนาฬิกา (ข้อเสนอขายจากลูกค้า)",
    sellerCol: "ผู้เสนอขาย",
    brandModelCol: "แบรนด์/รุ่น",
    desiredPriceCol: "ราคาที่ต้องการ",
    evalConditionCol: "สภาพประเมิน",
    inspectActionCol: "ตรวจสภาพ",
    importActionCol: "นำเข้าคลัง",
    passBtn: "ผ่าน",
    failBtn: "ตกเกณฑ์",
    waitingProcessText: "รอกระบวนการ",
    systemUsersTitle: "บัญชีผู้ใช้ในระบบ",
    usernameCol: "ชื่อผู้ใช้งาน",
    roleCol: "ระดับสิทธิ์",
    youBadge: "คุณ",
    editUserPrivilegeTitle: "แก้ไขสิทธิ์: {username}",
    selectUserToEditTitle: "เลือกบัญชีผู้ใช้เพื่อแก้ไข",
    accessPrivilegeLabel: "สิทธิ์การเข้าถึงระบบ",
    roleUserOption: "USER (ลูกค้า / ผู้ซื้อ)",
    roleManagerOption: "MANAGER (ผู้จัดการ)",
    roleAdminOption: "ADMIN (ผู้ดูแลระบบสูงสุด)",
    changePasswordLabel: "เปลี่ยนรหัสผ่านใหม่ (หากไม่เปลี่ยนให้เว้นว่าง)",
    newPasswordPlaceholder: "กรอกรหัสผ่านใหม่",
    editUserInstruction: "กดปุ่มแก้ไขท้ายชื่อบัญชีผู้ใช้งานที่ต้องการปรับบทบาทสิทธิ์การเข้าถึงระบบ หรือรีเซ็ตรหัสผ่านใหม่",
    statusPendingReviewAdmin: "รอ Manager ตรวจ",
    statusManagerApprovedAdmin: "ผ่าน Manager แล้ว",
    waitingManagerReviewText: "รอการตรวจสอบจาก Manager",
    finalConfirmBtn: "ยืนยันขั้นสุดท้าย",
    paymentConfirmedText: "ยืนยันชำระเงินแล้ว"
  },
  en: {
    home: "Home",
    admin: "Admin",
    docs: "Docs",
    manager: "Management",
    staff: "Staff",
    newArrivals: "New Arrivals",
    recommended: "Recommended",
    promotions: "Promotions",
    notifications: "Notifications",
    help: "Help",
    lang: "English",
    searchPlaceholder: "Search your luxury watch...",
    callCenter: "📞 Call Center: 02-123-4567",
    project: "✨ Premium CSI204 Project",
    myProfile: "👤 My Profile",
    signOut: "🚪 Sign Out",
    all: "All",
    cart: "Shopping Cart",
    wishlist: "Wishlist",
    checkout: "Proceed to Checkout 💳",
    role: "Role",
    welcome: "Welcome",
    cancel: "Cancel",
    productsTitle: "All Products",
    myOrders: "My Order History",
    noOrders: "No orders found.",
    stock: "Stock",
    outOfStock: "Out of Stock",
    addToCart: "Add to Cart 🛒",
    tempOutOfStock: "Temporarily Out of Stock",
    price: "Price",
    brand: "Brand",
    noSystemLogs: "No system logs.",
    itemsCount: "({count} items)",
    noWishlistItems: "No wishlist items.",
    outOfStockShort: "Out",
    addToCartShort: "Add to Cart",
    remove: "Remove",
    selectedCount: "({selected}/{total} selected)",
    emptyCart: "Your cart is empty.",
    selectedTotal: "Selected Total",
    adminConfirmNotif: "Order {id} slip checked. Awaiting your final confirmation.",
    managerReviewNotif: "New order {id} awaiting slip review.",
    userManagerApproveNotif: "Order {id} slip approved by Manager (Awaiting Admin confirmation).",
    userConfirmNotif: "Order {id} payment confirmed by Admin (Preparing to ship).",
    userShippedNotif: "Order {id} has been shipped!",
    userCancelNotif: "Order {id} slip rejected. Please submit a new slip.",
    logoutLog: "[AUTH]: User {username} logged out.",
    roleAdminDesc: "Access level: Admin (Superuser, can manage users, database, and view project reports).",
    roleManagerDesc: "Access level: Manager (Can add, edit, delete watches, and view sales reports).",
    roleUserDesc: "Access level: User (General customer, can browse, add to cart, and checkout).",
    switchRole: "Switch Role",
    language: "Language",
    langTh: "Thai (TH)",
    langEn: "English (EN)",
    themeTitle: "Theme",
    themeDark: "Dark",
    themeLight: "Light",
    welcomeSys: "Welcome to WatchMart! Fully functional system.",
    dbConnectedSys: "PostgreSQL DB (Neon) connected successfully.",
    loginRegister: "Login / Register",
    newItemsCount: "{count} new",
    noNewNotifications: "No new notifications.",
    helpFaq: "Help & FAQ",
    howToSearch: "How to search?",
    searchHelp: "Type watch names or brands in the search box to filter, or click hot keywords below it.",
    testingPayment: "Testing Payment",
    paymentHelp: "Add items to cart and go to checkout. The system will automatically deduct product stock upon successful checkout simulation.",
    testingRoles: "Testing Roles",
    rolesHelp: "Logout and sign in using accounts with different roles (Admin, Manager, User) to test system permission limits.",
    accountRolePrivileges: "Account Role Privileges",
    okButton: "OK",
    viewProductDetails: "View Product Details",
    recommendedDesc: "Premium selected luxury watches that are most popular.",
    stockLeft: "Stock: {count} left",
    addToCartNoEmoji: "Add to Cart",
    newArrivalsDesc: "Latest newly designed watches updated in the system.",
    promotionsDesc: "Promotions up to 15% discount, today only.",
    searchResultsFor: "Search results for \"{search}\"",
    noProductsFound: "No products match the criteria.",
    zeroReviews: "0 reviews",
    heroDesc1: "Luxurious sporty design reflecting racing history, world-class concept in a premium chronograph dial.",
    heroDesc2: "60th Anniversary Limited Edition, crafted for durability with mechanical movement and premium stainless steel.",
    heroDesc3: "Ultimate survivor watch, 200m water resistant with tritium gas tube technology glowing continuously for 25 years.",
    sellerVerifySuccess: "Identity verification successful!",
    sellerBlacklisted: "Information is blacklisted!",
    serverError: "Server error",
    proposeSuccess: "Watch proposal sent successfully!",
    proposeFailed: "Failed to send data",
    sellerPortalTitle: "🛍️ Seller Portal",
    sellerPortalSubtitle: "Portal for luxury watch sellers to join WatchMart.",
    verifySellerTitle: "Verify Seller Identity",
    blacklistWarning: "⚠️ Blacklist record detected! Cannot log in to seller system.",
    fullName: "Full Name",
    fullNamePlaceholder: "Full Name",
    email: "Email",
    nationalId: "National ID",
    verifySubmit: "Verify Identity and Register as Seller",
    totalProposedLabel: "Total Proposed",
    pendingLabel: "Pending",
    importedLabel: "Imported",
    proposeWatchTitle: "➕ Propose Watch",
    watchBrand: "Watch Brand",
    watchModel: "Model",
    proposePrice: "Proposed Price (THB)",
    priceBanding: "Price Banding",
    bandingClassic: "Classic (Under 25,000)",
    bandingSport: "Sport (25,000 - 100,000)",
    bandingElegant: "Elegant (100,000+)",
    dialColor: "Dial Color",
    watchCondition: "Details / Condition",
    watchConditionPlaceholder: "Describe watch condition...",
    submitProposalBtn: "Submit Watch Proposal 📨",
    myProposalsTitle: "📋 My Proposals",
    watchCol: "Watch",
    conditionCol: "Condition",
    statusCol: "Status",
    noProposals: "No proposals yet.",
    statusPendingCheck: "Pending Check",
    statusPassed: "Passed",
    statusFailed: "Failed",
    statusPendingImport: "Pending Import",
    priceCol: "Price",
    profileSaveSuccess: "Profile saved successfully!",
    profileSaveFail: "Failed to save profile",
    imageUploadOnly: "Please upload image files only",
    fileSizeLimit: "File size must not exceed 2MB",
    avatarUploadSuccess: "Avatar uploaded successfully!",
    avatarUploadFail: "Failed to upload avatar",
    serverConnError: "Server connection error",
    avatarDeleteSuccess: "Avatar deleted successfully!",
    avatarDeleteFail: "Failed to delete avatar",
    myProfileTitle: "My Profile",
    profileSubtitle: "Manage your personal info and shipping address",
    personalInfo: "Personal Information",
    firstName: "First Name",
    lastName: "Last Name",
    phoneNumber: "Phone Number",
    phonePlaceholder: "08X-XXX-XXXX",
    shippingAddress: "Shipping Address",
    addressPlaceholder: "House No., Street, Subdistrict, District, Province, Zipcode",
    saveDataBtn: "Save Data",
    accountInfo: "Account Information",
    clickToChangeAvatar: "Click to change avatar",
    deleteAvatarBtn: "Delete Avatar",
    cancelOrderConfirm: "Cancel order \"{id}\"?",
    cancelSuccess: "Cancellation successful",
    cancelFail: "Failed to cancel",
    paymentExpired: "Payment Time Expired",
    paymentRemaining: "Pay within {hours} hrs {minutes} mins",
    slipUploadSuccess: "Slip uploaded successfully! Waiting for manager review 🎉",
    slipUploadFail: "Could not upload slip",
    serverErrorGeneric: "A server error occurred",
    homeBreadcrumb: "🏠 Home",
    myOrdersSubtitle: "You can attach payment proof and check the status of all your orders here",
    noOrdersHistory: "You have no order history at the moment",
    statusPendingPayment: "Pending Payment",
    statusPendingReview: "Pending Review",
    statusConfirmed: "Confirmed",
    statusPaid: "Paid",
    statusShipped: "Shipped",
    statusCancelled: "Cancelled",
    itemsListLabel: "Items:",
    itemPriceQty: "฿ {price} x {qty} items",
    totalPriceLabel: "Total Price:",
    paymentMethod: "Payment Method",
    pleaseTransfer: "Please transfer money and attach slip",
    slipUploadTip: "* Recommended to transfer to the shop's account and attach a clear slip image here",
    orderExpired: "❌ This order's payment time has expired (> 24 hrs)",
    cancelOrderBtn: "Cancel Order",
    addedToCartToast: "Added \"{name}\" × {qty} to cart!",
    outOfStockToast: "Product is out of stock!",
    loginToReviewToast: "Please login to write a review",
    enterReviewToast: "Please enter your review comment",
    reviewSubmitSuccess: "Review submitted successfully! 🎉",
    reviewSubmitFail: "Failed to submit review",
    loadingProduct: "Loading product data...",
    viewFrontImage: "🔍 View Front",
    viewBackImage: "🔍 View Back",
    reviewsCount: "({count} user reviews)",
    inStockCount: "{count} items in stock",
    outOfStockText: "Temporarily Out of Stock",
    priceVatFreeShipping: "Price includes 7% VAT · Free Shipping",
    guaranteeAuthentic: "🛡️ 100% Authentic Guarantee",
    guaranteeReturn: "🔄 15-Day Return Policy",
    guaranteeShipping: "🚚 Fast Delivery 1–3 Days",
    quantityLabel: "Quantity",
    stockAvailable: "{count} in stock",
    addedBtn: "Added!",
    addToCartBtn: "Add to Cart",
    buyNowBtn: "Buy Now",
    categoryLabelText: "Category:",
    productDetailTitle: "Product Details",
    productDescText: "{brand} {name} is a {level} luxury watch in the {cat} group from the WatchMart Premium Collection",
    levelHigh: "top-tier",
    levelMedium: "mid-to-high",
    levelEntry: "entry-level",
    brandLabel: "Brand",
    modelLabel: "Model",
    categoryLabelSpec: "Category",
    stockLabel: "Stock",
    stockCount: "{count} items",
    reviewsTitle: "💬 Product Reviews ({count})",
    writeReviewTitle: "✍️ Write Your Review",
    rateProductLabel: "Rate Product",
    commentLabel: "Comment",
    commentPlaceholder: "Share your thoughts and experience about this watch...",
    submitReviewBtn: "Submit Review",
    please: "Please",
    loginLink: "login",
    toWriteReview: "to write a review",
    allCustomerReviews: "All Customer Reviews",
    noReviewsYet: "No reviews yet. Be the first to review this product!",
    docNotFound: "Document not found",
    docLoadFail: "Could not load document",
    systemDocsTitle: "📖 System Documents",
    analysisDesignDocBtn: "📐 Analysis & Design",
    readmeDocBtn: "📋 README",
    updateSuccess: "Update successful!",
    addProductSuccess: "Product added successfully!",
    saveFailed: "Save failed",
    deleteConfirm: "Delete \"{name}\"?",
    deleteSuccess: "Delete successful",
    deleteFailed: "Delete failed",
    shipSuccess: "Parcel shipped successfully!",
    updateStatusFail: "Status update failed",
    approveSlipSuccess: "Slip approved — Waiting for Admin confirmation",
    approveSlipFail: "Could not approve",
    rejectReasonRequired: "Please specify a reason for rejection",
    rejectSlipSuccess: "Slip rejected — Order cancelled",
    rejectSlipFail: "Could not reject",
    auditSellerOrigin: "Seller: {name} ({email}) on {date}",
    auditInspectorApproved: "Inspector: Assessment Staff (APPROVED)",
    auditImporterAdmin: "Importer: Admin logged into inventory",
    auditInitialOrigin: "Seller: Initial Inventory System",
    auditInitialInspector: "Inspector: Inventory System Staff",
    auditInitialImporter: "Importer: Manager CRUD",
    mgrDashboardTitle: "Manager Dashboard",
    mgrDashboardSubtitle: "Manage inventory, analyze sales, and monitor prices",
    totalSalesLabel: "Total Sales",
    totalOrdersLabel: "Total Orders",
    orderCount: "{count} orders",
    inventoryProductsLabel: "Inventory Products",
    productModelCount: "{count} models",
    salesByBrandTitle: "Sales by Brand",
    salesTrend7DaysTitle: "7-Day Sales Trend",
    mgrInventorySystemTitle: "Inventory System for Managers",
    mgrInventorySystemDesc: "Please click \"Edit Stock\" next to a product in the right table to update remaining stock.",
    editProductTitle: "Edit: {name}",
    addNewProductTitle: "Add New Product",
    mgrPermissionWarning: "Manager Privilege: Can edit stock only. Other fields must be edited by an Admin.",
    productNameLabel: "Product Name",
    priceThbLabel: "Price (THB)",
    stockQtyLabel: "Stock (Qty)",
    frontImageLabel: "Front Image (e.g., /images/LUMINOX/name.webp)",
    backImageLabel: "Back Image (e.g., /images/LUMINOX/name_back.webp)",
    updateDataBtn: "Update Data",
    saveStockBtn: "Save Stock",
    saveProductInfoBtn: "Save Product Info",
    cancelBtn: "Cancel",
    inventoryTitle: "Inventory",
    productCol: "Product",
    stockCol: "Stock",
    manageCol: "Manage",
    noProductsInInventory: "No products in inventory",
    lowStockWarning: "Low stock",
    editBtn: "Edit",
    editStockBtn: "Edit Stock",
    deleteBtn: "Delete",
    ordersAndShippingTitle: "Orders & Shipping",
    productAddressCol: "Product / Address",
    totalAmountCol: "Total Amount",
    channelCol: "Channel",
    actionCol: "Action",
    noOrdersList: "No orders found",
    buyerAddressLabel: "Buyer: {email} | Address: {address}",
    statusManagerApproved: "Waiting Admin Confirm",
    statusConfirmedReadyToShip: "Ready to ship (Confirmed)",
    statusPaidReadyToShip: "Ready to ship",
    viewSlipBtn: "View Slip",
    customerPendingTransfer: "Customer pending transfer (within 24h)",
    approveSlipBtn: "Approve Slip",
    rejectSlipBtn: "Reject",
    rejectReasonPlaceholder: "Reason for rejection...",
    waitAdminFinalConfirm: "Waiting for Admin final confirmation...",
    shipBtn: "Ship",
    deliveredStatusLabel: "Delivered",
    cancelledStatusLabel: "Cancelled",
    checkoutConfirmTitle: "💳 Checkout and Confirm Order",
    contactInfoTitle: "📋 Contact Info",
    contactEmailLabel: "Contact Email *",
    shippingAddressLabel: "Shipping Address *",
    addressPlaceholderCheckout: "House No, Street, Sub-district, District, Province, Zip",
    paymentMethodTitle: "Payment Method",
    paymentPromptPay: "PromptPay QR Code",
    paymentPromptPayDesc: "Scan QR and attach slip",
    paymentBank: "Bank Transfer",
    paymentBankDesc: "Transfer and attach slip",
    paymentCOD: "Cash on Delivery (COD)",
    paymentCODDesc: "Pay when you receive the product",
    generatingQR: "Generating QR Code...",
    loadQRFail: "❌ Failed to load QR Code",
    scanQRInstruction: "Scan QR Code above to pay and attach slip below",
    qrMockWarning: "⚠️ This is a mock system for CSI204 project only. Do not scan to transfer real money",
    attachSlipOptional: "Attach transfer slip (Optional — can attach later in Order History within 24 hours)",
    attachSlipRequired: "Attach transfer slip",
    processingLabel: "Processing...",
    confirmOrderBtn: "Confirm Order",
    orderSummaryTitle: "Order Summary",
    productPriceTotalLabel: "Product Price",
    shippingFeeLabel: "Shipping Fee",
    freeLabel: "Free",
    grandTotalLabel: "Grand Total",
    checkoutFailedToast: "Checkout Failed",
    orderSuccessTitle1: "Order Successful! 🎉",
    orderSuccessDesc1: "We have received your order successfully.<br />Thank you for trusting and shopping with WatchMart",
    orderSuccessTitle2: "Slip Submitted! ⏳",
    orderSuccessDesc2: "We have received your payment proof.<br />It is currently being verified by Manager & Admin",
    orderSuccessTitle3: "Order Successful! 💸",
    orderSuccessDesc3: "Please transfer money and attach the slip **within 24 hours**<br />You can attach the slip on the <strong>\"My Order History\"</strong> page",
    orderSuccessTitle4: "Order Successful! 📦",
    orderSuccessDesc4: "We are preparing to ship your product.<br />Please pay cash on delivery when the parcel arrives",
    orderIdLabel: "Your Order ID",
    backToStoreBtn: "Back to Store 🏠",
    adminDashboardTitle: "Admin Dashboard",
    adminDashboardSubtitle: "Inventory Control Panel, Manage Transactions, Users, and Overall System Evaluation",
    tabSales: "Sales Analysis",
    tabInventory: "Manage Inventory",
    tabOrders: "Orders & Shipping",
    tabUsers: "User Rights & System",
    deleteProductSuccessToast: "Product deleted successfully!",
    deleteProductFailToast: "Failed to delete product",
    confirmDeleteProduct: "Are you sure you want to delete this product from the system?",
    updateWatchSuccessToast: "Watch info updated successfully!",
    addWatchSuccessToast: "New watch saved successfully!",
    updateUserSuccessToast: "Updated user \"{username}\" successfully!",
    updateUserFailToast: "Failed to update user info",
    deleteSelfFailToast: "You cannot delete your own account!",
    confirmDeleteUser: "Are you sure you want to delete user \"{username}\"?",
    deleteUserSuccessToast: "User \"{username}\" deleted successfully",
    deleteUserFailToast: "Failed to delete user",
    inspectResultToast: "Inspection: {result}",
    inspectPass: "Passed",
    inspectFail: "Failed",
    inspectFailToast: "Inspection failed",
    importSuccessToast: "Imported successfully!",
    importFailToast: "Import failed",
    confirmOrderSuccessToast: "Order confirmed and paid successfully!",
    confirmOrderFailToast: "Confirmation failed",
    inspectQueueTitle: "Watch Condition Assessment Queue (Customer Proposals)",
    sellerCol: "Seller",
    brandModelCol: "Brand/Model",
    desiredPriceCol: "Desired Price",
    evalConditionCol: "Eval Condition",
    inspectActionCol: "Inspect",
    importActionCol: "Import",
    passBtn: "Pass",
    failBtn: "Fail",
    waitingProcessText: "Waiting",
    systemUsersTitle: "System Users",
    usernameCol: "Username",
    roleCol: "Role",
    youBadge: "You",
    editUserPrivilegeTitle: "Edit Rights: {username}",
    selectUserToEditTitle: "Select a user account to edit",
    accessPrivilegeLabel: "System Access Privilege",
    roleUserOption: "USER (Customer / Buyer)",
    roleManagerOption: "MANAGER",
    roleAdminOption: "ADMIN (Super Administrator)",
    changePasswordLabel: "Change New Password (leave blank if unchanged)",
    newPasswordPlaceholder: "Enter new password",
    editUserInstruction: "Click the edit button next to the user account you want to change role or reset password.",
    statusPendingReviewAdmin: "Wait Manager Review",
    statusManagerApprovedAdmin: "Manager Approved",
    waitingManagerReviewText: "Waiting for Manager review",
    finalConfirmBtn: "Final Confirm",
    paymentConfirmedText: "Payment Confirmed"
  }
};

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() => localStorage.getItem('watchmart_lang') || 'th');

  const changeLang = (newLang) => {
    localStorage.setItem('watchmart_lang', newLang);
    setLang(newLang);
  };

  const t = (key) => translations[lang][key] || key;

  return (
    <LanguageContext.Provider value={{ lang, changeLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

// ─── Auth Context ───────────────────────────────────────────────────────────
export const AuthContext = createContext(null);

export function useAuth() {
  return useContext(AuthContext);
}

function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('watchmart_logged_in_user'));
      if (stored && stored.username && stored.role) return stored;
      if (stored) localStorage.removeItem('watchmart_logged_in_user');
      return null;
    } catch {
      return null;
    }
  });

  const login = (userData) => {
    localStorage.setItem('watchmart_logged_in_user', JSON.stringify(userData));
    setUser(userData);
  };

  const updateUser = (patch) => {
    setUser(prev => {
      const updated = { ...prev, ...patch };
      localStorage.setItem('watchmart_logged_in_user', JSON.stringify(updated));
      return updated;
    });
  };

  const logout = () => {
    localStorage.removeItem('watchmart_logged_in_user');
    localStorage.removeItem('watchmart_db_seller_registered');
    setUser(null);
  };

  // Fetch avatar on mount if missing from localStorage
  useEffect(() => {
    if (user && user.username) {
      api.getProfile(user.username).then(async (res) => {
        if (res.ok) {
          const profile = await res.json();
          if (profile.avatar !== undefined && profile.avatar !== user.avatar) {
            updateUser({ avatar: profile.avatar });
          }
        }
      }).catch(() => {});
    }
  }, [user?.username]); // Only run when username changes/mounts

  return (
    <AuthContext.Provider value={{ user, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

// ─── Route Guards ────────────────────────────────────────────────────────────
function RequireAuth({ children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function RequireRole({ roles, children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (!roles.includes(user.role)) {
    if (user.role === 'admin') return <Navigate to="/admin" replace />;
    if (user.role === 'manager') return <Navigate to="/manager" replace />;
    return <Navigate to="/" replace />;
  }
  return children;
}

function GuestOnly({ children }) {
  const { user } = useAuth();
  if (!user) return children;
  if (user.role === 'admin') return <Navigate to="/admin" replace />;
  if (user.role === 'manager') return <Navigate to="/manager" replace />;
  return <Navigate to="/" replace />;
}

function ManagerRouteWrapper() {
  const { user } = useAuth();
  return user?.role === 'admin' ? <Admin /> : <Manager />;
}

// ─── App Router ──────────────────────────────────────────────────────────────
export default function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <AuthProvider>
        <WishlistProvider>
        <CartProvider>
          <BrowserRouter>
            {/* Global Cart Drawer — rendered once across all pages */}
            <CartDrawer />
            {/* Global Wishlist Drawer */}
            <WishlistDrawer />

            <Routes>
              {/* Public Auth Routes */}
              <Route path="/login" element={<GuestOnly><Login /></GuestOnly>} />
              <Route path="/register" element={<GuestOnly><Register /></GuestOnly>} />

              {/* Customer (anyone can browse, but checkout/cart action requires auth) */}
              <Route path="/" element={<Storefront />} />
              <Route path="/product/:id" element={<ProductDetail />} />
              <Route path="/profile" element={<RequireAuth><Profile /></RequireAuth>} />
              <Route path="/checkout" element={<RequireAuth><Checkout /></RequireAuth>} />
              <Route path="/my-orders" element={<RequireAuth><MyOrders /></RequireAuth>} />

              {/* Manager + Admin only */}
              <Route path="/manager" element={<RequireRole roles={['manager', 'admin']}><ManagerRouteWrapper /></RequireRole>} />

              {/* Admin only */}
              <Route path="/admin" element={<RequireRole roles={['admin']}><Admin /></RequireRole>} />
              {/* System Docs - Admin only */}
              <Route path="/docs" element={<RequireRole roles={['admin']}><MarkdownViewer /></RequireRole>} />

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </CartProvider>
        </WishlistProvider>
        </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}
