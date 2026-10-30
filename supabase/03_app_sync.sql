-- ============================================================
-- Fleet Desk — 03: ต่อแอปเข้ากับฐานข้อมูล + ข้อมูลตั้งต้นของร้าน
-- ============================================================
-- รันหลัง 02_public_booking.sql · ปลอดภัยที่จะรันซ้ำ
--
-- สิ่งที่เพิ่ม:
--   1. บัญชีที่ถูกปิด (is_active = false) ไม่มีสิทธิ์ใดๆ
--   2. ผู้ใช้ใหม่ได้แถวใน profiles อัตโนมัติ แต่ "ยังไม่เปิดใช้" จนเจ้าของกดเปิด
--   3. คอลัมน์ app_extra เก็บข้อมูลจากแอปที่ยังไม่มีคอลัมน์ของตัวเอง (กันข้อมูลหาย)
--   4. ตาราง app_records สำหรับเบิกเงิน รายจ่ายอื่น ค่าใช้จ่ายส่วนกลาง หมวดหมู่
--   5. bucket รูปรถแบบสาธารณะ (ลูกค้าต้องเห็นรูปรถ)
--   6. ข้อมูลตั้งต้น: รถ 10 คัน เงื่อนไขการเช่า บัญชีรับเงิน
-- ============================================================


-- ── ส่วนที่ 1: บัญชีที่ถูกปิดไม่มีสิทธิ์ ───────────────────────
alter table profiles add column if not exists email text;

create or replace function current_role_name()
returns text language sql stable security definer set search_path = public as $$
  select role::text from profiles where id = auth.uid() and is_active;
$$;

create or replace function is_owner()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce((select role = 'owner' from profiles where id = auth.uid() and is_active), false);
$$;

create or replace function is_staff_or_owner()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce((select role in ('owner','staff') from profiles where id = auth.uid() and is_active), false);
$$;

-- เดิมทุกคนที่ล็อกอินอ่านได้ → เปลี่ยนเป็นเฉพาะคนที่มีบทบาทและเปิดใช้อยู่
drop policy if exists vehicles_select on vehicles;
create policy vehicles_select on vehicles for select using (current_role_name() is not null);
drop policy if exists customers_all on customers;
create policy customers_all on customers for all
  using (current_role_name() is not null) with check (is_staff_or_owner());
drop policy if exists bookings_select on bookings;
create policy bookings_select on bookings for select using (current_role_name() is not null);
drop policy if exists events_select on schedule_events;
create policy events_select on schedule_events for select using (current_role_name() is not null);
drop policy if exists cat_select on expense_categories;
create policy cat_select on expense_categories for select using (current_role_name() is not null);
drop policy if exists settings_select on settings;
create policy settings_select on settings for select using (current_role_name() is not null);


-- ── ส่วนที่ 2: ผู้ใช้ใหม่ → profiles (ปิดไว้ก่อน) ─────────────
create or replace function handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into profiles (id, full_name, role, email, is_active)
  values (new.id,
          coalesce(nullif(new.raw_user_meta_data->>'full_name', ''), split_part(new.email, '@', 1)),
          'staff', new.email, false)
  on conflict (id) do update set email = excluded.email;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function handle_new_user();

-- ผู้ใช้ที่สร้างไว้ก่อนมี trigger นี้
insert into profiles (id, full_name, role, email, is_active)
select u.id, split_part(u.email, '@', 1), 'staff', u.email, false
from auth.users u
on conflict (id) do update set email = excluded.email;


-- ── ส่วนที่ 3: app_extra ─────────────────────────────────────
alter table vehicles        add column if not exists app_extra jsonb not null default '{}'::jsonb;
alter table bookings        add column if not exists app_extra jsonb not null default '{}'::jsonb;
alter table schedule_events add column if not exists app_extra jsonb not null default '{}'::jsonb;

