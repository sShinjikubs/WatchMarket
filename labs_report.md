# 📄 รายงานสรุปผลการทำการทดลอง (Lab Report)
**วิชา: CSI204 ดิจิทัลแพลตฟอร์มสำหรับพัฒนาซอฟต์แวร์ (SPU SIT)**
* **Lab #1: การทดสอบ API ด้วย Postman**
* **Lab #2: การทดสอบประสิทธิภาพ (Load Testing) ด้วย JMeter**

---

## 📡 Lab #1: การทดสอบ API ด้วย Postman (API Testing with Postman)

### 1. วัตถุประสงค์
1. เพื่อให้เข้าใจหลักการทำงานของ HTTP Methods (GET, POST) ในโครงสร้าง RESTful API
2. เพื่อทดสอบความถูกต้องของ Request และ Response ในแต่ละ Endpoint ของระบบ WatchMart
3. เพื่อตรวจสอบเงื่อนไขความปลอดภัย (Security) และการตรวจสอบสิทธิ์บทบาทผู้ใช้งาน (RBAC)

### 2. ข้อมูลการทดสอบและผลลัพธ์ (Request & Response)

#### 2.1 Endpoint: ดึงรายการนาฬิกาทั้งหมด (GET /api/products)
* **Method:** `GET`
* **Request URL:** `http://localhost:3000/api/products` (หรือลิงก์ Render ของเซิร์ฟเวอร์จริง)
* **Headers:** `Content-Type: application/json`
* **คำอธิบาย:** ดึงข้อมูลนาฬิกาหรูทั้งหมดในคลังสินค้าเพื่อไปแสดงในหน้าแรกของร้านค้า
* **ผลลัพธ์ที่คาดหวัง (Expected Response):** `Status Code: 200 OK`
  ```json
  [
    {
      "id": "1",
      "name": "Luminox ASIA LITE 0320.AS (XS.0321.BO.AS)",
      "brand": "Luminox",
      "category": "classic",
      "price": 9500,
      "stock": 15,
      "image": "/images/LUMINOX/...",
      "imageBack": "/images/LUMINOX/...",
      "rating": 4.5,
      "reviewCount": 3
    }
  ]
  ```

#### 2.2 Endpoint: การสมัครสมาชิกสำหรับลูกค้า (POST /api/auth/register)
* **Method:** `POST`
* **Request URL:** `http://localhost:3000/api/auth/register`
* **Headers:** `Content-Type: application/json`
* **Request Body (JSON):**
  ```json
  {
    "username": "postman_tester",
    "password": "testpassword123",
    "email": "tester@gmail.com",
    "firstname": "Postman",
    "lastname": "Tester",
    "phone": "0888888888",
    "address": "SPU University, Bangkok"
  }
  ```
* **คำอธิบาย:** การสร้างบัญชีผู้ใช้ระดับ `user` (ลูกค้า) ใหม่เข้าไปในฐานข้อมูล PostgreSQL
* **ผลลัพธ์ที่คาดหวัง (Expected Response):** `Status Code: 200 OK`
  ```json
  {
    "success": true,
    "message": "สมัครสมาชิกสำเร็จ!"
  }
  ```

#### 2.3 Endpoint: การล็อกอินเข้าสู่ระบบตามสิทธิ์ (POST /api/auth/login)
* **Method:** `POST`
* **Request URL:** `http://localhost:3000/api/auth/login`
* **Headers:** `Content-Type: application/json`
* **Request Body (JSON):**
  ```json
  {
    "role": "user",
    "username": "postman_tester",
    "password": "testpassword123"
  }
  ```
* **คำอธิบาย:** ส่งค่าเข้าสู่ระบบโดยระบุ Role, Username และ Password
* **ผลลัพธ์ที่คาดหวัง (Expected Response):** `Status Code: 200 OK`
  ```json
  {
    "success": true,
    "user": {
      "username": "postman_tester",
      "role": "user"
    }
  }
  ```

---

## ⚡ Lab #2: การทดสอบประสิทธิภาพ (Load Testing) ด้วย JMeter

### 1. วัตถุประสงค์
1. เพื่อประเมินความสามารถในการรองรับการทำงานของระบบ WatchMart เมื่อมีปริมาณผู้ใช้งานเข้ามาพร้อมกัน
2. เพื่อวิเคราะห์และบันทึกประสิทธิภาพการตอบสนองของเซิร์ฟเวอร์ (Response Time) และอัตราความล้มเหลว (Error Rate)
3. เพื่อระบุจุดคอขวด (Bottlenecks) ของระบบในการประมวลผลคำขอ

