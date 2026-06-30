# WatchMart ⌚ - Premium Watch E-Commerce Platform
> CSI204: Digital Platform for Software Development Workshop #1

ยินดีต้อนรับสู่ **WatchMart** แพลตฟอร์มร้านค้าออนไลน์สำหรับนาฬิกาหรูและนาฬิกาพรีเมียม โครงการนี้จัดทำขึ้นเพื่อสาธิตการออกแบบสถาปัตยกรรมระบบ (Platform Architecture) และการพัฒนาหน้าบ้าน (Frontend Development) ตามมาตรฐานการพัฒนาซอฟต์แวร์ที่ดี (Software Design Principles)

## 🌐 Live Demo & Documentation
- **Frontend Store (GitHub Pages):** [เข้าชมร้านค้า WatchMart](index.html)
- **Interactive System Architecture & Design Docs:** [ดูเอกสารวิเคราะห์และออกแบบระบบ](markdown.html)

---

## 📂 โครงสร้างโฟลเดอร์โครงการ (Project Structure)
```text
watch-store-project/
├── index.html           # หน้าหลักของร้านค้าออนไลน์ (WatchMart E-commerce UI)
├── style.css            # ไฟล์สไตล์หลัก (Modern Dark/Glassmorphism Theme)
├── markdown.html        # หน้าเว็บสำหรับแสดงเอกสารวิเคราะห์ระบบผ่าน marked.js
├── README.md            # เอกสารประกอบการติดตั้งและข้อมูลโครงงาน
├── analysis_design.md   # เอกสารการวิเคราะห์และออกแบบระบบ (Analysis & Design)
└── architecture.mmd     # โค้ดแผนผัง System Architecture (Mermaid format)
```

---

## 🛠️ เทคโนโลยีที่ใช้ในการออกแบบระบบ (System Technology Stack)
จากหัวข้อการเรียนรู้ในวิชา CSI204 ระบบถูกออกแบบโดยคำนึงถึงส่วนประกอบสำคัญดังนี้:

- **Frontend Architecture**: Single Page Responsive Web Design ด้วย HTML5, Modern CSS, และ Vanilla JavaScript สำหรับสร้าง UI แบบ Component-based
- **API Orchestration Layer**: ออกแบบเป็น RESTful API สำหรับการเชื่อมต่อระหว่าง Frontend และ Microservices
- **Backend Architecture**: บริการย่อย (Microservices) พัฒนาด้วย Node.js (Express) แบ่งออกเป็น 3 บริการหลักตามหลัก Modularity:
  - User Service
  - Product Service
  - Order Service
- **Database Architecture**: ใช้ฐานข้อมูล SQL (PostgreSQL/MySQL) สำหรับข้อมูลหลักที่ต้องการความถูกต้องสูง และ NoSQL (Redis) สำหรับ Caching เพื่อเพิ่มประสิทธิภาพ

---

## 🚀 ขั้นตอนการติดตั้งและใช้งานภายในเครื่อง (Local Setup)
1. **Clone Repository** จาก GitHub
   ```bash
   git clone <URL-Repository-ของคุณ>
   ```
2. **เปิดไฟล์หน้าเว็บหลัก**:
   - เปิดไฟล์ `index.html` หรือ `markdown.html` บนเบราว์เซอร์ได้ทันที หรือใช้ปลั๊กอิน **Live Server** ใน VS Code เพื่อจำลองเซิร์ฟเวอร์เสมือนจริง

---

## 👥 ผู้จัดทำ (Developers)
1. **ชื่อ-นามสกุล**: กฤษฎา ต้องไกรเลิศ (รหัสนักศึกษา: 67115444)
2. **ชื่อ-นามสกุล**: ภูกิจ ปัญญาธิ (รหัสนักศึกษา: 67120169)
3. **ชื่อ-นามสกุล**: นนทิวัชร หมื่นสาย

- สาขาวิชาวิทยาการคอมพิวเตอร์และนวัตกรรมซอฟต์แวร์ (Computer Science and Software Development Innovation)
- มหาวิทยาลัยศรีปทุม (SPU SIT)


<!-- Last updated: 2026-06-26 -->

