-- ============================================================
-- Fleet Desk — 02: ช่องทางให้ลูกค้าส่งคำขอจองเองผ่านเว็บ
-- ============================================================
-- รันหลัง 01_schema.sql · ปลอดภัยที่จะรันซ้ำ
--
-- ทำไมต้องมีไฟล์นี้:
--   01 ให้ลูกค้า "ดู" ได้แล้ว (public_availability, public_vehicles)
--   แต่ลูกค้ายัง "ส่งคำขอจอง" และ "แนบสลิป/ตั๋ว" ไม่ได้ และยังอ่าน
--   เงื่อนไขสัญญา/เลขบัญชีไม่ได้ เพราะตาราง settings เปิดให้เฉพาะคนล็อกอิน
--
-- หลักการ: ลูกค้าไม่ได้สิทธิ์เขียนตาราง bookings ตรงๆ
--   ต้องผ่านฟังก์ชัน submit_booking_request() ที่ตรวจทุกเงื่อนไขก่อน
--   และส่งกลับแค่รหัสการจอง — ไม่คืนข้อมูลของลูกค้ารายอื่น
-- ============================================================


-- ── ส่วนที่ 1: ข้อมูลที่หน้าลูกค้าต้องเห็น ─────────────────────
-- เปิดเฉพาะ 3 key นี้ · key อื่นใน settings ยังเห็นเฉพาะคนในบริษัท
create or replace view public_settings
with (security_invoker = false) as
  select key, value
  from settings
  where key in ('contract_terms', 'bank_accounts', 'company_info');

comment on view public_settings is
  'สำหรับหน้าลูกค้า: เงื่อนไขสัญญา เลขบัญชีรับมัดจำ ข้อมูลติดต่อบริษัท';

grant select on public_settings to anon, authenticated;


-- ── ส่วนที่ 2: ที่เก็บไฟล์เอกสาร ─────────────────────────────
-- bucket แบบ private: ไม่มีลิงก์สาธารณะ · จำกัดขนาด 10 MB · รับเฉพาะรูปและ PDF
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('documents', 'documents', false, 10485760,
        array['image/jpeg','image/png','image/webp','image/heic','application/pdf'])
on conflict (id) do update
  set public = false,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- ลูกค้า (ไม่ล็อกอิน): อัปโหลดได้อย่างเดียว เฉพาะโฟลเดอร์ public-uploads/
-- ไม่มีสิทธิ์อ่าน แก้ หรือลบ → เปิดดูไฟล์ของคนอื่นไม่ได้ เขียนทับไม่ได้
drop policy if exists documents_public_upload on storage.objects;
create policy documents_public_upload on storage.objects for insert
  to anon, authenticated
  with check (bucket_id = 'documents' and name like 'public-uploads/%');

-- คนในบริษัททุกบทบาท: เปิดดูเอกสารได้ (นักบัญชีต้องดูสลิปในแท็บประวัติ)
drop policy if exists documents_staff_read on storage.objects;
create policy documents_staff_read on storage.objects for select
  to authenticated
  using (bucket_id = 'documents' and public.current_role_name() is not null);

-- เจ้าของ+พนักงาน: อัปโหลด/แก้/ลบได้ (สัญญาที่เซ็น รูปส่งมอบ สลิปคืนมัดจำ)
drop policy if exists documents_staff_write on storage.objects;
create policy documents_staff_write on storage.objects for all
  to authenticated
  using (bucket_id = 'documents' and public.is_staff_or_owner())
  with check (bucket_id = 'documents' and public.is_staff_or_owner());