-- คิวงานในแอปใช้รหัสแบบ "<ประเภท>-<กลุ่ม>-<วันที่>" (1 แถว = 1 วัน) จึงเปลี่ยนเป็น text
alter table schedule_events alter column id drop default;
alter table schedule_events alter column id type text using id::text;
alter table schedule_events alter column id set default gen_random_uuid()::text;

comment on column vehicles.app_extra is
  'ข้อมูลจากแอปที่ยังไม่มีคอลัมน์ (รายได้/ค่าใช้จ่ายรายคัน ค่างวด ฯลฯ) — ไม่อยู่ใน public_vehicles';


-- ── ส่วนที่ 4: app_records ───────────────────────────────────
create table if not exists app_records (
  collection  text not null check (collection in ('claims','otherExpenses','overhead','categories')),
  id          text not null,
  data        jsonb not null,
  updated_at  timestamptz not null default now(),
  updated_by  uuid default auth.uid(),
  primary key (collection, id)
);

alter table app_records enable row level security;

-- อ่าน: เบิกเงิน+หมวดหมู่ ทุกบทบาท · รายจ่าย+ค่าใช้จ่ายส่วนกลาง เฉพาะเจ้าของ/นักบัญชี
drop policy if exists app_records_read on app_records;
create policy app_records_read on app_records for select using (
  (collection in ('claims','categories') and current_role_name() is not null)
  or (collection in ('otherExpenses','overhead') and current_role_name() in ('owner','accountant'))
);

-- เขียน: เบิกเงิน ทุกบทบาท · หมวดหมู่ เจ้าของ · รายจ่าย+ส่วนกลาง เจ้าของ/นักบัญชี
drop policy if exists app_records_write on app_records;
create policy app_records_write on app_records for all
  using (
    (collection = 'claims' and current_role_name() is not null)
    or (collection = 'categories' and is_owner())
    or (collection in ('otherExpenses','overhead') and current_role_name() in ('owner','accountant'))
  )
  with check (
    (collection = 'claims' and current_role_name() is not null)
    or (collection = 'categories' and is_owner())
    or (collection in ('otherExpenses','overhead') and current_role_name() in ('owner','accountant'))
  );


-- ── ส่วนที่ 5: รูปรถ (สาธารณะ) ───────────────────────────────
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('vehicle-photos', 'vehicle-photos', true, 5242880,
        array['image/jpeg','image/png','image/webp'])
on conflict (id) do update
  set public = true,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists vehicle_photos_staff_write on storage.objects;
create policy vehicle_photos_staff_write on storage.objects for all
  to authenticated
  using (bucket_id = 'vehicle-photos' and public.is_staff_or_owner())
  with check (bucket_id = 'vehicle-photos' and public.is_staff_or_owner());


-- ── ส่วนที่ 6: ข้อมูลตั้งต้นของร้าน (30 ต.ค. 2569) ────────────
-- รถ: ใส่เฉพาะตอนตารางยังว่าง · ทะเบียน "รอระบุ N" แก้ได้จากหน้าเว็บ
insert into vehicles (plate, province, brand, model, category, fuel, doors, bed, color,
                      rate, hourly_rate, reservation_deposit, security_deposit)
