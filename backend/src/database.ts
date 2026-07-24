import fs from 'fs';
import path from 'path';
import { Pool } from 'pg';
import { User, Profile, Product, Order, PendingWatch, BlacklistEntry, LogEntry, Review } from './types';

// Load .env.local from project root
const envPath = path.join(__dirname, '..', '..', '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach(line => {
    const parts = line.split('=');
    if (parts.length >= 2) {
      const key = parts[0].trim();
      let value = parts.slice(1).join('=').trim();
      if (value.startsWith('"') && value.endsWith('"')) {
        value = value.slice(1, -1);
      }
      process.env[key] = value;
    }
  });
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

let useFallback = false;

const JSON_DB_FILE = path.join(__dirname, '..', 'db.json');

interface JSONSchema {
  users: User[];
  profiles: Record<string, Profile>;
  products: Product[];
  orders: Order[];
  pendingWatches: PendingWatch[];
  blacklist: BlacklistEntry[];
  logs: LogEntry[];
  reviews: any[];
}

function readJsonDb(): JSONSchema {
  if (!fs.existsSync(JSON_DB_FILE)) {
    const initialData: JSONSchema = {
      users: defaultUsers,
      profiles: {},
      products: defaultProducts,
      orders: [],
      pendingWatches: [],
      blacklist: defaultBlacklist,
      logs: [],
      reviews: []
    };
    fs.writeFileSync(JSON_DB_FILE, JSON.stringify(initialData, null, 2), 'utf-8');
    return initialData;
  }
  try {
    const raw = fs.readFileSync(JSON_DB_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    return {
      users: defaultUsers,
      profiles: {},
      products: defaultProducts,
      orders: [],
      pendingWatches: [],
      blacklist: defaultBlacklist,
      logs: [],
      reviews: []
    };
  }
}

function writeJsonDb(data: JSONSchema) {
  try {
    fs.writeFileSync(JSON_DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error("Failed to write to JSON DB", err);
  }
}

// Seeds
const defaultProducts: Product[] = [
  {
    id: "1",
    name: "Luminox ASIA LITE 0320.AS (XS.0321.BO.AS)",
    nameEn: "Luminox ASIA LITE 0320.AS (XS.0321.BO.AS)",
    brand: "Luminox",
    category: "classic",
    price: 9500,
    stock: 15,
    image: "/images/LUMINOX/Luminox นาฬิกาข้อมือ ASIA LITE 0320.AS SERIES (หน้าปัด 44 mm) รุ่น XS.0321.BO.AS หน้า.webp",
    imageBack: "/images/LUMINOX/Luminox นาฬิกาข้อมือ ASIA LITE 0320.AS SERIES (หน้าปัด 44 mm) รุ่น XS.0321.BO.AS หลัง.webp"
  },
  {
    id: "2",
    name: "Luminox Bear Grylls Survival 3720 (XB.3729.NGU)",
    nameEn: "Luminox Bear Grylls Survival 3720 (XB.3729.NGU)",
    brand: "Luminox",
    category: "sport",
    price: 17500,
    stock: 8,
    image: "/images/LUMINOX/Luminox นาฬิกาข้อมือ BEAR GRYLLS SURVIVAL 3720 SEA SERIES รุ่น XB.3729.NGU หน้า.webp",
    imageBack: "/images/LUMINOX/Luminox นาฬิกาข้อมือ BEAR GRYLLS SURVIVAL 3720 SEA SERIES รุ่น XB.3729.NGU หลัง.webp"
  },
  {
    id: "3",
    name: "Luminox Sea Lion G Collection (X2.2055.1)",
    nameEn: "Luminox Sea Lion G Collection (X2.2055.1)",
    brand: "Luminox",
    category: "classic",
    price: 8900,
    stock: 20,
    image: "/images/LUMINOX/Luminox นาฬิกาข้อมือ G collection Sea Lion รุ่น X2.2055.1 หน้า.webp",
    imageBack: "/images/LUMINOX/Luminox นาฬิกาข้อมือ G collection Sea Lion รุ่น X2.2055.1 หลัง.webp"
  },
  {
    id: "4",
    name: "Luminox ICE-SAR 1080 Limited Edition (XL.1095)",
    nameEn: "Luminox ICE-SAR 1080 Limited Edition (XL.1095)",
    brand: "Luminox",
    category: "elegant",
    price: 21900,
    stock: 5,
    image: "/images/LUMINOX/Luminox นาฬิกาข้อมือ ICE-SAR 1080 SERIES Limited Edition รุ่น XL.1095 หน้า.webp",
    imageBack: "/images/LUMINOX/Luminox นาฬิกาข้อมือ ICE-SAR 1080 SERIES Limited Edition รุ่น XL.1095 หลัง.webp"
  },
  {
    id: "5",
    name: "Luminox Leatherback Sea Turtle Giant (XS.0325.GP)",
    nameEn: "Luminox Leatherback Sea Turtle Giant (XS.0325.GP)",
    brand: "Luminox",
    category: "sport",
    price: 11200,
    stock: 12,
    image: "/images/LUMINOX/Luminox นาฬิกาข้อมือ LEATHERBACK SEA TURTLE GIANT 0320 SERIES (หน้าปัด 44 mm) รุ่น XS.0325.GP หน้า.webp",
    imageBack: "/images/LUMINOX/Luminox นาฬิกาข้อมือ LEATHERBACK SEA TURTLE GIANT 0320 SERIES (หน้าปัด 44 mm) รุ่น XS.0325.GP หลัง.webp"
  },
  {
    id: "6",
    name: "Luminox Navy Seal 3500 (XS.3517.NM)",
    nameEn: "Luminox Navy Seal 3500 (XS.3517.NM)",
    brand: "Luminox",
    category: "sport",
    price: 14800,
    stock: 10,
    image: "/images/LUMINOX/Luminox นาฬิกาข้อมือ NAVY SEAL 3500 SERIES รุ่น XS.3517.NM หน้า.webp",
    imageBack: "/images/LUMINOX/Luminox นาฬิกาข้อมือ NAVY SEAL 3500 SERIES รุ่น XS.3517.NM หลัง.webp"
  },
  {
    id: "7",
    name: "Luminox Navy SEAL Foundation 3200 (XS.3228.NSF)",
    nameEn: "Luminox Navy SEAL Foundation 3200 (XS.3228.NSF)",
    brand: "Luminox",
    category: "elegant",
    price: 24500,
    stock: 7,
    image: "/images/LUMINOX/Luminox นาฬิกาข้อมือ Navy SEAL Foundation 3200 SERIES รุ่น XS.3228.NSF หน้า.webp",
    imageBack: "/images/LUMINOX/Luminox นาฬิกาข้อมือ Navy SEAL Foundation 3200 SERIES รุ่น XS.3228.NSF หลัง.webp"
  },
  {
    id: "8",
    name: "Luminox Pacific Diver 3120 (XS.3135)",
    nameEn: "Luminox Pacific Diver 3120 (XS.3135)",
    brand: "Luminox",
    category: "elegant",
    price: 22000,
    stock: 9,
    image: "/images/LUMINOX/Luminox นาฬิกาข้อมือ PACIFIC DIVER 3120 SERIES รุ่น XS.3135 หน้า.webp",
    imageBack: "/images/LUMINOX/Luminox นาฬิกาข้อมือ PACIFIC DIVER 3120 SERIES รุ่น XS.3135 หลัง.webp"
  },
  {
    id: "9",
    name: "Luminox Pacific Diver Ripple 39mm (XS.3122M)",
    nameEn: "Luminox Pacific Diver Ripple 39mm (XS.3122M)",
    brand: "Luminox",
    category: "elegant",
    price: 23400,
    stock: 6,
    image: "/images/LUMINOX/Luminox นาฬิกาข้อมือ PACIFIC DIVER RIPPLE 39MM 3120 SERIES รุ่น XS.3122M หน้า.webp",
    imageBack: "/images/LUMINOX/Luminox นาฬิกาข้อมือ PACIFIC DIVER RIPPLE 39MM 3120 SERIES รุ่น XS.3122M หลัง.webp"
  },
  {
    id: "10",
    name: "Luminox Red Bull AMPOL_26 Limited (XL.1970.ARB.N)",
    nameEn: "Luminox Red Bull AMPOL_26 Limited (XL.1970.ARB.N)",
    brand: "Luminox",
    category: "elegant",
    price: 29800,
    stock: 3,
    image: "/images/LUMINOX/Luminox นาฬิกาข้อมือ Red Bull AMPOL_26 รุ่น XL.1970.ARB.N LIMITED EDITION หน้า.webp",
    imageBack: "/images/LUMINOX/Luminox นาฬิกาข้อมือ Red Bull AMPOL_26 รุ่น XL.1970.ARB.N LIMITED EDITION หลัง.webp"
  },
  {
    id: "11",
    name: "Seiko Prospex Monster CMU 60th Anniversary",
    nameEn: "Seiko Prospex Monster CMU 60th Anniversary",
    brand: "Seiko",
    category: "elegant",
    price: 28500,
    stock: 4,
    image: "/images/SEIKO/SEIKO PROSPEX MONSTER CMU 60th Anniversary Limited Edition หน้า.webp",
    imageBack: "/images/SEIKO/SEIKO PROSPEX MONSTER CMU 60th Anniversary Limited Edition หลัง.webp"
  },
  {
    id: "12",
    name: "Seiko 5 Sports X HUF Limited Edition (SRPM09K)",
    nameEn: "Seiko 5 Sports X HUF Limited Edition (SRPM09K)",
    brand: "Seiko",
    category: "sport",
    price: 13900,
    stock: 14,
    image: "/images/SEIKO/SEIKO นาฬิกาข้อมือผู้ชาย 5 Sports X HUF Limited Edition รุ่น SRPM09K 39.4 มม. สีเขียว หน้า.webp",
    imageBack: "/images/SEIKO/SEIKO นาฬิกาข้อมือผู้ชาย 5 Sports X HUF Limited Edition รุ่น SRPM09K 39.4 มม. สีเขียว หลัง.webp"
  },
  {
    id: "13",
    name: "Seiko Prospex Speedtimer Solar Tokyo25 (SSC955P)",
    nameEn: "Seiko Prospex Speedtimer Solar Tokyo25 (SSC955P)",
    brand: "Seiko",
    category: "elegant",
    price: 31500,
    stock: 8,
    image: "/images/SEIKO/SEIKO นาฬิกาข้อมือผู้ชาย Prospex Speedtimer Solar Chronograph World Athletics Championships Tokyo25 Limited Edition รุ่น SSC955P ขนาด 39 มม. สีม่วง หน้า.webp",
    imageBack: "/images/SEIKO/SEIKO นาฬิกาข้อมือผู้ชาย Prospex Speedtimer Solar Chronograph World Athletics Championships Tokyo25 Limited Edition รุ่น SSC955P ขนาด 39 มม. สีม่วง หลัง.webp"
  },
  {
    id: "14",
    name: "Seiko 5 Sports Vintage Car Special (SRPL49K)",
    nameEn: "Seiko 5 Sports Vintage Car Special (SRPL49K)",
    brand: "Seiko",
    category: "classic",
    price: 14500,
    stock: 11,
    image: "/images/SEIKO/SEIKO นาฬิกาข้อมือผู้ชาย Seiko 5 Sports Vintage Car Special Edition รุ่น SRPL49K ขนาด 42.5 มม. สีเงิน หน้า.webp",
    imageBack: "/images/SEIKO/SEIKO นาฬิกาข้อมือผู้ชาย Seiko 5 Sports Vintage Car Special Edition รุ่น SRPL49K ขนาด 42.5 มม. สีเงิน หลัง.webp"
  },
  {
    id: "15",
    name: "Seiko 5 Sports x Poorboy Limited Edition (SRPM17K)",
    nameEn: "Seiko 5 Sports x Poorboy Limited Edition (SRPM17K)",
    brand: "Seiko",
    category: "sport",
    price: 15200,
    stock: 9,
    image: "/images/SEIKO/SEIKO นาฬิกาข้อมือผู้ชาย Seiko 5 Sports x Poorboy Limited Edition รุ่น SRPM17K 42.5 มม. สีเขียว หน้า.webp",
    imageBack: "/images/SEIKO/SEIKO นาฬิกาข้อมือผู้ชาย Seiko 5 Sports x Poorboy Limited Edition รุ่น SRPM17K 42.5 มม. สีเขียว หลัง.webp"
  },
  {
    id: "16",
    name: "Seiko Prospex Automatic Stainless Monster (SRPH75K)",
    nameEn: "Seiko Prospex Automatic Stainless Monster (SRPH75K)",
    brand: "Seiko",
    category: "sport",
    price: 19800,
    stock: 6,
    image: "/images/SEIKO/SEIKOนาฬิกาข้อมือผู้ชายอัตโนมัติ Prospex สแตนเลส รุ่น SRPH75K ขนาด 42.4 มม. หน้า.webp",
    imageBack: "/images/SEIKO/SEIKO นาฬิกาข้อมือผู้ชายอัตโนมัติ Prospex สแตนเลส รุ่น SRPH75K ขนาด 42.4 มม. หลัง.webp"
  },
  {
    id: "17",
    name: "Seiko Astron GPS Solar 145th Anniversary (HAB004J)",
    nameEn: "Seiko Astron GPS Solar 145th Anniversary (HAB004J)",
    brand: "Seiko",
    category: "elegant",
    price: 115000,
    stock: 2,
    image: "/images/SEIKO/SEIKO นาฬืกาข้อมือผู้ชาย Astron GPS Solar 145th Anniversary Limited Edition รุ่น HAB004J 43.4 มม. สีเงิน หน้า.webp",
    imageBack: "/images/SEIKO/SEIKO นาฬืกาข้อมือผู้ชาย Astron GPS Solar 145th Anniversary Limited Edition รุ่น HAB004J 43.4 มม. สีเงิน หลัง.webp"
  },
  {
    id: "18",
    name: "Seiko 5 Sports x POORBOY Limited Edition",
    nameEn: "Seiko 5 Sports x POORBOY Limited Edition",
    brand: "Seiko",
    category: "sport",
    price: 14800,
    stock: 7,
    image: "/images/SEIKO/Seiko 5 Sports x POORBOY Limited Edition หน้า.webp",
    imageBack: "/images/SEIKO/Seiko 5 Sports x POORBOY Limited Edition หลัง.webp"
  },
  {
    id: "19",
    name: "Seiko Monster Red The Fang Custom & Modify",
    nameEn: "Seiko Monster Red The Fang Custom & Modify",
    brand: "Seiko",
    category: "sport",
    price: 18900,
    stock: 5,
    image: "/images/SEIKO/Seiko Custom & Modify Monster เขี้ยวแดง Red The Fang หน้า.webp",
    imageBack: "/images/SEIKO/Seiko Custom & Modify Monster เขี้ยวแดง Red The Fang หลัง.webp"
  },
  {
    id: "20",
    name: "Seiko Prospex Divers 1965 Heritage Limited (HBC005J)",
    nameEn: "Seiko Prospex Divers 1965 Heritage Limited (HBC005J)",
    brand: "Seiko",
    category: "elegant",
    price: 49500,
    stock: 3,
    image: "/images/SEIKO/นาฬิกาข้อมือผู้ชาย Prospex Divers Watch 1965 Heritage Limited Edition 145th Anniversary รุ่น HBC005J ขนาด 40 มม. สีขาว หน้า.webp",
    imageBack: "/images/SEIKO/นาฬิกาข้อมือผู้ชาย Prospex Divers Watch 1965 Heritage Limited Edition 145th Anniversary รุ่น HBC005J ขนาด 40 มม. สีขาว หลัง.webp"
  },
  {
    id: "21",
    name: "TAG Heuer Aquaracer Professional 500 Date Automatic, 42 mm, Titanium",
    nameEn: "TAG Heuer Aquaracer Professional 500 Date Automatic, 42 mm, Titanium",
    brand: "TAG Heuer",
    category: "sport",
    price: 135000,
    stock: 5,
    image: "/images/TAG Heuer/TAG Heuer Aquaracer Professional 500 Date Automatic, 42 mm, Titanium Front.avif",
    imageBack: "/images/TAG Heuer/TAG Heuer Aquaracer Professional 500 Date Automatic, 42 mm, Titanium back.avif"
  },
  {
    id: "22",
    name: "TAG Heuer Formula 1 Chronograph",
    nameEn: "TAG Heuer Formula 1 Chronograph",
    brand: "TAG Heuer",
    category: "sport",
    price: 78000,
    stock: 10,
    image: "/images/TAG Heuer/TAG Heuer Formula 1 Chronograph  Front.avif",
    imageBack: "/images/TAG Heuer/TAG Heuer Formula 1 Chronograph Bank.avif"
  },
  {
    id: "23",
    name: "TAG Heuer Formula 1 Chronograph Quartz, 43 mm, Steel",
    nameEn: "TAG Heuer Formula 1 Chronograph Quartz, 43 mm, Steel",
    brand: "TAG Heuer",
    category: "sport",
    price: 85000,
    stock: 8,
    image: "/images/TAG Heuer/TAG Heuer Formula 1 Chronograph Quartz, 43 mm, Steel Front.avif",
    imageBack: "/images/TAG Heuer/TAG Heuer Formula 1 Chronograph Quartz, 43 mm, Steel Back.avif"
  },
  {
    id: "24",
    name: "TAG Heuer Formula 1 Chronograph x Red Bull Racing Quartz, 43 mm, Steel",
    nameEn: "TAG Heuer Formula 1 Chronograph x Red Bull Racing Quartz, 43 mm, Steel",
    brand: "TAG Heuer",
    category: "sport",
    price: 98000,
    stock: 6,
    image: "/images/TAG Heuer/TAG Heuer Formula 1 Chronograph x Red Bull Racing Quartz, 43 mm, Steel  Front.avif",
    imageBack: "/images/TAG Heuer/TAG Heuer Formula 1 Chronograph x Red Bull Racing Quartz, 43 mm, Steel back.avif"
  },
  {
    id: "25",
    name: "TAG Heuer Formula 1 Date Automatic, 43 mm, Steel",
    nameEn: "TAG Heuer Formula 1 Date Automatic, 43 mm, Steel",
    brand: "TAG Heuer",
    category: "classic",
    price: 110000,
    stock: 7,
    image: "/images/TAG Heuer/TAG Heuer Formula 1 Date Automatic, 43 mm, Steel Front.avif",
    imageBack: "/images/TAG Heuer/TAG Heuer Formula 1 Date Automatic, 43 mm, Steel Bacnk.avif"
  },
  {
    id: "26",
    name: "TAG Heuer Carrera Chronograph Automatic, 39 mm, Steel",
    nameEn: "TAG Heuer Carrera Chronograph Automatic, 39 mm, Steel",
    brand: "TAG Heuer",
    category: "sport",
    price: 195000,
    stock: 4,
    image: "/images/TAG Heuer/More/TAG Heuer Carrera Chronograph Automatic, 39 mm, Steel Front.avif",
    imageBack: "/images/TAG Heuer/More/TAG Heuer Carrera Chronograph Automatic, 39 mm, Steel Back.avif"
  },
  {
    id: "27",
    name: "TAG Heuer Carrera Chronograph x Porsche Automatic, 44 mm, Steel",
    nameEn: "TAG Heuer Carrera Chronograph x Porsche Automatic, 44 mm, Steel",
    brand: "TAG Heuer",
    category: "sport",
    price: 285000,
    stock: 3,
    image: "/images/TAG Heuer/More/TAG Heuer Carrera Chronograph x Porsche Automatic, 44 mm, Steel Front.avif",
    imageBack: "/images/TAG Heuer/More/TAG Heuer Carrera Chronograph x Porsche Automatic, 44 mm, Steel back.avif"
  },
  {
    id: "28",
    name: "TAG Heuer Carrera Date Automatic, 36 mm, Steel",
    nameEn: "TAG Heuer Carrera Date Automatic, 36 mm, Steel",
    brand: "TAG Heuer",
    category: "classic",
    price: 125000,
    stock: 6,
    image: "/images/TAG Heuer/More/TAG Heuer Carrera Date Automatic, 36 mm, Steel Front.avif",
    imageBack: "/images/TAG Heuer/More/TAG Heuer Carrera Date Automatic, 36 mm, Steel back.avif"
  },
  {
    id: "29",
    name: "TAG Heuer Formula 1 Chronograph Automatic, 44 mm, Steel",
    nameEn: "TAG Heuer Formula 1 Chronograph Automatic, 44 mm, Steel",
    brand: "TAG Heuer",
    category: "sport",
    price: 95000,
    stock: 5,
    image: "/images/TAG Heuer/More/TAG Heuer Formula 1 Chronograph Automatic, 44 mm, Steel Front.avif",
    imageBack: "/images/TAG Heuer/More/TAG Heuer Formula 1 Chronograph Automatic, 44 mm, Steel Back.avif"
  },
  {
    id: "30",
    name: "TAG Heuer Monaco Evergraph Automatic, 40 mm, Titanium",
    nameEn: "TAG Heuer Monaco Evergraph Automatic, 40 mm, Titanium",
    brand: "TAG Heuer",
    category: "elegant",
    price: 320000,
    stock: 2,
    image: "/images/TAG Heuer/More/TAG Heuer Monaco Evergraph Automatic, 40 mm, Titanium Front.avif",
    imageBack: "/images/TAG Heuer/More/TAG Heuer Monaco Evergraph Automatic, 40 mm, Titanium back.avif"
  },
  {
    id: "31",
    name: "Rolex Submariner Date Vintage Matte Dial Yellow Patina Ref.16800",
    nameEn: "Rolex Submariner Date Vintage Matte Dial Yellow Patina Ref.16800",
    brand: "Rolex",
    category: "sport",
    price: 345000,
    stock: 5,
    image: "/images/Rolex/Rolex Submariner Date Vintage Matte Dial Yellow Patina Ref.16800 หน้า.png",
    imageBack: "/images/Rolex/Rolex Submariner Date Vintage Matte Dial Yellow Patina Ref.16800 หลัง.png"
  },
  {
    id: "32",
    name: "Rolex 16233 Oyster Datejust Automatic Cal.3135 หลักเพชร",
    nameEn: "Rolex 16233 Oyster Datejust Automatic Cal.3135 Diamond Dial",
    brand: "Rolex",
    category: "elegant",
    price: 235000,
    stock: 4,
    image: "/images/Rolex/Rolex 16233 Oyster Datejust Automatic Cal.3135 หลักเพชร หน้า.png",
    imageBack: "/images/Rolex/Rolex 16233 Oyster Datejust Automatic Cal.3135 หลักเพชร หลัง.png"
  },
  {
    id: "33",
    name: "ROLEX Datejust 68273 Year 1987 Automatic Date Unisex Size 31 mm. (Pre-owned)",
    nameEn: "ROLEX Datejust 68273 Year 1987 Automatic Date Unisex Size 31 mm. (Pre-owned)",
    brand: "Rolex",
    category: "classic",
    price: 198000,
    stock: 3,
    image: "/images/Rolex/ROLEX Datejust 68273 Year 1987 Automatic Date Unisex Size 31 mm. (Pre-owned) หน้า.webp",
    imageBack: "/images/Rolex/ROLEX Datejust 68273 Year 1987 Automatic Date Unisex Size 31 mm. (Pre-owned) หลัง.webp"
  },
  {
    id: "34",
    name: "ROLEX GMT-Master II 16713 Year 1991 X Serie Automatic Date Size 40 mm. (Pre-owned)",
    nameEn: "ROLEX GMT-Master II 16713 Year 1991 X Serie Automatic Date Size 40 mm. (Pre-owned)",
    brand: "Rolex",
    category: "sport",
    price: 428000,
    stock: 2,
    image: "/images/Rolex/ROLEX GMT-Master II 16713 Year 1991 X Serie Automatic Date Size 40 mm. (Pre-owned) หน้า.webp",
    imageBack: "/images/Rolex/ROLEX GMT-Master II 16713 Year 1991 X Serie Automatic Date Size 40 mm. (Pre-owned) หลัง.webp"
  },
  {
    id: "35",
    name: "Rolex Cosmograph Daytona Oyster, 40 มม., ทองคำ",
    nameEn: "Rolex Cosmograph Daytona Oyster, 40 mm, Yellow Gold",
    brand: "Rolex",
    category: "sport",
    price: 1350000,
    stock: 3,
    image: "/images/Rolex/Rolex Cosmograph Daytona Oyster, 40 มม., ทองคำ.png",
    imageBack: "/images/Rolex/Rolex Cosmograph Daytona Oyster, 40 มม., ทองคำ.png"
  },
  {
    id: "36",
    name: "Rolex Cosmograph Daytona Oyster, 40 มม., ทองคำและเพชร",
    nameEn: "Rolex Cosmograph Daytona Oyster, 40 mm, Yellow Gold and Diamonds",
    brand: "Rolex",
    category: "elegant",
    price: 1650000,
    stock: 1,
    image: "/images/Rolex/Rolex Cosmograph Daytona Oyster, 40 มม., ทองคำและเพชร.png",
    imageBack: "/images/Rolex/Rolex Cosmograph Daytona Oyster, 40 มม., ทองคำและเพชร.png"
  },
  {
    id: "37",
    name: "Rolex Cosmograph Daytona Oyster, 40 มม., แพลทินัม",
    nameEn: "Rolex Cosmograph Daytona Oyster, 40 mm, Platinum",
    brand: "Rolex",
    category: "sport",
    price: 2200000,
    stock: 2,
    image: "/images/Rolex/Rolex Cosmograph Daytona Oyster, 40 มม., แพลทินัม.png",
    imageBack: "/images/Rolex/Rolex Cosmograph Daytona Oyster, 40 มม., แพลทินัม.png"
  },
  {
    id: "38",
    name: "Rolex Day-Date 40 Oyster, 40 มม., แพลทินัม",
    nameEn: "Rolex Day-Date 40 Oyster, 40 mm, Platinum",
    brand: "Rolex",
    category: "elegant",
    price: 1850000,
    stock: 3,
    image: "/images/Rolex/Rolex Day-Date 40 Oyster, 40 มม., แพลทินัม.png",
    imageBack: "/images/Rolex/Rolex Day-Date 40 Oyster, 40 มม., แพลทินัม.png"
  },
  {
    id: "39",
    name: "Rolex Lady-Datejust Oyster, 28 มม., Oystersteel และทองคำ",
    nameEn: "Rolex Lady-Datejust Oyster, 28 mm, Oystersteel andYellow Gold",
    brand: "Rolex",
    category: "classic",
    price: 380000,
    stock: 4,
    image: "/images/Rolex/Rolex Lady-Datejust Oyster, 28 มม., Oystersteel และทองคำ.png",
    imageBack: "/images/Rolex/Rolex Lady-Datejust Oyster, 28 มม., Oystersteel และทองคำ.png"
  },
  {
    id: "40",
    name: "Rolex Sky-Dweller Oyster, 42 มม., เอเวอร์โรสโกลด์",
    nameEn: "Rolex Sky-Dweller Oyster, 42 mm, Everose Gold",
    brand: "Rolex",
    category: "elegant",
    price: 1550000,
    stock: 2,
    image: "/images/Rolex/Rolex Sky-Dweller Oyster, 42 มม., เอเวอร์โรสโกลด์.png",
    imageBack: "/images/Rolex/Rolex Sky-Dweller Oyster, 42 มม., เอเวอร์โรสโกลด์.png"
  },
  {
    id: "41",
    name: "CASIO G-SHOCK GBX-100NS-1DR ของแท้ ประกันศูนย์ CMG",
    nameEn: "CASIO G-SHOCK GBX-100NS-1DR CMG Warranty",
    brand: "G-SHOCK",
    category: "sport",
    price: 6500,
    stock: 10,
    image: "/images/G-SHOCK/CASIO G-SHOCK GBX-100NS-1DR ของแท้ ประกันศูนย์ CMG หน้า.webp",
    imageBack: "/images/G-SHOCK/CASIO G-SHOCK GBX-100NS-1DR ของแท้ ประกันศูนย์ CMG หลัง.webp"
  },
  {
    id: "42",
    name: "CASIO G-SHOCK GST-B400D-1ADR (บลูทูธ,ทัชโซล่า)",
    nameEn: "CASIO G-SHOCK GST-B400D-1ADR (Bluetooth, Tough Solar)",
    brand: "G-SHOCK",
    category: "elegant",
    price: 12900,
    stock: 5,
    image: "/images/G-SHOCK/CASIO G-SHOCK GST-B400D-1ADR (บลูทูธ,ทัชโซล่า) ของแท้ ประกันศูนย์ CMG หน้า.webp",
    imageBack: "/images/G-SHOCK/CASIO G-SHOCK GST-B400D-1ADR (บลูทูธ,ทัชโซล่า) ของแท้ ประกันศูนย์ CMG หลัง.webp"
  },
  {
    id: "43",
    name: "CASIO G-SHOCK GA-110EVA30-7A EVANGELION",
    nameEn: "CASIO G-SHOCK GA-110EVA30-7A EVANGELION Limited Edition",
    brand: "G-SHOCK",
    category: "sport",
    price: 8900,
    stock: 3,
    image: "/images/G-SHOCK/CASIO นาฬิกาข้อมือ G-SHOCK GA-110EVA30-7A EVANGELION ของแท้ประกันศูนย์ 1ปี หน้า.webp",
    imageBack: "/images/G-SHOCK/CASIO นาฬิกาข้อมือ G-SHOCK GA-110EVA30-7A EVANGELION ของแท้ประกันศูนย์ 1ปี หลัง.png"
  },
  {
    id: "44",
    name: "CASIO G-SHOCK MID-TIER รุ่น GM-2100-1ADR สีเงิน",
    nameEn: "CASIO G-SHOCK MID-TIER GM-2100-1ADR Silver",
    brand: "G-SHOCK",
    category: "classic",
    price: 7900,
    stock: 8,
    image: "/images/G-SHOCK/CASIO นาฬิกาข้อมือผู้ชาย G-SHOCK MID-TIER รุ่น GM-2100-1ADR วัสดุเรซิ่น สีเงิน หน้า.webp",
    imageBack: "/images/G-SHOCK/CASIO นาฬิกาข้อมือผู้ชาย G-SHOCK MID-TIER รุ่น GM-2100-1ADR วัสดุเรซิ่น สีเงิน หลัง.webp"
  },
  {
    id: "45",
    name: "GA-010-2A อะนาล็อก-ดิจิตอลมาตรฐาน ซีรีส์ GA-010 G-SHOCK",
    nameEn: "G-SHOCK Standard Analog-Digital GA-010 Series GA-010-2A",
    brand: "G-SHOCK",
    category: "sport",
    price: 4500,
    stock: 12,
    image: "/images/G-SHOCK/GA-010-2A  อะนาล็อก-ดิจิตอลมาตรฐาน  ซีรีส์ GA-010  G-SHOCK  นาฬิกา  CASIO หน้า.png",
    imageBack: "/images/G-SHOCK/GA-010-2A  อะนาล็อก-ดิจิตอลมาตรฐาน  ซีรีส์ GA-010  G-SHOCK  นาฬิกา  CASIO หลัง.png"
  },
  {
    id: "46",
    name: "GA-2100FL-1A อะนาล็อก-ดิจิตอลมาตรฐาน ซีรีส์ 2100 G-SHOCK",
    nameEn: "G-SHOCK Standard Analog-Digital 2100 Series GA-2100FL-1A",
    brand: "G-SHOCK",
    category: "classic",
    price: 5200,
    stock: 6,
    image: "/images/G-SHOCK/GA-2100FL-1A  อะนาล็อก-ดิจิตอลมาตรฐาน  ซีรีส์ 2100  G-SHOCK  นาฬิกา  CASIO หน้า.png",
    imageBack: "/images/G-SHOCK/GA-2100FL-1A  อะนาล็อก-ดิจิตอลมาตรฐาน  ซีรีส์ 2100  G-SHOCK  นาฬิกา  CASIO หลัง.png"
  },
  {
    id: "47",
    name: "GA-2100FL-8A อะนาล็อก-ดิจิตอลมาตรฐาน ซีรีส์ 2100 G-SHOCK",
    nameEn: "G-SHOCK Standard Analog-Digital 2100 Series GA-2100FL-8A",
    brand: "G-SHOCK",
    category: "sport",
    price: 5200,
    stock: 7,
    image: "/images/G-SHOCK/GA-2100FL-8A  อะนาล็อก-ดิจิตอลมาตรฐาน  ซีรีส์ 2100  G-SHOCK  นาฬิกา  CASIO หน้า.png",
    imageBack: "/images/G-SHOCK/GA-2100FL-8A  อะนาล็อก-ดิจิตอลมาตรฐาน  ซีรีส์ 2100  G-SHOCK  นาฬิกา  CASIO หลัง.png"
  },
  {
    id: "48",
    name: "GA-B2100MF-1A อะนาล็อก-ดิจิตอลมาตรฐาน ซีรีส์ 2100 G-SHOCK",
    nameEn: "G-SHOCK Standard Analog-Digital 2100 Series GA-B2100MF-1A",
    brand: "G-SHOCK",
    category: "sport",
    price: 6900,
    stock: 9,
    image: "/images/G-SHOCK/GA-B2100MF-1A  อะนาล็อก-ดิจิตอลมาตรฐาน  ซีรีส์ 2100  G-SHOCK  นาฬิกา  CASIO หน้า.png",
    imageBack: "/images/G-SHOCK/GA-B2100MF-1A  อะนาล็อก-ดิจิตอลมาตรฐาน  ซีรีส์ 2100  G-SHOCK  นาฬิกา  CASIO หลัง.png"
  },
  {
    id: "49",
    name: "GM-B2100AD-2A FULL METAL ซีรีส์ 2100 G-SHOCK",
    nameEn: "G-SHOCK Full Metal 2100 Series GM-B2100AD-2A Blue Dial",
    brand: "G-SHOCK",
    category: "elegant",
    price: 22900,
    stock: 4,
    image: "/images/G-SHOCK/GM-B2100AD-2A  FULL METAL  ซีรีส์ 2100  G-SHOCK  นาฬิกา  CASIO หน้า.png",
    imageBack: "/images/G-SHOCK/GM-B2100AD-2A  FULL METAL  ซีรีส์ 2100  G-SHOCK  นาฬิกา  CASIO หลัง.png"
  },
  {
    id: "50",
    name: "CASIO G-SHOCK DW-6900U-1DR [FLASH SALE]",
    nameEn: "CASIO G-SHOCK DW-6900U-1DR Classic Digital CMG Warranty",
    brand: "G-SHOCK",
    category: "sport",
    price: 3200,
    stock: 15,
    image: "/images/G-SHOCK/{[FLASH SALE]} CASIO G-SHOCK DW-6900U-1DR ของแท้ ประกันศูนย์ CMG หน้า.png",
    imageBack: "/images/G-SHOCK/{[FLASH SALE]} CASIO G-SHOCK DW-6900U-1DR ของแท้ ประกันศูนย์ CMG หลัง.webp"
  }
];

const defaultBlacklist: BlacklistEntry[] = [
  { email: "bad@mail.com", nationalId: "1-1111-11111-11-1", reason: "มีประวัติฉ้อโกงบัตรประชาชน" },
  { email: "fraud@watch.com", nationalId: "2-2222-22222-22-2", reason: "มีประวัติส่งนาฬิกาปลอมเลียนแบบ" }
];

const defaultUsers: User[] = [
  { username: "admin", password: "admin123", role: "admin" },
  { username: "manager", password: "manager123", role: "manager" },
  { username: "buyer", password: "123456", role: "user" },
  { username: "seller", password: "123456", role: "user" }
];

export const db = {
  initDb: async (): Promise<void> => {
    let client;
    try {
      client = await pool.connect();
    } catch (err: any) {
      console.warn('Postgres connection failed, falling back to Local JSON Database (db.json):', err.message);
      useFallback = true;
      readJsonDb();
      return;
    }
    try {
      // 1. Users Table
      await client.query(`
        CREATE TABLE IF NOT EXISTS users (
          username VARCHAR(50) PRIMARY KEY,
          password VARCHAR(255) NOT NULL,
          role VARCHAR(20) NOT NULL
        )
      `);

      // 2. Profiles Table
      await client.query(`
        CREATE TABLE IF NOT EXISTS profiles (
          username VARCHAR(50) PRIMARY KEY REFERENCES users(username) ON DELETE CASCADE,
          firstname VARCHAR(50),
          lastname VARCHAR(50),
          email VARCHAR(100),
          phone VARCHAR(20),
          address TEXT
        )
      `);

      await client.query('ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar TEXT');

      // 3. Products Table
      await client.query(`
        CREATE TABLE IF NOT EXISTS products (
          id VARCHAR(50) PRIMARY KEY,
          name VARCHAR(100) NOT NULL,
          name_en VARCHAR(100),
          brand VARCHAR(50) NOT NULL,
          category VARCHAR(50) NOT NULL,
          price NUMERIC(12, 2) NOT NULL,
          stock INT NOT NULL DEFAULT 0,
          color VARCHAR(50),
          stroke_color VARCHAR(50),
          is_gold_face BOOLEAN DEFAULT FALSE,
          image VARCHAR(255),
          image_back VARCHAR(255)
        )
      `);

      // Run migrates to make sure columns exist
      await client.query('ALTER TABLE products ADD COLUMN IF NOT EXISTS name_en VARCHAR(100)');
      await client.query('ALTER TABLE products ADD COLUMN IF NOT EXISTS image VARCHAR(255)');
      await client.query('ALTER TABLE products ADD COLUMN IF NOT EXISTS image_back VARCHAR(255)');

      // 4. Orders Table
      await client.query(`
        CREATE TABLE IF NOT EXISTS orders (
          id VARCHAR(50) PRIMARY KEY,
          user_id VARCHAR(50) NOT NULL,
          items JSONB NOT NULL,
          total NUMERIC(12, 2) NOT NULL,
          email VARCHAR(100) NOT NULL,
          address TEXT NOT NULL,
          payment VARCHAR(50) NOT NULL,
          status VARCHAR(20) NOT NULL,
          date VARCHAR(50) NOT NULL,
          slip TEXT
        )
      `);

      // 5. Pending Watches Table
      await client.query(`
        CREATE TABLE IF NOT EXISTS pending_watches (
          id VARCHAR(50) PRIMARY KEY,
          brand VARCHAR(50) NOT NULL,
          model VARCHAR(100) NOT NULL,
          price NUMERIC(12, 2) NOT NULL,
          proposed_banding VARCHAR(50) NOT NULL,
          dial_color VARCHAR(50),
          description TEXT,
          seller_name VARCHAR(100) NOT NULL,
          seller_email VARCHAR(100) NOT NULL,
          inspection_status VARCHAR(20) DEFAULT 'pending',
          import_status VARCHAR(20) DEFAULT 'pending',
          date VARCHAR(50) NOT NULL
        )
      `);

      // 6. Blacklist Table
      await client.query(`
        CREATE TABLE IF NOT EXISTS blacklist (
          email VARCHAR(100) PRIMARY KEY,
          national_id VARCHAR(50) NOT NULL,
          reason TEXT
        )
      `);

      // 7. Logs Table
      await client.query(`
        CREATE TABLE IF NOT EXISTS logs (
          id SERIAL PRIMARY KEY,
          timestamp TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
          message TEXT NOT NULL
        )
      `);

      // 8. Reviews Table
      await client.query(`
        CREATE TABLE IF NOT EXISTS reviews (
          id SERIAL PRIMARY KEY,
          product_id VARCHAR(50) NOT NULL REFERENCES products(id) ON DELETE CASCADE,
          username VARCHAR(50) NOT NULL REFERENCES users(username) ON DELETE CASCADE,
          rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
          comment TEXT NOT NULL,
          date VARCHAR(50) NOT NULL
        )
      `);

      // Seeds if tables are empty or old placeholders exist
      const userCheck = await client.query('SELECT COUNT(*) FROM users');
      if (parseInt(userCheck.rows[0].count) === 0) {
        for (const u of defaultUsers) {
          await client.query('INSERT INTO users (username, password, role) VALUES ($1, $2, $3)', [u.username, u.password, u.role]);
        }
      }

      const prodCheck = await client.query('SELECT COUNT(*) FROM products');
      // Seed missing products or if table has old placeholders
      if (parseInt(prodCheck.rows[0].count) < defaultProducts.length) {
        for (const p of defaultProducts) {
          await client.query(
            `INSERT INTO products (id, name, name_en, brand, category, price, stock, color, stroke_color, is_gold_face, image, image_back)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
             ON CONFLICT (id) DO NOTHING`,
            [p.id, p.name, p.nameEn || '', p.brand, p.category, p.price, p.stock, p.color || '', p.strokeColor || '', p.isGoldFace || false, p.image || '', p.imageBack || '']
          );
        }
        console.log('Seeded watch database with LUMINOX, SEIKO & TAG Heuer collections!');
      }

      const blacklistCheck = await client.query('SELECT COUNT(*) FROM blacklist');
      if (parseInt(blacklistCheck.rows[0].count) === 0) {
        for (const b of defaultBlacklist) {
          await client.query('INSERT INTO blacklist (email, national_id, reason) VALUES ($1, $2, $3)', [b.email, b.nationalId, b.reason]);
        }
      }

      console.log('PostgreSQL Database connected & tables initialized.');
    } catch (err: any) {
      console.warn('Postgres query failed during init, switching to Local JSON fallback:', err?.message || err);
      useFallback = true;
      readJsonDb();
    } finally {
      client.release();
    }
  },

  getProducts: async (): Promise<Product[]> => {
    if (useFallback) {
      const data = readJsonDb();
      return data.products.map(p => {
        const prodReviews = data.reviews.filter(r => r.productId === p.id);
        const avgRating = prodReviews.length > 0
          ? prodReviews.reduce((sum, r) => sum + r.rating, 0) / prodReviews.length
          : 0.0;
        return {
          ...p,
          rating: avgRating,
          reviewCount: prodReviews.length
        };
      });
    }
    const res = await pool.query(
      `SELECT p.id, p.name, p.name_en as "nameEn", p.brand, p.category, CAST(p.price AS FLOAT) as price, p.stock, p.color,
              p.stroke_color as "strokeColor", p.is_gold_face as "isGoldFace", p.image, p.image_back as "imageBack",
              COALESCE(AVG(r.rating), 0.0) as rating,
              COUNT(r.id) as "reviewCount"
       FROM products p
       LEFT JOIN reviews r ON p.id = r.product_id
       GROUP BY p.id, p.name, p.name_en, p.brand, p.category, p.price, p.stock, p.color, p.stroke_color, p.is_gold_face, p.image, p.image_back
       ORDER BY length(p.id) ASC, p.id ASC`
    );
    return res.rows.map(row => ({
      ...row,
      rating: parseFloat(row.rating),
      reviewCount: parseInt(row.reviewCount, 10)
    }));
  },

  saveProducts: async (products: Product[]): Promise<void> => {
    if (useFallback) {
      const data = readJsonDb();
      for (const p of products) {
        const idx = data.products.findIndex(pr => pr.id === p.id);
        if (idx > -1) {
          data.products[idx] = { ...data.products[idx], ...p };
        } else {
          data.products.push(p);
        }
      }
      writeJsonDb(data);
      return;
    }
    for (const p of products) {
      await pool.query(
        `INSERT INTO products (id, name, name_en, brand, category, price, stock, color, stroke_color, is_gold_face, image, image_back)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
         ON CONFLICT (id) DO UPDATE SET
           name = EXCLUDED.name,
           name_en = EXCLUDED.name_en,
           brand = EXCLUDED.brand,
           category = EXCLUDED.category,
           price = EXCLUDED.price,
           stock = EXCLUDED.stock,
           color = EXCLUDED.color,
           stroke_color = EXCLUDED.stroke_color,
           is_gold_face = EXCLUDED.is_gold_face,
           image = EXCLUDED.image,
           image_back = EXCLUDED.image_back`,
        [p.id, p.name, p.nameEn || '', p.brand, p.category, p.price, p.stock, p.color || '', p.strokeColor || '', p.isGoldFace || false, p.image || '', p.imageBack || '']
      );
    }
  },

  forceReseedProducts: async (): Promise<void> => {
    if (useFallback) {
      const data = readJsonDb();
      data.products = [...defaultProducts];
      data.reviews = [];
      writeJsonDb(data);
      return;
    }
    const client = await pool.connect();
    try {
      await client.query('DELETE FROM reviews');
      await client.query('DELETE FROM products');
      for (const p of defaultProducts) {
        await client.query(
          `INSERT INTO products (id, name, name_en, brand, category, price, stock, color, stroke_color, is_gold_face, image, image_back)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
          [p.id, p.name, p.nameEn || '', p.brand, p.category, p.price, p.stock, p.color || '', p.strokeColor || '', p.isGoldFace || false, p.image || '', p.imageBack || '']
        );
      }
      console.log(`Force reseeded ${defaultProducts.length} products (LUMINOX & SEIKO collections).`);
    } finally {
      client.release();
    }
  },

  addProduct: async (p: Product): Promise<void> => {
    if (useFallback) {
      const data = readJsonDb();
      data.products.push(p);
      writeJsonDb(data);
      return;
    }
    await pool.query(
      `INSERT INTO products (id, name, name_en, brand, category, price, stock, color, stroke_color, is_gold_face, image, image_back)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
      [p.id, p.name, p.nameEn || '', p.brand, p.category, p.price, p.stock, p.color || '', p.strokeColor || '', p.isGoldFace || false, p.image || '', p.imageBack || '']
    );
  },

  updateProduct: async (id: string, p: Partial<Product>): Promise<void> => {
    if (useFallback) {
      const data = readJsonDb();
      const idx = data.products.findIndex(pr => pr.id === id);
      if (idx > -1) {
        data.products[idx] = { ...data.products[idx], ...p };
        writeJsonDb(data);
      }
      return;
    }
    const fields: string[] = [];
    const values: any[] = [];
    let idx = 1;

    if (p.name !== undefined) { fields.push(`name = $${idx++}`); values.push(p.name); }
    if (p.brand !== undefined) { fields.push(`brand = $${idx++}`); values.push(p.brand); }
    if (p.category !== undefined) { fields.push(`category = $${idx++}`); values.push(p.category); }
    if (p.price !== undefined) { fields.push(`price = $${idx++}`); values.push(p.price); }
    if (p.stock !== undefined) { fields.push(`stock = $${idx++}`); values.push(p.stock); }
    if (p.color !== undefined) { fields.push(`color = $${idx++}`); values.push(p.color); }
    if (p.strokeColor !== undefined) { fields.push(`stroke_color = $${idx++}`); values.push(p.strokeColor); }
    if (p.isGoldFace !== undefined) { fields.push(`is_gold_face = $${idx++}`); values.push(p.isGoldFace); }
    if (p.image !== undefined) { fields.push(`image = $${idx++}`); values.push(p.image); }
    if (p.imageBack !== undefined) { fields.push(`image_back = $${idx++}`); values.push(p.imageBack); }

    if (fields.length === 0) return;

    values.push(id);
    await pool.query(`UPDATE products SET ${fields.join(', ')} WHERE id = $${idx}`, values);
  },

  deleteProduct: async (id: string): Promise<void> => {
    if (useFallback) {
      const data = readJsonDb();
      data.products = data.products.filter(pr => pr.id !== id);
      data.reviews = data.reviews.filter(r => r.productId !== id);
      writeJsonDb(data);
      return;
    }
    await pool.query('DELETE FROM products WHERE id = $1', [id]);
  },

  getUsers: async (): Promise<User[]> => {
    if (useFallback) {
      const data = readJsonDb();
      return data.users;
    }
    const res = await pool.query('SELECT username, password, role FROM users');
    return res.rows;
  },

  updateUser: async (username: string, role: string, password?: string): Promise<void> => {
    if (useFallback) {
      const data = readJsonDb();
      const idx = data.users.findIndex(u => u.username === username);
      if (idx > -1) {
        data.users[idx].role = role as any;
        if (password) data.users[idx].password = password;
        writeJsonDb(data);
      }
      return;
    }
    if (password) {
      await pool.query('UPDATE users SET role = $1, password = $2 WHERE username = $3', [role, password, username]);
    } else {
      await pool.query('UPDATE users SET role = $1 WHERE username = $2', [role, username]);
    }
  },

  deleteUser: async (username: string): Promise<void> => {
    if (useFallback) {
      const data = readJsonDb();
      data.users = data.users.filter(u => u.username !== username);
      if (data.profiles[username]) {
        delete data.profiles[username];
      }
      writeJsonDb(data);
      return;
    }
    await pool.query('DELETE FROM users WHERE username = $1', [username]);
  },

  saveUsers: async (users: User[]): Promise<void> => {
    if (useFallback) {
      const data = readJsonDb();
      for (const u of users) {
        const idx = data.users.findIndex(us => us.username === u.username);
        if (idx > -1) {
          data.users[idx] = { ...data.users[idx], ...u };
        } else {
          data.users.push(u);
        }
      }
      writeJsonDb(data);
      return;
    }
    for (const u of users) {
      await pool.query(
        'INSERT INTO users (username, password, role) VALUES ($1, $2, $3) ON CONFLICT (username) DO UPDATE SET password = EXCLUDED.password, role = EXCLUDED.role',
        [u.username, u.password, u.role]
      );
    }
  },

  addUser: async (u: User): Promise<void> => {
    if (useFallback) {
      const data = readJsonDb();
      data.users.push(u);
      writeJsonDb(data);
      return;
    }
    await pool.query('INSERT INTO users (username, password, role) VALUES ($1, $2, $3)', [u.username, u.password, u.role]);
  },

  getProfiles: async (): Promise<Record<string, Profile>> => {
    if (useFallback) {
      const data = readJsonDb();
      return data.profiles;
    }
    const res = await pool.query('SELECT username, firstname, lastname, email, phone, address, avatar FROM profiles');
    const profiles: Record<string, Profile> = {};
    res.rows.forEach(row => {
      profiles[row.username] = {
        firstname: row.firstname,
        lastname: row.lastname,
        email: row.email,
        phone: row.phone,
        address: row.address,
        avatar: row.avatar
      };
    });
    return profiles;
  },

  getProfile: async (username: string): Promise<Profile | null> => {
    if (useFallback) {
      const data = readJsonDb();
      return data.profiles[username] || null;
    }
    const res = await pool.query('SELECT firstname, lastname, email, phone, address, avatar FROM profiles WHERE username = $1', [username]);
    if (res.rows.length === 0) return null;
    return res.rows[0];
  },

  saveProfile: async (username: string, profile: Profile): Promise<void> => {
    if (useFallback) {
      const data = readJsonDb();
      const existing = data.profiles[username] || { firstname: '', lastname: '', email: '', phone: '', address: '', avatar: '' };
      data.profiles[username] = {
        ...existing,
        ...profile,
        avatar: profile.avatar !== undefined ? profile.avatar : existing.avatar
      };
      writeJsonDb(data);
      return;
    }
    if (profile.avatar !== undefined) {
      await pool.query(
        `INSERT INTO profiles (username, firstname, lastname, email, phone, address, avatar)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (username) DO UPDATE SET
           firstname = EXCLUDED.firstname,
           lastname = EXCLUDED.lastname,
           email = EXCLUDED.email,
           phone = EXCLUDED.phone,
           address = EXCLUDED.address,
           avatar = EXCLUDED.avatar`,
        [username, profile.firstname, profile.lastname, profile.email, profile.phone, profile.address, profile.avatar]
      );
    } else {
      await pool.query(
        `INSERT INTO profiles (username, firstname, lastname, email, phone, address)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (username) DO UPDATE SET
           firstname = EXCLUDED.firstname,
           lastname = EXCLUDED.lastname,
           email = EXCLUDED.email,
           phone = EXCLUDED.phone,
           address = EXCLUDED.address`,
        [username, profile.firstname, profile.lastname, profile.email, profile.phone, profile.address]
      );
    }
  },

  saveProfiles: async (profiles: Record<string, Profile>): Promise<void> => {
    if (useFallback) {
      const data = readJsonDb();
      for (const username of Object.keys(profiles)) {
        data.profiles[username] = { ...(data.profiles[username] || {}), ...profiles[username] };
      }
      writeJsonDb(data);
      return;
    }
    for (const username of Object.keys(profiles)) {
      await db.saveProfile(username, profiles[username]);
    }
  },

  getOrders: async (): Promise<Order[]> => {
    if (useFallback) {
      const data = readJsonDb();
      return data.orders;
    }
    const res = await pool.query('SELECT id, user_id as "userId", items, CAST(total AS FLOAT) as total, email, address, payment, status, date, slip FROM orders');
    return res.rows;
  },

  saveOrders: async (orders: Order[]): Promise<void> => {
    if (useFallback) {
      const data = readJsonDb();
      for (const o of orders) {
        const idx = data.orders.findIndex(ord => ord.id === o.id);
        if (idx > -1) {
          data.orders[idx] = { ...data.orders[idx], ...o };
        } else {
          data.orders.push(o);
        }
      }
      writeJsonDb(data);
      return;
    }
    for (const o of orders) {
      await pool.query(
        `INSERT INTO orders (id, user_id, items, total, email, address, payment, status, date, slip)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         ON CONFLICT (id) DO UPDATE SET
           status = EXCLUDED.status,
           slip = EXCLUDED.slip`,
        [o.id, o.userId, JSON.stringify(o.items), o.total, o.email, o.address, o.payment, o.status, o.date, o.slip]
      );
    }
  },

  addOrder: async (o: Order): Promise<void> => {
    if (useFallback) {
      const data = readJsonDb();
      data.orders.push(o);
      writeJsonDb(data);
      return;
    }
    await pool.query(
      'INSERT INTO orders (id, user_id, items, total, email, address, payment, status, date, slip) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)',
      [o.id, o.userId, JSON.stringify(o.items), o.total, o.email, o.address, o.payment, o.status, o.date, o.slip]
    );
  },

  updateOrderStatus: async (id: string, status: string): Promise<void> => {
    if (useFallback) {
      const data = readJsonDb();
      const idx = data.orders.findIndex(ord => ord.id === id);
      if (idx > -1) {
        data.orders[idx].status = status;
        writeJsonDb(data);
      }
      return;
    }
    await pool.query('UPDATE orders SET status = $1 WHERE id = $2', [status, id]);
  },

  updateOrderSlip: async (id: string, slip: string, status: string): Promise<void> => {
    if (useFallback) {
      const data = readJsonDb();
      const idx = data.orders.findIndex(ord => ord.id === id);
      if (idx > -1) {
        data.orders[idx].slip = slip;
        data.orders[idx].status = status;
        writeJsonDb(data);
      }
      return;
    }
    await pool.query('UPDATE orders SET slip = $1, status = $2 WHERE id = $3', [slip, status, id]);
  },

  getPendingWatches: async (): Promise<PendingWatch[]> => {
    if (useFallback) {
      const data = readJsonDb();
      return data.pendingWatches;
    }
    const res = await pool.query(
      `SELECT id, brand, model, CAST(price AS FLOAT) as price, proposed_banding as "proposedBanding",
              dial_color as "dialColor", description, seller_name as "sellerName", seller_email as "sellerEmail",
              inspection_status as "inspectionStatus", import_status as "importStatus", date FROM pending_watches`
    );
    return res.rows;
  },

  savePendingWatches: async (watches: PendingWatch[]): Promise<void> => {
    if (useFallback) {
      const data = readJsonDb();
      for (const w of watches) {
        const idx = data.pendingWatches.findIndex(wat => wat.id === w.id);
        if (idx > -1) {
          data.pendingWatches[idx] = { ...data.pendingWatches[idx], ...w };
        } else {
          data.pendingWatches.push(w);
        }
      }
      writeJsonDb(data);
      return;
    }
    for (const w of watches) {
      await pool.query(
        `INSERT INTO pending_watches (id, brand, model, price, proposed_banding, dial_color, description, seller_name, seller_email, inspection_status, import_status, date)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
         ON CONFLICT (id) DO UPDATE SET
           inspection_status = EXCLUDED.inspection_status,
           import_status = EXCLUDED.import_status`,
        [w.id, w.brand, w.model, w.price, w.proposedBanding, w.dialColor, w.description, w.sellerName, w.sellerEmail, w.inspectionStatus, w.importStatus, w.date]
      );
    }
  },

  addPendingWatch: async (w: PendingWatch): Promise<void> => {
    if (useFallback) {
      const data = readJsonDb();
      data.pendingWatches.push({
        ...w,
        inspectionStatus: w.inspectionStatus || 'pending',
        importStatus: w.importStatus || 'pending'
      });
      writeJsonDb(data);
      return;
    }
    await pool.query(
      `INSERT INTO pending_watches (id, brand, model, price, proposed_banding, dial_color, description, seller_name, seller_email, inspection_status, import_status, date)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
      [w.id, w.brand, w.model, w.price, w.proposedBanding, w.dialColor, w.description, w.sellerName, w.sellerEmail, w.inspectionStatus || 'pending', w.importStatus || 'pending', w.date]
    );
  },

  updatePendingWatchInspection: async (id: string, status: 'passed' | 'failed'): Promise<void> => {
    if (useFallback) {
      const data = readJsonDb();
      const idx = data.pendingWatches.findIndex(w => w.id === id);
      if (idx > -1) {
        data.pendingWatches[idx].inspectionStatus = status;
        writeJsonDb(data);
      }
      return;
    }
    await pool.query('UPDATE pending_watches SET inspection_status = $1 WHERE id = $2', [status, id]);
  },

  updatePendingWatchImport: async (id: string, status: 'imported'): Promise<void> => {
    if (useFallback) {
      const data = readJsonDb();
      const idx = data.pendingWatches.findIndex(w => w.id === id);
      if (idx > -1) {
        data.pendingWatches[idx].importStatus = status;
        writeJsonDb(data);
      }
      return;
    }
    await pool.query('UPDATE pending_watches SET import_status = $1 WHERE id = $2', [status, id]);
  },

  getBlacklist: async (): Promise<BlacklistEntry[]> => {
    if (useFallback) {
      const data = readJsonDb();
      return data.blacklist;
    }
    const res = await pool.query('SELECT email, national_id as "nationalId", reason FROM blacklist');
    return res.rows;
  },

  saveBlacklist: async (blacklist: BlacklistEntry[]): Promise<void> => {
    if (useFallback) {
      const data = readJsonDb();
      for (const b of blacklist) {
        const idx = data.blacklist.findIndex(bl => bl.email === b.email);
        if (idx > -1) {
          data.blacklist[idx] = { ...data.blacklist[idx], ...b };
        } else {
          data.blacklist.push(b);
        }
      }
      writeJsonDb(data);
      return;
    }
    for (const b of blacklist) {
      await pool.query(
        'INSERT INTO blacklist (email, national_id, reason) VALUES ($1, $2, $3) ON CONFLICT (email) DO UPDATE SET national_id = EXCLUDED.national_id, reason = EXCLUDED.reason',
        [b.email, b.nationalId, b.reason]
      );
    }
  },

  getLogs: async (): Promise<LogEntry[]> => {
    if (useFallback) {
      const data = readJsonDb();
      return data.logs;
    }
    const res = await pool.query('SELECT timestamp, message FROM logs ORDER BY timestamp ASC');
    return res.rows.map(row => ({
      timestamp: row.timestamp.toISOString(),
      message: row.message
    }));
  },

  saveLogs: async (logs: LogEntry[]): Promise<void> => {
    if (useFallback) {
      const data = readJsonDb();
      for (const l of logs) {
        if (!data.logs.some(lo => lo.timestamp === l.timestamp && lo.message === l.message)) {
          data.logs.push(l);
        }
      }
      writeJsonDb(data);
      return;
    }
    for (const l of logs) {
      await pool.query('INSERT INTO logs (timestamp, message) VALUES ($1, $2) ON CONFLICT DO NOTHING', [l.timestamp, l.message]);
    }
  },

  addLog: async (message: string): Promise<void> => {
    console.log(`[LOG]: ${message}`);
    if (useFallback) {
      const data = readJsonDb();
      data.logs.push({
        timestamp: new Date().toISOString(),
        message
      });
      writeJsonDb(data);
      return;
    }
    await pool.query('INSERT INTO logs (message) VALUES ($1)', [message]);
  },

  getReviews: async (productId: string): Promise<Review[]> => {
    if (useFallback) {
      const data = readJsonDb();
      return data.reviews.filter(r => r.productId === productId).reverse();
    }
    const res = await pool.query(
      `SELECT id, product_id as "productId", username, rating, comment, date 
       FROM reviews WHERE product_id = $1 ORDER BY id DESC`,
      [productId]
    );
    return res.rows;
  },

  addReview: async (r: Review): Promise<void> => {
    if (useFallback) {
      const data = readJsonDb();
      data.reviews.push({
        ...r,
        id: data.reviews.length + 1
      });
      writeJsonDb(data);
      return;
    }
    await pool.query(
      `INSERT INTO reviews (product_id, username, rating, comment, date)
       VALUES ($1, $2, $3, $4, $5)`,
      [r.productId, r.username, r.rating, r.comment, r.date]
    );
  }
};
