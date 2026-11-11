-- ============================================================
-- Fleet Desk — 04: ส่งอีเมลแจ้งเจ้าของเมื่อลูกค้าจองผ่านเว็บ
-- ============================================================
-- รันหลัง 03_app_sync.sql · ปลอดภัยที่จะรันซ้ำ
--
-- ทำงานยังไง:
--   ลูกค้ากดส่งคำขอจอง → แถวใหม่ใน bookings (booking_source = 'customer')
--   → trigger ส่งอีเมลผ่าน Resend (resend.com) ไปที่อีเมลใน settings.notify_email
--
-- ต้องเตรียมก่อน (ทำครั้งเดียว):
--   1. สมัคร resend.com ด้วยอีเมลเดียวกับที่จะรับแจ้งเตือน
--      (ยังไม่มีโดเมนของร้าน → Resend ส่งได้เฉพาะไปที่อีเมลเจ้าของบัญชี Resend)
--   2. สร้าง API key ใน Resend
--   3. Supabase → Integrations → Vault → Add new secret
--      name = resend_api_key · secret = API key ที่ได้
--   ห้ามใส่ API key ในไฟล์นี้หรือใน git
--
-- ถ้าส่งเมลไม่สำเร็จ การจองยังสำเร็จตามปกติ (แจ้งเตือนพังต้องไม่ทำให้ลูกค้าจองไม่ได้)
-- ============================================================

create extension if not exists pg_net with schema extensions;

-- อีเมลที่รับแจ้งเตือน · เปลี่ยนได้ด้วย:
--   update settings set value = '"อีเมลใหม่@gmail.com"' where key = 'notify_email';
insert into settings (key, value) values ('notify_email', '"omsin2462542@gmail.com"')
on conflict (key) do nothing;

-- ข้อมูลที่ลูกค้าพิมพ์เอง ต้องกัน < > & ก่อนใส่ในอีเมล HTML
create or replace function html_escape(t text)
returns text language sql immutable as $$
  select replace(replace(replace(coalesce(t, ''), '&', '&amp;'), '<', '&lt;'), '>', '&gt;');
$$;

create or replace function notify_new_booking()
returns trigger language plpgsql security definer set search_path = public, extensions as $$
declare
  v_key  text;
  v_to   text;
  v_car  text;
  v_when text;
  v_html text;
begin
  if new.booking_source is distinct from 'customer' then return new; end if;

  select decrypted_secret into v_key from vault.decrypted_secrets where name = 'resend_api_key' limit 1;
  select value #>> '{}' into v_to from settings where key = 'notify_email';
  if v_key is null or v_to is null or v_to = '' then return new; end if;

  select brand || ' ' || model || ' · ' || plate into v_car from vehicles where id = new.vehicle_id;
  v_when := to_char(new.start_at at time zone 'Asia/Bangkok', 'DD/MM/YYYY HH24:MI')
            || ' → ' || to_char(new.end_at at time zone 'Asia/Bangkok', 'DD/MM/YYYY HH24:MI');

  v_html := format(
    '<div style="font-family:sans-serif;font-size:15px;line-height:1.6">'
    || '<h2 style="margin:0 0 8px">มีคำขอจองใหม่จากหน้าเว็บ</h2>'
    || '<table cellpadding="4">'
    || '<tr><td><b>รถ</b></td><td>%s</td></tr>'
    || '<tr><td><b>ช่วงเวลา</b></td><td>%s</td></tr>'
    || '<tr><td><b>ลูกค้า</b></td><td>%s %s</td></tr>'
    || '<tr><td><b>โทร</b></td><td><a href="tel:%s">%s</a></td></tr>'
    || '<tr><td><b>รับรถที่</b></td><td>%s</td></tr>'
    || '<tr><td><b>คืนรถที่</b></td><td>%s</td></tr>'
    || '</table>'
    || '<p>ลูกค้าแนบสลิปมัดจำแล้ว · คิวถูกล็อกไว้ให้แล้ว รอเจ้าหน้าที่ตรวจสลิปและกดยืนยัน</p>'
    || '<p><a href="https://omacarrentsnan.netlify.app/admin" style="background:#23262B;color:#fff;padding:10px 16px;border-radius:8px;text-decoration:none">เปิดหลังบ้านเพื่อตรวจสอบ</a></p>'
    || '</div>',
    html_escape(v_car), v_when,
    html_escape(new.first_name), html_escape(new.last_name),
    html_escape(new.phone), html_escape(new.phone),
    html_escape(new.pickup_location), html_escape(new.return_location)
  );

  perform net.http_post(
    url     := 'https://api.resend.com/emails',
    headers := jsonb_build_object('Authorization', 'Bearer ' || v_key, 'Content-Type', 'application/json'),
    body    := jsonb_build_object(
      'from',    'OM.A CARRENTS NAN <onboarding@resend.dev>',
      'to',      jsonb_build_array(v_to),
      'subject', 'คำขอจองใหม่: ' || coalesce(v_car, '') || ' · ' || to_char(new.start_at at time zone 'Asia/Bangkok', 'DD/MM HH24:MI'),
      'html',    v_html
    )
  );
  return new;
exception when others then
  return new;
end $$;

-- ฟังก์ชันนี้อ่าน API key ได้ → เรียกได้เฉพาะผ่าน trigger
revoke all on function notify_new_booking() from public, anon, authenticated;

drop trigger if exists bookings_notify on bookings;
create trigger bookings_notify after insert on bookings
  for each row execute function notify_new_booking();


-- ============================================================
-- เสร็จแล้ว — ถ้าขึ้น "Success. No rows returned" = สำเร็จ
-- ดูผลการส่งล่าสุด: select status_code, content from net._http_response order by created desc limit 5;
-- ============================================================
