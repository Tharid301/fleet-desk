# โครงสร้างฐานข้อมูล — ระบบจัดการรถเช่ารายวัน

หลักคิดสำคัญที่ต่างจาก prototype: **prototype เก็บตัวเลขสรุปไว้ตรงๆ** (เช่น `car.income = 18900`) แต่ระบบจริงต้องเก็บ **รายการธุรกรรมทีละรายการ** (ledger) แล้วค่อยคำนวณสรุป (SUM/GROUP BY) ตอน query — ข้อดีคือ ตรวจสอบย้อนหลังได้ทุกบาท, แก้ไข/ลบมีร่องรอย, และคำนวณรายเดือน/รายปีได้แม่นยำจากข้อมูลจริงแทนเลขที่พิมพ์ไว้ล่วงหน้า

ดูภาพรวมความสัมพันธ์ตารางได้ที่ `fleet-db-erd.mermaid` · ประวัติการพัฒนาและการตัดสินใจที่ `fleet-desk-buildlog.md`

> **อัปเดต 16 ก.ย. 2569:** เพิ่มหัวข้อ 7 "ฟิลด์ที่เพิ่มหลังออกแบบครั้งแรก" ให้ตรงกับ prototype ปัจจุบัน
> หัวข้อ 1–6 เป็นแบบออกแบบดั้งเดิม ยังใช้ได้ แต่ต้องอ่านคู่กับหัวข้อ 7

---

## 1. กลุ่มข้อมูลรถ (Fleet)

### `vehicles`
ข้อมูลหลักของรถแต่ละคัน
| Field | Type | หมายเหตุ |
|---|---|---|
| id | PK | |
| plate_number | string | ทะเบียน |
| province | string | |
| brand, model | string | |
| category | enum | eco_car / sedan / hatchback / suv / ppv / pickup / mpv_van |
| fuel_type | enum | gasoline / diesel / hybrid / phev / ev |
| doors | int | 4 / 5 |
| has_bed | bool | มีกระบะหรือไม่ |
| status | enum | available / rented / washing / repair / retired |
| daily_rate | decimal | ค่าเช่าอ้างอิงต่อวัน (ราคาจริงต่อสัญญาอาจต่างกันได้ → เก็บใน `rental_contracts.daily_rate_agreed`) |
| purchase_cost | decimal | ราคาซื้อ ใช้คิดค่าเสื่อม |
| salvage_value | decimal | มูลค่าซากประมาณเมื่อครบอายุใช้งาน (ถ้า 0 ก็ได้ แต่นักบัญชีมักตั้งไว้เผื่อขายต่อ) |
| depreciation_years | int | อายุใช้งานที่คิดค่าเสื่อม |
| purchase_date | date | ใช้อ้างอิงเริ่มคิดค่าเสื่อม |
| mileage | int | อัปเดตทุกครั้งที่คืนรถ |
| registration_expiry | date | ต่อภาษีรถ |
| insurance_expiry | date | ต่อประกัน/พ.ร.บ. |

### `vehicle_photos`
รูปรถ (หลายรูปต่อคัน — รูปหลัก 1 รูป + มุมอื่นๆ)
`id, vehicle_id FK, photo_url, is_primary, uploaded_at`

### `loans` + `loan_payments`
แยกจากกัน เพราะ "สัญญาเงินกู้" (ผ่อนเดือนละเท่าไหร่ กี่เดือน) กับ "การจ่ายจริงแต่ละงวด" เป็นคนละเรื่อง — ถ้าผ่อนไม่ตรงงวดหรือโปะบางเดือน ต้องเห็นเป็นรายการแยกได้

`loans`: `id, vehicle_id FK, lender_name, principal_amount, monthly_payment, interest_rate_pct, start_date, term_months, status`

`loan_payments`: `id, loan_id FK, payment_date, amount, principal_portion, interest_portion`
— แยกเงินต้น/ดอกเบี้ยต่องวด เพราะ **มีแค่ดอกเบี้ยเท่านั้นที่เป็นค่าใช้จ่ายทางบัญชี** เงินต้นคือการลดหนี้สิน ไม่ใช่รายจ่ายในงบกำไรขาดทุน

---

## 2. กลุ่มข้อมูลลูกค้า/สัญญาเช่า

### `customers`
`id, full_name, id_card_number, driver_license_number, phone, email, address, blacklist_flag, blacklist_reason`
> id_card_number ควรเข้ารหัส/มาสก์บางส่วนตอนแสดงผล เพราะเป็นข้อมูลอ่อนไหวตาม PDPA