select * from (values
  ('รอระบุ 1',  'น่าน', 'Honda',      'Accord 2.0 Hybrid (2021)', 'Sedan',   'Hybrid', '4 ประตู', 'ไม่มีกระบะ', 'black',  2500, 100, 1000, 2000),
  ('รอระบุ 2',  'น่าน', 'Toyota',     'Fortuner 2.4 (2018)',      'PPV',     'ดีเซล',  '5 ประตู', 'ไม่มีกระบะ', 'white',  1800, 100, 1000, 2000),
  ('รอระบุ 3',  'น่าน', 'Honda',      'Civic 2.0 Hybrid (2026)',  'Sedan',   'Hybrid', '4 ประตู', 'ไม่มีกระบะ', 'white',  1799, 100, 1000, 2000),
  ('รอระบุ 4',  'น่าน', 'Honda',      'HR-V 1.5 e:HEV (2025)',    'SUV',     'Hybrid', '5 ประตู', 'ไม่มีกระบะ', 'gray',   1700, 100, 1000, 2000),
  ('รอระบุ 5',  'น่าน', 'Jaecoo',     '5 EV (2026)',              'SUV',     'EV',     '5 ประตู', 'ไม่มีกระบะ', 'white',  1600, 100, 1000, 2000),
  ('รอระบุ 6',  'น่าน', 'Suzuki',     'XL7 1.5 7 ที่นั่ง (2021)',  'MPV/Van', 'เบนซิน', '5 ประตู', 'ไม่มีกระบะ', 'silver', 1300, 100, 1000, 2000),
  ('รอระบุ 7',  'น่าน', 'Toyota',     'Corolla Altis 1.8 (2018)', 'Sedan',   'เบนซิน', '4 ประตู', 'ไม่มีกระบะ', 'silver', 1300, 100, 1000, 2000),
  ('รอระบุ 8',  'น่าน', 'Honda',      'City 1.0 Turbo SV (2020)', 'Sedan',   'เบนซิน', '4 ประตู', 'ไม่มีกระบะ', 'black',   900, 100, 1000, 2000),
  ('รอระบุ 9',  'น่าน', 'Toyota',     'Vios 1.5 (2020)',          'Sedan',   'เบนซิน', '4 ประตู', 'ไม่มีกระบะ', 'white',   900, 100, 1000, 2000),
  ('รอระบุ 10', 'น่าน', 'Mitsubishi', 'Attrage 1.2 (2020)',       'Eco Car', 'เบนซิน', '4 ประตู', 'ไม่มีกระบะ', 'red',     800, 100, 1000, 2000)
) as v(plate, province, brand, model, category, fuel, doors, bed, color, rate, hourly_rate, reservation_deposit, security_deposit)
where not exists (select 1 from vehicles);

-- เงื่อนไขการเช่า + บัญชีรับเงิน: แทนที่เฉพาะค่าตั้งต้นจาก 01 (ไม่ทับที่เจ้าของแก้แล้ว)
update settings set value = to_jsonb($terms$การจอง: โอนจอง 1,000 บาท · วันรับรถจ่ายส่วนที่เหลือ + มัดจำ 2,000 บาท (คืนให้ในวันคืนรถ)

1. ไม่อนุญาตให้นำรถออกนอกจังหวัดน่าน ยกเว้นแจ้งทางเพจและได้รับการพิจารณาแล้ว
2. รถทุกคัน ยกเว้น Pajero และ Fortuner ไม่อนุญาตให้ขึ้นบ้านเกวต เปียงซ้อ โดยเด็ดขาด
   ห้วยหมี (ไม่เกินธรรมชาติสะปัน) · ห้วยโทน (ไม่เกินอิงไอหมอก) · ฝ่าฝืนปรับ 10,000 บาท
3. รถมีประกันชั้น 1 หากเกิดอุบัติเหตุให้แจ้งทางเพจเป็นอันดับแรก
4. หากเกิดอุบัติเหตุและลูกค้าเป็นฝ่ายผิด มีค่า excess 2,000-5,000 บาทตามความรุนแรง หากไม่ใช่ฝ่ายผิดไม่ต้องจ่ายใดๆ ทั้งสิ้น
5. ยกเลิกการจอง ทางเพจขอสงวนสิทธิ์ไม่คืนเงินจอง$terms$::text)
where key = 'contract_terms' and value = '"เงื่อนไขการเช่ารถ (แก้ไขได้จากหน้าเว็บ)"'::jsonb;

update settings
set value = '[{"bank":"พร้อมเพย์ (สแกน QR)","accountNo":"-","accountName":"หจก. ออม.เอ รถเช่าน่าน"}]'::jsonb
where key = 'bank_accounts' and value = '[]'::jsonb;


-- ============================================================
-- เสร็จแล้ว — ถ้าขึ้น "Success. No rows returned" = สำเร็จ
-- ============================================================
