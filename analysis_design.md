# 📄 เอกสารการวิเคราะห์และออกแบบระบบ (System Analysis & Design)
## โครงการ: WatchMart - แพลตฟอร์มร้านขายนาฬิกาพรีเมียมออนไลน์
**วิชา: CSI204 ดิจิทัลแพลตฟอร์มสำหรับพัฒนาซอฟต์แวร์ (SPU SIT)**
**ผู้จัดทำ:**
1. **กฤษฎา ต้องไกรเลิศ** (รหัสนักศึกษา: 67115444)
2. **ภูกิจ ปัญญาธิ** (รหัสนักศึกษา: 67120169)
3. **นนทิวัชร หมื่นสาย** (รหัสนักศึกษา : 67117362)

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
    subgraph Client_Layer ["📱 Client Layer (Frontend UI)"]
        A1["💻 User Portal (User UI)"]
        A2["🛍️ Employee Portal (Sales UI)"]
        A3["👑 Admin Dashboard (Operations & Audit)"]
    end
 
    subgraph Gateway_Layer ["🔒 Gateway & Authentication"]
        CDN["🌐 CDN (Content Delivery Network)"]
        GW["🔑 API Gateway & Auth Manager (JWT / Roles)"]
    end
 
    subgraph Backend_Layer ["⚙️ Backend Microservices"]
        AuthSvc["👤 Authentication Service"]
        VerifySvc["🛡️ Employee Verification & Blacklist check"]
        InspectSvc["🔎 Watch Inspection & Catalog Service"]
        AuditSvc["📊 Price Compliance & Audit Service"]
        ChatSvc["💬 Live Support Chat Service"]
        PaySvc["💳 Easy Donate QR Payment Service"]
    end
 
    subgraph Data_Layer ["💾 Database & Storage Layer"]
        SQL_DB[("🗄️ Primary SQL DB<br>(Users, Employees, Watches, Logs)")]
        Redis_DB[("⚡ Redis Cache<br>(Blacklist, Product Catalog)")]
        Storage[("📦 File Storage<br>(Receipt Slips, Watch Themes)")]
    end

    subgraph External_Services ["🌐 External Integration APIs"]
        LineAPI["💬 LINE Notify API"]
        BankAPI["📱 Easy Donate QR Bank Gateway"]
        BlacklistAPI["🔍 External Blacklist Provider"]
    end

    %% Client to Gateway Connections
    A1 & A2 & A3 --> CDN
    CDN --> GW

    %% Gateway to Microservices Connections
    GW --> AuthSvc
    GW --> VerifySvc
    GW --> InspectSvc
    GW --> AuditSvc
    GW --> ChatSvc
    GW --> PaySvc

    %% Services to Databases
    AuthSvc --> SQL_DB
    VerifySvc --> SQL_DB
    VerifySvc --> Redis_DB
    InspectSvc --> SQL_DB
    InspectSvc --> Storage
    AuditSvc --> SQL_DB
    ChatSvc --> SQL_DB
    PaySvc --> SQL_DB
    PaySvc --> Storage

    %% External APIs Trigger
    VerifySvc --> BlacklistAPI
    PaySvc --> BankAPI
    PaySvc --> LineAPI
    InspectSvc --> LineAPI

    %% Style Customization
    classDef client fill:#0f172a,stroke:#c5a880,stroke-width:2px,color:#fff;
    classDef gateway fill:#1e1b4b,stroke:#818cf8,stroke-width:2px,color:#fff;
    classDef backend fill:#064e3b,stroke:#34d399,stroke-width:2px,color:#fff;
    classDef data fill:#78350f,stroke:#fbbf24,stroke-width:2px,color:#fff;
    classDef external fill:#7f1d1d,stroke:#f87171,stroke-width:2px,color:#fff;

    class A1,A2,A3 client;
    class CDN,GW gateway;
    class AuthSvc,VerifySvc,InspectSvc,AuditSvc,ChatSvc,PaySvc backend;
    class SQL_DB,Redis_DB,Storage data;
    class LineAPI,BankAPI,BlacklistAPI external;
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
    username VARCHAR(50) PRIMARY KEY,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 4.2 ตาราง Profiles
