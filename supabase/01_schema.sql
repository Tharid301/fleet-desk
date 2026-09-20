-- ============================================================
-- Fleet Desk — คำสั่งสร้างฐานข้อมูล (Supabase / PostgreSQL)
-- ============================================================
-- วิธีใช้:
--   1. เข้า supabase.com → เลือกโปรเจกต์ → เมนู SQL Editor (ไอคอนซ้ายมือ)
--   2. กด "New query"
--   3. ก๊อปไฟล์นี้ทั้งหมดไปวาง แล้วกด Run
--   4. ถ้าขึ้น "Success. No rows returned" = สำเร็จ
--
-- ปลอดภัยที่จะรันซ้ำ: ทุกคำสั่งใช้ IF NOT EXISTS / OR REPLACE
-- ============================================================


-- ── ส่วนที่ 0: เปิดส่วนเสริมที่ต้องใช้ ────────────────────────
-- btree_gist จำเป็นสำหรับการกันจองซ้ำ (ดูส่วนที่ 4)
create extension if not exists "btree_gist";
create extension if not exists "pgcrypto";


-- ── ส่วนที่ 1: ผู้ใช้และสิทธิ์ ────────────────────────────────
-- Supabase มีตาราง auth.users ให้อยู่แล้ว (เก็บอีเมล/รหัสผ่าน)
-- เราสร้างตารางเสริมเก็บ "บทบาท" ของแต่ละคน

do $$ begin
  create type user_role as enum ('owner', 'staff', 'accountant');
exception when duplicate_object then null; end $$;

create table if not exists profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  full_name   text not null,
  role        user_role not null default 'staff',
  phone       text,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now()
);

comment on table profiles is 'ข้อมูลเสริมของผู้ใช้ เชื่อมกับ auth.users ของ Supabase';

-- ฟังก์ชันช่วย: ดึงบทบาทของคนที่กำลังล็อกอินอยู่
-- ใช้ใน RLS policy ทุกตาราง
create or replace function current_role_name()
returns text language sql stable security definer set search_path = public as $$
  select role::text from profiles where id = auth.uid();
$$;

create or replace function is_owner()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce((select role = 'owner' from profiles where id = auth.uid()), false);
$$;

create or replace function is_staff_or_owner()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce((select role in ('owner','staff') from profiles where id = auth.uid()), false);
$$;


-- ── ส่วนที่ 2: กองรถ ─────────────────────────────────────────
do $$ begin
  create type vehicle_status as enum ('available','rented','wash','maintenance');
exception when duplicate_object then null; end $$;

do $$ begin
  create type owner_type as enum ('page','partner');
exception when duplicate_object then null; end $$;

create table if not exists vehicles (
  id                    uuid primary key default gen_random_uuid(),
  plate                 text not null,
  province              text,
  brand                 text not null,
  model                 text not null,
  category              text,
  fuel                  text,
  doors                 text,
  bed                   text,
  color                 text,
  status                vehicle_status not null default 'available',

  -- ราคา (numeric(12,2) = ทศนิยม 2 ตำแหน่งเสมอ ห้ามใช้ float กับเงิน)
  rate                  numeric(12,2) not null default 0,   -- ค่าเช่า/วัน
  hourly_rate           numeric(12,2) not null default 0,   -- ค่าเช่า/ชม.เกิน
  reservation_deposit   numeric(12,2) not null default 0,   -- มัดจำจอง
  security_deposit      numeric(12,2) not null default 0,   -- มัดจำค้ำประกัน

  mileage               integer not null default 0,
  gps_monthly_fee       numeric(12,2) not null default 0,

  -- เจ้าของรถ
  owner_type            owner_type not null default 'page',
  partner_name          text,
  commission_pct        numeric(5,2) default 0,   -- % ที่เพจหัก
  withholding_pct       numeric(5,2) default 0,   -- % หัก ณ ที่จ่าย

  -- ทรัพย์สิน/ค่างวด
  purchase_cost         numeric(12,2) default 0,
  depreciation_years    integer default 5,
  loan_monthly          numeric(12,2),            -- null = ไม่มีค่างวด
  loan_interest_monthly numeric(12,2),
  loan_months_left      integer,

  -- วันหมดอายุเอกสาร (แยก 3 รายการ ต่ออายุคนละที่คนละเวลา)
  insurance_expiry      date,   -- ประกันภาคสมัครใจ
  prb_expiry            date,   -- พ.ร.บ. (ภาคบังคับ)
  tax_expiry            date,   -- ภาษีรถประจำปี

  photos                jsonb not null default '[]'::jsonb,  -- URL ของรูปใน Storage
  is_active             boolean not null default true,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),

  constraint vehicles_plate_unique unique (plate)
);