-- ── ส่วนที่ 3: ฟังก์ชันส่งคำขอจอง ─────────────────────────────
-- ตรวจตามกฎฝั่งลูกค้า (architecture.md หัวข้อ 5.4):
--   ต้องแนบตั๋วเดินทาง · ต้องรับทราบเงื่อนไข · ต้องแนบสลิปมัดจำ
--   ส่งแล้วล็อกคิวทันที (status = pending ก็กันคิวผ่าน bookings_no_overlap)
create or replace function submit_booking_request(
  p_vehicle_id        uuid,
  p_start_at          timestamptz,
  p_end_at            timestamptz,
  p_first_name        text,
  p_last_name         text,
  p_phone             text,
  p_email             text,
  p_pickup_location   text,
  p_return_location   text,
  p_travel_ticket_path    text,
  p_reservation_slip_path text,
  p_terms_accepted    boolean,
  p_notes             text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_vehicle vehicles%rowtype;
  v_id      uuid;
begin
  -- ข้อมูลผู้จอง
  if coalesce(trim(p_first_name), '') = '' or coalesce(trim(p_phone), '') = '' then
    raise exception 'กรุณากรอกชื่อและเบอร์โทร';
  end if;
  if length(p_first_name) > 100 or length(coalesce(p_last_name, '')) > 100
     or length(p_phone) > 30 or length(coalesce(p_email, '')) > 200
     or length(coalesce(p_notes, '')) > 2000 then
    raise exception 'ข้อมูลยาวเกินกำหนด';
  end if;

  -- เงื่อนไขบังคับ 3 ข้อ
  if p_terms_accepted is not true then
    raise exception 'กรุณารับทราบเงื่อนไขการเช่าก่อนส่งคำขอ';
  end if;
  if p_travel_ticket_path is null or p_reservation_slip_path is null then
    raise exception 'กรุณาแนบตั๋วเดินทางและสลิปมัดจำ';
  end if;
  -- ไฟล์ต้องเป็นของที่ลูกค้าเพิ่งอัปโหลดจริงใน public-uploads/
  if p_travel_ticket_path not like 'public-uploads/%'
     or p_reservation_slip_path not like 'public-uploads/%'
     or not exists (select 1 from storage.objects
                    where bucket_id = 'documents' and name = p_travel_ticket_path)
     or not exists (select 1 from storage.objects
                    where bucket_id = 'documents' and name = p_reservation_slip_path) then
    raise exception 'ไม่พบไฟล์ที่แนบ กรุณาอัปโหลดใหม่';
  end if;

  -- เวลา
  if p_end_at <= p_start_at then
    raise exception 'เวลาคืนรถต้องหลังเวลารับรถ';
  end if;
  if p_start_at < now() then
    raise exception 'เวลารับรถต้องเป็นเวลาในอนาคต';
  end if;

  -- รถ
  select * into v_vehicle from vehicles where id = p_vehicle_id;
  if not found or not v_vehicle.is_active or v_vehicle.status = 'maintenance' then
    raise exception 'รถคันนี้ไม่เปิดให้จองในขณะนี้';
  end if;

  -- งานที่ลงในปฏิทินเอง (ซ่อม ล้าง ฯลฯ) ไม่อยู่ใน bookings_no_overlap จึงตรวจแยก
  if exists (
    select 1 from schedule_events e
    where e.vehicle_id = p_vehicle_id
      and e.booking_id is null
      and tstzrange(e.start_at, e.end_at, '[)')
          && tstzrange(p_start_at, p_end_at + interval '1 hour', '[)')
  ) then
    raise exception 'ช่วงเวลานี้รถไม่ว่าง กรุณาเลือกเวลาอื่น';
  end if;

  begin
    insert into bookings (
      vehicle_id, first_name, last_name, phone, email,
      status, booking_source, start_at, end_at,
      pickup_location, return_location,
      reservation_deposit, security_deposit,
      travel_ticket_url, reservation_slip_url,
      terms_accepted_at, notes
    ) values (
      p_vehicle_id, trim(p_first_name), nullif(trim(p_last_name), ''), trim(p_phone), nullif(trim(p_email), ''),
      'pending', 'customer', p_start_at, p_end_at,
      p_pickup_location, p_return_location,
      v_vehicle.reservation_deposit, v_vehicle.security_deposit,
      p_travel_ticket_path, p_reservation_slip_path,
      now(), p_notes
    )
    returning id into v_id;
  exception when exclusion_violation then
    -- ชน bookings_no_overlap = มีคนจองช่วงนี้ไปก่อนแล้ว
    raise exception 'ช่วงเวลานี้มีผู้จองแล้ว กรุณาเลือกเวลาอื่น';
  end;

  return v_id;
end $$;

comment on function submit_booking_request is
  'ช่องทางเดียวที่ลูกค้า (ไม่ล็อกอิน) สร้างการจองได้ · คืนแค่รหัสการจอง';

revoke all on function submit_booking_request from public;
grant execute on function submit_booking_request to anon, authenticated;


-- ============================================================
-- เสร็จแล้ว — ถ้าขึ้น "Success. No rows returned" = สำเร็จ
-- ============================================================