```sql
CREATE TABLE profiles (
    username VARCHAR(50) PRIMARY KEY REFERENCES users(username) ON DELETE CASCADE,
    firstname VARCHAR(50),
    lastname VARCHAR(50),
    email VARCHAR(100),
    phone VARCHAR(20),
    address TEXT
);
```

### 4.3 ตาราง Products (รองรับการเก็บคะแนนและรูปภาพนาฬิกา)
```sql
CREATE TABLE products (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    brand VARCHAR(50) NOT NULL,
    category VARCHAR(50) NOT NULL,
    price NUMERIC(12, 2) NOT NULL,
    stock INT NOT NULL DEFAULT 0,
    color VARCHAR(50),
    stroke_color VARCHAR(50),
    is_gold_face BOOLEAN DEFAULT FALSE,
    image VARCHAR(255),
    image_back VARCHAR(255)
);
```

### 4.4 ตาราง Orders (รองรับการจัดเก็บสลิปชำระเงินภายหลังและ 2-Step Verification)
```sql
CREATE TABLE orders (
    id VARCHAR(50) PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL,
    items JSONB NOT NULL,
    total NUMERIC(12, 2) NOT NULL,
    email VARCHAR(100) NOT NULL,
    address TEXT NOT NULL,
    payment VARCHAR(50) NOT NULL,
    status VARCHAR(20) NOT NULL, -- pending_payment, pending_review, manager_approved, confirmed, shipped, cancelled
    date VARCHAR(50) NOT NULL,
    slip TEXT
);
```

### 4.5 ตาราง Reviews
```sql
CREATE TABLE reviews (
    id SERIAL PRIMARY KEY,
    product_id VARCHAR(50) NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    username VARCHAR(50) NOT NULL REFERENCES users(username) ON DELETE CASCADE,
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT NOT NULL,
    date VARCHAR(50) NOT NULL
);
```

---

## 5. การวิเคราะห์และออกแบบระบบด้วย UML Diagram (UML Design)
เพื่อแสดงโครงสร้าง ลำดับการทำงาน และความสัมพันธ์ของระบบ **WatchMart** ให้ชัดเจนยิ่งขึ้นตามแนวทางวิศวกรรมซอฟต์แวร์

### 5.1 Use Case Diagram (แผนภาพแสดงการทำงานของผู้ใช้)
แผนภาพ Use Case แสดงขอบเขตของระบบ (System Boundary) และปฏิสัมพันธ์ระหว่างนักช้อป (User), พนักงาน/ผู้จัดการ (Manager) และผู้ดูแลระบบ (Admin)

```mermaid
graph TD
    %% Define Actors
    UserActor["👤 ผู้ซื้อ (User)"]
    ManagerActor["🛍️ ผู้จัดการ (Manager)"]
    AdminActor["👑 ผู้ดูแลระบบ (Admin)"]

    subgraph WatchMart_System ["💼 ระบบ WatchMart Platform"]
        UC_Login["เข้าสู่ระบบ (Login)"]
        UC_Search["ค้นหาและกรองนาฬิกา (Search & Filter)"]
        UC_Cart["จัดการตะกร้าสินค้า (Manage Cart)"]
        UC_Checkout["สั่งซื้อสินค้า (Checkout)"]
        UC_UploadSlip["แนบสลิปหลักฐานชำระเงินภายหลัง 24 ชม. (Upload Slip)"]
        UC_Track["ติดตามสถานะจัดส่งและใบสั่งซื้อ (Track Orders)"]
        UC_Notif["รับแจ้งเตือนการยืนยันสินค้า/ตรวจสลิป (Notification)"]

        UC_Verify["ยืนยันตัวตนพนักงาน (Employee Verify)"]
        UC_AddWatch["ลงรายการนาฬิกาเข้าคลัง (Add Watch to Stock)"]

        UC_Inspect["ตรวจสอบและอนุมัติสินค้า (Inspect & Approve)"]
        UC_VerifySlip["ตรวจสอบสลิปและอนุมัติขั้นแรก (Verify Slip)"]
        UC_FinalConfirm["ยืนยันออเดอร์ขั้นสุดท้าย (Final Confirm Order)"]
        UC_PriceAudit["ตรวจสอบราคากลาง (Price Audit)"]
        UC_Chat["ให้บริการแชทช่วยเหลือ (Support Chat)"]
        UC_Blacklist["จัดการบัญชีดำ (Blacklist Management)"]
        UC_Logs["ตรวจสอบระบบประวัติการทำงาน (System Logs)"]
    end

    %% User Connections
    UserActor --> UC_Login
    UserActor --> UC_Search
    UserActor --> UC_Cart
    UserActor --> UC_Checkout
    UserActor --> UC_UploadSlip
    UserActor --> UC_Track
    UserActor --> UC_Notif

    %% Manager Connections
    ManagerActor --> UC_Login
    ManagerActor --> UC_Verify
    ManagerActor --> UC_AddWatch
    ManagerActor --> UC_VerifySlip

    %% Admin Connections
    AdminActor --> UC_Login
    AdminActor --> UC_Inspect
    AdminActor --> UC_FinalConfirm
    AdminActor --> UC_PriceAudit
    AdminActor --> UC_Chat
    AdminActor --> UC_Blacklist
    AdminActor --> UC_Logs

    %% Include relation
    UC_Checkout -.->|"<<include>>"| UC_Login
    UC_AddWatch -.->|"<<include>>"| UC_Verify
```