create index if not exists idx_vehicles_status on vehicles(status) where is_active;
comment on column vehicles.photos is 'เก็บเป็น URL ที่ชี้ไป Supabase Storage ไม่ใช่ base64';


-- ── ส่วนที่ 3: ลูกค้า ────────────────────────────────────────
create table if not exists customers (
  id            uuid primary key default gen_random_uuid(),
  first_name    text not null,
  last_name     text,
  phone         text not null,
  email         text,
  id_card_url   text,          -- URL ใน Storage
  license_url   text,
  notes         text,
  created_at    timestamptz not null default now()
);

create index if not exists idx_customers_phone on customers(phone);


-- ── ส่วนที่ 4: การจอง + กันจองซ้ำ ────────────────────────────
do $$ begin
  create type booking_status as enum ('pending','active','completed','cancelled');
exception when duplicate_object then null; end $$;

create table if not exists bookings (
  id                        uuid primary key default gen_random_uuid(),
  vehicle_id                uuid not null references vehicles(id),
  customer_id               uuid references customers(id),

  -- เก็บซ้ำไว้ในนี้ด้วย เพื่อให้ประวัติย้อนหลังไม่เปลี่ยนตามถ้าลูกค้าแก้ข้อมูลทีหลัง
  first_name                text not null,
  last_name                 text,
  phone                     text not null,
  email                     text,

  status                    booking_status not null default 'pending',
  booking_source            text default 'staff',   -- 'customer' = จองเองผ่านเว็บ

  start_at                  timestamptz not null,
  end_at                    timestamptz not null,
  actual_end_at             timestamptz,            -- เวลาคืนจริง (ใช้คิดค่าปรับคืนช้า)
  pickup_location           text,
  return_location           text,

  -- ราคา: ถ้า custom_* เป็น null ให้ใช้ราคาของรถ
  custom_daily_rate         numeric(12,2),
  custom_hourly_rate        numeric(12,2),
  rate_note                 text,                   -- เหตุผลที่ปรับราคา

  reservation_deposit       numeric(12,2) not null default 0,
  reservation_deposit_paid  boolean not null default false,
  pickup_day_payment        numeric(12,2) not null default 0,
  pickup_day_paid           boolean not null default false,
  security_deposit          numeric(12,2) not null default 0,
  security_deposit_collected boolean not null default false,
  security_deposit_refunded boolean not null default false,
  contract_signed           boolean not null default false,

  -- เอกสาร (เก็บ URL ไม่ใช่ไฟล์)
  travel_ticket_url         text,
  reservation_slip_url      text,
  contract_doc_url          text,
  handover_photo_url        text,
  return_slip_url           text,

  terms_accepted_at         timestamptz,            -- หลักฐานว่ารับทราบเงื่อนไข
  cancel_reason             text,
  deposit_refunded          boolean not null default false,
  notes                     text,

  created_by                uuid references profiles(id),
  created_at                timestamptz not null default now(),
  updated_at                timestamptz not null default now(),

  constraint booking_time_valid check (end_at > start_at)
);

create index if not exists idx_bookings_vehicle_time on bookings(vehicle_id, start_at, end_at);
create index if not exists idx_bookings_status on bookings(status);

-- ★★★ หัวใจของการกันจองซ้ำ ★★★
-- EXCLUDE constraint สั่งให้ PostgreSQL ปฏิเสธการ insert ที่ช่วงเวลาทับกัน
-- ของรถคันเดียวกัน โดยอัตโนมัติ ที่ระดับฐานข้อมูล
--
-- ผลคือ: ลูกค้า A กดจอง 18:00 · ลูกค้า B กดจองคันเดียวกัน 18:00:01
--        → คนที่สองถูกปฏิเสธทันที ไม่ต้องรอบริษัทมาเช็คตอน 19:00
--
-- หมายเหตุทางเทคนิค: ต้องใช้คอลัมน์จริง (blocked_until) ไม่ใช่ end_at + interval
-- เพราะ PostgreSQL ไม่ยอมให้ใช้การบวกเวลาในนิพจน์ของ index (ไม่ immutable)

-- blocked_until = end_at + เวลาเคลียรถ · trigger ด้านล่างดูแลให้อัตโนมัติ
alter table bookings add column if not exists blocked_until timestamptz;