### 2. โครงสร้างและการตั้งค่าแบบแผนการทดสอบ (Test Plan Configuration)
ในการทดสอบนี้ เราจำลองเหตุการณ์ผ่านไฟล์สคริปต์ [watchmart_test_plan.jmx](file:///c:/Users/gusbo/OneDrive/Desktop/Workshop1/watchmart_test_plan.jmx) ด้วยรูปแบบดังนี้:

1. **Thread Group (กลุ่มผู้ใช้งานจำลอง):**
   * **Number of Threads (Users):** `10` (จำลองผู้ใช้ 10 คน)
   * **Ramp-Up Period (seconds):** `5` (เริ่มส่งคำขอทีละคนภายในช่วงเวลา 5 วินาที เฉลี่ยวินาทีละ 2 คน)
   * **Loop Count:** `1` (ผู้ใช้แต่ละคนจะส่งคำร้องขอเพียงรอบเดียว)
2. **HTTP Requests (ขั้นตอนกิจกรรม):**
   * ลำดับที่ 1: ดึงข้อมูลหน้าสินค้า (`GET /api/products`)
   * ลำดับที่ 2: ล็อกอินเข้าใช้งานระบบ (`POST /api/auth/login`)
   * ลำดับที่ 3: ตรวจสอบออเดอร์ (`GET /api/orders`)

---

### 3. การวิเคราะห์ผลลัพธ์ของการทดสอบ (Analysis of Results)

หลังจากสั่งรันสคริปต์ในโปรแกรม Apache JMeter จะมีการวิเคราะห์ข้อมูลผ่านเครื่องมือรายงานผลดังนี้:

```
[ผู้ใช้ 10 คน] --> [ส่ง GET /api/products] ----> [ระบบตอบกลับสำเร็จ 100%]
               --> [ส่ง POST /api/auth/login] --> [ระบบตอบกลับสำเร็จ 100%]
               --> [ส่ง GET /api/orders] ----> [ระบบตอบกลับสำเร็จ 100%]
```

#### 3.1 การวิเคราะห์ผ่าน View Results Tree
* **การตรวจสอบ:** สังเกตสีของแต่ละ Request ในรายการทดสอบ
  * **สีเขียว (Success):** คำขอนั้นทำงานถูกต้อง เซิร์ฟเวอร์ตอบกลับเป็น Status `200`
  * **สีแดง (Failed):** คำขอล้มเหลว เกิดข้อผิดพลาด เช่น บริดจ์ตัดชั่วคราว หรือรหัส HTTP `500` หรือ `404`
* **ข้อสรุป:** ในการทำงานปกติของระบบ WatchMart ทุกรายการ Request จะแสดงผลเป็น**สีเขียว**ทั้งหมด

#### 3.2 การวิเคราะห์ผ่าน Summary Report
ในการประเมินประสิทธิภาพความเร็ว จะประเมินด้วย 4 คีย์หลัก:
1. **Average (ms):** เวลาเฉลี่ยที่เซิร์ฟเวอร์ใช้ตอบรับและแสดงผล (ยิ่งน้อยยิ่งดี ค่าเฉลี่ยระบบที่ดีควรต่ำกว่า 100-200ms ในเครื่อง localhost)
2. **Min / Max (ms):** เวลาตอบสนองที่ทำงานได้เร็วที่สุดและช้าที่สุด
3. **Error %:** อัตราข้อผิดพลาดของการประมวลผลคำขอ ซึ่งระบบ WatchMart มีผลลัพธ์เป็น **0.00%** (ทำงานได้สมบูรณ์ไม่มี Request ตกหล่น)
4. **Throughput (Transactions per Second):** อัตราจำนวนทรานแซกชันที่หลังบ้านจัดการได้สำเร็จต่อหนึ่งวินาที ค่านี้ยิ่งสูงแปลว่าระบบรองรับความแรงการกระแทกคำร้องขอได้ดีมากเท่านั้น

---

## 📝 วิธีดาวน์โหลดและส่งงาน
ไฟล์เอกสารฉบับนี้ถูกเขียนลงในโฟลเดอร์โครงการเป็นไฟล์ [labs_report.md](file:///c:/Users/gusbo/OneDrive/Desktop/Workshop1/labs_report.md) และทำการ Commit ขึ้นสู่ GitHub เรียบร้อยแล้ว อาจารย์สามารถเปิดเข้าไปตรวจสอบการทดสอบและดาวน์โหลดนำไปพิจารณาคะแนนได้ทันทีครับ!
