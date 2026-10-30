/* ================= ชั้นเชื่อมต่อฐานข้อมูล (Supabase) =================
 * แอปยังเก็บข้อมูลเป็นก้อน state ใน App เหมือนเดิม — ไฟล์นี้แปลงไป-กลับระหว่าง
 * รูปแบบของแอปกับตารางในฐานข้อมูล และส่งเฉพาะแถวที่เปลี่ยนขึ้นไป
 *
 * โหมด:
 *   DB_MODE   — ใช้งานจริง (ค่าเริ่มต้นเมื่อมี src/supabase.json)
 *   DEMO_MODE — เปิดด้วย ?demo=1 → ข้อมูลตัวอย่างในเบราว์เซอร์ ไม่แตะฐานข้อมูล (ใช้กับเทสต์)
 */
import { createClient } from "@supabase/supabase-js";
import CONFIG from "./supabase.json";

const params = typeof window !== "undefined" && window.location ? new URLSearchParams(window.location.search) : new URLSearchParams();
export const DEMO_MODE = params.has("demo") || !CONFIG.url;
export const DB_MODE = !DEMO_MODE;

export const supabase = DB_MODE
  ? createClient(CONFIG.url, CONFIG.publishableKey, { auth: { persistSession: true, autoRefreshToken: true } })
  : null;

/* ---------- id + วันที่ (เวลาไทย UTC+7 เสมอ ไม่ขึ้นกับเครื่อง) ---------- */
export function newId() {
  const c = typeof crypto !== "undefined" ? crypto : null;
  if (c && c.randomUUID) return c.randomUUID();
  const b = new Uint8Array(16);
  if (c && c.getRandomValues) c.getRandomValues(b); else for (let i = 0; i < 16; i++) b[i] = Math.floor(Math.random() * 256);
  b[6] = (b[6] & 0x0f) | 0x40; b[8] = (b[8] & 0x3f) | 0x80;
  const h = Array.from(b, (x) => x.toString(16).padStart(2, "0")).join("");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}