### 5.2 Class Diagram (แผนภาพคลาสโครงสร้างข้อมูล)
แสดงความสัมพันธ์ของ Object/Entity ต่างๆ ในเชิงโครงสร้างข้อมูลเชิงวัตถุ (Object-Oriented Design) ของระบบ WatchMart

```mermaid
classDiagram
    class User {
        +int id
        +string username
        +string email
        +string passwordHash
        +datetime createdAt
        +register() bool
        +login() bool
    }

    class Product {
        +int id
        +string name
        +string brand
        +string description
        +decimal price
        +int stock
        +string imageUrl
        +getDetails() Product
        +updateStock(int qty) bool
    }

    class Category {
        +int id
        +string name
        +string description
    }

    class Cart {
        +int id
        +int userId
        +addCartItem(Product p, int qty)
        +removeCartItem(int productId)
        +clearCart()
        +getTotalPrice() decimal
    }

    class CartItem {
        +int id
        +int productId
        +int quantity
        +decimal price
    }

    class Order {
        +int id
        +int userId
        +decimal totalPrice
        +string status
        +datetime createdAt
        +processPayment() bool
        +cancelOrder() bool
    }

    class OrderItem {
        +int id
        +int productId
        +int quantity
        +decimal unitPrice
    }

    class Payment {
        +int id
        +int orderId
        +string paymentMethod
        +decimal amount
        +string transactionRef
        +string status
        +process() bool
    }

    User "1" --> "0..1" Cart : เจ้าของ
    User "1" --> "0..*" Order : สั่งซื้อ
    Cart "1" *-- "0..*" CartItem : ประกอบด้วย
    Product "1" <-- "1" CartItem : อ้างอิง
    Product "*" --> "1" Category : อยู่ในหมวดหมู่
    Order "1" *-- "1..*" OrderItem : ประกอบด้วย
    Product "1" <-- "1" OrderItem : อ้างอิง
    Order "1" --> "1" Payment : มีการจ่ายเงิน
```

### 5.3 Sequence Diagram (แผนภาพขั้นตอนการทำงาน)
แสดงขั้นตอนการส่งข้อความโต้ตอบระหว่างผู้ใช้ หน้าบ้าน (Frontend) ระบบควบคุมการสั่งซื้อ (Order Service) บริการชำระเงิน (Payment Service) และฐานข้อมูลหลัก เมื่อผู้ใช้ (User) ทำการสั่งซื้อนาฬิกาพรีเมียม