### `rental_contracts`
หัวใจของระบบ — ผูกรถ+ลูกค้า+ช่วงเวลา+เงื่อนไข
`id, vehicle_id FK, customer_id FK, start_datetime, end_datetime_planned, actual_return_datetime, daily_rate_agreed, deposit_amount, total_amount, late_fee, damage_fee, fuel_level_out, fuel_level_in, mileage_out, mileage_in, status(booked/ongoing/completed/cancelled), contract_pdf_url, created_by_staff_id`

### `vehicle_condition_photos`
รูปสภาพรถก่อน/หลังเช่า ผูกกับสัญญา — กันข้อพิพาทเรื่องรอยขีดข่วน
`id, rental_contract_id FK, photo_url, stage(before/after), uploaded_at`

---

## 3. กลุ่มตารางงาน/ซ่อมบำรุง

### `schedule_events`
เวอร์ชันเต็มของ "คิววันนี้" ในหน้าปฏิทิน ใส่ `scheduled_at` เป็น datetime จริง (ไม่ผูกกับแค่ "วันนี้") จะได้ดูคิวล่วงหน้า/ย้อนหลังได้
`id, vehicle_id FK, event_type(pickup/dropoff/wash/repair/maintenance/other), scheduled_at, completed_at, related_contract_id FK nullable, assigned_staff_id FK nullable, note`

### `maintenance_records`
ประวัติซ่อม/เช็คระยะแบบละเอียด แยกจาก schedule_events เพราะต้องเก็บข้อมูลเชิงบัญชี/เชิงเทคนิคเพิ่ม (ค่าใช้จ่าย, เลขไมล์ตอนเข้าศูนย์, ใบเสร็จ)
`id, vehicle_id FK, type, description, cost, vendor_name, odometer_at_service, service_date, next_service_due_date, next_service_due_km, invoice_url`
> `cost` ในตารางนี้ควรมี `transactions` แถวคู่กันเสมอ (ผูกผ่าน reference) เพื่อให้ตัวเลขไปโผล่ในงบกำไรขาดทุนอัตโนมัติ

---

## 4. กลุ่มบุคลากร

### `staff`
`id, name, position, is_owner, phone, start_date, end_date, status(active/resigned)`

### `salary_history`
**ตัวที่ตอบโจทย์ที่คุยกันไว้** — เก็บเป็นประวัติ ไม่ใช่ตัวเลขเดียวที่แก้ทับ
`id, staff_id FK, monthly_salary, effective_from, effective_to(null=ปัจจุบัน), note`

วิธีใช้งาน: เวลาปรับเงินเดือน → ปิด record เก่าด้วย `effective_to = วันสิ้นเดือนก่อนปรับ` แล้วเปิด record ใหม่ `effective_from = วันที่มีผล` วิธีนี้ทำให้ query "เงินเดือนรวมของเดือน X" ย้อนหลังได้ถูกต้องเสมอ ไม่ว่าจะแก้ข้อมูลตอนไหนก็ตาม

---

## 5. กลุ่มบัญชี/การเงิน (ส่วนสำคัญที่สุด)

### `chart_of_accounts` (ผังบัญชี)
กำหนดหมวดหมู่มาตรฐานไว้ล่วงหน้า เช่น
| code | name | account_type |
|---|---|---|
| 4000 | รายได้ค่าเช่ารถ | revenue |
| 4100 | รายได้อื่น (ค่าปรับ, ค่าเสียหาย) | revenue |
| 5100 | ค่าน้ำมัน/ไฟฟ้า | variable_cost |
| 5200 | ค่าล้างรถ | variable_cost |
| 5300 | ค่าซ่อมบำรุง | variable_cost |
| 5400 | ค่าประกันภัย/พ.ร.บ. | fixed_cost |
| 6100 | เงินเดือนพนักงาน+เจ้าของ | overhead |
| 6200 | ค่าเช่าที่จอด/ออฟฟิศ | overhead |
| 6300 | การตลาด | overhead |
| 6400 | ค่าคอมมิชชั่นแพลตฟอร์ม | overhead |
| 7100 | ค่าเสื่อมราคา | depreciation |
| 7200 | ดอกเบี้ยจ่าย | interest |