create or replace function set_blocked_until()
returns trigger language plpgsql as $$
begin
  -- เผื่อเวลาเคลียรถ 1 ชม. ก่อนส่งคันต่อไป (ตรงกับ CLEAN_BUFFER_HOURS ในแอป)
  new.blocked_until := new.end_at + interval '1 hour';
  return new;
end $$;

drop trigger if exists bookings_set_blocked on bookings;
create trigger bookings_set_blocked before insert or update of end_at on bookings
  for each row execute function set_blocked_until();

update bookings set blocked_until = end_at + interval '1 hour' where blocked_until is null;

-- นับเฉพาะ pending/active (ยกเลิกหรือปิดงานแล้วไม่กันคิว)
do $$ begin
  alter table bookings add constraint bookings_no_overlap
    exclude using gist (
      vehicle_id with =,
      tstzrange(start_at, blocked_until, '[)') with &&
    ) where (status in ('pending','active'));
exception when duplicate_object then null; end $$;


-- ── ส่วนที่ 5: ปฏิทินงาน ─────────────────────────────────────
do $$ begin
  create type event_type as enum ('booked','clean','wash','repair','other');
exception when duplicate_object then null; end $$;

create table if not exists schedule_events (
  id          uuid primary key default gen_random_uuid(),
  vehicle_id  uuid not null references vehicles(id) on delete cascade,
  booking_id  uuid references bookings(id) on delete cascade,  -- null = งานที่ลงเอง
  type        event_type not null default 'other',
  start_at    timestamptz not null,
  end_at      timestamptz not null,
  note        text,
  created_at  timestamptz not null default now(),

  constraint event_time_valid check (end_at > start_at)
);

create index if not exists idx_events_vehicle_time on schedule_events(vehicle_id, start_at);
comment on column schedule_events.booking_id is 'ถ้าไม่ null = สร้างจากการจอง ห้ามแก้ในปฏิทินโดยตรง';


-- ── ส่วนที่ 6: หมวดหมู่และรายรับ-รายจ่าย ─────────────────────
do $$ begin
  create type flow_type as enum ('operating','investing','financing');
exception when duplicate_object then null; end $$;

do $$ begin
  create type flow_direction as enum ('in','out');
exception when duplicate_object then null; end $$;

create table if not exists expense_categories (
  key         text primary key,
  label       text not null,
  flow        flow_type not null default 'operating',
  direction   flow_direction not null default 'out',
  note        text,
  is_system   boolean not null default false,   -- หมวดมาตรฐาน ลบไม่ได้
  sort_order  integer default 0
);

comment on column expense_categories.flow is
  'operating = กระทบกำไร | investing/financing = กระทบเงินสดอย่างเดียว';

create table if not exists transactions (
  id            uuid primary key default gen_random_uuid(),
  category_key  text not null references expense_categories(key),
  vehicle_id    uuid references vehicles(id),     -- ถ้าผูกกับรถคันใดคันหนึ่ง
  booking_id    uuid references bookings(id),
  occurred_on   date not null,
  amount        numeric(12,2) not null,
  description   text not null,
  receipt_url   text,
  created_by    uuid references profiles(id),
  created_at    timestamptz not null default now(),

  constraint amount_positive check (amount > 0)
);

create index if not exists idx_tx_date on transactions(occurred_on);
create index if not exists idx_tx_category on transactions(category_key);


-- ── ส่วนที่ 7: คำร้องเบิกเงินพนักงาน ─────────────────────────
do $$ begin
  create type claim_status as enum ('pending','approved','paid','rejected','cancelled');
exception when duplicate_object then null; end $$;

create table if not exists claims (
  id              uuid primary key default gen_random_uuid(),
  requester_id    uuid not null references profiles(id),
  category_key    text references expense_categories(key),
  vehicle_id      uuid references vehicles(id),

  amount          numeric(12,2) not null,
  payment_date    date not null,              -- วันที่พนักงานจ่ายเงินไป
  description     text not null,
  receipt_url     text not null,              -- บังคับ ต้องมีใบเสร็จ
  extra_doc_url   text,

  status          claim_status not null default 'pending',
  requested_at    timestamptz not null default now(),
  reviewed_by     uuid references profiles(id),
  reviewed_at     timestamptz,
  reject_reason   text,
  paid_at         timestamptz,
  edited_at       timestamptz,

  constraint claim_amount_positive check (amount > 0)
);

create index if not exists idx_claims_status on claims(status);
create index if not exists idx_claims_requester on claims(requester_id);

