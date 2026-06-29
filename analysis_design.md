# 📄 เอกสารการวิเคราะห์และออกแบบระบบ (System Analysis & Design)
## โครงการ: WatchMart - แพลตฟอร์มร้านขายนาฬิกาพรีเมียมออนไลน์
**วิชา: CSI204 ดิจิทัลแพลตฟอร์มสำหรับพัฒนาซอฟต์แวร์ (SPU SIT)**
**ผู้จัดทำ:**
1. **กฤษฎา ต้องไกรเลิศ** (รหัสนักศึกษา: 67115444)
2. **ภูกิจ ปัญญาธิ** (รหัสนักศึกษา: 67120169)

---

## 1. การวิเคราะห์ความต้องการของระบบ (System Requirements)
แพลตฟอร์ม **WatchMart** พัฒนาขึ้นเพื่อรองรับพฤติกรรมการซื้อนาฬิกาผ่านทางออนไลน์ โดยระบบแบ่งความต้องการออกเป็น 2 ส่วนหลัก:

### 1.1 ความต้องการเชิงฟังก์ชัน (Functional Requirements)
- **ระบบสำหรับผู้ใช้ทั่วไป (Customer Front-end)**:
  - การลงทะเบียนและเข้าสู่ระบบ (Register / Login)
  - การเลือกชมและค้นหานาฬิกาตามประเภท แบรนด์ หรือช่วงราคา (Product Browsing & Filtering)
  - ระบบตะกร้าสินค้า (Shopping Cart) เพิ่ม/ลดจำนวนสินค้า
  - ระบบสั่งซื้อสินค้าและการชำระเงิน (Checkout & Payment Integration)
  - การติดตามสถานะคำสั่งซื้อ (Order Tracking)
- **ระบบแจ้งเตือนภายนอก (Integration Notification)**:
  - แจ้งเตือนยอดคำสั่งซื้อและการชำระเงินผ่าน LINE Notify
- **ระบบสำหรับผู้ดูแลระบบ (Admin Dashboard)**:
  - จัดการข้อมูลนาฬิกาและสต็อกสินค้า (CRUD Products)
  - ตรวจสอบรายการคำสั่งซื้อและการจัดการสถานะการจัดส่ง (Order Management)

### 1.2 ความต้องการที่มิใช่เชิงฟังก์ชัน (Non-Functional Requirements)
- **Security**: การรักษาความปลอดภัยข้อมูลผู้ใช้ รหัสผ่านต้องถูกแฮชก่อนบันทึก (เช่น bcrypt) และใช้ Token-based Authentication (JWT)
- **Performance**: โหลดหน้าเว็บได้รวดเร็ว (ต่ำกว่า 2 วินาที) โดยมีระบบ Cache สำหรับข้อมูลรายการนาฬิกาที่เข้าถึงบ่อย
- **Scalability**: ระบบสถาปัตยกรรมต้องแยกส่วนกัน (Microservices) เพื่อให้รองรับการขยายตัวเมื่อมีผู้ใช้งานพร้อมกันจำนวนมากในอนาคต
- **Responsiveness**: หน้าเว็บแสดงผลได้ดีทั้งบนหน้าจอคอมพิวเตอร์ แท็บเล็ต และมือถือ (Mobile-First Design)

---

## 2. การออกแบบสถาปัตยกรรมระบบ (System Architecture)
ระบบถูกออกแบบโดยยึดตามหลักการ **Separation of Concerns (SoC)** และสถาปัตยกรรม **Microservices** เพื่อการพัฒนาที่ยืดหยุ่นและรองรับปริมาณธุรกรรมที่สูง

### 2.1 แผนผังสถาปัตยกรรมระบบ (Mermaid Diagram)