### `transactions` (สมุดรายวัน / general ledger)
**นี่คือแหล่งข้อมูลจริงที่ทุกอย่างในแดชบอร์ดควรคำนวณมาจากตรงนี้**
`id, vehicle_id FK nullable, account_id FK, rental_contract_id FK nullable, staff_id FK nullable, loan_id FK nullable, transaction_type(income/expense), amount, transaction_date, description, payment_method, receipt_url, created_by_staff_id`

- `vehicle_id` เป็น null ได้สำหรับรายการระดับบริษัท (เช่น เงินเดือน, ค่าเช่าออฟฟิศ)
- รายได้ค่าเช่าแต่ละสัญญา → 1 แถวใน transactions ผูกกับ `rental_contract_id`
- ค่าน้ำมัน/ซ่อม/ล้าง แต่ละครั้ง → 1 แถว ผูกกับ `vehicle_id`
- จ่ายเงินเดือน → 1 แถวต่อคนต่อเดือน ผูกกับ `staff_id`
- จ่ายค่างวดรถ → มาจาก `loan_payments` (หรือ mirror เข้ามาเป็น transaction ที่ผูก `loan_id` ก็ได้ แล้วแต่สไตล์ระบบ)

### `recurring_expense_templates`
ค่าใช้จ่ายประจำที่เกิดซ้ำทุกเดือน (ค่าเช่าที่, ค่าคอม) ให้ระบบ auto-generate เป็นแถวใน `transactions` ทุกวันที่กำหนด แทนที่จะให้พนักงานพิมพ์เองทุกเดือน
`id, account_id FK, description, amount, day_of_month, active`

### `depreciation_entries`
บันทึกค่าเสื่อมราย "เดือน" ต่อคัน (คำนวณอัตโนมัติจาก `purchase_cost`, `salvage_value`, `depreciation_years` แต่ควร "จด" เป็น record ไว้ ไม่ใช่คำนวณสดทุกครั้ง เพราะต้องมี `accumulated_depreciation` และ `book_value_after` ไว้ดูมูลค่าทางบัญชีคงเหลือของรถแต่ละคัน — มีประโยชน์ตอนคิดขายรถต่อด้วย)
`id, vehicle_id FK, period_year_month, amount, accumulated_depreciation, book_value_after`

---

## 6. ระบบ/สิทธิ์การใช้งาน

### `users` + `audit_log`
`users`: `id, staff_id FK, username, password_hash, role(admin/staff/viewer), last_login`
`audit_log`: `id, user_id FK, action, table_name, record_id, old_value(json), new_value(json), created_at`
> audit_log สำคัญมากสำหรับระบบบัญชี — ถ้ามีใครแก้ไข/ลบรายการเงิน ต้องมีร่องรอยว่าใครแก้ ตอนไหน แก้จากอะไรเป็นอะไร กันพนักงานปรับตัวเลขโดยไม่มีใครรู้

---

## สรุป: จาก prototype → ของจริง เปลี่ยนอะไรบ้าง

| ใน prototype | ใน production DB |
|---|---|
| `car.income` (เลขนิ่ง) | `SUM(transactions.amount) WHERE vehicle_id=X AND type=income AND month=Y` |
| `car.expense.fuel` ฯลฯ | `SUM(transactions.amount) WHERE account_id=(ค่าน้ำมัน)` |
| `overhead.staff[]` เก็บเงินเดือนตรงๆ | `salary_history` (มี effective_from/to) |
| `car.loan.daysRentedThisMonth` (กดปุ่ม +/- เอง) | คำนวณจาก `rental_contracts` จริงที่ปิดสัญญาแล้วในเดือนนั้น |
| `car.today[]` | `schedule_events` ที่ query เฉพาะวันที่ต้องการ (ไม่ผูกกับ "วันนี้" ตายตัว) |
| กราฟรายเดือนแบบ mock array | materialized view หรือ query สรุปจาก `transactions` จริง |

แนะนำให้เริ่มจาก `vehicles`, `transactions`, `chart_of_accounts` ก่อน เพราะ 3 ตารางนี้คือแกนที่ทุกหน้าจอในแอปพึ่งพา ส่วน `rental_contracts`, `customers`, `salary_history` ค่อยต่อยอดตามลำดับการใช้งานจริง


---

## 7. ฟิลด์ที่เพิ่มหลังออกแบบครั้งแรก (sync กับ prototype 16 ก.ย. 2569)