const BKK_MS = 7 * 3600 * 1000;
const pad = (n) => String(n).padStart(2, "0");
const ymd = (d) => `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
export function todayBkk() { return ymd(new Date(Date.now() + BKK_MS)); }
function shiftDate(date, n) { const [y, m, d] = date.split("-").map(Number); return ymd(new Date(Date.UTC(y, m - 1, d + n))); }
function toTs(date, time) { return `${date}T${time || "00:00"}:00+07:00`; }
function hourTs(date, hour) { return hour >= 24 ? toTs(shiftDate(date, 1), "00:00") : toTs(date, `${pad(hour)}:00`); }
function fromTs(ts) {
  const d = new Date(new Date(ts).getTime() + BKK_MS);
  return { date: ymd(d), time: `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}`, hour: d.getUTCHours(), minute: d.getUTCMinutes() };
}
const dateOrNull = (v) => (v ? v : null);
const num = (v, d = 0) => (v === null || v === undefined || v === "" || isNaN(Number(v)) ? d : Number(v));
const numOrNull = (v) => (v === null || v === undefined || v === "" || isNaN(Number(v)) ? null : Number(v));

function check(res, what) {
  if (res.error) throw new Error(`${what}: ${res.error.message}`);
  return res.data;
}

/* ---------- ไฟล์แนบ ---------- */
function dataUrlToBlob(dataUrl) {
  const [head, b64] = dataUrl.split(",");
  const mime = (head.match(/data:([^;]+)/) || [])[1] || "application/octet-stream";
  const bin = atob(b64);
  const arr = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  return new Blob([arr], { type: mime });
}
const extOf = (mime) => (mime === "application/pdf" ? "pdf" : mime === "image/png" ? "png" : mime === "image/webp" ? "webp" : "jpg");

// ไฟล์เดิมที่อัปโหลดไปแล้วในรอบนี้ ไม่อัปซ้ำเวลาบันทึกงานเดิมอีกครั้ง
const uploaded = new Map();
async function uploadDataUrl(bucket, prefix, dataUrl) {
  const key = `${bucket}|${dataUrl}`;
  if (uploaded.has(key)) return uploaded.get(key);
  const blob = dataUrlToBlob(dataUrl);
  const path = `${prefix}/${newId()}.${extOf(blob.type)}`;
  check(await supabase.storage.from(bucket).upload(path, blob, { contentType: blob.type, upsert: false }), "อัปโหลดไฟล์");
  uploaded.set(key, path);
  return path;
}

/* ---------- รถ ---------- */
const STATUS_TO_DB = { repair: "maintenance" };
const STATUS_FROM_DB = { maintenance: "repair" };
const CAR_DEFAULTS = {
  plate: "", province: "", brand: "", model: "", category: "", fuel: "", doors: "", bed: "ไม่มีกระบะ", color: "white",
  status: "available", rate: 0, hourlyRate: 0, reservationDeposit: 0, securityDeposit: 0, gpsMonthlyFee: 0, mileage: 0, util: 0,
  photoUrl: "", photos: [], insuranceExpiry: "", prbExpiry: "", taxExpiry: "",
  ownerType: "page", partnerName: "", commissionPct: 0, withholdingPct: 0,
  income: 0, expense: { fuel: 0, wash: 0, repair: 0, insurance: 0 }, purchaseCost: 0, depreciationYears: 5, loan: null,
};

function carFromRow(r, withPrivate) {
  const photos = Array.isArray(r.photos) ? r.photos : [];
  const base = {
    id: r.id, plate: r.plate, province: r.province || "", brand: r.brand, model: r.model, category: r.category || "",
    fuel: r.fuel || "", doors: r.doors || "", color: r.color || "white", status: STATUS_FROM_DB[r.status] || r.status,
    rate: num(r.rate), hourlyRate: num(r.hourly_rate), reservationDeposit: num(r.reservation_deposit), securityDeposit: num(r.security_deposit),
    photos, photoUrl: photos[0] || "",
  };
  if (!withPrivate) return { ...CAR_DEFAULTS, ...base };
  return {
    ...CAR_DEFAULTS, ...(r.app_extra || {}), ...base,
    bed: r.bed || "ไม่มีกระบะ", mileage: num(r.mileage), gpsMonthlyFee: num(r.gps_monthly_fee),
    ownerType: r.owner_type || "page", partnerName: r.partner_name || "", commissionPct: num(r.commission_pct), withholdingPct: num(r.withholding_pct),
    purchaseCost: num(r.purchase_cost), depreciationYears: num(r.depreciation_years, 5),
    insuranceExpiry: r.insurance_expiry || "", prbExpiry: r.prb_expiry || "", taxExpiry: r.tax_expiry || "",
  };
}

async function carToRow(c) {
  const list = (Array.isArray(c.photos) && c.photos.length ? c.photos : c.photoUrl ? [c.photoUrl] : []);
  const photos = [];
  for (const p of list) {
    if (typeof p === "string" && p.startsWith("data:")) {
      const path = await uploadDataUrl("vehicle-photos", c.id, p);
      photos.push(supabase.storage.from("vehicle-photos").getPublicUrl(path).data.publicUrl);
    } else if (p) photos.push(p);
  }
  // eslint-disable-next-line no-unused-vars
  const { id, photos: _p, photoUrl: _u, ...extra } = c;
  return {
    id: c.id, plate: c.plate, province: c.province || null, brand: c.brand, model: c.model,
    category: c.category || null, fuel: c.fuel || null, doors: c.doors || null, bed: c.bed || null, color: c.color || null,
    status: STATUS_TO_DB[c.status] || c.status || "available",
    rate: num(c.rate), hourly_rate: num(c.hourlyRate), reservation_deposit: num(c.reservationDeposit), security_deposit: num(c.securityDeposit),
    mileage: Math.round(num(c.mileage)), gps_monthly_fee: num(c.gpsMonthlyFee),
    owner_type: c.ownerType === "partner" ? "partner" : "page", partner_name: c.partnerName || null,
    commission_pct: num(c.commissionPct), withholding_pct: num(c.withholdingPct),
    purchase_cost: num(c.purchaseCost), depreciation_years: Math.round(num(c.depreciationYears, 5)),
    loan_monthly: c.loan ? numOrNull(c.loan.monthly) : null, loan_interest_monthly: c.loan ? numOrNull(c.loan.interestMonthly) : null,
    loan_months_left: c.loan ? numOrNull(c.loan.monthsLeft) : null,
    insurance_expiry: dateOrNull(c.insuranceExpiry), prb_expiry: dateOrNull(c.prbExpiry), tax_expiry: dateOrNull(c.taxExpiry),
    photos, app_extra: extra,
  };
}

/* ---------- การจอง ---------- */
const FILE_COLS = {
  travelTicketUrl: "travel_ticket_url", reservationSlipUrl: "reservation_slip_url", contractDocUrl: "contract_doc_url",
  handoverPhotoUrl: "handover_photo_url", returnSlipUrl: "return_slip_url",
};
// ฟิลด์ที่คอลัมน์ในฐานข้อมูลเก็บไม่ครบ (เช่น null ≠ 0) ให้ยึดค่าจาก app_extra
const PREFER_EXTRA = ["pickupDayPayment"];

function bookingFromRow(r, signed) {
  const s = fromTs(r.start_at), e = fromTs(r.end_at), a = r.actual_end_at ? fromTs(r.actual_end_at) : null;
  const extra = r.app_extra || {};
  const files = {}, fileVals = {};
  Object.entries(FILE_COLS).forEach(([k, col]) => {
    const path = r[col];
    const url = path ? (signed[path] || "") : "";
    fileVals[k] = url;
    if (path) files[k] = { path, url };
  });
  const b = {
    ...extra,
    id: r.id, carId: r.vehicle_id, status: r.status, bookingSource: r.booking_source || "staff",
    firstName: r.first_name, lastName: r.last_name || "", phone: r.phone, email: r.email || "",
    startDate: s.date, startTime: s.time, endDate: e.date, endTime: e.time,
    pickupLocation: r.pickup_location || "", returnLocation: r.return_location || "",
    customDailyRate: numOrNull(r.custom_daily_rate), customHourlyRate: numOrNull(r.custom_hourly_rate), rateNote: r.rate_note || "",
    reservationDeposit: num(r.reservation_deposit), reservationDepositPaid: r.reservation_deposit_paid,
    pickupDayPayment: num(r.pickup_day_payment), pickupDayPaid: r.pickup_day_paid,
    securityDeposit: num(r.security_deposit), securityDepositCollected: r.security_deposit_collected, securityDepositRefunded: r.security_deposit_refunded,
    contractSigned: r.contract_signed, termsAcceptedAt: r.terms_accepted_at || "",
    cancelReason: r.cancel_reason || "", depositRefunded: r.deposit_refunded, notes: r.notes || "",
    createdBy: extra.createdBy || (r.booking_source === "customer" ? "ลูกค้า (จองเอง)" : ""),
    ...fileVals, __files: files,
  };
  if (a) { b.actualEndDate = a.date; b.actualEndTime = a.time; } else { delete b.actualEndDate; delete b.actualEndTime; }
  PREFER_EXTRA.forEach((k) => { if (k in extra) b[k] = extra[k]; });
  return b;
}

async function bookingToRow(b) {
  const fileCols = {};
  for (const [k, col] of Object.entries(FILE_COLS)) {
    const v = b[k];
    const known = b.__files && b.__files[k];
    if (!v) fileCols[col] = null;
    else if (v.startsWith("data:")) fileCols[col] = await uploadDataUrl("documents", `bookings/${b.id}`, v);
    else if (known && known.url === v) fileCols[col] = known.path;
    else fileCols[col] = known ? known.path : v;
  }
  // eslint-disable-next-line no-unused-vars
  const { id, __files, travelTicketUrl, reservationSlipUrl, contractDocUrl, handoverPhotoUrl, returnSlipUrl, ...extra } = b;
  return {
    id: b.id, vehicle_id: b.carId, status: b.status || "pending", booking_source: b.bookingSource || "staff",
    first_name: b.firstName || "-", last_name: b.lastName || null, phone: b.phone || "-", email: b.email || null,
    start_at: toTs(b.startDate, b.startTime), end_at: toTs(b.endDate, b.endTime),
    actual_end_at: b.actualEndDate ? toTs(b.actualEndDate, b.actualEndTime) : null,
    pickup_location: b.pickupLocation || null, return_location: b.returnLocation || null,
    custom_daily_rate: numOrNull(b.customDailyRate), custom_hourly_rate: numOrNull(b.customHourlyRate), rate_note: b.rateNote || null,
    reservation_deposit: num(b.reservationDeposit), reservation_deposit_paid: !!b.reservationDepositPaid,
    pickup_day_payment: num(b.pickupDayPayment), pickup_day_paid: !!b.pickupDayPaid,
    security_deposit: num(b.securityDeposit), security_deposit_collected: !!b.securityDepositCollected,
    security_deposit_refunded: !!b.securityDepositRefunded, contract_signed: !!b.contractSigned,
    terms_accepted_at: b.termsAcceptedAt || null, cancel_reason: b.cancelReason || null,
    deposit_refunded: !!b.depositRefunded, notes: b.notes || null,
    ...fileCols, app_extra: extra,
  };
}

/* ---------- ปฏิทิน (เฉพาะงานที่ลงเอง — งานจากการจองสร้างใหม่จาก bookings) ---------- */
function eventFromRow(r) {
  const s = fromTs(r.start_at), e = fromTs(r.end_at);
  const endHour = e.date !== s.date ? 24 : e.hour + (e.minute ? 1 : 0);
  return { ...(r.app_extra || {}), id: r.id, carId: r.vehicle_id, date: s.date, startHour: s.hour, endHour, type: r.type, note: r.note || "", bookingId: null };
}
function eventToRow(ev) {
  // eslint-disable-next-line no-unused-vars
  const { id, carId, date, startHour, endHour, type, note, bookingId, ...extra } = ev;
  return { id: ev.id, vehicle_id: ev.carId, booking_id: null, type: ev.type || "other", start_at: hourTs(ev.date, ev.startHour), end_at: hourTs(ev.date, ev.endHour), note: ev.note || null, app_extra: extra };
}

// public_availability → แถวรายวันแบบเดียวกับ scheduleEvents (ไม่มีข้อมูลระบุตัวตน)
function availabilityToEvents(rows) {
  const out = [];
  rows.forEach((r, i) => {
    const s = fromTs(r.start_at);
    let e = fromTs(r.blocked_until);
    let endDate = e.date, endHour = e.hour + (e.minute ? 1 : 0);
    if (endHour === 0 && endDate !== s.date) { endDate = shiftDate(endDate, -1); endHour = 24; }
    const type = r.reason === "taken" ? "booked" : r.reason === "prep" ? "clean" : "other";
    let d = s.date, guard = 0;
    while (guard++ < 400) {
      const sh = d === s.date ? s.hour : 0;
      const eh = d === endDate ? endHour : 24;
      if (eh > sh) out.push({ id: `pub-${i}-${d}`, carId: r.vehicle_id, date: d, startHour: sh, endHour: eh, type });
      if (d >= endDate) break;
      d = shiftDate(d, 1);
    }
  });
  return out;
}

/* ---------- โหลดข้อมูล ---------- */
const settingsMap = (rows) => Object.fromEntries((rows || []).map((r) => [r.key, r.value]));

export async function loadPublicData() {
  const [veh, avail, st] = await Promise.all([
    supabase.from("public_vehicles").select("*"),
    supabase.from("public_availability").select("*"),
    supabase.from("public_settings").select("key,value"),
  ]);
  const s = settingsMap(check(st, "โหลดเงื่อนไข"));
  const cars = check(veh, "โหลดรายการรถ").map((r) => carFromRow(r, false)).sort((a, b) => b.rate - a.rate);
  return {
    cars,
    events: availabilityToEvents(check(avail, "โหลดคิวว่าง")),
    termsText: typeof s.contract_terms === "string" ? s.contract_terms : "",
    bankInfo: Array.isArray(s.bank_accounts) ? s.bank_accounts : [],
  };
}

export async function loadStaffData() {
  const [veh, bk, ev, rec, st] = await Promise.all([
    supabase.from("vehicles").select("*").order("rate", { ascending: false }),
    supabase.from("bookings").select("*").order("start_at"),
    supabase.from("schedule_events").select("*").is("booking_id", null),
    supabase.from("app_records").select("collection,id,data"),
    supabase.from("settings").select("key,value"),
  ]);
  const bookingRows = check(bk, "โหลดงานเช่า");
  const paths = [];
  bookingRows.forEach((r) => Object.values(FILE_COLS).forEach((c) => { if (r[c]) paths.push(r[c]); }));
  const signed = {};
  if (paths.length) {
    const res = await supabase.storage.from("documents").createSignedUrls(paths, 6 * 3600);
    (res.data || []).forEach((x) => { if (x.signedUrl) signed[x.path] = x.signedUrl; });
  }
  const recs = check(rec, "โหลดบัญชี");
  const byCol = (c) => recs.filter((r) => r.collection === c).map((r) => r.data);
  const overheadRec = recs.find((r) => r.collection === "overhead" && r.id === "main");
  const s = settingsMap(check(st, "โหลดการตั้งค่า"));
  return {
    cars: check(veh, "โหลดรายการรถ").map((r) => carFromRow(r, true)),
    bookings: bookingRows.map((r) => bookingFromRow(r, signed)),
    manualEvents: check(ev, "โหลดคิวงาน").map(eventFromRow),
    claims: byCol("claims"),
    otherExpenses: byCol("otherExpenses"),
    categories: byCol("categories"),
    overhead: overheadRec ? overheadRec.data : null,
    termsText: typeof s.contract_terms === "string" ? s.contract_terms : null,
    bankInfo: Array.isArray(s.bank_accounts) ? s.bank_accounts : null,
  };
}

/* ---------- ส่งการเปลี่ยนแปลงขึ้นฐานข้อมูล ---------- */
export async function pushCars(changed, removedIds) {
  if (changed.length) check(await supabase.from("vehicles").upsert(await Promise.all(changed.map(carToRow))), "บันทึกรถ");
  if (removedIds.length) check(await supabase.from("vehicles").delete().in("id", removedIds), "ลบรถ");
}
export async function pushBookings(changed, removedIds) {
  for (const b of changed) {
    const res = await supabase.from("bookings").upsert(await bookingToRow(b));
    if (res.error && res.error.code === "23P01") throw new Error(`รถคันนี้มีงานเช่าทับช่วง ${b.startDate} ${b.startTime} – ${b.endDate} ${b.endTime} อยู่แล้ว`);
    check(res, "บันทึกงานเช่า");
  }
  if (removedIds.length) check(await supabase.from("bookings").delete().in("id", removedIds), "ลบงานเช่า");
}
export async function pushEvents(changed, removedIds) {
  if (changed.length) check(await supabase.from("schedule_events").upsert(changed.map(eventToRow)), "บันทึกคิวงาน");
  if (removedIds.length) check(await supabase.from("schedule_events").delete().in("id", removedIds), "ลบคิวงาน");
}
export async function pushRecords(collection, changed, removedIds, keyOf) {
  if (changed.length) check(await supabase.from("app_records").upsert(changed.map((x) => ({ collection, id: String(keyOf(x)), data: x, updated_at: new Date().toISOString() }))), "บันทึกข้อมูล");
  if (removedIds.length) check(await supabase.from("app_records").delete().eq("collection", collection).in("id", removedIds), "ลบข้อมูล");
}
export async function pushSetting(key, value) {
  check(await supabase.from("settings").upsert({ key, value, updated_at: new Date().toISOString() }), "บันทึกการตั้งค่า");
}

/* ---------- ลูกค้าส่งคำขอจอง ---------- */
export async function submitBookingRequest(req, car) {
  if (!req.travelTicketUrl.startsWith("data:") || !req.reservationSlipUrl.startsWith("data:")) throw new Error("กรุณาแนบตั๋วเดินทางและสลิปมัดจำเป็นรูปภาพหรือ PDF");
  const ticket = await uploadDataUrl("documents", "public-uploads", req.travelTicketUrl);
  const slip = await uploadDataUrl("documents", "public-uploads", req.reservationSlipUrl);
  const res = await supabase.rpc("submit_booking_request", {
    p_vehicle_id: car.id, p_start_at: toTs(req.startDate, req.startTime), p_end_at: toTs(req.endDate, req.endTime),
    p_first_name: req.firstName, p_last_name: req.lastName || null, p_phone: req.phone, p_email: req.email || null,
    p_pickup_location: req.pickupLocation || null, p_return_location: req.returnLocation || null,
    p_travel_ticket_path: ticket, p_reservation_slip_path: slip, p_terms_accepted: !!req.termsAccepted,
    p_notes: "จองผ่านหน้าลูกค้า (self-service) — รอเจ้าหน้าที่ตรวจสอบและยืนยัน",
  });
  if (res.error) throw new Error(res.error.message);
  return res.data;
}

/* ---------- บัญชีผู้ใช้ ---------- */
export async function currentProfile() {
  const { data } = await supabase.auth.getSession();
  const user = data && data.session ? data.session.user : null;
  if (!user) return null;
  const res = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
  const p = res.data;
  return { email: user.email, profile: p, active: !!(p && p.is_active) };
}
export async function signIn(email, password) {
  const res = await supabase.auth.signInWithPassword({ email: email.trim(), password });
  if (res.error) throw new Error(res.error.message === "Invalid login credentials" ? "อีเมลหรือรหัสผ่านไม่ถูกต้อง" : res.error.message);
  return currentProfile();
}
export async function signOut() { await supabase.auth.signOut(); }

/* ---------- ลืมรหัสผ่าน ----------
 * ส่งอีเมลลิงก์ตั้งรหัสใหม่ → กดลิงก์ → กลับมาที่ /admin พร้อมสิทธิ์ชั่วคราว → ตั้งรหัสใหม่
 * ต้องเพิ่มโดเมนเว็บใน Supabase → Authentication → URL Configuration → Redirect URLs */
// อ่านก่อนที่ supabase-js จะล้าง #access_token ออกจากลิงก์
export const OPENED_FROM_RESET_LINK = typeof window !== "undefined" && /type=recovery/.test(window.location.hash || "");
export async function requestPasswordReset(email) {
  const res = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: `${window.location.origin}/admin` });
  if (res.error) throw new Error(res.error.message);
}
export function onPasswordRecovery(cb) {
  const { data } = supabase.auth.onAuthStateChange((event) => { if (event === "PASSWORD_RECOVERY") cb(); });
  return () => data.subscription.unsubscribe();
}
export async function setNewPassword(password) {
  const res = await supabase.auth.updateUser({ password });
  if (res.error) throw new Error(res.error.message);
}
export const sessionFromProfile = (p, email) => ({ id: p.id, name: p.full_name || email, role: p.role, email });

export async function listProfiles() {
  return check(await supabase.from("profiles").select("*").order("created_at"), "โหลดรายชื่อผู้ใช้");
}
export async function updateProfile(id, patch) {
  check(await supabase.from("profiles").update(patch).eq("id", id), "บันทึกผู้ใช้");
}