```mermaid
sequenceDiagram
    autonumber
    actor User as 👤 User (ผู้ซื้อ)
    participant UI as 💻 Frontend (Web App)
    participant OrderSvc as 🛒 Order Service
    participant PaySvc as 💳 Payment Service
    participant BankAPI as 📱 Easy Donate API
    participant DB as 🗄️ Database

    User->>UI: Click "Checkout Now"
    UI->>OrderSvc: Create order POST /api/orders (Cart details)
    activate OrderSvc
    OrderSvc->>DB: Save order details (Insert Order & OrderItems)
    activate DB
    DB-->>OrderSvc: Return order_id
    deactivate DB
    OrderSvc-->>UI: Order Created (Status: Pending)
    deactivate OrderSvc

    UI->>PaySvc: Initiate payment POST /api/payments (Amount, PromptPay QR)
    activate PaySvc
    PaySvc->>BankAPI: Request PromptPay QR Code (Easy Donate API)
    activate BankAPI
    BankAPI-->>PaySvc: Return QR code URL & transaction_ref
    deactivate BankAPI
    PaySvc-->>UI: Render QR Code to User
    deactivate PaySvc

    User->>BankAPI: Scan and transfer via Mobile Banking app
    activate BankAPI
    BankAPI->>PaySvc: Webhook callback / Verification notification
    deactivate BankAPI
    activate PaySvc
    PaySvc->>DB: Update Payment transaction status to 'Success'
    activate DB
    DB-->>PaySvc: Update complete
    deactivate DB
    PaySvc-->>UI: Payment success callback
    deactivate PaySvc

    UI->>OrderSvc: Update order status to 'Paid'
    activate OrderSvc
    OrderSvc->>DB: Update Order Status = 'Paid'
    OrderSvc-->>UI: Show order confirmation screen
    deactivate OrderSvc
    UI-->>User: Display receipt & payment success
```

### 5.4 Activity Diagram (แผนภาพกิจกรรมการสั่งซื้อสินค้า)
แสดงการไหลของกิจกรรม (Activity Flow) ตั้งแต่เริ่มต้นเลือกชมนาฬิกาจนถึงสิ้นสุดการชำระเงินและการส่งมอบสินค้าสำเร็จ

```mermaid
stateDiagram-v2
    [*] --> เข้าสู่เว็บไซต์
    เข้าสู่เว็บไซต์ --> เลือกชมสินค้า
    เลือกชมสินค้า --> ค้นหาหรือกรองประเภทสินค้า
    ค้นหาหรือกรองประเภทสินค้า --> เพิ่มสินค้าลงตะกร้า: สนใจสั่งซื้อ
    เพิ่มสินค้าลงตะกร้า --> ตรวจสอบตะกร้าสินค้า
    ตรวจสอบตะกร้าสินค้า --> กดปุ่มสั่งซื้อ: ตกลงชำระเงิน
    กดปุ่มสั่งซื้อ --> กรอกข้อมูลจัดส่งและเลือกวิธีชำระเงิน
    
    state ชำระเงิน <<choice>>
    กรอกข้อมูลจัดส่งและเลือกวิธีชำระเงิน --> ชำระเงิน
    
    ชำระเงิน --> โอนเงินธนาคาร: เลือกโอนเงิน
    ชำระเงิน --> บัตรเครดิต: กรอกรายละเอียดบัตร
    ชำระเงิน --> สแกนพร้อมเพย์: สแกนคิวอาร์โค้ด
    
    state ผลการชำระเงิน <<choice>>
    โอนเงินธนาคาร --> ผลการชำระเงิน
    บัตรเครดิต --> ผลการชำระเงิน
    สแกนพร้อมเพย์ --> ผลการชำระเงิน
    
    ผลการชำระเงิน --> ยกเลิกคำสั่งซื้อ: ชำระเงินล้มเหลว / กดยกเลิก
    ผลการชำระเงิน --> ยืนยันคำสั่งซื้อ: ชำระเงินสำเร็จ
    
    ยืนยันคำสั่งซื้อ --> ระบบอัปเดตสต็อกสินค้า
    ระบบอัปเดตสต็อกสินค้า --> พนักงานตรวจสอบและส่งมอบสินค้า
    พนักงานตรวจสอบและส่งมอบสินค้า --> [*]: ลูกค้าได้รับสินค้าสำเร็จ
    ยกเลิกคำสั่งซื้อ --> [*]
```

