# Fleet Desk — ระบบจัดการรถเช่ารายวัน

ระบบจัดการธุรกิจรถเช่า ครอบคลุม กองรถ · คิวงาน · งานเช่า · ประวัติ · เบิกเงิน · บัญชี

---

## เริ่มต้นใช้งาน

```bash
npm install        # ติดตั้งครั้งแรกครั้งเดียว
npm run build      # สร้างไฟล์เว็บ -> build/fleet-desk-web.html
npm test           # รันเทสต์ทั้งหมด
npm run check      # เทสต์ + build (ใช้ก่อน deploy ทุกครั้ง)
```

เปิดไฟล์ `build/fleet-desk-web.html` ในเบราว์เซอร์ได้เลย ไม่ต้องต่อเซิร์ฟเวอร์

---

## โครงสร้างโปรเจกต์

```
fleet-desk/
├── src/
│   ├── App.jsx           ← โค้ดหลักทั้งหมด
│   ├── entry.jsx         ← จุดเริ่มต้น (mount React)
│   └── tw-input.css      ← ไฟล์ตั้งต้นของ Tailwind
├── docs/
│   ├── fleet-desk-architecture.md      ← อ่านอันนี้ก่อน
│   ├── fleet-db-schema.md              ← โครงสร้างฐานข้อมูลเป้าหมาย
│   ├── fleet-desk-buildlog.md          ← ประวัติการตัดสินใจ + บั๊กที่เคยเจอ
│   └── คู่มือทำเว็บ-สำหรับเจ้าของธุรกิจ.md
├── tests/
│   ├── smoke-test.cjs    ← render แอปจริง กดทุกแท็บ นับ error
│   └── privacy-test.cjs  ← ตรวจว่าข้อมูลลูกค้าไม่รั่วหน้าสาธารณะ
├── scripts/build.cjs
└── build/                ← ผลลัพธ์ (ไม่เก็บใน git)
```

---

## กฎที่ต้องรู้ก่อนแก้โค้ด

**1. รันเทสต์ก่อน commit เสมอ**
```bash
npm test
```
`esbuild ผ่าน` ไม่ได้แปลว่าโปรแกรมรันได้ — เคยเกิดจริง: ใช้ตัวแปรที่ไม่เคยประกาศ คอมไพล์ผ่าน แต่แอปหน้าขาวทุกเครื่อง

**2. ห้ามประกาศ component ข้างใน component body**
ทำให้ React สร้างใหม่ทุก render → ช่องกรอกพิมพ์ได้ตัวเดียว (เคยเกิดจริง)

**3. ห้ามวาง React hook หลัง early return**
ทำให้ crash ตอนสลับหน้าจอ (เคยเกิดจริง)

**4. เงินต้องทศนิยม 2 ตำแหน่ง**
ใช้ `fmt()` สำหรับเงิน · `fmtInt()` สำหรับจำนวนนับ

**5. ห้ามใช้ `toISOString()` กับวันที่**
timezone เพี้ยนที่ UTC+7 ใช้ `addDays()` ที่เขียนไว้แล้ว

**6. หน้าลูกค้าห้ามแตะ `scheduleEvents` ดิบ**
ต้องอ่านจาก `publicEvents` ที่ตัดข้อมูลระบุตัวตนออกแล้ว (PDPA)

**7. build ต้องใช้ `--target=es2019`**
ห้ามใช้ `esnext` — Safari เก่า parse ไม่ผ่านแล้วหน้าขาว

---

## เชื่อมต่อ GitHub (ทำครั้งแรกครั้งเดียว)

```bash
# 1. สร้าง repo เปล่าบน github.com (อย่าติ๊ก "Add README")
# 2. เชื่อมแล้วส่งขึ้น
git remote add origin https://github.com/<ชื่อผู้ใช้>/fleet-desk.git
git branch -M main
git push -u origin main
```

ครั้งต่อไปแค่:
```bash
git add -A
git commit -m "อธิบายว่าแก้อะไร"
git push
```

---

## สถานะปัจจุบัน

| | สถานะ |
|---|---|
| Frontend | ✅ ใช้งานได้ |
| Backend | ❌ ยังไม่มี |
| Database | ❌ ยังไม่มี — ข้อมูลอยู่ใน localStorage เท่านั้น |

**ข้อจำกัดสำคัญ:** ข้อมูลเก็บในเบราว์เซอร์เครื่องเดียว · พื้นที่ ~5 MB (เก็บงานที่เอกสารครบได้ 3-5 งาน) · Safari ลบทิ้งถ้าไม่เข้าเว็บเกิน 7 วัน

รายละเอียดและแผนขั้นต่อไป ดู `docs/fleet-desk-architecture.md` หัวข้อ 9