แบบออกแบบเดิม (หัวข้อ 1–6) ทำไว้ก่อนพัฒนา หลังจากนั้นมีฟีเจอร์เพิ่มอีกมาก ส่วนนี้คือส่วนต่างที่ต้องเพิ่มเข้าไปตอนสร้าง DB จริง

### `vehicles` — เพิ่ม
| ฟิลด์ | ชนิด | ใช้ทำอะไร |
|---|---|---|
| color | string | สีรถ (ใช้ในข้อความส่งลูกค้าและ filter) |
| hourly_rate | decimal | ค่าเช่าต่อชั่วโมงสำหรับเศษเวลาไม่เกิน 3 ชม. |
| reservation_deposit | decimal | เงินมัดจำจอง **แยกตามรถแต่ละคัน** |
| security_deposit | decimal | เงินค้ำประกัน แยกตามรถแต่ละคัน |
| gps_monthly_fee | decimal | ค่า GPS รายเดือน |
| owner_type | enum | `page` (รถบริษัท) / `partner` (รถฝากขาย) |
| partner_name | string | ชื่อเจ้าของรถ กรณี partner |
| commission_pct | decimal | % ที่เพจหักจากรถ partner |
| withholding_pct | decimal | % หัก ณ ที่จ่าย |
| insurance_expiry | date | วันหมดอายุประกัน/พ.ร.บ. (ใช้เตือนล่วงหน้า 30 วัน) |
| tax_expiry | date | วันหมดอายุภาษีรถ |

> หมายเหตุ: schema เดิมมี `registration_expiry`/`insurance_expiry` อยู่แล้ว — ใน prototype ใช้ชื่อ `taxExpiry`/`insuranceExpiry` ตอนทำจริงให้เลือกใช้ชื่อเดียวกันทั้งระบบ

### `rental_contracts` (= bookings) — เพิ่ม
| ฟิลด์ | ชนิด | ใช้ทำอะไร |
|---|---|---|
| status | enum | `pending` (ลูกค้าจองเอง รอยืนยัน) / `active` / `completed` / `cancelled` |
| booking_source | enum | `customer` (จองออนไลน์เอง) / `staff` (เจ้าหน้าที่คีย์ให้) |
| travel_ticket_url | string | รูปตั๋วเครื่องบิน/รถทัวร์ ยืนยันตัวตนผู้จอง |
| reservation_slip_url | string | สลิปโอนเงินจอง |
| contract_doc_url | string | สัญญาเช่าที่เซ็นแล้ว (รองรับ PDF) |
| handover_photo_url | string | รูปตอนส่งมอบรถ |
| return_slip_url | string | สลิปคืนมัดจำตอนปิดงาน |
| terms_accepted_at | timestamp | เวลาที่ลูกค้ากดรับทราบเงื่อนไข (หลักฐานทางกฎหมาย) |
| actual_end_datetime | timestamp | เวลาคืนรถจริง ใช้คิดค่าปรับคืนช้า |
| reservation_deposit / pickup_day_payment / security_deposit | decimal | เงิน 3 ก้อน |
| *_paid flags | bool | จ่ายแล้วหรือยัง (ใช้คำนวณยอดค้างรับ) |
| deposit_refunded | bool | กรณียกเลิก คืนเงินจองหรือริบ |

**กฎ:** ปิดงาน (`completed`) ได้ต่อเมื่อมีครบ 4 ไฟล์: reservation_slip + contract_doc + handover_photo + return_slip

### ตารางใหม่ `settings`
เก็บข้อความที่แก้ไขได้จากหน้าแอป
`id, key, value(text), updated_at, updated_by`
ใช้กับ: เงื่อนไขสัญญาเช่า, เลขบัญชีธนาคาร (อาจมีหลายบัญชี → เก็บเป็น JSON array)

### สิ่งที่ prototype ยังทำไม่ได้ ต้องมีใน DB จริง
1. **ไฟล์แนบ** — prototype เก็บ base64 ในหน่วยความจำ ของจริงต้องอัปขึ้น object storage แล้วเก็บแค่ URL
2. **ล็อคการจองซ้ำ** — ต้องใช้ DB transaction/row lock ตอน insert booking กัน 2 คนจองคันเดียวเวลาเดียวกัน
3. **`transactions` ledger** — ตัวเลขรายได้/รายจ่ายทั้งหมดต้องมาจากตารางนี้ ไม่ใช่เก็บยอดสรุปไว้ที่ `vehicles` แบบ prototype
4. **`salary_history`** — มีในแบบแล้วแต่ prototype ยังไม่ได้ทำ UI