---

## 6. การออกแบบส่วนติดต่อผู้ใช้งาน (UI/UX Design & Wireframe)

### 6.1 แนวคิดการออกแบบ UI/UX (Design Concept)
เพื่อส่งเสริมภาพลักษณ์ความเป็น **Premium Online Chronometers** ระบบได้รับการวิเคราะห์และออกแบบดังนี้:
* **UI Design (User Interface)**:
  * **Color Palette**: ใช้สีโทนเข้มอาร์กอนกึ่งลักชัวรี (Dark Slate: `#0f172a`, Deep Midnight: `#0b0c10`) ตัดกับสีทองหรูทองคำขาว (Primary Accent Gold: `#c5a880`) เพื่อสะท้อนความประณีตมีระดับ
  * **Typography**: ใช้ฟอนต์ **Outfit** ที่มีหน้าตาเรียบหรู ทันสมัย ดูเป็นสากลและสะอาดตา
  * **Visual**: แสดงรูปภาพนาฬิกาด้วยกรอบ SVG และ Glassmorphism Overlay (โปร่งแสงแต่อบอุ่นด้วยแสงสะท้อน)
* **UX Design (User Experience)**:
  * **Seamless Checkout**: ลูกค้าสามารถกดเพิ่มสินค้าลงตะกร้าได้อย่างรวดเร็วผ่าน Side Cart Drawer โดยไม่ต้องเปลี่ยนหน้าเว็บบ่อยๆ
  * **Mobile-First Experience**: หน้าหลักและระบบการชำระเงินสามารถใช้งานได้อย่างคล่องตัวบนมือถือ ตอบสนองรวดเร็วผ่านโครงสร้าง Flexbox & Grid CSS

### 6.2 การวางแผนโครงร่างหน้าจอ (Wireframe & Prototype)
ในการพัฒนาออกแบบระบบจะอ้างอิงจากแบบร่างหน้าจอหลัก (Wireframe) 3 หน้า ดังนี้:
1. **Homepage (หน้าหลัก)**:
   * ส่วนบนสุดเป็น Navigation Bar แสดง Logo `WatchMart` และไอคอนตะกร้าสินค้า
   * ส่วนถัดมาคือ Hero Section นำเสนอวิสัยทัศน์ของแบรนด์และปุ่มเรียกให้ดำเนินการ (CTA Button: "เลือกชมสินค้า")
   * ด้านล่างเป็นระบบกรองหมวดหมู่ (Filter Tags) และตารางแสดงรายการนาฬิกาแบบ Grid
2. **Side Cart Drawer (ตะกร้าสินค้าแบบแถบข้าง)**:
   * สไลด์ออกมาจากทางขวาเมื่อกดรูปตะกร้า
   * แสดงรายการที่เลือกซื้อ ปุ่มปรับเปลี่ยนจำนวน หรือลบชิ้นงาน และสรุปยอดเงินรวม
3. **Checkout UI (หน้าต่างยืนยันสั่งซื้อ)**:
   * ฟอร์มกรอกที่อยู่จัดส่ง และตัวเลือกการชำระเงิน (โอนเงิน, บัตรเครดิต, พร้อมเพย์) พร้อมปุ่มชำระเงินที่เด่นชัด

---

## 7. โครงสร้างระบบและการไหลของข้อมูลใหม่ (New System Structure & Data Flow Design)

เพื่อให้สอดคล้องกับความต้องการเพิ่มเติมเกี่ยวกับสถาปัตยกรรมและกระบวนการทำงานของระบบในการจัดการสินค้า ความปลอดภัย และการชำระเงิน แผนภาพด้านล่างอธิบายถึงความสัมพันธ์และการแลกเปลี่ยนข้อมูลดังนี้:

### 7.1 แผนภาพการไหลของข้อมูลและสถาปัตยกรรม (System Structure & Data Flow)