comment on table claims is
  'บัญชี: เป็นรายจ่ายตอน approved (มีใบเสร็จแล้ว) · ตัดเงินสดตอน paid';


-- ── ส่วนที่ 8: เงินเดือนและค่าใช้จ่ายส่วนกลาง ────────────────
create table if not exists staff_salaries (
  id          uuid primary key default gen_random_uuid(),
  profile_id  uuid references profiles(id),
  name        text not null,
  position    text,
  salary      numeric(12,2) not null default 0,
  is_owner    boolean not null default false,
  effective_from date not null default current_date,
  effective_to   date,                -- null = ยังใช้อยู่
  created_at  timestamptz not null default now()
);

comment on table staff_salaries is 'เก็บเป็นประวัติ ขึ้นเงินเดือนให้ปิด effective_to แล้วเพิ่มแถวใหม่';

create table if not exists overhead_costs (
  id           uuid primary key default gen_random_uuid(),
  month        date not null,          -- ใช้วันที่ 1 ของเดือน
  rent         numeric(12,2) not null default 0,
  marketing    numeric(12,2) not null default 0,
  platform_fee numeric(12,2) not null default 0,
  other        numeric(12,2) not null default 0,

  constraint overhead_month_unique unique (month)
);


-- ── ส่วนที่ 9: การตั้งค่าที่แก้ไขได้จากหน้าเว็บ ──────────────
create table if not exists settings (
  key         text primary key,
  value       jsonb not null,
  updated_at  timestamptz not null default now(),
  updated_by  uuid references profiles(id)
);

insert into settings (key, value) values
  ('contract_terms', '"เงื่อนไขการเช่ารถ (แก้ไขได้จากหน้าเว็บ)"'::jsonb),
  ('bank_accounts',  '[]'::jsonb),
  ('company_info',   '{"name":"","phone":"","line_id":"","email":"","address":""}'::jsonb)
on conflict (key) do nothing;


-- ── ส่วนที่ 10: ใส่หมวดหมู่มาตรฐาน ───────────────────────────
insert into expense_categories (key, label, flow, direction, note, is_system, sort_order) values
  -- ดำเนินงาน (กระทบกำไร)
  ('staff_welfare',  'สวัสดิการพนักงาน/งานเลี้ยง', 'operating','out','เลี้ยงปีใหม่ ประกันกลุ่ม ยูนิฟอร์ม', true, 10),
  ('office',         'ของใช้สำนักงาน',             'operating','out','', true, 20),
  ('utilities',      'ค่าน้ำ-ไฟ-เน็ต-โทรศัพท์',     'operating','out','', true, 30),
  ('entertainment',  'ค่ารับรองลูกค้า',            'operating','out','สรรพากรจำกัดเพดาน ควรถามผู้ทำบัญชี', true, 40),
  ('professional',   'ค่าทำบัญชี/ที่ปรึกษา/กฎหมาย','operating','out','', true, 50),
  ('travel',         'ค่าเดินทางเพื่อธุรกิจ',       'operating','out','', true, 60),
  ('car_repair',     'ค่าซ่อม/บำรุงรถ',            'operating','out','ผูกกับรถได้', true, 70),
  ('car_wash',       'ค่าล้างรถ',                  'operating','out','ผูกกับรถได้', true, 80),
  ('car_fuel',       'ค่าน้ำมัน/ชาร์จไฟ',          'operating','out','ผูกกับรถได้', true, 90),
  ('other_biz',      'ค่าใช้จ่ายธุรกิจอื่นๆ',       'operating','out','', true, 100),
  ('other_income',   'รายได้อื่น (นอกจากค่าเช่า)',  'operating','in', 'ค่าปรับ ค่าเสียหาย', true, 110),
  -- ลงทุน (ไม่กระทบกำไร)
  ('buy_car',        'ซื้อรถเข้ากอง',              'investing','out','ไม่ใช่รายจ่าย — ทยอยเป็นค่าเสื่อม', true, 200),
  ('sell_car',       'ขายรถออก',                   'investing','in', '', true, 210),
  ('office_improve', 'ปรับปรุงออฟฟิศ/อู่ (งานใหญ่)','investing','out','งานที่ใช้ได้หลายปี', true, 220),
  ('buy_equipment',  'ซื้ออุปกรณ์ถาวร',            'investing','out','GPS กล้อง เครื่องมือ', true, 230),
  -- จัดหาเงิน (ไม่กระทบกำไร)
  ('loan_in',        'รับเงินกู้เข้ามา',            'financing','in', '', true, 300),
  ('loan_principal', 'จ่ายคืนเงินต้น',             'financing','out','ดอกเบี้ยแยกเป็นหมวดดำเนินงาน', true, 310),
  ('owner_inject',   'เจ้าของเติมเงินเข้าบริษัท',   'financing','in', 'ไม่ใช่รายได้ ไม่เสียภาษี', true, 320),
  ('owner_draw',     'เจ้าของถอนไปใช้ส่วนตัว',      'financing','out','ไม่ใช่รายจ่าย หักภาษีไม่ได้', true, 330)