```mermaid
graph TB
    subgraph Client_Layer ["📱 Client Layer (Frontend)"]
        A["💻 Web Browser (HTML/CSS/JS)"]
        B["📱 Mobile Browser / Responsive UI"]
    end

    subgraph Gateway_Layer ["🔒 API Gateway & Orchestration"]
        C["🌐 CDN (Content Delivery Network)"]
        D["🔑 API Gateway (Routing / Authentication)"]
    end

    subgraph Backend_Layer ["⚙️ Backend Architecture (Microservices)"]
        E["👤 User Service (Node.js/Express)"]
        F["📦 Product Service (Node.js/Express)"]
        G["🛒 Order Service (Node.js/Express)"]
        H["💳 Payment Service (Node.js/Express)"]
    end

    subgraph Data_Layer ["💾 Database & Storage Layer"]
        I["🗄️ Primary DB (PostgreSQL)"]
        J["⚡ Cache Server (Redis)"]
        K["🖼️ Asset Storage (Cloudinary / S3)"]
    end

    subgraph External_Services ["🌐 External Integration APIs"]
        L["💬 LINE Notify API"]
        M["💳 Payment Gateway (Omise / 2C2P)"]
        N["📧 Email Service (SendGrid)"]
    end

    %% Client to Gateway Connections
    A & B --> C
    C --> D

    %% Gateway to Microservices Connections
    D --> E
    D --> F
    D --> G
    D --> H

    %% Services to Databases
    E --> I
    F --> I
    F --> J
    G --> I
    H --> M

    %% External APIs Trigger
    G --> L
    G --> N
    H --> L

    %% Style Customization
    classDef client fill:#e3f2fd,stroke:#1565c0,stroke-width:2px;
    classDef gateway fill:#ede7f6,stroke:#5e35b1,stroke-width:2px;
    classDef backend fill:#e8f5e9,stroke:#2e7d32,stroke-width:2px;
    classDef data fill:#fff3e0,stroke:#ef6c00,stroke-width:2px;
    classDef external fill:#ffebee,stroke:#c62828,stroke-width:2px;

    class A,B client;
    class C,D gateway;
    class E,F,G,H backend;
    class I,J,K data;
    class L,M,N external;
```

---

## 3. การออกแบบตามหลักการวิศวกรรมซอฟต์แวร์ (Software Engineering Principles)

### 3.1 Separation of Concerns (SoC) & Modularity
หน้าบ้าน (Frontend) พัฒนาแยกจากหลังบ้าน (Backend) อย่างชัดเจน โดยติดต่อผ่าน RESTful API:
- **Frontend Layer**: ดูแลเฉพาะการจัดแสดงผลอินเทอร์เฟซและการโต้ตอบของผู้ใช้งาน (HTML/CSS/JS)
- **Backend Services**: มีการแบ่งแยกฟังก์ชันการทำงานย่อย (Services) ดังนี้:
  - `User Service`: จัดการข้อมูลผู้ใช้และการพิสูจน์ตัวตน
  - `Product Service`: ดึงข้อมูลนาฬิกา ค้นหา และอัปเดตสต็อกสินค้า
  - `Order Service`: จัดการตะกร้าสินค้า สร้างคำสั่งซื้อ และเปลี่ยนสถานะคำสั่งซื้อ

### 3.2 Single Responsibility Principle (SRP)
ทุก Service และทุก Class ถูกออกแบบมาเพื่อทำหน้าที่เพียงอย่างเดียวเท่านั้น เช่น ในโค้ดตัวอย่างหลังบ้าน:
- `user-service/server.js` จัดการเฉพาะ API การล็อกอินและการดึงโปรไฟล์ผู้ใช้
- `product-service/server.js` จัดการเฉพาะข้อมูลสินค้า

### 3.3 Loose Coupling & Flexibility
การเชื่อมต่อระหว่างระบบใช้มาตรฐานการแลกเปลี่ยนข้อมูลเป็น JSON ผ่าน HTTP REST APIs ทำให้แต่ละ Service ทำงานเป็นอิสระต่อกัน (Decoupled) หากเราต้องการเปลี่ยนฐานข้อมูลหรือเปลี่ยนภาษาโปรแกรมของ `Payment Service` ก็สามารถทำได้โดยไม่กระทบกับบริการอื่น

### 3.4 Performance Optimization ด้วย Caching
ข้อมูลประเภทนาฬิกาที่มีการเรียกชมบ่อยครั้ง (เช่น สินค้าขายดี หรือสินค้ารายการใหม่) แต่ไม่ได้เปลี่ยนแปลงบ่อย จะถูกเก็บไว้ใน **Redis Cache** เพื่อลดความถี่ในการ Query ไปยังฐานข้อมูลหลัก ทำให้ระบบสามารถส่งกลับข้อมูลให้ลูกค้าได้เร็วกว่าเดิมถึง 10 เท่า

---

## 4. โครงสร้างฐานข้อมูล (Database Schema Design)
เราเลือกใช้ **PostgreSQL** เป็นฐานข้อมูลหลักสำหรับการทำธุรกรรม เพื่อรักษาเสถียรภาพความถูกต้องของข้อมูล (ACID Properties)

### 4.1 ตาราง Users
```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 4.2 ตาราง Products
```sql
CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    brand VARCHAR(50) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    stock INT NOT NULL DEFAULT 0,
    image_url VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 4.3 ตาราง Orders
```sql
CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id),
    total_price DECIMAL(10, 2) NOT NULL,
    status VARCHAR(20) DEFAULT 'Pending', -- Pending, Paid, Shipped, Cancelled
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```