```mermaid
graph TB
    subgraph Actors ["👥 บทบาทในระบบ (Actors & Roles)"]
        User["👤 User (ผู้ซื้อ)"]
        Customer["🛍️ Employee (พนักงาน)"]
        Admin["👑 Admin (ผู้ดูแลระบบ/ผู้จัดการ)"]
    end

    subgraph Security ["🔒 ความปลอดภัยและการตรวจสอบ"]
        Blacklist["🔍 Blacklist Verification<br>(Email + บัตรประชาชน)"]
    end

    subgraph Operations ["⚙️ กิจกรรมและการดำเนินงาน"]
        Purchase["🤝 กระบวนการซื้อ-ขายสินค้า"]
        AdminFlow["🛠️ Admin Task<br>- ตรวจสอบและนำสินค้าเข้าคลัง<br>- ตรวจสอบราคากลางและความถูกต้อง<br>- ตอบแชทบริการช่วยเหลือ"]
    end

    subgraph Interfaces ["🔌 บริการชำระเงิน & การเชื่อมต่อภายนอก"]
        PaymentAPI["💳 QR Code Easy Donate API<br>(Bank Gateway)"]
    end

    subgraph Database_Storage ["💾 ส่วนจัดเก็บข้อมูลและทรัพยากร (Database & Storage)"]
        SQL_DB[("🗄️ SQL Database<br>(นาฬิกา, ผู้ใช้, พนักงาน)")]
        Storage_Data[("📦 Storage Data<br>(ข้อมูล, รูปภาพสินค้า, Price Banding)")]
    end

    %% Relationships and Flows
    User -->|สั่งซื้อสินค้าที่ลงโดย| Customer
    Customer -->|ลงทะเบียนพนักงานด้วยบัตรประชาชนและอีเมล| Blacklist
    Blacklist -->|ตรวจสอบข้อมูลยืนยันตัวตน| SQL_DB

    %% Purchase & Payment Flow
    User & Customer --> Purchase
    Purchase -->|เรียกชำระเงินสแกน QR Code| PaymentAPI
    PaymentAPI -->|บันทึกธุรกรรม| SQL_DB

    %% Admin Actions
    Admin --> AdminFlow

    %% DB & Storage Links
    AdminFlow -->|จัดการและเก็บข้อมูล| SQL_DB
    AdminFlow -->|จัดเก็บทรัพยากร/ไฟล์| Storage_Data
```

### 7.2 รายละเอียดการทำงานของระบบใหม่ (System Requirements Specification)
 
1. **บทบาทการดำเนินงานของผู้ใช้งาน (Actors & Operations)**
    - **User (ผู้ซื้อ)**: ทำหน้าที่สั่งซื้อสินค้าจากระบบที่ดำเนินการลงสินค้าโดยพนักงาน (**Employee**)
    - **Employee (พนักงาน/พนักงานขาย)**: สมาชิกที่เป็นพนักงานองค์กรที่มีหน้าที่รับผิดชอบในการนำนาฬิกาเข้าระบบคลังสินค้าเพื่อตั้งขาย
    - **Admin (ผู้ดูแลระบบ/ผู้จัดการ)**: รับผิดชอบการบริหารจัดการระบบทั้งหมด ครอบคลุมการตรวจสอบความถูกต้องของสินค้าและราคากลาง (Audit & Inspection), อนุมัติการนำเข้าสินค้า, ตรวจสอบแบล็คลิสต์ และตอบแชทซัพพอร์ตช่วยเหลือลูกค้า
2. **ระบบฐานข้อมูลและพื้นที่จัดเก็บข้อมูล (Database & Storage)**
    - **SQL Database**: จัดเก็บข้อมูลโครงสร้างหลัก ได้แก่ ข้อมูลนาฬิกา (Watch), ข้อมูลผู้ใช้งานทั่วไป (User) และข้อมูลพนักงานขาย (Employee)
    - **Storage (Data Store)**: ทำหน้าที่จัดเก็บข้อมูลรูปภาพสินค้า (Picture), โครงสร้างระดับราคา (Price Banding) และไฟล์ข้อมูล (Data) อื่น ๆ ทั้งหมดของระบบ