on conflict (key) do nothing;


-- ── ส่วนที่ 11: Row Level Security (ความปลอดภัย) ─────────────
-- ★ นี่คือส่วนที่แก้ปัญหา "หน้าบ้านกันไม่ได้" ★
-- กฎเหล่านี้บังคับที่ฐานข้อมูล ต่อให้คนแก้โค้ดหน้าบ้านก็ข้ามไม่ได้

alter table profiles           enable row level security;
alter table vehicles           enable row level security;
alter table customers          enable row level security;
alter table bookings           enable row level security;
alter table schedule_events    enable row level security;
alter table expense_categories enable row level security;
alter table transactions       enable row level security;
alter table claims             enable row level security;
alter table staff_salaries     enable row level security;
alter table overhead_costs     enable row level security;
alter table settings           enable row level security;

-- profiles: ดูตัวเองได้ · เจ้าของดูได้ทุกคน
drop policy if exists profiles_select on profiles;
create policy profiles_select on profiles for select
  using (id = auth.uid() or is_owner());

drop policy if exists profiles_manage on profiles;
create policy profiles_manage on profiles for all
  using (is_owner()) with check (is_owner());

-- vehicles: ทุกคนที่ล็อกอินดูได้ · เจ้าของ+พนักงานแก้ได้ (นักบัญชีดูอย่างเดียว)
drop policy if exists vehicles_select on vehicles;
create policy vehicles_select on vehicles for select
  using (auth.uid() is not null);

drop policy if exists vehicles_write on vehicles;
create policy vehicles_write on vehicles for all
  using (is_staff_or_owner()) with check (is_staff_or_owner());

-- customers: เฉพาะคนในบริษัท (ข้อมูลส่วนบุคคล)
drop policy if exists customers_all on customers;
create policy customers_all on customers for all
  using (auth.uid() is not null) with check (is_staff_or_owner());

-- bookings: เฉพาะคนในบริษัท
-- ★ ลูกค้าทั่วไปไม่มีสิทธิ์อ่านตารางนี้เลย ★
drop policy if exists bookings_select on bookings;
create policy bookings_select on bookings for select
  using (auth.uid() is not null);

drop policy if exists bookings_write on bookings;
create policy bookings_write on bookings for all
  using (is_staff_or_owner()) with check (is_staff_or_owner());

-- schedule_events: เฉพาะคนในบริษัท
drop policy if exists events_select on schedule_events;
create policy events_select on schedule_events for select
  using (auth.uid() is not null);

drop policy if exists events_write on schedule_events;
create policy events_write on schedule_events for all
  using (is_staff_or_owner()) with check (is_staff_or_owner());

-- claims: พนักงานเห็นของตัวเอง · เจ้าของเห็นทั้งหมด
drop policy if exists claims_select on claims;
create policy claims_select on claims for select
  using (requester_id = auth.uid() or is_owner());

drop policy if exists claims_insert on claims;
create policy claims_insert on claims for insert
  with check (requester_id = auth.uid());

-- แก้ได้เฉพาะของตัวเองและยังไม่ถูกพิจารณา
drop policy if exists claims_update_own on claims;
create policy claims_update_own on claims for update
  using (requester_id = auth.uid() and status = 'pending')
  with check (requester_id = auth.uid());

-- อนุมัติ/ปฏิเสธ/จ่ายคืน = เจ้าของเท่านั้น
drop policy if exists claims_update_owner on claims;
create policy claims_update_owner on claims for update
  using (is_owner()) with check (is_owner());

-- เงิน: เจ้าของและนักบัญชีเท่านั้น (พนักงานทั่วไปไม่เห็น)
drop policy if exists tx_access on transactions;
create policy tx_access on transactions for all
  using (current_role_name() in ('owner','accountant'))
  with check (current_role_name() in ('owner','accountant'));

drop policy if exists salaries_access on staff_salaries;
create policy salaries_access on staff_salaries for all
  using (current_role_name() in ('owner','accountant'))
  with check (is_owner());