3. **ระบบตรวจสอบความปลอดภัย (Blacklist & Identity Verification)**
    - ระบบเพิ่มความปลอดภัยขั้นสูงในการลงทะเบียนพนักงาน โดยผู้ที่เป็น **พนักงาน (Employee)** เท่านั้นที่จะต้องยื่นเอกสาร **บัตรประชาชน** และ **Email** เพื่อตรวจสอบความถูกต้องผ่านระบบ Blacklist ก่อนที่จะได้รับอนุญาตให้จัดการและนำนาฬิกาเข้าคลังสินค้า
4. **ระบบรับชำระเงิน (QR Code Payment API)**
    - ดำเนินการชำระเงินโดยใช้ **QR Code** ที่ดึงข้อมูลผ่าน API จากธนาคารใดธนาคารหนึ่ง โดยใช้ระบบการรับบริจาค/ชำระเงิน **Easy Donate** เพื่อความปลอดภัยและยืนยันยอดเงินอัตโนมัติ

### 7.3 แผนภาพความสัมพันธ์ฐานข้อมูล (Database ER Diagram)

แผนภาพความสัมพันธ์ระหว่างตารางฐานข้อมูลหลักในระบบ (SQL Database) และส่วนของข้อมูลที่ถูกส่งไปจัดเก็บลงในพื้นที่เก็บข้อมูล (Storage Data) เพื่อให้เห็นประเภทของข้อมูลและความเชื่อมโยง:

```mermaid
erDiagram
    USER {
        int id PK "รหัสผู้ใช้หลัก"
        string username "ชื่อผู้ใช้"
        string email UK "อีเมลผู้ใช้งาน"
        string password_hash "รหัสผ่านที่เข้ารหัส"
        datetime created_at "วันที่สมัครสมาชิก"
    }

    EMPLOYEE {
        int id PK "รหัสพนักงานขาย"
        int user_id FK "รหัสผู้ใช้"
        string email UK "อีเมลองค์กรพนักงาน"
        string national_id UK "เลขบัตรประชาชน (ยืนยันตนพนักงาน)"
        string verify_status "สถานะการตรวจสอบ (Verified/Pending/Failed)"
        datetime verified_at "วันที่ผ่านการอนุมัติ"
    }

    BLACKLIST {
        int id PK "รหัสแบล็คลิสต์"
        string email UK "อีเมลที่ถูกแบล็คลิสต์"
        string national_id UK "เลขบัตรประชาชนที่ถูกแบล็คลิสต์"
        string reason "เหตุผลในการแบล็คลิสต์"
        datetime created_at "วันที่บันทึกประวัติ"
    }

    WATCH {
        int id PK "รหัสนาฬิกา"
        string brand "แบรนด์"
        string model "รุ่น"
        decimal price "ราคา"
        string price_banding "ช่วงราคา (Price Banding)"
        string status "สถานะ (พร้อมขาย/รอตรวจสอบ/ขายแล้ว)"
    }


    PAYMENT {
        int id PK "รหัสการจ่ายเงิน"
        int order_id FK "รหัสใบสั่งซื้อ"
        decimal amount "ยอดเงินชำระ"
        string qr_code_url "ลิงก์รูปภาพ QR Code (Easy Donate)"
        string transaction_ref "รหัสอ้างอิงธนาคาร (Bank API)"
        string status "สถานะการชำระเงิน (Success/Pending/Failed)"
    }

    STORAGE_DATA {
        int id PK "รหัสข้อมูลทรัพยากร"
        string file_name "ชื่อไฟล์"
        string file_path "ที่อยู่จัดเก็บไฟล์"
        string file_type "ประเภทไฟล์ (Picture/Document/Log)"
        int size_bytes "ขนาดของไฟล์ (Bytes)"
    }

    %% ความสัมพันธ์
    USER ||--o| EMPLOYEE : "ลงทะเบียนเป็น"
    EMPLOYEE ||--o| BLACKLIST : "ตรวจสอบกับ"
    USER ||--o| PAYMENT : "ชำระเงิน"
    WATCH ||--o| STORAGE_DATA : "เก็บไฟล์รูปภาพ/เอกสาร (Picture)"
```