drop policy if exists overhead_access on overhead_costs;
create policy overhead_access on overhead_costs for all
  using (current_role_name() in ('owner','accountant'))
  with check (current_role_name() in ('owner','accountant'));

-- หมวดหมู่: ทุกคนอ่านได้ · เจ้าของแก้ได้
drop policy if exists cat_select on expense_categories;
create policy cat_select on expense_categories for select
  using (auth.uid() is not null);

drop policy if exists cat_write on expense_categories;
create policy cat_write on expense_categories for all
  using (is_owner()) with check (is_owner());

-- settings: ทุกคนอ่านได้ · เจ้าของแก้ได้
drop policy if exists settings_select on settings;
create policy settings_select on settings for select
  using (auth.uid() is not null);

drop policy if exists settings_write on settings;
create policy settings_write on settings for all
  using (is_owner()) with check (is_owner());


-- ── ส่วนที่ 12: ช่องทางสำหรับลูกค้า (ไม่ต้องล็อกอิน) ─────────
-- ★★★ นี่คือทางแก้ที่แท้จริงของปัญหาข้อมูลลูกค้ารั่ว ★★★
--
-- ลูกค้าทั่วไปไม่มีสิทธิ์อ่านตาราง bookings เลย
-- แต่ต้องดูได้ว่ารถว่างช่วงไหน จึงสร้าง "view" ที่ส่งเฉพาะช่วงเวลา
-- ไม่มีชื่อ ไม่มีเบอร์โทร ไม่มีโน้ต ไม่มีรหัสการจอง

create or replace view public_availability
with (security_invoker = false) as
  select
    b.vehicle_id,
    b.start_at,
    b.blocked_until,                                -- รวมเวลาเคลียรถแล้ว
    'taken'::text as reason
  from bookings b
  where b.status in ('pending','active')
  union all
  select
    e.vehicle_id,
    e.start_at,
    e.end_at,
    case when e.type = 'clean' then 'prep' else 'unavailable' end
  from schedule_events e
  where e.booking_id is null;

comment on view public_availability is
  'สำหรับหน้าลูกค้า: บอกแค่ว่ารถไม่ว่างช่วงไหน ไม่มีข้อมูลระบุตัวตนใดๆ';

grant select on public_availability to anon, authenticated;

-- รถที่เปิดให้เช่า — ลูกค้าดูได้ แต่ไม่เห็นข้อมูลต้นทุน
create or replace view public_vehicles
with (security_invoker = false) as
  select id, plate, brand, model, category, fuel, doors, color,
         rate, hourly_rate, reservation_deposit, security_deposit, photos, status
  from vehicles
  where is_active and status <> 'maintenance';

comment on view public_vehicles is
  'สำหรับหน้าลูกค้า: ไม่มีราคาซื้อ ค่างวด ค่าใช้จ่าย หรือข้อมูลพาร์ทเนอร์';

grant select on public_vehicles to anon, authenticated;


-- ── ส่วนที่ 13: อัปเดต updated_at อัตโนมัติ ──────────────────
create or replace function touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists vehicles_touch on vehicles;
create trigger vehicles_touch before update on vehicles
  for each row execute function touch_updated_at();

drop trigger if exists bookings_touch on bookings;
create trigger bookings_touch before update on bookings
  for each row execute function touch_updated_at();


-- ============================================================
-- เสร็จแล้ว
-- ============================================================
-- ขั้นต่อไป:
--   1. เมนู Authentication → Users → เพิ่มผู้ใช้คนแรก (ตัวเอง)
--   2. รันคำสั่งนี้เพื่อตั้งตัวเองเป็นเจ้าของ (แทนอีเมลของคุณ):
--
--      insert into profiles (id, full_name, role)
--      select id, 'ชื่อของคุณ', 'owner' from auth.users
--      where email = 'อีเมลของคุณ@example.com'
--      on conflict (id) do update set role = 'owner';
--
--   3. เมนู Storage → สร้าง bucket ชื่อ "documents" (ตั้งเป็น Private)
--   4. เมนู Settings → API → ก๊อป 2 ค่านี้มาให้ผู้พัฒนา:
--        - Project URL
--        - anon public key   ← ตัวนี้ใส่ในหน้าเว็บได้ ปลอดภัย
--      ⚠️ ห้ามก๊อป service_role key เด็ดขาด — ตัวนั้นข้าม RLS ได้ทั้งหมด
-- ============================================================
