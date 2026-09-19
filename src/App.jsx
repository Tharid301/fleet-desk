import React, { useState, useRef, useEffect } from "react";
import * as XLSX from "xlsx";
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import {
  Car, Truck, Zap, Leaf, Sparkles, Wrench, Wallet, CalendarDays, X, Plus, Pencil,
  Fuel, TrendingUp, TrendingDown, Gauge, ShieldCheck, Clock, ChevronRight, ChevronLeft, Trash2,
  PiggyBank, Image as ImageIcon, LogOut, Download, Lock, ClipboardList, Users, Eye,
  Phone, Mail, MapPin, MessageSquare, Copy, Check, Handshake, Settings, Archive, FileText, Filter, Camera,
} from "lucide-react";

/* ================= tokens ================= */
const INK = "#23262B";
const BOARD = "#2A2E33";
const PAPER = "#F6F1E7";
const PAPER_LINE = "#E4DBC8";
const MUTE = "#8A8F98";
const FONTS = `@import url('https://fonts.googleapis.com/css2?family=Oswald:wght@500;600;700&family=JetBrains+Mono:wght@400;600;700&family=Inter:wght@400;500;600&display=swap');
  * { font-family: 'Inter', sans-serif; box-sizing: border-box; } .font-mono { font-family: 'JetBrains Mono', monospace; }`;

const STATUS = {
  available: { label: "ว่าง", color: "#3A7D5C", bg: "#3A7D5C1a" },
  rented: { label: "ให้เช่าอยู่", color: "#3B5BA5", bg: "#3B5BA51a" },
  wash: { label: "คิวล้างรถ", color: "#D69A2D", bg: "#D69A2D1a" },
  repair: { label: "ซ่อม", color: "#C1502E", bg: "#C1502E1a" },
};
const EVENT_TYPES = ["booked", "clean", "wash", "repair", "other"];
const EVENT_LABEL = { booked: "ให้เช่า/จองไว้", clean: "เคลียรถ (ล็อกอัตโนมัติ)", wash: "ล้างรถ", repair: "ซ่อม", other: "อื่นๆ" };
const EVENT_COLOR = { booked: "#3B5BA5", clean: "#2E7D8F", wash: "#D69A2D", repair: "#C1502E", other: "#8A8F98" };
const EVENT_ICON = { booked: ClipboardList, clean: Sparkles, wash: Sparkles, repair: Wrench, other: Clock };

const COLORS = [
  { key: "white", label: "ขาว", hex: "#F2F2F0" },
  { key: "black", label: "ดำ", hex: "#1C1C1C" },
  { key: "silver", label: "เงิน", hex: "#C7CBCF" },
  { key: "gray", label: "เทา", hex: "#6B7078" },
  { key: "bronze", label: "บรอนซ์ทอง", hex: "#8A6D3B" },
  { key: "red", label: "แดง", hex: "#B23A2E" },
  { key: "blue", label: "น้ำเงิน", hex: "#2E4C8A" },
  { key: "yellow", label: "เหลือง", hex: "#D6B32D" },
];
const CATEGORIES = ["Eco Car", "Sedan", "Hatchback", "SUV", "PPV", "Pickup", "MPV/Van"];
const FUELS = ["เบนซิน", "ดีเซล", "Hybrid", "PHEV", "EV"];
const DOORS = ["4 ประตู", "5 ประตู"];
const BEDS = ["มีกระบะ", "ไม่มีกระบะ"];
const CATS = ["ทั้งหมด", "Eco Car", "Sedan", "Hatchback", "SUV", "PPV", "Pickup", "EV", "Hybrid", "PHEV", "มีกระบะ"];
const HOURS_FULL = Array.from({ length: 24 }, (_, i) => i);
const DAY_COL_W = 50;
const DAYS_WINDOW = 7;

/* ================= auth / roles ================= */
const MOCK_ACCOUNTS = [
  { id: "u1", name: "คุณสมชาย", email: "somchai.owner@gmail.com", role: "owner" },
  { id: "u2", name: "มานะ (พนักงาน A)", email: "mana.staff@gmail.com", role: "staff" },
  { id: "u3", name: "ปราณี (พนักงาน B)", email: "pranee.staff@gmail.com", role: "staff" },
  { id: "u4", name: "คุณบัญชี (ผู้ช่วยบัญชี)", email: "accountant@gmail.com", role: "accountant" },
];
const ROLE_LABEL = { owner: "เจ้าของ", staff: "พนักงาน", accountant: "นักบัญชี" };
const ROLE_COLOR = { owner: "#D69A2D", staff: "#3B5BA5", accountant: "#3A7D5C" };
const ROLE_TABS = { owner: ["fleet", "schedule", "booking", "archive", "claims", "finance"], staff: ["fleet", "schedule", "booking", "archive", "claims"], accountant: ["fleet", "booking", "archive", "claims", "finance"] };
const TAB_META = { fleet: { label: "กองรถ", icon: Car }, schedule: { label: "คิวงาน", icon: CalendarDays }, booking: { label: "งานเช่า", icon: ClipboardList }, archive: { label: "ประวัติ", icon: Archive }, claims: { label: "เบิกเงิน", icon: FileText }, finance: { label: "บัญชี", icon: Wallet } };
const canEditFleetTab = (role) => role === "owner" || role === "staff";
const canSeeFinanceInfo = (role) => role === "owner" || role === "accountant";
const canEditBookingTab = (role) => role === "owner" || role === "staff";
const DEMO_PASSWORD = "demo1234";

/* ================= dates ================= */
const APP_TODAY = "2026-08-05";
const THAI_MONTHS_SHORT = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
const THAI_WEEKDAYS = ["อาทิตย์", "จันทร์", "อังคาร", "พุธ", "พฤหัสบดี", "ศุกร์", "เสาร์"];
function formatThaiDate(iso) { const d = new Date(iso + "T00:00:00"); return `วัน${THAI_WEEKDAYS[d.getDay()]}ที่ ${d.getDate()} ${THAI_MONTHS_SHORT[d.getMonth()]} ${d.getFullYear() + 543}`; }
function formatThaiDateShort(iso) { const d = new Date(iso + "T00:00:00"); return `${d.getDate()} ${THAI_MONTHS_SHORT[d.getMonth()]} ${d.getFullYear() + 543}`; }
function formatDateTime(iso, fallbackDate) {
  if (!iso) return fallbackDate ? formatDMY(fallbackDate) : "-";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return fallbackDate ? formatDMY(fallbackDate) : "-";
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${d.getDate()}/${d.getMonth() + 1}/${(d.getFullYear() + 543) % 100} ${hh}:${mm} น.`;
}
function formatDMY(iso) { const d = new Date(iso + "T00:00:00"); return `${d.getDate()}/${d.getMonth() + 1}/${(d.getFullYear() + 543) % 100}`; }
function addDays(iso, n) { const d = new Date(iso + "T00:00:00"); d.setDate(d.getDate() + n); const y = d.getFullYear(); const m = String(d.getMonth() + 1).padStart(2, "0"); const day = String(d.getDate()).padStart(2, "0"); return `${y}-${m}-${day}`; }
function daysBetween(a, b) { return Math.round((new Date(b + "T00:00:00") - new Date(a + "T00:00:00")) / 86400000); }
function weekdayShort(iso) { const d = new Date(iso + "T00:00:00"); return ["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส"][d.getDay()]; }
function calcDuration(startDate, startTime, endDate, endTime) {
  const start = new Date(`${startDate}T${startTime || "00:00"}`);
  const end = new Date(`${endDate}T${endTime || "00:00"}`);
  const totalMinutes = Math.max(0, Math.round((end - start) / 60000));
  const totalHours = totalMinutes / 60;
  const fullDays = Math.floor(totalMinutes / (24 * 60));
  const remainderMinutes = totalMinutes - fullDays * 24 * 60;

  // Case 1: under 1 full day -> minimum 1 day charge, no hourly add-on
  if (fullDays === 0) return { days: 1, extraHours: 0, totalHours };
  if (remainderMinutes === 0) return { days: fullDays, extraHours: 0, totalHours };
  // Case 2: remainder over 3 hours -> round up to a full extra day instead of hourly
  if (remainderMinutes > 180) return { days: fullDays + 1, extraHours: 0, totalHours };
  // Case 3: remainder up to 3 hours -> bill actual hours (minutes: <30 down, >=30 up)
  let extraHours = Math.floor(remainderMinutes / 60);
  if (remainderMinutes % 60 >= 30) extraHours += 1;
  return { days: fullDays, extraHours, totalHours };
}

/* ================= chat / company constants ================= */
const DEFAULT_COMPANY_BANK_INFO = [{ bank: "กสิกรไทย (KBank)", accountNo: "xxx-x-xxxxx-x", accountName: "ชื่อบัญชีเพจ (ตัวอย่าง)" }];
const DEFAULT_RESERVATION_DEPOSIT = 500;
const DEFAULT_CONTRACT_TERMS_TEXT = `เงื่อนไขการเช่ารถ (สรุปย่อ)
1. ผู้เช่าต้องมีใบขับขี่ที่ยังไม่หมดอายุ และแสดงบัตรประชาชนตัวจริงวันรับรถ
2. คืนรถช้ากว่ากำหนด คิดเพิ่มชั่วโมงละ 100 บาท (ไม่เกิน 3 ชม.) หากช้าเกิน 3 ชม. คิดเพิ่มเป็นค่าเช่า 1 วันเต็มแทน ทั้งนี้หากคืนรถก่อนเวลา จะยึดราคาตามที่จองไว้ ไม่มีการคืนเงินส่วนต่าง
3. คืนรถพร้อมระดับน้ำมัน/แบตเตอรี่เท่าที่รับไป ไม่ครบคิดค่าปรับตามจริง
4. เงินมัดจำ (ค้ำประกัน) คืนเต็มจำนวนหากรถไม่มีความเสียหาย ณ วันคืนรถ
5. กรณียกเลิกการจอง เงินโอนจองที่ชำระไว้จะไม่คืนให้ตามเงื่อนไขการจอง
* กรุณาตรวจสอบเงื่อนไขฉบับเต็มในสัญญาเช่าอีกครั้งก่อนรับรถค่ะ (แก้ไขข้อความนี้ได้ให้ตรงกับสัญญาจริงของร้าน)`;

/* ================= mock fleet data ================= */
const INITIAL_CARS = [
  { id: 1, plate: "1กข 2345", province: "กรุงเทพฯ", brand: "Honda", model: "City", category: "Sedan", fuel: "เบนซิน", doors: "4 ประตู", bed: "ไม่มีกระบะ", color: "silver", status: "available", rate: 1700, hourlyRate: 100, gpsMonthlyFee: 300, mileage: 34210, util: 72, photoUrl: "", reservationDeposit: 500, securityDeposit: 2000, insuranceExpiry: "2026-08-20", prbExpiry: "2026-08-20", taxExpiry: "2026-09-15",
    ownerType: "page", partnerName: "", commissionPct: 0, withholdingPct: 0,
    income: 18900, expense: { fuel: 1200, wash: 400, repair: 0, insurance: 850 },
    purchaseCost: 579000, depreciationYears: 5,
    loan: { monthly: 4800, monthsLeft: 37, daysRentedThisMonth: 2, interestMonthly: 1200 } },
  { id: 2, plate: "2ขค 8891", province: "กรุงเทพฯ", brand: "Toyota", model: "Yaris", category: "Hatchback", fuel: "เบนซิน", doors: "5 ประตู", bed: "ไม่มีกระบะ", color: "red", status: "rented", rate: 850, hourlyRate: 60, gpsMonthlyFee: 300, mileage: 51880, util: 88, photoUrl: "", reservationDeposit: 500, securityDeposit: 1500, insuranceExpiry: "2026-07-28", prbExpiry: "2026-07-28", taxExpiry: "2026-11-30",
    ownerType: "page", partnerName: "", commissionPct: 0, withholdingPct: 0,
    income: 22500, expense: { fuel: 1500, wash: 400, repair: 600, insurance: 850 },
    purchaseCost: 569000, depreciationYears: 5,
    loan: null },
  { id: 3, plate: "1กท 4477", province: "นนทบุรี", brand: "Honda", model: "HR-V", category: "SUV", fuel: "เบนซิน", doors: "5 ประตู", bed: "ไม่มีกระบะ", color: "white", status: "available", rate: 1400, hourlyRate: 90, gpsMonthlyFee: 300, mileage: 21050, util: 65, photoUrl: "", reservationDeposit: 500, securityDeposit: 1500, insuranceExpiry: "2027-02-10", prbExpiry: "2027-02-10", taxExpiry: "2027-01-05",
    ownerType: "partner", partnerName: "คุณวิชัย (พาร์ทเนอร์)", commissionPct: 20, withholdingPct: 5,
    income: 26400, expense: { fuel: 1800, wash: 400, repair: 0, insurance: 1100 },
    purchaseCost: 0, depreciationYears: 5,
    loan: null },
  { id: 4, plate: "3ฮบ 1290", province: "กรุงเทพฯ", brand: "Toyota", model: "Fortuner", category: "PPV", fuel: "ดีเซล", doors: "5 ประตู", bed: "ไม่มีกระบะ", color: "black", status: "wash", rate: 2200, hourlyRate: 140, gpsMonthlyFee: 300, mileage: 68900, util: 58, photoUrl: "", reservationDeposit: 1000, securityDeposit: 3000, insuranceExpiry: "2026-09-02", prbExpiry: "2026-09-02", taxExpiry: "2026-08-25",
    ownerType: "page", partnerName: "", commissionPct: 0, withholdingPct: 0,
    income: 31200, expense: { fuel: 2600, wash: 500, repair: 1200, insurance: 1400 },
    purchaseCost: 1459000, depreciationYears: 5,
    loan: null },
  { id: 5, plate: "4กก 5567", province: "สมุทรปราการ", brand: "Toyota", model: "Hilux Revo", category: "Pickup", fuel: "ดีเซล", doors: "4 ประตู", bed: "มีกระบะ", color: "white", status: "repair", rate: 1300, hourlyRate: 85, gpsMonthlyFee: 300, mileage: 77410, util: 41, photoUrl: "", reservationDeposit: 800, securityDeposit: 2000, insuranceExpiry: "2026-12-01", prbExpiry: "2026-12-01", taxExpiry: "2026-12-20",
    ownerType: "page", partnerName: "", commissionPct: 0, withholdingPct: 0,
    income: 14200, expense: { fuel: 2000, wash: 300, repair: 4500, insurance: 1100 },
    purchaseCost: 789000, depreciationYears: 5,
    loan: { monthly: 8000, monthsLeft: 48, daysRentedThisMonth: 5, interestMonthly: 2400 } },
  { id: 6, plate: "1วอ 9981", province: "กรุงเทพฯ", brand: "MG", model: "MG4", category: "Hatchback", fuel: "EV", doors: "5 ประตู", bed: "ไม่มีกระบะ", color: "blue", status: "available", rate: 1100, hourlyRate: 70, gpsMonthlyFee: 300, mileage: 12980, util: 54, photoUrl: "", reservationDeposit: 500, securityDeposit: 1500, insuranceExpiry: "2026-08-12", prbExpiry: "2026-08-12", taxExpiry: "2027-03-01",
    ownerType: "page", partnerName: "", commissionPct: 0, withholdingPct: 0,
    income: 15800, expense: { fuel: 450, wash: 400, repair: 0, insurance: 900 },
    purchaseCost: 799000, depreciationYears: 5,
    loan: null },
  { id: 7, plate: "5ขข 3345", province: "กรุงเทพฯ", brand: "BYD", model: "Atto 3", category: "SUV", fuel: "EV", doors: "5 ประตู", bed: "ไม่มีกระบะ", color: "white", status: "rented", rate: 1650, hourlyRate: 100, gpsMonthlyFee: 300, mileage: 9040, util: 81, photoUrl: "", reservationDeposit: 500, securityDeposit: 1500, insuranceExpiry: "2027-05-15", prbExpiry: "2027-05-15", taxExpiry: "2027-04-10",
    ownerType: "partner", partnerName: "คุณมณี (พาร์ทเนอร์)", commissionPct: 20, withholdingPct: 5,
    income: 24700, expense: { fuel: 600, wash: 400, repair: 0, insurance: 1100 },
    purchaseCost: 0, depreciationYears: 5,
    loan: null },
  { id: 8, plate: "2กค 6612", province: "นนทบุรี", brand: "Honda", model: "Civic", category: "Sedan", fuel: "เบนซิน", doors: "4 ประตู", bed: "ไม่มีกระบะ", color: "gray", status: "available", rate: 1200, hourlyRate: 80, gpsMonthlyFee: 300, mileage: 40330, util: 69, photoUrl: "", reservationDeposit: 500, securityDeposit: 1500, insuranceExpiry: "2026-10-05", prbExpiry: "2026-10-05", taxExpiry: "2026-10-05",
    ownerType: "page", partnerName: "", commissionPct: 0, withholdingPct: 0,
    income: 19600, expense: { fuel: 1400, wash: 400, repair: 0, insurance: 950 },
    purchaseCost: 869000, depreciationYears: 5,
    loan: null },
];

/* ================= mock bookings + schedule ================= */
const INITIAL_BOOKINGS = [
  { id: "bk1", status: "active", firstName: "กิตติธาดา", lastName: "เขียวสด", phone: "093-4212761", email: "", carId: 1,
    startDate: "2026-08-05", startTime: "09:00", endDate: "2026-08-08", endTime: "12:00", pickupLocation: "สนามบิน", returnLocation: "สนามบิน",
    reservationDeposit: 1000, reservationDepositPaid: true, pickupDayPayment: null, pickupDayPaid: false,
    securityDeposit: 2000, securityDepositCollected: false, securityDepositRefunded: false,
    contractSigned: false, idCardOrLicense: "", notes: "", cancelReason: "", depositRefunded: false, createdBy: "มานะ (พนักงาน A)" },
  { id: "bk2", status: "active", firstName: "อร", lastName: "จันทร์เพ็ญ", phone: "081-234-5678", email: "orn@example.com", carId: 2,
    startDate: "2026-08-04", startTime: "09:00", endDate: "2026-08-06", endTime: "20:00", pickupLocation: "ออฟฟิศ", returnLocation: "ออฟฟิศ",
    reservationDeposit: 500, reservationDepositPaid: true, pickupDayPayment: 1550, pickupDayPaid: true,
    securityDeposit: 1500, securityDepositCollected: true, securityDepositRefunded: false,
    contractSigned: true, idCardOrLicense: "", notes: "", cancelReason: "", depositRefunded: false, createdBy: "คุณสมชาย" },
  { id: "bk3", status: "active", firstName: "นภา", lastName: "ศรีสุข", phone: "082-555-1212", email: "", carId: 7,
    startDate: "2026-08-05", startTime: "08:00", endDate: "2026-08-05", endTime: "19:00", pickupLocation: "ออฟฟิศ", returnLocation: "ออฟฟิศ",
    reservationDeposit: 500, reservationDepositPaid: true, pickupDayPayment: 1150, pickupDayPaid: true,
    securityDeposit: 1500, securityDepositCollected: true, securityDepositRefunded: false,
    contractSigned: true, idCardOrLicense: "", notes: "", cancelReason: "", depositRefunded: false, createdBy: "ปราณี (พนักงาน B)" },
  { id: "bk4", status: "active", firstName: "วารี", lastName: "ทองสุข", phone: "089-777-8899", email: "waree@example.com", carId: 3,
    startDate: "2026-11-20", startTime: "10:00", endDate: "2026-11-22", endTime: "18:00", pickupLocation: "ออฟฟิศ", returnLocation: "ออฟฟิศ",
    reservationDeposit: 500, reservationDepositPaid: true, pickupDayPayment: null, pickupDayPaid: false,
    securityDeposit: 1500, securityDepositCollected: false, securityDepositRefunded: false,
    contractSigned: false, idCardOrLicense: "", notes: "จองล่วงหน้า - รอเซ็นสัญญาใกล้วันรับรถ", cancelReason: "", depositRefunded: false, createdBy: "คุณสมชาย" },
  { id: "bk9", status: "active", firstName: "เอกชัย", lastName: "พงษ์ไพบูลย์", phone: "084-666-7788", email: "", carId: 6,
    startDate: "2026-07-30", startTime: "09:00", endDate: "2026-08-02", endTime: "18:00", pickupLocation: "สนามบิน", returnLocation: "สนามบิน",
    reservationDeposit: 500, reservationDepositPaid: true, reservationSlipUrl: "", pickupDayPayment: 3800, pickupDayPaid: true,
    securityDeposit: 1500, securityDepositCollected: true, securityDepositRefunded: false,
    contractSigned: false, contractDocUrl: "", handoverPhotoUrl: "", returnSlipUrl: "",
    idCardOrLicense: "", notes: "ตัวอย่างงานที่เลยกำหนดคืนแล้วแต่ยังไม่ได้ปิด", cancelReason: "", depositRefunded: false, createdBy: "มานะ (พนักงาน A)" },
  { id: "bk5", status: "cancelled", firstName: "กันต์", lastName: "ทองดี", phone: "085-111-2233", email: "", carId: 8,
    startDate: "2026-08-10", startTime: "09:00", endDate: "2026-08-10", endTime: "18:00", pickupLocation: "ออฟฟิศ", returnLocation: "ออฟฟิศ",
    reservationDeposit: 500, reservationDepositPaid: true, pickupDayPayment: null, pickupDayPaid: false,
    securityDeposit: 0, securityDepositCollected: false, securityDepositRefunded: false,
    contractSigned: false, idCardOrLicense: "", notes: "", cancelReason: "ลูกค้ายกเลิกก่อนวันรับรถ ไม่แจ้งล่วงหน้า", depositRefunded: false, createdBy: "มานะ (พนักงาน A)" },
  { id: "bk6", status: "completed", firstName: "ปิยะ", lastName: "แสงทอง", phone: "086-222-3344", email: "piya@example.com", carId: 4,
    startDate: "2026-06-15", startTime: "09:00", endDate: "2026-06-18", endTime: "12:00", pickupLocation: "สนามบิน", returnLocation: "สนามบิน",
    actualEndDate: "2026-06-18", actualEndTime: "12:00",
    reservationDeposit: 1000, reservationDepositPaid: true, pickupDayPayment: 4600, pickupDayPaid: true,
    securityDeposit: 2000, securityDepositCollected: true, securityDepositRefunded: true,
    contractSigned: true, idCardOrLicense: "", notes: "", cancelReason: "", depositRefunded: false, createdBy: "คุณสมชาย" },
  { id: "bk7", status: "completed", firstName: "มาลี", lastName: "รุ่งเรือง", phone: "081-555-9988", email: "", carId: 3,
    startDate: "2025-03-10", startTime: "10:00", endDate: "2025-03-12", endTime: "18:00", pickupLocation: "ออฟฟิศ", returnLocation: "ออฟฟิศ",
    actualEndDate: "2025-03-12", actualEndTime: "18:00",
    reservationDeposit: 500, reservationDepositPaid: true, pickupDayPayment: 2300, pickupDayPaid: true,
    securityDeposit: 1500, securityDepositCollected: true, securityDepositRefunded: true,
    contractSigned: true, idCardOrLicense: "", notes: "", cancelReason: "", depositRefunded: false, createdBy: "ปราณี (พนักงาน B)" },
  { id: "bk8", status: "completed", firstName: "ธนกร", lastName: "ศรีวิไล", phone: "089-333-1122", email: "", carId: 5,
    startDate: "2022-12-20", startTime: "08:00", endDate: "2022-12-23", endTime: "20:00", pickupLocation: "ขนส่งสายใต้", returnLocation: "ขนส่งสายใต้",
    actualEndDate: "2022-12-24", actualEndTime: "09:00",
    reservationDeposit: 500, reservationDepositPaid: true, pickupDayPayment: 3400, pickupDayPaid: true,
    securityDeposit: 1500, securityDepositCollected: true, securityDepositRefunded: true,
    contractSigned: true, idCardOrLicense: "", notes: "คืนช้ากว่ากำหนด ~13 ชม. คิดเพิ่ม 1 วัน", cancelReason: "", depositRefunded: false, createdBy: "มานะ (พนักงาน A)" },
];

const INITIAL_SCHEDULE_EVENTS = [
  { id: "e1", carId: 4, date: "2026-08-05", startHour: 11, endHour: 12, type: "wash", note: "ล้าง + ดูดฝุ่นภายใน", groupId: "g1", bookingId: null },
  { id: "e2", carId: 4, date: "2026-08-05", startHour: 16, endHour: 20, type: "booked", note: "คุณธีระ 086-xxx-xxxx", groupId: "g2", bookingId: null },
  { id: "e3a", carId: 5, date: "2026-08-05", startHour: 9, endHour: 24, type: "repair", note: "เปลี่ยนผ้าเบรก + เช็คช่วงล่าง (3 วัน)", groupId: "g3", bookingId: null },
  { id: "e3b", carId: 5, date: "2026-08-06", startHour: 0, endHour: 24, type: "repair", note: "เปลี่ยนผ้าเบรก + เช็คช่วงล่าง (3 วัน)", groupId: "g3", bookingId: null },
  { id: "e3c", carId: 5, date: "2026-08-07", startHour: 0, endHour: 17, type: "repair", note: "เปลี่ยนผ้าเบรก + เช็คช่วงล่าง (3 วัน)", groupId: "g3", bookingId: null },
  { id: "e4", carId: 2, date: "2026-08-04", startHour: 8, endHour: 9, type: "wash", note: "ล้างก่อนส่งลูกค้า", groupId: "g4", bookingId: null },
];

const HISTORY = [
  { month: "ม.ค.", revenue: 148000, netProfit: 21000 },
  { month: "ก.พ.", revenue: 152000, netProfit: 23500 },
  { month: "มี.ค.", revenue: 139000, netProfit: 16000 },
  { month: "เม.ย.", revenue: 161000, netProfit: 27000 },
  { month: "พ.ค.", revenue: 158000, netProfit: 24500 },
  { month: "มิ.ย.", revenue: 165000, netProfit: 28000 },
  { month: "ก.ค.", revenue: 171000, netProfit: 29500 },
];

// Past-year summaries for the finance year-selector (point 3). Only totals are kept for prior years —
// full monthly/category breakdowns would come from real stored transactions in production.
const YEARLY_SUMMARY_HISTORY = [
  { year: 2565, revenue: 1450000, netProfit: 198000, avgUtil: 58 },
  { year: 2566, revenue: 1620000, netProfit: 245000, avgUtil: 62 },
  { year: 2567, revenue: 1780000, netProfit: 289000, avgUtil: 66 },
  { year: 2568, revenue: 1950000, netProfit: 318000, avgUtil: 69 },
];
const CURRENT_YEAR_BE = 2569;

const DEFAULT_OVERHEAD = {
  staff: [
    { id: 1, name: "คุณสมชาย", position: "เจ้าของเพจ", salary: 25000, isOwner: true },
    { id: 2, name: "พนักงาน A", position: "ดูแลรถ/ล้างรถ/รับ-ส่ง", salary: 12000, isOwner: false },
    { id: 3, name: "พนักงาน B", position: "แอดมิน/ตอบแชท/จอง", salary: 15000, isOwner: false },
  ],
  rent: 8000, marketing: 3000, platformFee: 4000, other: 1500,
};

/* ================= ad-hoc expense ledger ================= */
// CRITICAL ACCOUNTING DISTINCTION:
//  - isDrawing: false -> a real business expense. Reduces profit AND cash. Tax-deductible
//               if properly documented (receipt / tax invoice in the company's name).
//  - isDrawing: true  -> owner taking money out for personal use. Reduces CASH ONLY.
//               It is NOT an expense and NOT tax-deductible. Recording it as an expense
//               understates profit and will be disallowed by the Revenue Department.
// Cash-flow classification (standard 3-bucket model):
//   operating  = day-to-day running of the business (affects profit)
//   investing  = buying/selling things used for years (does NOT hit profit directly;
//                a purchased car becomes an asset and is expensed via depreciation instead)
//   financing  = loans and owner money (does NOT hit profit at all)
const FLOW_TYPES = {
  operating: { label: "ดำเนินงาน", color: "#3B5BA5", hitsProfit: true },
  investing: { label: "ลงทุน", color: "#7A4FA3", hitsProfit: false },
  financing: { label: "จัดหาเงิน", color: "#D69A2D", hitsProfit: false },
};
const DEFAULT_EXPENSE_CATEGORIES = [
  // --- operating: real running costs, reduce profit ---
  { key: "staff_welfare", label: "สวัสดิการพนักงาน/งานเลี้ยง", flow: "operating", dir: "out", note: "เลี้ยงปีใหม่ ประกันกลุ่ม ยูนิฟอร์ม", system: true },
  { key: "office", label: "ของใช้สำนักงาน", flow: "operating", dir: "out", note: "เครื่องเขียน ของใช้สิ้นเปลือง", system: true },
  { key: "utilities", label: "ค่าน้ำ-ไฟ-เน็ต-โทรศัพท์", flow: "operating", dir: "out", note: "", system: true },
  { key: "entertainment", label: "ค่ารับรองลูกค้า", flow: "operating", dir: "out", note: "สรรพากรจำกัดเพดาน ควรถามผู้ทำบัญชี", system: true },
  { key: "professional", label: "ค่าทำบัญชี/ที่ปรึกษา/กฎหมาย", flow: "operating", dir: "out", note: "", system: true },
  { key: "travel", label: "ค่าเดินทางเพื่อธุรกิจ", flow: "operating", dir: "out", note: "", system: true },
  { key: "car_repair", label: "ค่าซ่อม/บำรุงรถ", flow: "operating", dir: "out", note: "ผูกกับรถคันใดคันหนึ่งได้", system: true },
  { key: "car_wash", label: "ค่าล้างรถ", flow: "operating", dir: "out", note: "ผูกกับรถคันใดคันหนึ่งได้", system: true },
  { key: "car_fuel", label: "ค่าน้ำมัน/ชาร์จไฟ", flow: "operating", dir: "out", note: "ผูกกับรถคันใดคันหนึ่งได้", system: true },
  { key: "other_biz", label: "ค่าใช้จ่ายธุรกิจอื่นๆ", flow: "operating", dir: "out", note: "", system: true },
  { key: "other_income", label: "รายได้อื่น (นอกจากค่าเช่า)", flow: "operating", dir: "in", note: "ค่าปรับ ค่าเสียหาย ฯลฯ", system: true },
  // --- investing: buying/selling long-term assets, NOT an expense ---
  { key: "buy_car", label: "ซื้อรถเข้ากอง", flow: "investing", dir: "out", note: "ไม่ใช่รายจ่าย — รถเป็นทรัพย์สิน ทยอยเป็นรายจ่ายผ่านค่าเสื่อม", system: true },
  { key: "sell_car", label: "ขายรถออก", flow: "investing", dir: "in", note: "เงินเข้าจากการขายทรัพย์สิน", system: true },
  { key: "office_improve", label: "ปรับปรุงออฟฟิศ/อู่ (งานใหญ่)", flow: "investing", dir: "out", note: "งานที่ใช้ได้หลายปี ถ้าซ่อมเล็กน้อยให้ใช้หมวดดำเนินงานแทน", system: true },
  { key: "buy_equipment", label: "ซื้ออุปกรณ์ถาวร", flow: "investing", dir: "out", note: "GPS กล้อง เครื่องมือ ที่ใช้ได้หลายปี", system: true },
  // --- financing: loans and owner money, never touches profit ---
  { key: "loan_in", label: "รับเงินกู้เข้ามา", flow: "financing", dir: "in", note: "", system: true },
  { key: "loan_principal", label: "จ่ายคืนเงินต้น (นอกเหนือค่างวดรถ)", flow: "financing", dir: "out", note: "ดอกเบี้ยให้แยกเป็นหมวดดำเนินงาน", system: true },
  { key: "owner_inject", label: "เจ้าของเติมเงินเข้าบริษัท", flow: "financing", dir: "in", note: "ไม่ใช่รายได้ ไม่เสียภาษี", system: true },
  { key: "owner_draw", label: "เจ้าของถอนไปใช้ส่วนตัว", flow: "financing", dir: "out", note: "ไม่ใช่รายจ่าย ไม่ลดกำไร หักภาษีไม่ได้", system: true },
];
// Staff reimbursement claims. Flow: pending -> approved -> paid (or rejected).
// Accounting: becomes an expense at "approved" (receipt exists), moves cash at "paid".
const CLAIM_STATUS = {
  pending: { label: "รออนุมัติ", color: "#D69A2D" },
  approved: { label: "อนุมัติแล้ว — รอจ่ายคืน", color: "#3B5BA5" },
  paid: { label: "จ่ายคืนแล้ว", color: "#3A7D5C" },
  rejected: { label: "ไม่อนุมัติ", color: "#C1502E" },
  cancelled: { label: "ยกเลิกโดยผู้ขอเบิก", color: "#8A8F98" },
};
const INITIAL_CLAIMS = [
  { id: "cl1", requesterName: "มานะ (พนักงาน A)", requestDate: "2026-08-04", requestedAt: "2026-08-04T09:12:00", reviewedAtTime: "", paymentDate: "2026-08-03", amount: 1800,
    category: "car_repair", carId: 5, description: "เปลี่ยนผ้าเบรกหน้า ร้านเจริญยนต์", receiptUrl: "", extraDocUrl: "",
    status: "pending", reviewedBy: "", reviewedAt: "", rejectReason: "", paidAt: "" },
  { id: "cl2", requesterName: "ปราณี (พนักงาน B)", requestDate: "2026-08-02", requestedAt: "2026-08-02T16:45:00", reviewedAtTime: "2026-08-02T18:20:00", paymentDate: "2026-08-01", amount: 450,
    category: "car_wash", carId: 2, description: "ล้างรถ+ดูดฝุ่นก่อนส่งลูกค้า", receiptUrl: "", extraDocUrl: "",
    status: "approved", reviewedBy: "คุณสมชาย", reviewedAt: "2026-08-02", rejectReason: "", paidAt: "" },
  { id: "cl3", requesterName: "มานะ (พนักงาน A)", requestDate: "2026-07-29", requestedAt: "2026-07-29T11:03:00", reviewedAtTime: "2026-07-29T13:30:00", paymentDate: "2026-07-28", amount: 1200,
    category: "car_fuel", carId: 1, description: "เติมน้ำมันก่อนส่งมอบ", receiptUrl: "", extraDocUrl: "",
    status: "paid", reviewedBy: "คุณสมชาย", reviewedAt: "2026-07-29", rejectReason: "", paidAt: "2026-07-30" },
];
let claimCounter = 100;

const INITIAL_OTHER_EXPENSES = [
  { id: "ox1", date: "2026-08-02", category: "staff_welfare", description: "เลี้ยงทีมงานหลังปิดยอดเดือน ก.ค.", amount: 3500, receiptUrl: "", carId: null },
  { id: "ox2", date: "2026-08-04", category: "professional", description: "ค่าทำบัญชีรายเดือน", amount: 2500, receiptUrl: "", carId: null },
  { id: "ox3", date: "2026-08-03", category: "owner_draw", description: "ถอนไปใช้ส่วนตัว", amount: 20000, receiptUrl: "", carId: null },
];
function catOf(key, categories) {
  const list = categories || DEFAULT_EXPENSE_CATEGORIES;
  return list.find((c) => c.key === key) || { key, label: key, flow: "operating", dir: "out", note: "" };
}
// Splits ad-hoc entries by what they actually do to the books.
function splitExpenses(otherExpenses, yearMonth, categories) {
  const inMonth = (otherExpenses || []).filter((e) => !yearMonth || (e.date || "").slice(0, 7) === yearMonth);
  const withCat = inMonth.map((e) => ({ ...e, cat: catOf(e.category, categories) }));
  const sum = (arr) => arr.reduce((s, e) => s + (e.amount || 0), 0);
  const opOut = withCat.filter((e) => e.cat.flow === "operating" && e.cat.dir === "out");
  const opIn = withCat.filter((e) => e.cat.flow === "operating" && e.cat.dir === "in");
  const invOut = withCat.filter((e) => e.cat.flow === "investing" && e.cat.dir === "out");
  const invIn = withCat.filter((e) => e.cat.flow === "investing" && e.cat.dir === "in");
  const finOut = withCat.filter((e) => e.cat.flow === "financing" && e.cat.dir === "out");
  const finIn = withCat.filter((e) => e.cat.flow === "financing" && e.cat.dir === "in");
  return {
    list: withCat,
    business: opOut, businessTotal: sum(opOut),      // reduces profit AND cash
    otherIncomeTotal: sum(opIn),                      // adds to profit AND cash
    investOut: invOut, investOutTotal: sum(invOut),   // cash only (becomes an asset)
    investIn: invIn, investInTotal: sum(invIn),       // cash only
    finOut: finOut, finOutTotal: sum(finOut),         // cash only (incl. owner drawings)
    finIn: finIn, finInTotal: sum(finIn),             // cash only (incl. owner injections)
    drawings: finOut, drawingsTotal: sum(finOut),     // kept for backward compatibility
  };
}
let expenseCounter = 100;

// Money must keep 2 decimals. Rounding to whole baht makes interest, tax and partner
// commission figures drift, which is painful to reconcile at audit time.
function fmt(n) {
  const v = Number(n) || 0;
  return v.toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
// Whole-number formatter for counts (days, cars, percentages) where decimals are noise.
function fmtInt(n) { return Math.round(Number(n) || 0).toLocaleString("th-TH"); }
const R = (n) => Math.round((Number(n) || 0) * 100) / 100;
// Locks background page scroll while a fixed-position modal is open. Without this, on many mobile
// browsers a touch-scroll gesture inside a long modal can get captured by the page behind it instead,
// making the modal feel "stuck" even though its own content is scrollable.
function useLockBodyScroll(active = true) {
  useEffect(() => {
    if (!active) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = original; };
  }, [active]);
}
let eventCounter = 100;
let groupCounter = 100;
let carCounter = 100;
let staffCounter = 100;
let bookingCounter = 100;
let accountCounter = 100;
const todayStr = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; };

/* ================= accounting helpers ================= */
// CASH vs PROFIT — these are deliberately different calculations:
//  - Loan: the FULL installment leaves the bank account, but only the interest portion is an expense.
//  - Security deposits: cash comes in, but it is a liability to be returned, never revenue.
//  - Depreciation: a real expense, but no cash moves.
// A business can be profitable on paper and still run out of cash, which is what this panel catches.
// How many rental days per month this car must achieve just to cover its OWN fixed costs
// (loan installment + insurance + GPS + depreciation). Below this number the car loses money
// no matter how well the rest of the business does.
function computeBreakeven(car) {
  const loanCash = car.loan ? car.loan.monthly : 0;
  const fixedMonthly = loanCash + (car.expense.insurance || 0) + (car.gpsMonthlyFee || 0);
  const depreciation = car.purchaseCost ? car.purchaseCost / ((car.depreciationYears || 5) * 12) : 0;
  const totalToCover = fixedMonthly + depreciation;
  const rate = car.rate || 0;
  // variable cost per rental day (fuel/wash roughly scale with usage)
  const variablePerDay = rate > 0 ? ((car.expense.fuel || 0) + (car.expense.wash || 0)) / 30 : 0;
  const contributionPerDay = Math.max(1, rate - variablePerDay);
  const daysNeeded = rate > 0 ? Math.ceil(totalToCover / contributionPerDay) : 0;
  return { fixedMonthly, depreciation, totalToCover, daysNeeded, contributionPerDay };
}

// Documents expiring soon or already expired. Thai law requires valid พ.ร.บ./insurance and
// road tax — driving on an expired one is both illegal and voids coverage in an accident.
function getExpiryAlerts(cars, today = APP_TODAY, warnDays = 30) {
  const alerts = [];
  cars.forEach((car) => {
    [
      { key: "insuranceExpiry", label: "ประกันภัยภาคสมัครใจ" },
      { key: "prbExpiry", label: "พ.ร.บ. (ประกันภาคบังคับ)" },
      { key: "taxExpiry", label: "ภาษีรถประจำปี" },
    ].forEach(({ key, label }) => {
      const d = car[key];
      if (!d) return;
      const diff = daysBetween(today, d);
      if (diff <= warnDays) alerts.push({ car, label, date: d, daysLeft: diff, expired: diff < 0 });
    });
  });
  return alerts.sort((a, b) => a.daysLeft - b.daysLeft);
}

// Outcome mix across all jobs ever recorded — shows whether cancellations are becoming
// a pattern worth investigating, rather than just listing individual jobs.
function computeOutcomeStats(bookings) {
  const total = bookings.length;
  const completed = bookings.filter((b) => b.status === "completed").length;
  const cancelled = bookings.filter((b) => b.status === "cancelled").length;
  const active = bookings.filter((b) => b.status === "active").length;
  const pending = bookings.filter((b) => b.status === "pending").length;
  // "not completed" = past its return date, still open, documents incomplete
  const overdueOpen = bookings.filter((b) => b.status === "active" && b.endDate < APP_TODAY).length;
  const closedTotal = completed + cancelled;
  const pct = (nn) => (closedTotal ? Math.round((nn / closedTotal) * 100) : 0);
  const cancelReasons = {};
  bookings.filter((b) => b.status === "cancelled").forEach((b) => {
    const k = (b.cancelReason || "ไม่ระบุเหตุผล").trim() || "ไม่ระบุเหตุผล";
    cancelReasons[k] = (cancelReasons[k] || 0) + 1;
  });
  return { total, completed, cancelled, active, pending, overdueOpen, closedTotal,
    completedPct: pct(completed), cancelledPct: pct(cancelled),
    cancelReasons: Object.entries(cancelReasons).sort((a, b) => b[1] - a[1]) };
}


function computeCashFlow(cars, overhead, bookings, otherExpenses, yearMonth, categories, claims) {
  const live = bookings.filter((b) => b.status !== "cancelled");
  let cashInRental = 0, securityHeld = 0, outstanding = 0;
  const outstandingList = [];
  live.forEach((b) => {
    const resAmt = b.reservationDeposit || 0;
    const pickAmt = b.pickupDayPayment || 0;
    if (b.reservationDepositPaid) cashInRental += resAmt;
    if (b.pickupDayPaid) cashInRental += pickAmt;
    if (b.securityDepositCollected && !b.securityDepositRefunded) securityHeld += b.securityDeposit || 0;
    const owedItems = [];
    if (!b.reservationDepositPaid && resAmt) owedItems.push({ label: "เงินโอนจอง", amount: resAmt });
    if (!b.pickupDayPaid && pickAmt) owedItems.push({ label: "ยอดวันรับรถ", amount: pickAmt });
    const owedTotal = owedItems.reduce((s, i) => s + i.amount, 0);
    if (owedTotal > 0) { outstanding += owedTotal; outstandingList.push({ booking: b, items: owedItems, total: owedTotal }); }
  });
  // forfeited deposits from cancelled bookings are cash the business keeps
  const forfeited = bookings.filter((b) => b.status === "cancelled" && b.reservationDepositPaid && !b.depositRefunded).reduce((s, b) => s + (b.reservationDeposit || 0), 0);

  const pageCars = cars.filter((c) => c.ownerType !== "partner");
  const carCashOut = pageCars.reduce((s, c) => s + c.expense.fuel + c.expense.wash + c.expense.repair + c.expense.insurance + (c.gpsMonthlyFee || 0), 0);
  const staffCashOut = overhead.staff.reduce((s, p) => s + p.salary, 0);
  const overheadCashOut = overhead.rent + overhead.marketing + overhead.platformFee + overhead.other;
  const loanCashOut = cars.reduce((s, c) => s + (c.loan ? c.loan.monthly : 0), 0);
  const partnerPayout = cars.filter((c) => c.ownerType === "partner").reduce((s, c) => s + computePartnerPayout(c).netPayout, 0);

  // Every bucket moves real cash, regardless of whether it touches profit.
  const ox = splitExpenses(otherExpenses, yearMonth, categories);
  const claimsPaid = (claims || []).filter((q) => q.status === "paid" && (!yearMonth || (q.paidAt || q.paymentDate || "").slice(0, 7) === yearMonth));
  const claimsPaidTotal = claimsPaid.reduce((s, q) => s + (q.amount || 0), 0);
  const claimsOwed = (claims || []).filter((q) => q.status === "approved");
  const claimsOwedTotal = claimsOwed.reduce((s, q) => s + (q.amount || 0), 0);

  const cashIn = cashInRental + forfeited + ox.otherIncomeTotal + ox.investInTotal + ox.finInTotal;
  const cashOut = carCashOut + staffCashOut + overheadCashOut + loanCashOut + partnerPayout
                + ox.businessTotal + ox.investOutTotal + ox.finOutTotal + claimsPaidTotal;
  const netCash = cashIn - cashOut;
  return { cashIn, cashInRental, forfeited, securityHeld, outstanding, outstandingList,
    carCashOut, staffCashOut, overheadCashOut, loanCashOut, partnerPayout,
    otherBusinessOut: ox.businessTotal, otherIncomeIn: ox.otherIncomeTotal,
    investOut: ox.investOutTotal, investIn: ox.investInTotal,
    finOut: ox.finOutTotal, finIn: ox.finInTotal, drawingsOut: ox.finOutTotal,
    claimsPaidTotal, claimsOwedTotal, claimsOwed,
    cashOut, netCash };
}

function computePnL(cars, overhead, bookings, otherExpenses, yearMonth, categories, claims) {
  const oxSplit = splitExpenses(otherExpenses, yearMonth, categories);
  const pageCars = cars.filter((c) => c.ownerType !== "partner");
  const partnerCars = cars.filter((c) => c.ownerType === "partner");
  const pageOwnRevenue = pageCars.reduce((s, c) => s + c.income, 0);
  const commissionRevenue = partnerCars.reduce((s, c) => s + (c.income * (c.commissionPct || 0)) / 100, 0);
  const revenue = pageOwnRevenue + commissionRevenue;
  const otherIncome = bookings.filter((b) => b.status === "cancelled" && b.reservationDepositPaid && !b.depositRefunded).reduce((s, b) => s + (b.reservationDeposit || 0), 0) + oxSplit.otherIncomeTotal;
  const variableCost = pageCars.reduce((s, c) => s + c.expense.fuel + c.expense.wash + c.expense.repair + (c.gpsMonthlyFee || 0), 0);
  const insurance = pageCars.reduce((s, c) => s + c.expense.insurance, 0);
  const staffTotal = overhead.staff.reduce((s, p) => s + p.salary, 0);
  // Only real business expenses enter the P&L. Owner drawings are deliberately excluded —
  // they are a withdrawal of profit, not a cost of earning it.
  const otherBusiness = oxSplit.businessTotal;
  // A staff claim is a genuine business cost once approved (receipt exists), whether or not
  // the company has physically reimbursed it yet.
  const claimExpense = (claims || [])
    .filter((q) => (q.status === "approved" || q.status === "paid") && (!yearMonth || (q.paymentDate || "").slice(0, 7) === yearMonth))
    .reduce((s, q) => s + (q.amount || 0), 0);
  const overheadTotal = staffTotal + overhead.rent + overhead.marketing + overhead.platformFee + overhead.other + otherBusiness + claimExpense;
  const fixedCost = insurance + overheadTotal;
  const ebitda = revenue + otherIncome - variableCost - fixedCost;
  const depreciation = pageCars.reduce((s, c) => s + (c.purchaseCost ? c.purchaseCost / ((c.depreciationYears || 5) * 12) : 0), 0);
  const ebit = ebitda - depreciation;
  const interest = pageCars.reduce((s, c) => s + (c.loan ? (c.loan.interestMonthly || 0) : 0), 0);
  const ebt = ebit - interest;
  const tax = ebt > 0 ? ebt * 0.20 : 0;
  const netProfit = ebt - tax;
  return { revenue, pageOwnRevenue, commissionRevenue, otherIncome, variableCost, insurance, staffTotal, otherBusiness, claimExpense, overheadTotal, fixedCost, ebitda, depreciation, ebit, interest, ebt, tax, netProfit };
}
function carMonthlyNet(car) {
  const exp = car.expense.fuel + car.expense.wash + car.expense.repair + car.expense.insurance + (car.gpsMonthlyFee || 0);
  const dep = car.purchaseCost ? car.purchaseCost / ((car.depreciationYears || 5) * 12) : 0;
  const interest = car.loan ? (car.loan.interestMonthly || 0) : 0;
  return car.income - exp - dep - interest;
}
// Utilization % = days this car had a "booked" event this month ÷ days elapsed in the month so far (or full month if it's a past month).
// This is a live calculation from real schedule data — it does NOT read any stored/mock util number.
// Point 10: a job whose return date has passed but is still not closed. Returns the list of
// missing documents so staff know exactly what's blocking closure, not just that something is.
function getMissingDocs(b) {
  const missing = [];
  if (!b.reservationSlipUrl) missing.push("สลิปโอนเงินจอง");
  if (!b.contractDocUrl) missing.push("สัญญาเช่าที่เซ็นแล้ว");
  if (!b.handoverPhotoUrl) missing.push("รูปส่งมอบรถ");
  if (!b.returnSlipUrl) missing.push("สลิปคืนมัดจำ/ปิดงาน");
  return missing;
}
function getOverdueJobs(bookings, today = APP_TODAY) {
  return bookings
    .filter((b) => b.status === "active" && b.endDate < today)
    .map((b) => ({ booking: b, daysOverdue: Math.max(1, daysBetween(b.endDate, today)), missing: getMissingDocs(b) }))
    .sort((a, b) => b.daysOverdue - a.daysOverdue);
}

function computeUtilization(car, scheduleEvents, yearMonth = APP_TODAY.slice(0, 7)) {
  const [y, m] = yearMonth.split("-").map(Number);
  const daysInMonth = new Date(y, m, 0).getDate();
  const isCurrentMonth = yearMonth === APP_TODAY.slice(0, 7);
  const denom = isCurrentMonth ? Number(APP_TODAY.slice(8, 10)) : daysInMonth;
  const bookedDates = new Set(scheduleEvents.filter((e) => e.carId === car.id && e.type === "booked" && e.date.startsWith(yearMonth) && Number(e.date.slice(8, 10)) <= denom).map((e) => e.date));
  return denom > 0 ? Math.round((bookedDates.size / denom) * 100) : 0;
}
function computePartnerPayout(car) {
  const commission = (car.income * (car.commissionPct || 0)) / 100;
  const afterCommission = car.income - commission;
  const withholding = (afterCommission * (car.withholdingPct || 0)) / 100;
  const carExp = car.expense.fuel + car.expense.wash + car.expense.repair + car.expense.insurance + (car.gpsMonthlyFee || 0);
  const netPayout = afterCommission - withholding - carExp;
  return { commission, afterCommission, withholding, carExp, netPayout };
}
function calcBookingTotal(booking, car) {
  if (!car) return { days: 0, extraHours: 0, dailySubtotal: 0, hourSubtotal: 0, total: 0, listTotal: 0, discount: 0, overridden: false };
  const { days, extraHours } = calcDuration(booking.startDate, booking.startTime, booking.endDate, booking.endTime);
  // A booking may carry its own agreed daily rate (e.g. a discount for a long stay).
  // Falls back to the car's standard rate when not set, so existing bookings are unaffected.
  const dailyRate = booking.customDailyRate != null && booking.customDailyRate !== "" ? Number(booking.customDailyRate) : (car.rate || 0);
  const hourRate = booking.customHourlyRate != null && booking.customHourlyRate !== "" ? Number(booking.customHourlyRate) : (car.hourlyRate || 0);
  const dailySubtotal = days * dailyRate;
  const hourSubtotal = extraHours * hourRate;
  const listTotal = days * (car.rate || 0) + extraHours * (car.hourlyRate || 0);
  const total = dailySubtotal + hourSubtotal;
  return { days, extraHours, dailyRate, hourRate, dailySubtotal, hourSubtotal, total, listTotal, discount: listTotal - total, overridden: total !== listTotal };
}
// Same billing rules as calcBookingTotal (point 19), applied to the ACTUAL return date/time instead of
// the originally planned one — this is how a late return gets correctly billed extra.
function calcActualBookingTotal(booking, car) {
  return calcBookingTotal({ ...booking, endDate: booking.actualEndDate || booking.endDate, endTime: booking.actualEndTime || booking.endTime }, car);
}
function generateBookingMessage(booking, car) {
  if (!car) return "";
  const { days, extraHours, dailySubtotal, hourSubtotal, total } = calcBookingTotal(booking, car);
  const colorLabel = (COLORS.find((c) => c.key === car.color) || {}).label || "";
  const pickupDayPayment = booking.pickupDayPayment != null ? booking.pickupDayPayment : total - (booking.reservationDeposit || 0);
  const lines = [
    `คุณ ${booking.firstName} ${booking.lastName}`,
    booking.phone,
    `${car.model}${colorLabel}`,
    `${formatDMY(booking.startDate)} รับรถ ${booking.startTime} ${booking.pickupLocation || "-"}`,
    `${formatDMY(booking.endDate)} คืนรถ ${booking.endTime} ${booking.returnLocation || "-"}`,
    `${days}วัน${extraHours}ชม ${fmt(dailySubtotal)}+${fmt(hourSubtotal)}=${fmt(total)}บาท`,
    `โอนจอง${fmt(booking.reservationDeposit || 0)} วันรับรถจ่าย${fmt(pickupDayPayment)}${booking.securityDeposit ? `+มัดจำ${fmt(booking.securityDeposit)}(คืนให้ในวันคืนรถครับ)` : ""}`,
  ];
  return lines.join("\n");
}
// Point 6: written confirmation sent to the customer's email once staff confirms a booking.
// This app has no real email/SMTP integration — it generates the exact content that would be sent,
// for staff to copy into an email client (or, in production, to wire to a real email service).
function generateConfirmationEmail(booking, car, termsText) {
  if (!car) return "";
  const summary = generateBookingMessage(booking, car);
  return [
    `เรื่อง: ยืนยันการจองรถ — ${car.brand} ${car.model} (${formatDMY(booking.startDate)}–${formatDMY(booking.endDate)})`,
    "",
    `เรียน คุณ${booking.firstName} ${booking.lastName}`,
    "",
    "ทางร้านขอยืนยันการจองรถของท่านตามรายละเอียดด้านล่าง กรุณาเก็บอีเมลนี้ไว้เป็นหลักฐาน ไม่จำเป็นต้องตอบกลับค่ะ",
    "",
    "— สรุปการจอง —",
    summary,
    "",
    "— เงื่อนไขการเช่ารถ —",
    termsText,
  ].join("\n");
}
function generateAvailableCarsMessage(cars) {
  const avail = cars.filter((c) => c.status === "available");
  const lines = ["🚗 รถว่างค่ะ วันนี้", ""];
  avail.forEach((c) => { const colorLabel = (COLORS.find((x) => x.key === c.color) || {}).label || ""; lines.push(`${c.brand} ${c.model} ${colorLabel} - ${fmt(c.rate)} บาท/วัน`); });
  if (avail.length === 0) lines.push("ขออภัยค่ะ ตอนนี้รถเต็มทุกคัน");
  lines.push("", "สนใจคันไหนแจ้งวันเวลารับ-คืนได้เลยค่ะ 😊");
  return lines.join("\n");
}
function generateBankInfoMessage(bankInfo) {
  return bankInfo.map((b) => `ธนาคาร: ${b.bank}\nเลขบัญชี: ${b.accountNo}\nชื่อบัญชี: ${b.accountName}`).join("\n\n");
}

/* ================= calendar helpers ================= */
function expandRangeToEvents({ startDate, endDate, carId, type, note, groupId, startHour = 0, endHour = 24, bookingId = null, idPrefix = "ev" }) {
  const events = [];
  let d = startDate; let safety = 0;
  while (safety++ < 60) {
    const isFirst = d === startDate; const isLast = d === endDate;
    const sh = isFirst ? startHour : 0;
    const eh = isLast ? endHour : 24;
    if (eh > sh) events.push({ id: `${idPrefix}-${groupId}-${d}`, carId, date: d, startHour: sh, endHour: eh, type, note, groupId, bookingId });
    if (d === endDate) break;
    d = addDays(d, 1);
  }
  return events;
}
// Data saved before cleaning-buffer blocks existed won't have them. Regenerate the
// missing blocks on load so the schedule is correct without forcing a data reset.
// How long a car is held back after return for inspection and cleaning.
const CLEAN_BUFFER_HOURS = 1;

function ensureCleanBuffers(scheduleEvents, bookings) {
  const existing = new Set(scheduleEvents.filter((e) => e.type === "clean").map((e) => e.bookingId));
  const added = [];
  bookings.filter((b) => b.status === "active" || b.status === "completed").forEach((b) => {
    if (existing.has(b.id)) return;
    expandBookingToEvents(b).filter((e) => e.type === "clean").forEach((e) => added.push(e));
  });
  return added.length ? [...scheduleEvents, ...added] : scheduleEvents;
}

function expandBookingToEvents(b) {
  const endHour = parseInt((b.endTime || "00:00").split(":")[0], 10) || 24;
  const events = expandRangeToEvents({
    startDate: b.startDate, endDate: b.endDate, carId: b.carId, type: "booked",
    note: `${b.firstName} ${b.lastName} · ${b.phone}`, groupId: b.id, bookingId: b.id,
    startHour: parseInt((b.startTime || "00:00").split(":")[0], 10), endHour,
    idPrefix: "bk",
  });
  // Block the cleaning window straight after the return so the car can't be re-let immediately.
  const cleanStart = endHour;
  const cleanEnd = cleanStart + CLEAN_BUFFER_HOURS;
  if (cleanEnd <= 24) {
    events.push({
      id: `clean-${b.id}`, carId: b.carId, date: b.endDate, type: "clean",
      note: `เคลียรถหลัง ${b.firstName} คืน — พร้อมส่งต่อ ${cleanEnd}:00`, startHour: cleanStart, endHour: cleanEnd,
      groupId: `clean-${b.id}`, bookingId: b.id, isCleanBuffer: true,
    });
  } else {
    // Return late in the day — carry the buffer into the following morning.
    events.push({
      id: `clean-${b.id}`, carId: b.carId, date: addDays(b.endDate, 1), type: "clean",
      note: `เคลียรถหลัง ${b.firstName} คืน — พร้อมส่งต่อ ${CLEAN_BUFFER_HOURS}:00`, startHour: 0, endHour: CLEAN_BUFFER_HOURS,
      groupId: `clean-${b.id}`, bookingId: b.id, isCleanBuffer: true,
    });
  }
  return events;
}
function mergeIntervals(intervals) {
  const sorted = [...intervals].sort((a, b) => a[0] - b[0]);
  const merged = [];
  for (const [s, e] of sorted) {
    if (merged.length && s <= merged[merged.length - 1][1]) merged[merged.length - 1][1] = Math.max(merged[merged.length - 1][1], e);
    else merged.push([s, e]);
  }
  return merged;
}
function getFreeWindows(busy, dayStart, dayEnd) {
  const free = []; let cursor = dayStart;
  for (const [s, e] of busy) {
    const cs = Math.max(s, dayStart), ce = Math.min(e, dayEnd);
    if (ce <= dayStart || cs >= dayEnd) continue;
    if (cs > cursor) free.push([cursor, cs]);
    cursor = Math.max(cursor, ce);
  }
  if (cursor < dayEnd) free.push([cursor, dayEnd]);
  return free.filter(([s, e]) => e > s);
}

/* ================= export helpers ================= */
function buildFleetCustomerSheets(cars) {
  const aoa = [
    ["รายการรถให้เช่า — Fleet Desk"], [""],
    ["ทะเบียน", "ยี่ห้อ", "รุ่น", "สี", "ประเภท", "เชื้อเพลิง", "จำนวนประตู", "กระบะ", "สถานะ", "ค่าเช่า/วัน (บาท)"],
    ...cars.map((c) => [c.plate, c.brand, c.model, (COLORS.find((x) => x.key === c.color) || {}).label || "-", c.category, c.fuel, c.doors, c.bed, STATUS[c.status].label, R(c.rate)]),
  ];
  return [{ name: "กองรถ", aoa }];
}
function buildAccountingSheets(cars, overhead, bookings, otherExpenses) {
  const pnl = computePnL(cars, overhead, bookings, otherExpenses, APP_TODAY.slice(0, 7));
  const pnlAoa = [
    ["งบกำไรขาดทุน — Fleet Desk — เดือนปัจจุบัน"], [""],
    ["รายการ", "จำนวนเงิน (บาท)"],
    ["รายได้ค่าเช่ารถของเพจเอง", R(pnl.pageOwnRevenue)],
    ["รายได้ค่าคอมมิชชั่นจากรถพาร์ทเนอร์", R(pnl.commissionRevenue)],
    ["รายได้อื่น (เงินมัดจำที่ริบจากลูกค้ายกเลิก)", R(pnl.otherIncome)],
    ["หัก ต้นทุนผันแปร (น้ำมัน/ล้าง/ซ่อม/GPS) - เฉพาะรถเพจ", -R(pnl.variableCost)],
    ["หัก ประกันภัย/พ.ร.บ. - เฉพาะรถเพจ", -R(pnl.insurance)],
    ["หัก เงินเดือนพนักงาน+เจ้าของ", -R(pnl.staffTotal)],
    ["หัก ค่าใช้จ่ายส่วนกลางอื่น", -R(pnl.overheadTotal - pnl.staffTotal)],
    ["EBITDA", R(pnl.ebitda)],
    ["หัก ค่าเสื่อมราคา (เฉพาะรถเพจ)", -R(pnl.depreciation)],
    ["EBIT", R(pnl.ebit)],
    ["หัก ดอกเบี้ยจ่าย (เฉพาะรถเพจ)", -R(pnl.interest)],
    ["กำไรก่อนภาษี (EBT)", R(pnl.ebt)],
    ["หัก ภาษีเงินได้นิติบุคคล (ประมาณ 20%)", -R(pnl.tax)],
    ["กำไรสุทธิ", R(pnl.netProfit)],
  ];
  const perCarAoa = [
    ["รายรับ-รายจ่ายแยกคัน (รถเพจ) — เดือนปัจจุบัน"], [""],
    ["ทะเบียน", "ยี่ห้อ/รุ่น", "รายรับ", "ค่าน้ำมัน/ไฟฟ้า", "ค่าล้างรถ", "ค่าซ่อม", "GPS", "ประกันภัย", "ค่าเสื่อม/เดือน", "ดอกเบี้ย/เดือน", "กำไรสุทธิ/เดือน"],
    ...cars.filter((c) => c.ownerType !== "partner").map((c) => {
      const dep = c.purchaseCost ? c.purchaseCost / ((c.depreciationYears || 5) * 12) : 0;
      const interest = c.loan ? (c.loan.interestMonthly || 0) : 0;
      return [c.plate, `${c.brand} ${c.model}`, R(c.income), R(c.expense.fuel), R(c.expense.wash), R(c.expense.repair), R(c.gpsMonthlyFee || 0), R(c.expense.insurance), R(dep), R(interest), R(carMonthlyNet(c))];
    }),
  ];
  const partnerAoa = [
    ["สรุปจ่ายพาร์ทเนอร์ — เดือนปัจจุบัน"], [""],
    ["ทะเบียน", "ยี่ห้อ/รุ่น", "เจ้าของ", "รายได้รวม", "หัก %เข้าเพจ", "คงเหลือหลังหักเพจ", "หัก ณ ที่จ่าย", "หักค่าใช้จ่ายรถ(น้ำมัน/ล้าง/ซ่อม/ประกัน/GPS)", "ยอดสุทธิจ่ายพาร์ทเนอร์"],
    ...cars.filter((c) => c.ownerType === "partner").map((c) => { const p = computePartnerPayout(c); return [c.plate, `${c.brand} ${c.model}`, c.partnerName, R(c.income), R(p.commission), R(p.afterCommission), R(p.withholding), R(p.carExp), R(p.netPayout)]; }),
  ];
  const salaryAoa = [
    ["เงินเดือน — เดือนปัจจุบัน"], [""],
    ["ชื่อ", "ตำแหน่ง", "สถานะ", "เงินเดือน (บาท)"],
    ...overhead.staff.map((p) => [p.name, p.position, p.isOwner ? "เจ้าของ/หุ้นส่วน" : "พนักงาน", R(p.salary)]),
  ];
  const financed = cars.filter((c) => c.loan);
  const loanAoa = [
    ["ค่าผ่อนรถ — เดือนปัจจุบัน"], [""],
    ["ทะเบียน", "ยี่ห้อ/รุ่น", "ค่างวด/เดือน", "ดอกเบี้ยโดยประมาณ/เดือน", "เหลืออีก (เดือน)", "ส่งแล้วเดือนนี้ (วัน)", "สถานะ"],
    ...financed.map((c) => { const earned = c.rate * c.loan.daysRentedThisMonth; return [c.plate, `${c.brand} ${c.model}`, R(c.loan.monthly), R(c.loan.interestMonthly || 0), c.loan.monthsLeft, c.loan.daysRentedThisMonth, earned >= c.loan.monthly ? "ครอบคลุมแล้ว" : "ยังไม่ครอบคลุม"]; }),
  ];
  const reconAoa = [
    ["ตรวจสอบรายการจอง (เทียบกับตารางคิวงาน)"], [""],
    ["ทะเบียน", "เจ้าของรถ", "ลูกค้า", "วันที่เริ่ม-สิ้นสุด", "จำนวนวัน", "ชั่วโมงเพิ่ม", "ราคา/วัน", "ราคารวม", "ยอดจ่ายวันรับรถ", "สถานะ"],
    ...bookings.map((b) => {
      const car = cars.find((c) => c.id === b.carId);
      const t = calcBookingTotal(b, car);
      return [car ? car.plate : "-", car ? (car.ownerType === "partner" ? car.partnerName : "เพจ") : "-", `${b.firstName} ${b.lastName}`, `${formatDMY(b.startDate)}–${formatDMY(b.endDate)}`, t.days, t.extraHours, car ? R(car.rate) : 0, R(t.total), R(b.pickupDayPayment != null ? b.pickupDayPayment : t.total - (b.reservationDeposit || 0)), b.status === "cancelled" ? "ยกเลิก" : "ปกติ"];
    }),
  ];
  return [
    { name: "งบกำไรขาดทุน", aoa: pnlAoa },
    { name: "รายรับ-จ่ายรายคัน", aoa: perCarAoa },
    { name: "สรุปจ่ายพาร์ทเนอร์", aoa: partnerAoa },
    { name: "เงินเดือน", aoa: salaryAoa },
    { name: "ค่าผ่อนรถ", aoa: loanAoa },
    { name: "ตรวจสอบรายการจอง", aoa: reconAoa },
  ];
}
// Raw data as a readable spreadsheet: one sheet per table, nested objects flattened
// into columns. Attachment fields hold base64 blobs (hundreds of KB each) — dumping those
// into cells would be unreadable and can break Excel, so only a "มี/ไม่มี" marker is written.
function hasFile(v) { return v ? "มี" : "ไม่มี"; }
function buildRawDataSheets(cars, overhead, bookings, scheduleEvents, otherExpenses, claims, categories) {
  const cat = (k) => catOf(k, categories).label;
  const carLabel = (id) => { const c = cars.find((x) => x.id === id); return c ? `${c.plate} (${c.brand} ${c.model})` : "-"; };

  const carsAoa = [
    ["ข้อมูลรถทั้งหมด"], [""],
    ["ทะเบียน", "จังหวัด", "ยี่ห้อ", "รุ่น", "สี", "ประเภท", "เชื้อเพลิง", "ประตู", "กระบะ", "สถานะ",
     "ค่าเช่า/วัน", "ค่าเช่า/ชม.เกิน", "มัดจำจอง", "มัดจำค้ำประกัน", "เลขไมล์", "ค่า GPS/เดือน",
     "เจ้าของรถ", "ชื่อพาร์ทเนอร์", "%เข้าเพจ", "%หัก ณ ที่จ่าย",
     "ราคาซื้อ", "อายุค่าเสื่อม(ปี)", "ค่างวด/เดือน", "ดอกเบี้ย/เดือน", "งวดคงเหลือ",
     "ประกันภัยหมดอายุ", "พ.ร.บ.หมดอายุ", "ภาษีหมดอายุ", "รายรับเดือนนี้", "ค่าน้ำมัน", "ค่าล้าง", "ค่าซ่อม", "ค่าประกัน", "รูปรถ"],
    ...cars.map((c) => [
      c.plate, c.province, c.brand, c.model, (COLORS.find((x) => x.key === c.color) || {}).label || "-",
      c.category, c.fuel, c.doors, c.bed, (STATUS[c.status] || {}).label || c.status,
      R(c.rate), R(c.hourlyRate), R(c.reservationDeposit), R(c.securityDeposit), Math.round(c.mileage || 0), R(c.gpsMonthlyFee),
      c.ownerType === "partner" ? "พาร์ทเนอร์" : "รถเพจ", c.partnerName || "-", c.commissionPct || 0, c.withholdingPct || 0,
      R(c.purchaseCost), c.depreciationYears || "-",
      c.loan ? R(c.loan.monthly) : "-", c.loan ? R(c.loan.interestMonthly) : "-", c.loan ? c.loan.monthsLeft : "-",
      c.insuranceExpiry ? formatDMY(c.insuranceExpiry) : "-", c.prbExpiry ? formatDMY(c.prbExpiry) : "-", c.taxExpiry ? formatDMY(c.taxExpiry) : "-",
      R(c.income), R(c.expense.fuel), R(c.expense.wash), R(c.expense.repair), R(c.expense.insurance), hasFile(c.photoUrl),
    ]),
  ];

  const bkAoa = [
    ["การจองทั้งหมด (ทุกสถานะ)"], [""],
    ["สถานะ", "ชื่อ", "นามสกุล", "เบอร์โทร", "อีเมล", "รถ", "วันรับ", "เวลารับ", "สถานที่รับ",
     "วันคืน", "เวลาคืน", "สถานที่คืน", "วันคืนจริง", "เวลาคืนจริง",
     "จำนวนวัน", "ชม.เพิ่ม", "ราคารวม", "เงินโอนจอง", "จ่ายจองแล้ว", "ยอดวันรับรถ", "จ่ายวันรับแล้ว",
     "มัดจำค้ำประกัน", "เก็บมัดจำแล้ว", "คืนมัดจำแล้ว", "เซ็นสัญญาแล้ว",
     "ตั๋วเดินทาง", "สลิปจอง", "สัญญาเซ็น", "รูปส่งมอบ", "สลิปปิดงาน",
     "เหตุผลยกเลิก", "คืนเงินจอง", "ผู้บันทึก", "หมายเหตุ"],
    ...bookings.map((b) => {
      const c = cars.find((x) => x.id === b.carId);
      const t = calcBookingTotal(b, c);
      return [
        b.status, b.firstName, b.lastName, b.phone, b.email || "-", carLabel(b.carId),
        formatDMY(b.startDate), b.startTime, b.pickupLocation || "-",
        formatDMY(b.endDate), b.endTime, b.returnLocation || "-",
        b.actualEndDate ? formatDMY(b.actualEndDate) : "-", b.actualEndTime || "-",
        t.days, t.extraHours, R(t.total),
        R(b.reservationDeposit), b.reservationDepositPaid ? "ใช่" : "ไม่", R(b.pickupDayPayment), b.pickupDayPaid ? "ใช่" : "ไม่",
        R(b.securityDeposit), b.securityDepositCollected ? "ใช่" : "ไม่", b.securityDepositRefunded ? "ใช่" : "ไม่", b.contractSigned ? "ใช่" : "ไม่",
        hasFile(b.travelTicketUrl), hasFile(b.reservationSlipUrl), hasFile(b.contractDocUrl), hasFile(b.handoverPhotoUrl), hasFile(b.returnSlipUrl),
        b.cancelReason || "-", b.depositRefunded ? "คืนแล้ว" : "-", b.createdBy || "-", b.notes || "-",
      ];
    }),
  ];

  const evAoa = [
    ["คิวงานทั้งหมด"], [""],
    ["วันที่", "รถ", "ประเภทงาน", "เวลาเริ่ม", "เวลาสิ้นสุด", "รายละเอียด", "ผูกกับการจอง"],
    ...[...scheduleEvents].sort((a, b) => (a.date || "").localeCompare(b.date || "")).map((e) => [
      formatDMY(e.date), carLabel(e.carId), (EVENT_LABEL[e.type] || e.type),
      `${e.startHour}:00`, `${e.endHour}:00`, e.note || "-", e.bookingId ? "ใช่" : "ไม่",
    ]),
  ];

  const oxAoa = [
    ["รายรับ-รายจ่ายอื่น"], [""],
    ["วันที่", "กลุ่ม", "หมวดหมู่", "ทิศทาง", "กระทบกำไร", "รายละเอียด", "จำนวนเงิน", "รถที่เกี่ยวข้อง", "ใบเสร็จ"],
    ...[...otherExpenses].sort((a, b) => (b.date || "").localeCompare(a.date || "")).map((e) => {
      const ct = catOf(e.category, categories);
      const fi = FLOW_TYPES[ct.flow] || FLOW_TYPES.operating;
      return [formatDMY(e.date), fi.label, ct.label, ct.dir === "in" ? "รับเข้า" : "จ่ายออก",
        fi.hitsProfit ? "ใช่" : "ไม่", e.description, R(e.amount), e.carId ? carLabel(e.carId) : "-", hasFile(e.receiptUrl)];
    }),
  ];

  const clAoa = [
    ["คำร้องเบิกเงิน"], [""],
    ["สถานะ", "ผู้ขอเบิก", "วันเวลาที่ยื่น", "วันที่จ่ายเงิน", "จำนวนเงิน", "หมวดหมู่", "รถที่เกี่ยวข้อง",
     "รายละเอียด", "ผู้อนุมัติ", "วันเวลาที่อนุมัติ", "วันที่จ่ายคืน", "เหตุผลไม่อนุมัติ", "ใบเสร็จ", "เอกสารอื่น"],
    ...[...claims].sort((a, b) => (b.requestDate || "").localeCompare(a.requestDate || "")).map((q) => [
      (CLAIM_STATUS[q.status] || {}).label || q.status, q.requesterName,
      formatDateTime(q.requestedAt, q.requestDate), formatDMY(q.paymentDate), R(q.amount),
      cat(q.category), q.carId ? carLabel(q.carId) : "-", q.description,
      q.reviewedBy || "-", q.reviewedAt ? formatDateTime(q.reviewedAtTime, q.reviewedAt) : "-",
      q.paidAt ? formatDMY(q.paidAt) : "-", q.rejectReason || "-", hasFile(q.receiptUrl), hasFile(q.extraDocUrl),
    ]),
  ];

  const stAoa = [
    ["พนักงานและเงินเดือน"], [""],
    ["ชื่อ", "ตำแหน่ง", "สถานะ", "เงินเดือน/เดือน"],
    ...overhead.staff.map((p) => [p.name, p.position || "-", p.isOwner ? "เจ้าของ/หุ้นส่วน" : "พนักงาน", R(p.salary)]),
    [""], ["ค่าใช้จ่ายส่วนกลางอื่น", ""],
    ["ค่าเช่าที่จอด/ออฟฟิศ", R(overhead.rent)],
    ["การตลาด/โฆษณา", R(overhead.marketing)],
    ["ค่าคอมมิชชั่นแพลตฟอร์ม", R(overhead.platformFee)],
    ["อื่นๆ", R(overhead.other)],
  ];

  const catAoa = [
    ["หมวดหมู่รายรับ-รายจ่าย"], [""],
    ["กลุ่ม", "ชื่อหมวด", "ทิศทาง", "กระทบกำไร", "คำอธิบาย", "หมวดมาตรฐาน"],
    ...(categories || DEFAULT_EXPENSE_CATEGORIES).map((ct) => {
      const fi = FLOW_TYPES[ct.flow] || FLOW_TYPES.operating;
      return [fi.label, ct.label, ct.dir === "in" ? "รับเข้า" : "จ่ายออก", fi.hitsProfit ? "ใช่" : "ไม่", ct.note || "-", ct.system ? "ใช่" : "ไม่"];
    }),
  ];

  return [
    { name: "รถทั้งหมด", aoa: carsAoa },
    { name: "การจองทั้งหมด", aoa: bkAoa },
    { name: "คิวงาน", aoa: evAoa },
    { name: "รายรับ-รายจ่ายอื่น", aoa: oxAoa },
    { name: "คำร้องเบิกเงิน", aoa: clAoa },
    { name: "พนักงาน-เงินเดือน", aoa: stAoa },
    { name: "หมวดหมู่", aoa: catAoa },
  ];
}

function buildInvestorSheets(cars, overhead, bookings, scheduleEvents, otherExpenses) {
  const pnl = computePnL(cars, overhead, bookings, otherExpenses, APP_TODAY.slice(0, 7));
  const totalAsset = cars.reduce((s, c) => s + (c.purchaseCost || 0), 0);
  const totalDebtRemaining = cars.reduce((s, c) => s + (c.loan ? c.loan.monthly * c.loan.monthsLeft : 0), 0);
  const avgUtil = Math.round(cars.reduce((s, c) => s + computeUtilization(c, scheduleEvents), 0) / cars.length);
  const margin = pnl.revenue ? Math.round((pnl.netProfit / pnl.revenue) * 100) : 0;
  const summaryAoa = [
    ["สรุปภาพรวมกิจการ — Fleet Desk"], [""],
    ["รายการ", "ค่า"],
    ["จำนวนรถในกอง (รวมพาร์ทเนอร์)", cars.length],
    ["จำนวนรถของเพจเอง", cars.filter((c) => c.ownerType !== "partner").length],
    ["จำนวนรถพาร์ทเนอร์", cars.filter((c) => c.ownerType === "partner").length],
    ["รายได้เดือนล่าสุด (บาท, รวมค่าคอมมิชชั่น)", R(pnl.revenue)],
    ["EBITDA (บาท)", R(pnl.ebitda)],
    ["กำไรสุทธิเดือนล่าสุด (บาท)", R(pnl.netProfit)],
    ["อัตรากำไรสุทธิ (%)", margin],
    ["อัตราการใช้งานเฉลี่ย (%)", avgUtil],
    ["มูลค่าสินทรัพย์รวม-ราคาซื้อรถเพจ (บาท)", R(totalAsset)],
    ["ภาระหนี้คงเหลือโดยประมาณ (บาท)", R(totalDebtRemaining)],
  ];
  const trendAoa = [["แนวโน้มรายเดือน"], [""], ["เดือน", "รายได้ (บาท)", "กำไรสุทธิ (บาท)"], ...HISTORY.map((h) => [h.month, R(h.revenue), R(h.netProfit)]), ["ปัจจุบัน", R(pnl.revenue), R(pnl.netProfit)]];
  const ranked = cars.filter((c) => c.ownerType !== "partner").map((c) => ({ ...c, monthlyNet: carMonthlyNet(c) })).sort((a, b) => b.monthlyNet - a.monthlyNet);
  const rankAoa = [
    ["อันดับความคุ้มค่าต่อคัน (เฉพาะรถเพจ, หลังหักค่าเสื่อม+ดอกเบี้ย)"], [""],
    ["อันดับ", "ทะเบียน", "ยี่ห้อ/รุ่น", "กำไรสุทธิ/เดือน", "ประมาณการ/ปี", "ราคาซื้อ", "ROI ต่อปี (%)"],
    ...ranked.map((c, i) => { const annual = c.monthlyNet * 12; const roi = c.purchaseCost ? Math.round((annual / c.purchaseCost) * 1000) / 10 : "-"; return [i + 1, c.plate, `${c.brand} ${c.model}`, R(c.monthlyNet), R(annual), R(c.purchaseCost || 0), roi]; }),
  ];
  return [{ name: "สรุปภาพรวม", aoa: summaryAoa }, { name: "แนวโน้มรายเดือน", aoa: trendAoa }, { name: "อันดับ ROI ต่อคัน", aoa: rankAoa }];
}
function buildAndDownloadWorkbook(sheets, filename) {
  const wb = XLSX.utils.book_new();
  sheets.forEach(({ name, aoa }) => {
    const ws = XLSX.utils.aoa_to_sheet(aoa);
    const header = aoa[2] || [];
    ws["!cols"] = header.map((h, i) => { let max = String(h || "").length; aoa.slice(3).forEach((row) => { const v = row[i]; if (v != null) max = Math.max(max, String(v).length); }); return { wch: Math.min(30, Math.max(10, max + 2)) }; });
    if (ws["!ref"]) {
      const range = XLSX.utils.decode_range(ws["!ref"]);
      for (let rr = range.s.r; rr <= range.e.r; rr++) for (let cc = range.s.c; cc <= range.e.c; cc++) { const cell = ws[XLSX.utils.encode_cell({ r: rr, c: cc })]; if (cell && cell.t === "n") cell.z = "#,##0"; }
    }
    XLSX.utils.book_append_sheet(wb, ws, name.slice(0, 31));
  });
  XLSX.writeFile(wb, filename);
}
function downloadJSON(obj, filename) {
  const blob = new Blob([JSON.stringify(obj, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a"); a.href = url; a.download = filename; document.body.appendChild(a); a.click(); document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
const EXPORT_OPTIONS = [
  { key: "fleet_customer", label: "ข้อมูลกองรถ (นำเสนอลูกค้า)", desc: "รายชื่อรถ สี ประเภท เชื้อเพลิง ราคาเช่า/วัน สถานะ", roles: ["owner", "staff", "accountant"], type: "xlsx" },
  { key: "accounting_tax", label: "บัญชี (ส่งสำนักบัญชี/ยื่นภาษี)", desc: "งบกำไรขาดทุน, รายรับ-จ่ายแยกคัน, จ่ายพาร์ทเนอร์, เงินเดือน, ค่าผ่อนรถ, ตรวจสอบรายการจอง", roles: ["owner", "accountant"], type: "xlsx" },
  { key: "investor_finance", label: "สรุปการเงิน (นำเสนอนักลงทุน/ธนาคาร)", desc: "ภาพรวมผลประกอบการ แนวโน้มรายเดือน อันดับความคุ้มค่าต่อคัน", roles: ["owner", "accountant"], type: "xlsx" },
  { key: "raw_excel", label: "ข้อมูลดิบทั้งหมด (Excel — อ่านง่าย)", desc: "ทุกตารางแยกเป็นชีท: รถ · การจอง · คิวงาน · รายรับ-รายจ่าย · คำร้องเบิกเงิน · พนักงาน · หมวดหมู่ — เปิดดู กรอง เรียงได้เลย", roles: ["owner", "accountant"], type: "xlsx" },
  { key: "full_backup", label: "ไฟล์สำรองระบบ (JSON — สำหรับโปรแกรมเมอร์)", desc: "ใช้ตอนย้ายไปฐานข้อมูลจริง หรือกู้คืนข้อมูล ไม่เหมาะกับการเปิดอ่านเอง", roles: ["owner"], type: "json" },
];

/* ================= shared small UI ================= */
function ImageLightbox({ url, onClose }) {
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4" style={{ background: "#000000e6" }} onClick={onClose}>
      <img src={url} alt="รูปขยาย" className="max-w-full max-h-full object-contain rounded-lg" onClick={(e) => e.stopPropagation()} />
      <button onClick={onClose} className="absolute top-4 right-4 rounded-full p-2" style={{ background: "#ffffff26" }}><X size={20} color="#fff" /></button>
    </div>
  );
}
/* ================= local persistence ================= */
// Saves working data in the browser so a refresh doesn't wipe everything.
// This is per-browser and per-device only — it is NOT a real database and is not shared
// between staff. Replace with a real backend (see fleet-db-schema.md) for production.
const LAYOUT_KEY = "fleetdesk_layout";
function loadLayoutPref() {
  try { const v = window.localStorage.getItem(LAYOUT_KEY); return v === "desktop" || v === "mobile" ? v : null; } catch (e) { return null; }
}
function saveLayoutPref(v) {
  try { if (v) window.localStorage.setItem(LAYOUT_KEY, v); else window.localStorage.removeItem(LAYOUT_KEY); } catch (e) {}
}
const STORAGE_KEY = "fleetdesk_v1";
function loadSaved() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) { return null; }
}
function saveState(data) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    return { ok: true };
  } catch (e) {
    const quota = e && (e.name === "QuotaExceededError" || e.code === 22);
    return { ok: false, reason: quota ? "quota" : "unknown" };
  }
}
function clearSaved() {
  try { window.localStorage.removeItem(STORAGE_KEY); return true; } catch (e) { return false; }
}
function estimateStorageKB() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? Math.round(raw.length / 1024) : 0;
  } catch (e) { return 0; }
}

// Shrinks a photo before it is stored. A 4MB phone photo becomes roughly 150-300KB,
// which is the difference between storing ~1 photo and storing ~30.
function compressImage(file, maxDim = 1400, quality = 0.7) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("read failed"));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("decode failed"));
      img.onload = () => {
        try {
          let { width, height } = img;
          if (width > maxDim || height > maxDim) {
            const scale = Math.min(maxDim / width, maxDim / height);
            width = Math.round(width * scale);
            height = Math.round(height * scale);
          }
          const canvas = document.createElement("canvas");
          canvas.width = width; canvas.height = height;
          const ctx = canvas.getContext("2d");
          ctx.fillStyle = "#FFFFFF";
          ctx.fillRect(0, 0, width, height);
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL("image/jpeg", quality));
        } catch (err) { reject(err); }
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

// Money input that physically prevents more than 2 decimal places from being typed,
// and normalises to exactly 2 on blur (so "500" becomes "500.00"). type="number" is
// deliberately avoided because browsers allow unlimited decimals there and strip
// the caret position when you try to correct the value programmatically.
// Defined at module scope on purpose. If these live inside a component body, every
// keystroke creates a NEW component type, so React unmounts the old input and mounts a
// fresh one — the caret is lost and you can only type one character. Classic React trap.
function Field({ label, children }) {
  return <label className="block mb-3"><div className="text-[12px] font-medium mb-1" style={{ color: INK }}>{label}</div>{children}</label>;
}
function ReadText({ v }) {
  return <div className="text-[13px] py-2" style={{ color: INK }}>{v || "-"}</div>;
}

// Up to 8 photos per car (exterior/interior) so customers can inspect before booking.
// Not required to fill all slots.
const MAX_CAR_PHOTOS = 8;
function PhotoGallery({ photos, onChange, label }) {
  const list = Array.isArray(photos) ? photos : [];
  const setAt = (i, v) => {
    const next = [...list];
    if (v) next[i] = v; else next.splice(i, 1);
    onChange(next.filter(Boolean));
  };
  return (
    <div>
      {label && <div className="text-[12px] font-medium mb-1.5" style={{ color: INK }}>{label} <span className="text-[10.5px]" style={{ color: MUTE }}>({list.length}/{MAX_CAR_PHOTOS} รูป · ใส่ไม่ครบก็ได้)</span></div>}
      <div className="grid grid-cols-2 gap-2">
        {list.map((p, i) => (
          <div key={i}><PhotoAttach value={p} onChange={(v) => setAt(i, v)} /></div>
        ))}
        {list.length < MAX_CAR_PHOTOS && (
          <div><PhotoAttach value="" onChange={(v) => v && onChange([...list, v])} hint={list.length === 0 ? "รูปแรกจะใช้เป็นรูปหลัก" : "เพิ่มรูปที่ " + (list.length + 1)} /></div>
        )}
      </div>
    </div>
  );
}

function MoneyInput({ value, onChange, placeholder, style, className, disabled }) {
  const clamp = (raw) => {
    let s = String(raw == null ? "" : raw).replace(/[^\d.]/g, "");
    const parts = s.split(".");
    if (parts.length > 2) s = parts[0] + "." + parts.slice(1).join("");
    const bits = s.split(".");
    if (bits.length === 2) s = bits[0] + "." + bits[1].slice(0, 2);
    return s;
  };
  const normalise = () => {
    if (value === "" || value == null) return;
    const n = Number(value);
    if (!isNaN(n)) onChange(n.toFixed(2));
  };
  return (
    <input type="text" inputMode="decimal" disabled={disabled}
      className={className} style={style} placeholder={placeholder || "0.00"}
      value={value == null ? "" : value}
      onChange={(e) => onChange(clamp(e.target.value))}
      onBlur={normalise} />
  );
}

function PhotoAttach({ label, value, onChange, hint }) {
  const inputRef = useRef(null);
  const [error, setError] = useState("");
  const [zoomed, setZoomed] = useState(false);
  const [busy, setBusy] = useState(false);
  const isPdf = typeof value === "string" && value.startsWith("data:application/pdf");
  const handleFile = async (e) => {
    try {
      const file = e.target.files && e.target.files[0];
      e.target.value = "";
      if (!file) return;
      const okType = file.type && (file.type.startsWith("image/") || file.type === "application/pdf");
      if (file.type && !okType) { setError("กรุณาเลือกไฟล์รูปภาพหรือ PDF"); return; }
      setError("");

      if (file.type === "application/pdf") {
        // PDFs can't be compressed in the browser, so cap them to protect storage space
        if (file.size > 3 * 1024 * 1024) { setError("ไฟล์ PDF ใหญ่เกิน 3MB — กรุณาสแกนใหม่ที่ความละเอียดต่ำลง หรือถ่ายรูปเอกสารแทน"); return; }
        const reader = new FileReader();
        reader.onload = () => onChange(reader.result);
        reader.onerror = () => setError("อ่านไฟล์ไม่สำเร็จ กรุณาลองใหม่");
        reader.readAsDataURL(file);
        return;
      }

      if (file.size > 25 * 1024 * 1024) { setError("ไฟล์ใหญ่เกิน 25MB กรุณาถ่ายใหม่"); return; }
      setBusy(true);
      try {
        const compressed = await compressImage(file);
        onChange(compressed);
      } catch (err) {
        setError("ประมวลผลรูปไม่สำเร็จ (ถ้าเป็นรูป HEIC จาก iPhone ลองตั้งกล้องเป็น 'ประสิทธิภาพสูงสุด/JPEG' หรือเลือกรูปอื่น)");
      } finally {
        setBusy(false);
      }
    } catch (err) {
      setError("เกิดข้อผิดพลาดไม่ทราบสาเหตุ กรุณาลองใหม่อีกครั้ง");
      setBusy(false);
    }
  };
  return (
    <div>
      {label && <div className="text-[12px] font-medium mb-1.5" style={{ color: INK }}>{label}</div>}
      {value ? (
        isPdf ? (
          <div className="relative rounded-md overflow-hidden" style={{ border: `1px solid ${PAPER_LINE}`, background: "#FFFFFF" }}>
            <object data={value} type="application/pdf" className="w-full" style={{ height: 180, display: "block" }}>
              <div className="w-full flex flex-col items-center justify-center gap-1.5" style={{ height: 180, background: "#FFFFFF80" }}>
                <FileText size={22} color="#C1502E" />
                <span className="text-[11px]" style={{ color: MUTE }}>เบราว์เซอร์นี้แสดง PDF ในหน้าไม่ได้</span>
                <a href={value} target="_blank" rel="noreferrer" className="text-[11.5px] underline" style={{ color: "#3B5BA5" }}>เปิดดูไฟล์ในแท็บใหม่</a>
              </div>
            </object>
            <button type="button" onClick={() => onChange("")} className="absolute top-1.5 right-1.5 rounded-full p-1.5" style={{ background: "#00000090" }}><X size={13} color="#fff" /></button>
            <div className="flex items-center justify-between px-2 py-1.5" style={{ borderTop: `1px solid ${PAPER_LINE}` }}>
              <span className="text-[10px] flex items-center gap-1" style={{ color: "#3A7D5C" }}><Check size={10} />แนบไฟล์ PDF แล้ว</span>
              <a href={value} target="_blank" rel="noreferrer" className="text-[10px] underline" style={{ color: "#3B5BA5" }}>เปิดเต็มหน้า</a>
            </div>
          </div>
        ) : (
          <div className="relative rounded-md overflow-hidden" style={{ border: `1px solid ${PAPER_LINE}` }}>
            <img src={value} alt={label || "attachment"} className="w-full h-36 object-cover cursor-zoom-in" onClick={() => setZoomed(true)} onError={() => setError("แสดงรูปนี้ไม่ได้ (อาจเป็นไฟล์ประเภทที่เบราว์เซอร์ไม่รองรับ เช่น HEIC) กรุณาลองแนบรูปใหม่")} />
            <button type="button" onClick={() => onChange("")} className="absolute top-1.5 right-1.5 rounded-full p-1.5" style={{ background: "#00000090" }}><X size={13} color="#fff" /></button>
            <div className="absolute bottom-1.5 left-1.5 text-[10px] px-1.5 py-0.5 rounded-full flex items-center gap-1" style={{ background: "#3A7D5Ce6", color: "#fff" }}><Check size={10} />แนบแล้ว — แตะรูปเพื่อดูขยาย</div>
          </div>
        )
      ) : (
        <button type="button" disabled={busy} onClick={() => inputRef.current && inputRef.current.click()} className="w-full py-4 rounded-md border-2 border-dashed flex flex-col items-center gap-1.5" style={{ borderColor: busy ? "#3B5BA5" : PAPER_LINE, color: busy ? "#3B5BA5" : MUTE }}>
          <Camera size={20} /><span className="text-[11.5px]">{busy ? "กำลังย่อรูป กรุณารอสักครู่..." : "แตะเพื่อถ่ายรูป เลือกจากคลังภาพ หรือแนบไฟล์ PDF"}</span>
        </button>
      )}
      {hint && !value && <div className="text-[10px] mt-1" style={{ color: MUTE }}>{hint}</div>}
      {error && <div className="text-[10.5px] mt-1" style={{ color: "#C1502E" }}>{error}</div>}
      <input ref={inputRef} type="file" accept="image/*,application/pdf" className="hidden" onChange={handleFile} />
      {zoomed && value && <ImageLightbox url={value} onClose={() => setZoomed(false)} />}
    </div>
  );
}

function CopyableTextModal({ title, text, onClose }) {
  useLockBodyScroll();
  const [copied, setCopied] = useState(false);
  const doCopy = async () => {
    try { await navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1800); } catch { setCopied(false); }
  };
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0" style={{ background: "#00000066" }} onClick={onClose} />
      <div className="relative w-full sm:max-w-sm rounded-t-2xl sm:rounded-2xl" style={{ background: PAPER }}>
        <div className="p-4 flex items-center justify-between border-b" style={{ borderColor: PAPER_LINE }}>
          <div className="font-semibold text-[14px] flex items-center gap-1.5" style={{ color: INK }}><MessageSquare size={16} />{title}</div>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-black/5"><X size={18} color={INK} /></button>
        </div>
        <div className="p-4">
          <textarea readOnly value={text} rows={8} className="w-full text-[12.5px] rounded-md p-2.5 outline-none font-mono" style={{ background: "#FFFFFF", border: `1px solid ${PAPER_LINE}`, color: INK }} onFocus={(e) => e.target.select()} />
          <button onClick={doCopy} className="w-full mt-3 py-2.5 rounded-lg text-[13px] font-semibold flex items-center justify-center gap-1.5" style={{ background: copied ? "#3A7D5C" : INK, color: PAPER }}>
            {copied ? <Check size={14} /> : <Copy size={14} />}{copied ? "คัดลอกแล้ว" : "คัดลอกข้อความ"}
          </button>
        </div>
      </div>
    </div>
  );
}

function CarPanelIcon({ car }) {
  const [imgErr, setImgErr] = useState(false);
  const Icon = car.category === "Pickup" ? Truck : Car;
  const c = STATUS[car.status].color;
  const colorHex = (COLORS.find((x) => x.key === car.color) || {}).hex;
  if (car.photoUrl && !imgErr) {
    return (
      <div className="relative w-full h-24 rounded-md overflow-hidden" style={{ background: `${c}14` }}>
        <img src={car.photoUrl} alt={car.plate} className="w-full h-full object-cover" onError={() => setImgErr(true)} />
        {colorHex && <span className="absolute bottom-1.5 left-1.5 w-3.5 h-3.5 rounded-full border" style={{ background: colorHex, borderColor: "#FFFFFF" }} />}
        {(car.fuel === "EV" || car.fuel === "PHEV") && <span className="absolute top-1.5 right-1.5 rounded-full p-1" style={{ background: c }}><Zap size={11} color={PAPER} fill={PAPER} /></span>}
        {car.fuel === "Hybrid" && <span className="absolute top-1.5 right-1.5 rounded-full p-1" style={{ background: c }}><Leaf size={11} color={PAPER} fill={PAPER} /></span>}
      </div>
    );
  }
  return (
    <div className="relative w-full h-24 flex items-center justify-center rounded-md" style={{ background: `${c}14` }}>
      <Icon size={46} strokeWidth={1.4} color={c} />
      {colorHex && <span className="absolute bottom-1.5 left-1.5 w-3.5 h-3.5 rounded-full border" style={{ background: colorHex, borderColor: PAPER }} />}
      {(car.fuel === "EV" || car.fuel === "PHEV") && <span className="absolute top-1.5 right-1.5 rounded-full p-1" style={{ background: c }}><Zap size={11} color={PAPER} fill={PAPER} /></span>}
      {car.fuel === "Hybrid" && <span className="absolute top-1.5 right-1.5 rounded-full p-1" style={{ background: c }}><Leaf size={11} color={PAPER} fill={PAPER} /></span>}
    </div>
  );
}
function Tag({ children }) { return <span className="text-[11px] px-1.5 py-0.5 rounded border" style={{ borderColor: PAPER_LINE, color: INK, background: "#FFFFFF80" }}>{children}</span>; }

function CarTag({ car, onClick, todayHint }) {
  const s = STATUS[car.status];
  return (
    <button onClick={onClick} className="relative text-left w-full pt-3 focus:outline-none group">
      <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full z-10 border" style={{ background: BOARD, borderColor: "#00000030" }} />
      <div className="rounded-lg p-3 pt-5 shadow-md transition-transform group-hover:-translate-y-0.5" style={{ background: PAPER, border: `1px solid ${PAPER_LINE}` }}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full" style={{ color: s.color, background: s.bg }}>{s.label}</span>
          <span className="text-[11px]" style={{ color: MUTE }}>{fmt(car.rate)}.-/วัน</span>
        </div>
        <CarPanelIcon car={car} />
        <div className="mt-2 font-mono font-bold text-[15px]" style={{ color: INK }}>{car.plate}</div>
        <div className="text-[12px]" style={{ color: MUTE }}>{car.brand} {car.model} · {car.province}</div>
        <div className="text-[10.5px] mb-2" style={{ color: "#3B5BA5" }}>{todayHint}</div>
        <div className="flex flex-wrap gap-1"><Tag>{car.category}</Tag><Tag>{car.fuel}</Tag>{car.ownerType === "partner" && <Tag>พาร์ทเนอร์</Tag>}</div>
      </div>
    </button>
  );
}

/* ================= Add / Edit car form ================= */
function CarForm({ car, onSave, onClose, onDelete, showFinance }) {
  useLockBodyScroll();
  // A car object flagged __newFromPurchase came from recording a purchase in the accounts —
  // treat it as a brand-new car with the price already filled in.
  const fromPurchase = !!(car && car.__newFromPurchase);
  const isNew = !car || fromPurchase;
  const [f, setF] = useState(() => (car && !car.__newFromPurchase) ? { ...car, loanEnabled: !!car.loan, loan: car.loan || { monthly: 5000, monthsLeft: 24, daysRentedThisMonth: 0, interestMonthly: 0 } } : {
    plate: "", province: "", brand: "", model: "", category: "Sedan", fuel: "เบนซิน", doors: "4 ประตู", bed: "ไม่มีกระบะ", color: "white",
    status: "available", rate: 1000, hourlyRate: 60, gpsMonthlyFee: 300, mileage: 0, util: 60, income: 0, expense: { fuel: 0, wash: 0, repair: 0, insurance: 0 },
    reservationDeposit: 500, securityDeposit: 1500, insuranceExpiry: "", prbExpiry: "", taxExpiry: "",
    photoUrl: "", photos: [], purchaseCost: (car && car.purchaseCost) || 0, depreciationYears: 5, ownerType: "page", partnerName: "", commissionPct: 20, withholdingPct: 5,
    loanEnabled: false, loan: { monthly: 5000, monthsLeft: 24, daysRentedThisMonth: 0, interestMonthly: 0 },
  });
  const [confirmDel, setConfirmDel] = useState(false);
  const set = (k, v) => setF((p) => ({ ...p, [k]: v }));
  const setLoan = (k, v) => setF((p) => ({ ...p, loan: { ...p.loan, [k]: v } }));
  const submit = () => { if (!f.plate.trim() || !f.brand.trim() || !f.model.trim()) return; const payload = { ...f, id: f.id || carCounter++, loan: f.loanEnabled ? f.loan : null }; delete payload.loanEnabled; onSave(payload); };
  const inputCls = "w-full text-[13px] rounded-md px-2.5 py-2 outline-none";
  const inputStyle = { background: "#FFFFFF", border: `1px solid ${PAPER_LINE}`, color: INK };

  return (
    <div className="fixed inset-0 z-40 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0" style={{ background: "#00000066" }} onClick={onClose} />
      <div className="relative w-full sm:max-w-sm lg:max-w-2xl rounded-t-2xl sm:rounded-2xl flex flex-col" style={{ background: PAPER, maxHeight: "88vh", minHeight: 0 }}>
        <div className="p-4 flex items-center justify-between border-b flex-shrink-0" style={{ borderColor: PAPER_LINE, background: PAPER }}>
          <div className="font-semibold text-[15px]" style={{ color: INK }}>{fromPurchase ? "เพิ่มรถที่เพิ่งซื้อ" : isNew ? "เพิ่มรถใหม่" : "แก้ไขข้อมูลรถ"}</div>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-black/5"><X size={18} color={INK} /></button>
        </div>
        <div className="p-4 flex-1 min-h-0 overflow-y-auto" style={{ WebkitOverflowScrolling: "touch", touchAction: "pan-y", overscrollBehavior: "contain" }}>
          {fromPurchase && <div className="rounded-md p-2.5 mb-3 text-[11.5px]" style={{ background: "#7A4FA314", color: "#7A4FA3" }}>บันทึกการซื้อในบัญชีเรียบร้อยแล้ว (ราคาซื้อกรอกให้อัตโนมัติ) กรอกทะเบียน/รุ่น ให้ครบเพื่อเพิ่มเข้ากองรถ</div>}
          <div className="grid grid-cols-2 gap-2">
            <Field label="ทะเบียน"><input className={inputCls} style={inputStyle} value={f.plate} onChange={(e) => set("plate", e.target.value)} placeholder="1กข 2345" /></Field>
            <Field label="จังหวัด"><input className={inputCls} style={inputStyle} value={f.province} onChange={(e) => set("province", e.target.value)} placeholder="กรุงเทพฯ" /></Field>
            <Field label="ยี่ห้อ"><input className={inputCls} style={inputStyle} value={f.brand} onChange={(e) => set("brand", e.target.value)} placeholder="Honda" /></Field>
            <Field label="รุ่น"><input className={inputCls} style={inputStyle} value={f.model} onChange={(e) => set("model", e.target.value)} placeholder="City" /></Field>
          </div>
          <PhotoGallery label="รูปรถ (ภายนอก/ภายใน)" photos={f.photos && f.photos.length ? f.photos : (f.photoUrl ? [f.photoUrl] : [])}
            onChange={(arr) => { set("photos", arr); set("photoUrl", arr[0] || ""); }} />
          <div className="mt-3" />
          <Field label="สีรถ">
            <div className="flex flex-wrap gap-2">{COLORS.map((c) => (
              <button key={c.key} onClick={() => set("color", c.key)} title={c.label} className="w-7 h-7 rounded-full border-2" style={{ background: c.hex, borderColor: f.color === c.key ? "#3B5BA5" : PAPER_LINE }} />
            ))}</div>
          </Field>
          <Field label="ประเภทรถ"><div className="flex flex-wrap gap-1.5">{CATEGORIES.map((c) => (<button key={c} onClick={() => set("category", c)} className="text-[12px] px-2.5 py-1 rounded-full border" style={{ borderColor: PAPER_LINE, background: f.category === c ? INK : "transparent", color: f.category === c ? PAPER : INK }}>{c}</button>))}</div></Field>
          <Field label="เชื้อเพลิง"><div className="flex flex-wrap gap-1.5">{FUELS.map((c) => (<button key={c} onClick={() => set("fuel", c)} className="text-[12px] px-2.5 py-1 rounded-full border" style={{ borderColor: PAPER_LINE, background: f.fuel === c ? INK : "transparent", color: f.fuel === c ? PAPER : INK }}>{c}</button>))}</div></Field>
          <div className="grid grid-cols-2 gap-2">
            <Field label="จำนวนประตู"><div className="flex gap-1.5">{DOORS.map((c) => (<button key={c} onClick={() => set("doors", c)} className="text-[12px] px-2 py-1 rounded-full border flex-1" style={{ borderColor: PAPER_LINE, background: f.doors === c ? INK : "transparent", color: f.doors === c ? PAPER : INK }}>{c}</button>))}</div></Field>
            <Field label="กระบะ"><div className="flex gap-1.5">{BEDS.map((c) => (<button key={c} onClick={() => set("bed", c)} className="text-[11px] px-2 py-1 rounded-full border flex-1" style={{ borderColor: PAPER_LINE, background: f.bed === c ? INK : "transparent", color: f.bed === c ? PAPER : INK }}>{c}</button>))}</div></Field>
          </div>
          <Field label="สถานะปัจจุบัน"><div className="flex flex-wrap gap-1.5">{Object.keys(STATUS).map((s) => (<button key={s} onClick={() => set("status", s)} className="text-[12px] px-2.5 py-1 rounded-full border" style={{ borderColor: STATUS[s].color, background: f.status === s ? STATUS[s].color : "transparent", color: f.status === s ? PAPER : STATUS[s].color }}>{STATUS[s].label}</button>))}</div></Field>
          <div className="grid grid-cols-2 gap-2">
            <Field label="ค่าเช่า/วัน (บาท)"><MoneyInput className={inputCls} style={inputStyle} value={f.rate} onChange={(v) => set("rate", v === "" ? 0 : Number(v))} /></Field>
            <Field label="ค่าเช่า/ชม.เกิน (บาท)"><MoneyInput className={inputCls} style={inputStyle} value={f.hourlyRate} onChange={(v) => set("hourlyRate", v === "" ? 0 : Number(v))} /></Field>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Field label="เงินมัดจำจอง (บาท)"><MoneyInput className={inputCls} style={inputStyle} value={f.reservationDeposit} onChange={(v) => set("reservationDeposit", v === "" ? 0 : Number(v))} /></Field>
            <Field label="มัดจำค้ำประกัน (บาท)"><MoneyInput className={inputCls} style={inputStyle} value={f.securityDeposit} onChange={(v) => set("securityDeposit", v === "" ? 0 : Number(v))} /></Field>
          </div>
          <div className="text-[10.5px] -mt-1 mb-3" style={{ color: MUTE }}>* ค่ามัดจำแยกตามรถแต่ละคัน — จะถูกดึงไปใช้อัตโนมัติตอนลูกค้าจองและตอนเปิดงานเช่า</div>
          <div className="text-[12px] font-semibold mb-1.5" style={{ color: INK }}>วันหมดอายุเอกสารรถ</div>
          <div className="grid grid-cols-3 gap-2">
            <Field label="ประกันภัย (สมัครใจ)"><input type="date" className={inputCls} style={inputStyle} value={f.insuranceExpiry || ""} onChange={(e) => set("insuranceExpiry", e.target.value)} /></Field>
            <Field label="พ.ร.บ. (บังคับ)"><input type="date" className={inputCls} style={inputStyle} value={f.prbExpiry || ""} onChange={(e) => set("prbExpiry", e.target.value)} /></Field>
            <Field label="ภาษีรถประจำปี"><input type="date" className={inputCls} style={inputStyle} value={f.taxExpiry || ""} onChange={(e) => set("taxExpiry", e.target.value)} /></Field>
          </div>
          <div className="text-[10.5px] -mt-1 mb-3" style={{ color: MUTE }}>* แยก 3 รายการเพราะต่ออายุไม่พร้อมกันและคนละที่ · ระบบเตือนล่วงหน้า 30 วัน · ขับรถที่ พ.ร.บ. หรือภาษีขาด ผิดกฎหมายและประกันอาจไม่คุ้มครอง</div>
          <div className="grid grid-cols-2 gap-2">
            <Field label="เลขไมล์ (กม.)"><input type="number" className={inputCls} style={inputStyle} value={f.mileage} onChange={(e) => set("mileage", Number(e.target.value))} /></Field>
            <Field label="ค่า GPS/เดือน (บาท)"><MoneyInput className={inputCls} style={inputStyle} value={f.gpsMonthlyFee} onChange={(v) => set("gpsMonthlyFee", v === "" ? 0 : Number(v))} /></Field>
          </div>

          {!showFinance && <div className="text-[11px] rounded-md p-2 mb-2 flex items-center gap-1.5" style={{ background: "#3B5BA514", color: "#3B5BA5" }}><Lock size={12} />ข้อมูลราคาซื้อ/เงินกู้/พาร์ทเนอร์ แก้ไขได้เฉพาะเจ้าของ</div>}
          {showFinance && (
            <>
              <div className="mt-1 mb-2 pt-3 border-t" style={{ borderColor: PAPER_LINE }}>
                <div className="text-[12px] font-semibold mb-1.5 flex items-center gap-1" style={{ color: INK }}><Handshake size={13} />เจ้าของรถ</div>
                <div className="flex gap-1.5 mb-2">
                  <button onClick={() => set("ownerType", "page")} className="flex-1 text-[12px] py-1.5 rounded-full border" style={{ borderColor: PAPER_LINE, background: f.ownerType === "page" ? INK : "transparent", color: f.ownerType === "page" ? PAPER : INK }}>รถของเพจเอง</button>
                  <button onClick={() => set("ownerType", "partner")} className="flex-1 text-[12px] py-1.5 rounded-full border" style={{ borderColor: PAPER_LINE, background: f.ownerType === "partner" ? INK : "transparent", color: f.ownerType === "partner" ? PAPER : INK }}>รถพาร์ทเนอร์</button>
                </div>
                {f.ownerType === "partner" && (
                  <>
                    <Field label="ชื่อพาร์ทเนอร์"><input className={inputCls} style={inputStyle} value={f.partnerName} onChange={(e) => set("partnerName", e.target.value)} placeholder="คุณ..." /></Field>
                    <div className="grid grid-cols-2 gap-2">
                      <Field label="หัก % เข้าเพจ"><input type="number" className={inputCls} style={inputStyle} value={f.commissionPct} onChange={(e) => set("commissionPct", Number(e.target.value))} /></Field>
                      <Field label="หัก ณ ที่จ่าย (%)"><input type="number" className={inputCls} style={inputStyle} value={f.withholdingPct} onChange={(e) => set("withholdingPct", Number(e.target.value))} /></Field>
                    </div>
                  </>
                )}
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Field label="ราคาซื้อรถ (บาท)"><MoneyInput className={inputCls} style={inputStyle} value={f.purchaseCost} onChange={(v) => set("purchaseCost", v === "" ? 0 : Number(v))} /></Field>
                <Field label="อายุคิดค่าเสื่อม (ปี)"><input type="number" className={inputCls} style={inputStyle} value={f.depreciationYears} onChange={(e) => set("depreciationYears", Number(e.target.value))} /></Field>
              </div>
              <div className="mt-1 mb-2 pt-3 border-t" style={{ borderColor: PAPER_LINE }}>
                <label className="flex items-center gap-2 mb-2 cursor-pointer"><input type="checkbox" checked={f.loanEnabled} onChange={(e) => set("loanEnabled", e.target.checked)} /><span className="text-[13px] font-medium" style={{ color: INK }}>รถคันนี้ยังผ่อนอยู่</span></label>
                {f.loanEnabled && (
                  <div className="pl-1">
                    <div className="grid grid-cols-2 gap-2">
                      <Field label="ค่างวด/เดือน (บาท)"><MoneyInput className={inputCls} style={inputStyle} value={f.loan.monthly} onChange={(v) => setLoan("monthly", v === "" ? 0 : Number(v))} /></Field>
                      <Field label="เหลืออีก (เดือน)"><input type="number" className={inputCls} style={inputStyle} value={f.loan.monthsLeft} onChange={(e) => setLoan("monthsLeft", Number(e.target.value))} /></Field>
                    </div>
                    <Field label="ในค่างวดนี้ เป็นดอกเบี้ยประมาณ (บาท/เดือน)"><MoneyInput className={inputCls} style={inputStyle} value={f.loan.interestMonthly} onChange={(v) => setLoan("interestMonthly", v === "" ? 0 : Number(v))} /></Field>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
        <div className="p-4 pt-3 flex-shrink-0 border-t" style={{ borderColor: PAPER_LINE }}>
          <div className="flex gap-2">
            {!isNew && (confirmDel ? (<button onClick={() => onDelete(f.id)} className="px-3 py-2.5 rounded-lg text-[13px] font-semibold" style={{ background: "#C1502E", color: PAPER }}>ยืนยันลบรถคันนี้</button>) : (<button onClick={() => setConfirmDel(true)} className="px-3 py-2.5 rounded-lg text-[13px] flex items-center gap-1" style={{ border: `1px solid #C1502E`, color: "#C1502E" }}><Trash2 size={14} />ลบ</button>))}
            <button onClick={submit} className="flex-1 py-2.5 rounded-lg text-[13px] font-semibold" style={{ background: INK, color: PAPER }}>{isNew ? "เพิ่มรถ" : "บันทึกการแก้ไข"}</button>
          </div>
          <button onClick={onClose} className="w-full mt-2 py-2 rounded-lg text-[12px] flex items-center justify-center gap-1.5" style={{ border: `1px solid ${PAPER_LINE}`, color: MUTE }}><X size={13} />ปิดหน้าต่าง</button>
        </div>
      </div>
    </div>
  );
}

function LoanCard({ car }) {
  if (!car.loan) return null;
  const earned = car.rate * car.loan.daysRentedThisMonth;
  const shortfall = car.loan.monthly - earned;
  const daysMore = shortfall > 0 ? Math.ceil(shortfall / car.rate) : 0;
  const pct = Math.min(100, Math.round((earned / car.loan.monthly) * 100));
  const covered = shortfall <= 0;
  return (
    <div className="rounded-md p-3" style={{ background: "#FFFFFF80", border: `1px solid ${PAPER_LINE}` }}>
      <div className="flex items-center gap-1.5 text-[13px] font-semibold mb-2" style={{ color: INK }}><PiggyBank size={15} />ค่าผ่อนรถ</div>
      <div className="text-[12px] mb-1.5" style={{ color: MUTE }}>ผ่อนเดือนละ <span className="font-mono" style={{ color: INK }}>{fmt(car.loan.monthly)}</span> บาท (ดอกเบี้ย ~{fmt(car.loan.interestMonthly || 0)}) · เหลืออีก {car.loan.monthsLeft} เดือน</div>
      <div className="text-[12px] mb-1.5" style={{ color: MUTE }}>รายได้ {fmt(car.rate)}.-/วัน × ส่งแล้ว {car.loan.daysRentedThisMonth} วัน = <span className="font-mono" style={{ color: INK }}>{fmt(earned)}</span></div>
      <div className="w-full h-2 rounded-full mb-1.5 overflow-hidden" style={{ background: PAPER_LINE }}><div className="h-full rounded-full" style={{ width: `${pct}%`, background: covered ? "#3A7D5C" : "#D69A2D" }} /></div>
      <div className="text-[13px] font-medium" style={{ color: covered ? "#3A7D5C" : "#C1502E" }}>{covered ? `ครอบคลุมค่าผ่อนแล้ว ✓ (เกิน ${fmt(-shortfall)} บาท)` : `ขาดอีก ${fmt(shortfall)} บาท (ต้องส่งอีก ${daysMore} วัน ถึงจะ cover)`}</div>
    </div>
  );
}

function Drawer({ car, events, onClose, onEdit, canEdit, canSeeFinance }) {
  useLockBodyScroll(!!car);
  if (!car) return null;
  const totalExpense = Object.values(car.expense).reduce((a, b) => a + b, 0) + (car.gpsMonthlyFee || 0);
  const profit = car.income - totalExpense;
  const s = STATUS[car.status];
  const carEvents = events.filter((e) => e.carId === car.id && e.date >= APP_TODAY);
  const groups = {};
  carEvents.forEach((e) => { const key = e.groupId || e.id; if (!groups[key]) groups[key] = []; groups[key].push(e); });
  const upcoming = Object.values(groups).map((g) => {
    const sorted = [...g].sort((a, b) => a.date.localeCompare(b.date));
    return { id: sorted[0].groupId || sorted[0].id, type: sorted[0].type, note: sorted[0].note, startDate: sorted[0].date, endDate: sorted[sorted.length - 1].date, startHour: sorted[0].startHour, endHour: sorted[sorted.length - 1].endHour };
  }).sort((a, b) => (a.startDate + String(a.startHour).padStart(2, "0")).localeCompare(b.startDate + String(b.startHour).padStart(2, "0"))).slice(0, 6);
  const expenseRows = [{ label: "ค่าน้ำมัน/ไฟฟ้า", val: car.expense.fuel, icon: Fuel }, { label: "ค่าล้างรถ", val: car.expense.wash, icon: Sparkles }, { label: "ค่าซ่อม/บำรุง", val: car.expense.repair, icon: Wrench }, { label: "ค่าประกัน/พ.ร.บ.", val: car.expense.insurance, icon: ShieldCheck }, { label: "ค่า GPS", val: car.gpsMonthlyFee || 0, icon: MapPin }];
  const colorObj = COLORS.find((c) => c.key === car.color);
  return (
    <div className="fixed inset-0 z-30 flex justify-end">
      <div className="absolute inset-0" style={{ background: "#00000066" }} onClick={onClose} />
      <div className="relative w-full max-w-sm h-full shadow-2xl flex flex-col" style={{ background: PAPER, minHeight: 0 }}>
        <div className="p-4 flex items-center justify-between border-b flex-shrink-0" style={{ borderColor: PAPER_LINE }}>
          <div>
            <div className="font-mono font-bold text-lg flex items-center gap-1.5" style={{ color: INK }}>{car.plate}{colorObj && <span className="w-3 h-3 rounded-full border" style={{ background: colorObj.hex, borderColor: PAPER_LINE }} />}</div>
            <div className="text-[12px]" style={{ color: MUTE }}>{car.brand} {car.model} {car.ownerType === "partner" && `· รถของ${car.partnerName}`}</div>
          </div>
          <div className="flex items-center gap-1">{canEdit && <button onClick={() => onEdit(car)} className="p-1.5 rounded-full hover:bg-black/5"><Pencil size={16} color={INK} /></button>}<button onClick={onClose} className="p-1.5 rounded-full hover:bg-black/5"><X size={18} color={INK} /></button></div>
        </div>
        <div className="p-4 space-y-5 flex-1 min-h-0 overflow-y-auto" style={{ WebkitOverflowScrolling: "touch", touchAction: "pan-y", overscrollBehavior: "contain" }}>
          <div className="flex items-center gap-2"><span className="text-[12px] font-semibold px-2 py-1 rounded-full" style={{ color: s.color, background: s.bg }}>{s.label}</span><span className="text-[12px]" style={{ color: MUTE }}>เลขไมล์ {fmtInt(car.mileage)} กม.</span></div>
          <div>
            <div className="flex items-center gap-1.5 mb-2 text-[13px] font-semibold" style={{ color: INK }}><CalendarDays size={15} /> คิวถัดไป</div>
            {upcoming.length === 0 ? (<div className="text-[13px] rounded-md p-3" style={{ color: MUTE, background: "#FFFFFF80", border: `1px solid ${PAPER_LINE}` }}>ไม่มีคิวล่วงหน้า — รถว่างพร้อมให้เช่า</div>) : (
              <div className="space-y-2">{upcoming.map((ev) => { const EIcon = EVENT_ICON[ev.type]; const multiDay = ev.endDate !== ev.startDate; return (
                <div key={ev.id} className="flex items-start gap-2 rounded-md p-2.5" style={{ background: "#FFFFFF80", border: `1px solid ${PAPER_LINE}` }}>
                  <EIcon size={16} style={{ color: EVENT_COLOR[ev.type] }} className="mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="text-[13px] font-medium" style={{ color: INK }}>{EVENT_LABEL[ev.type]}</div>
                    <div className="text-[12px] font-mono" style={{ color: INK }}>{multiDay ? `${formatThaiDateShort(ev.startDate)} ${ev.startHour}:00 → ${formatThaiDateShort(ev.endDate)} ${ev.endHour}:00` : `${formatThaiDateShort(ev.startDate)} · ${ev.startHour}:00–${ev.endHour}:00`}</div>
                    <div className="text-[12px]" style={{ color: MUTE }}>{ev.note}</div>
                  </div>
                </div>
              ); })}</div>
            )}
          </div>
          {canSeeFinance && (
            <>
              <div>
                <div className="flex items-center gap-1.5 mb-2 text-[13px] font-semibold" style={{ color: INK }}><Wallet size={15} /> บัญชีเดือนนี้</div>
                <div className="rounded-md p-3 space-y-2" style={{ background: "#FFFFFF80", border: `1px solid ${PAPER_LINE}` }}>
                  <div className="flex justify-between text-[13px]"><span style={{ color: MUTE }}>รายรับรวม</span><span className="font-mono font-semibold" style={{ color: "#3A7D5C" }}>+{fmt(car.income)}</span></div>
                  {expenseRows.map((r) => (<div key={r.label} className="flex justify-between text-[12.5px]"><span style={{ color: MUTE }} className="flex items-center gap-1.5"><r.icon size={12} />{r.label}</span><span className="font-mono" style={{ color: INK }}>-{fmt(r.val)}</span></div>))}
                  <div className="border-t pt-2 flex justify-between text-[13px] font-semibold" style={{ borderColor: PAPER_LINE }}><span style={{ color: INK }}>กำไรดำเนินงาน</span><span className="font-mono" style={{ color: profit >= 0 ? "#3A7D5C" : "#C1502E" }}>{profit >= 0 ? "+" : ""}{fmt(profit)}</span></div>
                  <div className="text-[10.5px]" style={{ color: MUTE }}>* ยังไม่หักค่าเสื่อมราคาและดอกเบี้ย</div>
                </div>
              </div>
              {car.ownerType === "partner" && (() => { const p = computePartnerPayout(car); return (
                <div className="rounded-md p-3" style={{ background: "#FFFFFF80", border: `1px solid ${PAPER_LINE}` }}>
                  <div className="flex items-center gap-1.5 text-[13px] font-semibold mb-2" style={{ color: INK }}><Handshake size={15} />สรุปจ่าย{car.partnerName}</div>
                  <div className="text-[12px] space-y-1" style={{ color: MUTE }}>
                    <div className="flex justify-between"><span>รายได้รวม</span><span className="font-mono" style={{ color: INK }}>{fmt(car.income)}</span></div>
                    <div className="flex justify-between"><span>หัก %เข้าเพจ ({car.commissionPct}%)</span><span className="font-mono" style={{ color: INK }}>-{fmt(p.commission)}</span></div>
                    <div className="flex justify-between"><span>หัก ณ ที่จ่าย ({car.withholdingPct}%)</span><span className="font-mono" style={{ color: INK }}>-{fmt(p.withholding)}</span></div>
                    <div className="flex justify-between"><span>หักค่าใช้จ่ายรถ</span><span className="font-mono" style={{ color: INK }}>-{fmt(p.carExp)}</span></div>
                    <div className="flex justify-between font-semibold pt-1 border-t" style={{ borderColor: PAPER_LINE, color: INK }}><span>ยอดสุทธิจ่ายพาร์ทเนอร์</span><span className="font-mono">{fmt(p.netPayout)}</span></div>
                  </div>
                </div>
              ); })()}
              {car.loan && <LoanCard car={car} />}
              {(() => {
                const be = computeBreakeven(car);
                if (!be.daysNeeded) return null;
                const actualDays = car.loan ? car.loan.daysRentedThisMonth : Math.round((car.income || 0) / (car.rate || 1));
                const pct = Math.min(100, Math.round((actualDays / be.daysNeeded) * 100));
                const ok = actualDays >= be.daysNeeded;
                return (
                  <div className="rounded-md p-3" style={{ background: "#FFFFFF80", border: `1px solid ${PAPER_LINE}` }}>
                    <div className="flex items-center gap-1.5 text-[13px] font-semibold mb-2" style={{ color: INK }}><Gauge size={15} />จุดคุ้มทุนของรถคันนี้</div>
                    <div className="text-[12px] mb-1.5" style={{ color: MUTE }}>
                      ต้องปล่อยเช่าอย่างน้อย <b className="font-mono" style={{ color: INK }}>{be.daysNeeded} วัน/เดือน</b> ถึงจะคุ้มค่าใช้จ่ายประจำของคันนี้
                    </div>
                    <div className="text-[11px] mb-2" style={{ color: MUTE }}>
                      ต้องครอบคลุม {fmt(be.totalToCover)}/เดือน (ค่างวด+ประกัน+GPS {fmt(be.fixedMonthly)} · ค่าเสื่อม {fmt(be.depreciation)})
                    </div>
                    <div className="w-full h-2 rounded-full mb-1.5 overflow-hidden" style={{ background: PAPER_LINE }}>
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, background: ok ? "#3A7D5C" : "#D69A2D" }} />
                    </div>
                    <div className="text-[12.5px] font-medium" style={{ color: ok ? "#3A7D5C" : "#C1502E" }}>
                      {ok ? `เดือนนี้ปล่อยไปแล้ว ${actualDays} วัน — คุ้มทุนแล้ว ✓` : `เดือนนี้ปล่อยไปแล้ว ${actualDays} วัน — ขาดอีก ${be.daysNeeded - actualDays} วัน`}
                    </div>
                  </div>
                );
              })()}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function FleetView({ cars, events, onSelect, onAdd, canEdit, wide }) {
  const [statusF, setStatusF] = useState("ทั้งหมด");
  const [catF, setCatF] = useState("ทั้งหมด");
  const [colorF, setColorF] = useState("ทั้งหมด");
  const expiryAlerts = getExpiryAlerts(cars);
  const hasExpired = expiryAlerts.some((a) => a.expired);
  const statusOpts = ["ทั้งหมด", ...Object.keys(STATUS)];
  const filtered = cars.filter((c) => {
    const sOk = statusF === "ทั้งหมด" || c.status === statusF;
    const cOk = catF === "ทั้งหมด" || c.category === catF || c.bed === catF || c.fuel === catF;
    const colOk = colorF === "ทั้งหมด" || c.color === colorF;
    return sOk && cOk && colOk;
  });
  const hintFor = (carId) => {
    const today = events.filter((e) => e.carId === carId && e.date === APP_TODAY);
    if (today.length === 0) return "ว่างทั้งวันนี้";
    const ev = today[0];
    const group = ev.groupId ? events.filter((e) => e.carId === carId && e.groupId === ev.groupId) : [ev];
    const dates = group.map((e) => e.date).sort();
    const spanEnd = dates[dates.length - 1];
    const label = EVENT_LABEL[ev.type] || "ไม่ว่าง";
    if (spanEnd > APP_TODAY) return `ไม่ว่าง (${label}) ถึง ${formatThaiDateShort(spanEnd)}`;
    return `ไม่ว่างวันนี้ (${label}) ${ev.startHour}:00–${ev.endHour}:00`;
  };
  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="text-[13px] font-semibold" style={{ color: INK }}>รถทั้งหมด {cars.length} คัน</div>
        {canEdit && <button onClick={onAdd} className="flex items-center gap-1 text-[12px] font-semibold px-2.5 py-1.5 rounded-full" style={{ background: INK, color: PAPER }}><Plus size={13} />เพิ่มรถ</button>}
      </div>
      {expiryAlerts.length > 0 && (
        <div className="rounded-lg p-3 mb-3" style={{ background: hasExpired ? "#C1502E14" : "#D69A2D14", border: `1px solid ${hasExpired ? "#C1502E55" : "#D69A2D55"}` }}>
          <div className="text-[12.5px] font-semibold mb-2" style={{ color: hasExpired ? "#C1502E" : "#805B00" }}>
            {hasExpired ? "🚨 มีเอกสารหมดอายุแล้ว — ห้ามนำรถออกให้เช่า" : "⏰ เอกสารใกล้หมดอายุ"}
          </div>
          <div className="space-y-1.5">
            {expiryAlerts.map((a, i) => (
              <button key={i} onClick={() => onSelect(a.car)} className="w-full flex items-center justify-between gap-2 rounded-md px-2.5 py-2 text-left" style={{ background: "#FFFFFF", border: `1px solid ${PAPER_LINE}` }}>
                <div className="min-w-0">
                  <div className="text-[12px] font-mono font-semibold truncate" style={{ color: INK }}>{a.car.plate}</div>
                  <div className="text-[10.5px]" style={{ color: MUTE }}>{a.label} · {formatDMY(a.date)}</div>
                </div>
                <span className="text-[10.5px] font-semibold px-1.5 py-0.5 rounded-full flex-shrink-0" style={{ background: a.expired ? "#C1502E" : "#D69A2D", color: PAPER }}>
                  {a.expired ? `หมดแล้ว ${Math.abs(a.daysLeft)} วัน` : `เหลือ ${a.daysLeft} วัน`}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
      <div className="flex flex-wrap gap-1.5 mb-2">{statusOpts.map((s) => (<button key={s} onClick={() => setStatusF(s)} className="text-[12px] px-2.5 py-1 rounded-full border transition" style={{ borderColor: s === "ทั้งหมด" ? MUTE : STATUS[s].color, background: statusF === s ? (s === "ทั้งหมด" ? INK : STATUS[s].color) : "transparent", color: statusF === s ? PAPER : (s === "ทั้งหมด" ? MUTE : STATUS[s].color) }}>{s === "ทั้งหมด" ? "ทั้งหมด" : STATUS[s].label}</button>))}</div>
      <div className="flex flex-wrap gap-1.5 mb-2">{CATS.map((c) => (<button key={c} onClick={() => setCatF(c)} className="text-[12px] px-2.5 py-1 rounded-full border transition" style={{ borderColor: PAPER_LINE, background: catF === c ? PAPER : "transparent", color: catF === c ? INK : "#C9CDD3" }}>{c}</button>))}</div>
      <div className="flex flex-wrap items-center gap-1.5 mb-4">
        <span className="text-[11px]" style={{ color: "#C9CDD3" }}>สี:</span>
        <button onClick={() => setColorF("ทั้งหมด")} className="text-[11px] px-2 py-1 rounded-full border" style={{ borderColor: PAPER_LINE, background: colorF === "ทั้งหมด" ? PAPER : "transparent", color: colorF === "ทั้งหมด" ? INK : "#C9CDD3" }}>ทั้งหมด</button>
        {COLORS.map((c) => (<button key={c.key} onClick={() => setColorF(c.key)} title={c.label} className="w-6 h-6 rounded-full border-2" style={{ background: c.hex, borderColor: colorF === c.key ? "#3B5BA5" : "transparent" }} />))}
      </div>
      <div className={`grid gap-3 pt-1 ${wide ? "grid-cols-4 xl:grid-cols-5" : "grid-cols-2 sm:grid-cols-3"}`}>
        {filtered.map((car) => <CarTag key={car.id} car={car} onClick={() => onSelect(car)} todayHint={hintFor(car.id)} />)}
        {filtered.length === 0 && <div className="col-span-full text-center text-[13px] py-10" style={{ color: MUTE }}>ไม่พบรถตามเงื่อนไขที่เลือก</div>}
      </div>
    </div>
  );
}

/* ================= calendar (date-range Gantt) ================= */
// Cleaning windows are derived from a booking's return time — editing them here would
// silently desync them from the booking, so they get their own read-only view.
function CleanBlockModal({ initial, onClose }) {
  useLockBodyScroll();
  return (
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
        <div className="absolute inset-0" style={{ background: "#00000066" }} onClick={onClose} />
        <div className="relative w-full sm:max-w-sm rounded-t-2xl sm:rounded-2xl p-4" style={{ background: PAPER }}>
          <div className="flex items-center justify-between mb-3">
            <div className="font-semibold text-[15px] flex items-center gap-1.5" style={{ color: "#2E7D8F" }}><Sparkles size={16} />ช่วงเคลียรถ</div>
            <button onClick={onClose} className="p-1.5 rounded-full hover:bg-black/5"><X size={18} color={INK} /></button>
          </div>
          <div className="rounded-md p-3 mb-3" style={{ background: "#2E7D8F14" }}>
            <div className="font-mono font-bold text-[20px]" style={{ color: "#2E7D8F" }}>{String(initial.startHour).padStart(2, "0")}:00 – {String(initial.endHour).padStart(2, "0")}:00</div>
            <div className="text-[12px] mt-1" style={{ color: INK }}>{initial.note}</div>
          </div>
          <div className="text-[11.5px] mb-3" style={{ color: MUTE }}>
            ช่วงนี้ระบบล็อกให้อัตโนมัติหลังลูกค้าคืนรถ เพื่อให้มีเวลาตรวจสภาพและทำความสะอาดก่อนส่งคันต่อไป<br /><br />
            <b style={{ color: INK }}>แก้เวลาตรงนี้ไม่ได้</b> เพราะผูกกับเวลาคืนรถของการจอง — ถ้าต้องการเปลี่ยน ให้ไปแก้เวลาคืนรถที่แท็บ "งานเช่า" แล้วช่วงนี้จะขยับตามเอง
          </div>
          <button onClick={onClose} className="w-full py-2.5 rounded-lg text-[13px] font-semibold" style={{ border: `1px solid ${PAPER_LINE}`, color: INK }}>ปิด</button>
        </div>
      </div>
    
  );
}

function EventModal({ mode, initial, onSave, onDelete, onClose }) {
  useLockBodyScroll();
  const [startDate, setStartDate] = useState(initial.date);
  const [endDate, setEndDate] = useState(initial.groupEndDate || initial.date);
  const [startHour, setStartHour] = useState(initial.startHour);
  const [endHour, setEndHour] = useState(initial.endHour === 24 ? 24 : initial.endHour);
  const [type, setType] = useState(initial.type || "booked");
  const [note, setNote] = useState(initial.note || "");
  const inputCls = "w-full text-[13px] rounded-md px-2.5 py-2 outline-none";
  const inputStyle = { background: "#FFFFFF", border: `1px solid ${PAPER_LINE}`, color: INK };

  if (mode === "locked") {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={onClose}>
        <div className="absolute inset-0" style={{ background: "#00000066" }} />
        <div className="relative rounded-xl p-4 w-80" style={{ background: PAPER, border: `1px solid ${PAPER_LINE}` }} onClick={(e) => e.stopPropagation()}>
          <div className="text-[13px] font-semibold mb-2 flex items-center gap-1.5" style={{ color: INK }}><Lock size={14} />รายการนี้ผูกกับการจอง</div>
          <div className="text-[12.5px] mb-1" style={{ color: INK }}>{formatThaiDateShort(initial.date)}{initial.groupEndDate && initial.groupEndDate !== initial.date ? ` – ${formatThaiDateShort(initial.groupEndDate)}` : ""}</div>
          <div className="text-[12px] mb-3" style={{ color: MUTE }}>{initial.note}</div>
          <div className="text-[11px] mb-3" style={{ color: "#3B5BA5" }}>จัดการ/แก้ไขได้ที่แท็บ "งานเช่า" เพื่อให้ข้อมูลตรงกันเสมอ</div>
          <button onClick={onClose} className="w-full py-2 rounded-lg text-[12.5px]" style={{ border: `1px solid ${PAPER_LINE}`, color: INK }}>ปิด</button>
        </div>
      </div>
    );
  }
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0" style={{ background: "#00000066" }} />
      <div className="relative rounded-t-2xl sm:rounded-2xl p-4 w-full sm:w-80" style={{ background: PAPER, border: `1px solid ${PAPER_LINE}` }} onClick={(e) => e.stopPropagation()}>
        <div className="text-[13px] font-semibold mb-3" style={{ color: INK }}>{mode === "edit" ? "แก้ไขรายการ" : "เพิ่มรายการ"}</div>
        <div className="grid grid-cols-2 gap-2 mb-2">
          <label><div className="text-[11px] mb-1" style={{ color: MUTE }}>วันที่เริ่ม</div><input type="date" className={inputCls} style={inputStyle} value={startDate} onChange={(e) => setStartDate(e.target.value)} /></label>
          <label><div className="text-[11px] mb-1" style={{ color: MUTE }}>ถึงวันที่</div><input type="date" className={inputCls} style={inputStyle} value={endDate} min={startDate} onChange={(e) => setEndDate(e.target.value)} /></label>
        </div>
        <div className="grid grid-cols-2 gap-2 mb-2">
          <label><div className="text-[11px] mb-1" style={{ color: MUTE }}>เวลาเริ่ม (วันแรก)</div><select className={inputCls} style={inputStyle} value={startHour} onChange={(e) => setStartHour(Number(e.target.value))}>{HOURS_FULL.map((h) => <option key={h} value={h}>{h}:00</option>)}</select></label>
          <label><div className="text-[11px] mb-1" style={{ color: MUTE }}>เวลาสิ้นสุด (วันสุดท้าย)</div><select className={inputCls} style={inputStyle} value={endHour} onChange={(e) => setEndHour(Number(e.target.value))}>{[...HOURS_FULL, 24].filter((h) => h > 0).map((h) => <option key={h} value={h}>{h}:00</option>)}</select></label>
        </div>
        <div className="flex flex-wrap gap-1.5 mb-3">{EVENT_TYPES.map((t) => (<button key={t} onClick={() => setType(t)} className="text-[12px] px-2.5 py-1 rounded-full border" style={{ borderColor: EVENT_COLOR[t], background: type === t ? EVENT_COLOR[t] : "transparent", color: type === t ? PAPER : EVENT_COLOR[t] }}>{EVENT_LABEL[t]}</button>))}</div>
        <input className={`${inputCls} mb-3`} style={inputStyle} placeholder="หมายเหตุ เช่น ชื่อลูกค้า/เบอร์โทร" value={note} onChange={(e) => setNote(e.target.value)} />
        <div className="flex gap-2">
          {mode === "edit" && <button onClick={() => onDelete(initial.groupId)} className="px-3 py-2 rounded-lg text-[12.5px]" style={{ border: `1px solid #C1502E`, color: "#C1502E" }}><Trash2 size={14} /></button>}
          <button onClick={onClose} className="flex-1 py-2 rounded-lg text-[12.5px]" style={{ border: `1px solid ${PAPER_LINE}`, color: INK }}>ยกเลิก</button>
          <button onClick={() => { if (endDate < startDate) return; onSave({ carId: initial.carId, groupId: initial.groupId, startDate, endDate, startHour, endHour, type, note: note || "-" }); }} className="flex-1 py-2 rounded-lg text-[12.5px] font-semibold" style={{ background: INK, color: PAPER }}>บันทึก</button>
        </div>
      </div>
    </div>
  );
}

function GanttRow({ car, visibleDates, eventsByDate, onCellClick, onEventClick, onDropEvent, zebra }) {
  const isConn = (date, groupId, dir) => { const d = addDays(date, dir); const e = eventsByDate[`${car.id}|${d}`]; return e && e.groupId === groupId; };
  const s = STATUS[car.status];
  const freeDays = visibleDates.filter((d) => !eventsByDate[`${car.id}|${d}`]).length;
  return (
    <div className="flex items-stretch" style={{ background: zebra ? "#FFFFFF80" : "transparent", borderBottom: `1px solid ${PAPER_LINE}` }}>
      <div className="sticky left-0 z-10 w-[104px] flex-shrink-0 flex items-center gap-1.5 pl-2 pr-2 py-2" style={{ background: zebra ? "#F1EBDD" : PAPER, boxShadow: "2px 0 4px -2px rgba(0,0,0,0.18)" }}>
        <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: s.color }} title={s.label} />
        <div className="min-w-0 flex-1">
          <div className="font-mono text-[12px] font-bold truncate" style={{ color: INK }}>{car.plate}</div>
          <div className="text-[9.5px] truncate" style={{ color: MUTE }}>{car.brand} {car.model}</div>
          <div className="text-[9px] font-medium" style={{ color: freeDays === 0 ? "#C1502E" : freeDays <= 2 ? "#D69A2D" : "#3A7D5C" }}>
            {freeDays === 0 ? "เต็มทั้งสัปดาห์" : `ว่าง ${freeDays}/${visibleDates.length} วัน`}
          </div>
        </div>
      </div>
      <div className="flex flex-shrink-0">
        {visibleDates.map((date) => {
          const ev = eventsByDate[`${car.id}|${date}`];
          const isToday = date === APP_TODAY;
          const dow = new Date(date + "T00:00:00").getDay();
          const isWeekend = dow === 0 || dow === 6;
          const bg = isToday ? "#3B5BA514" : isWeekend ? "#00000008" : "transparent";
          return (
            <div key={date} className="relative h-16 flex-shrink-0 group" style={{ width: DAY_COL_W, background: bg, borderLeft: isToday ? "2px solid #3B5BA5" : `1px solid ${PAPER_LINE}` }}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => { e.preventDefault(); const data = e.dataTransfer.getData("text/plain"); if (data) onDropEvent(JSON.parse(data), car.id, date); }}
              onClick={() => { if (!ev) onCellClick(car.id, date); }}>
              {!ev && (
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: "#3B5BA5" }}>
                  <Plus size={13} />
                </div>
              )}
              {ev && (() => {
                const connL = isConn(date, ev.groupId, -1); const connR = isConn(date, ev.groupId, 1);
                const EIcon = EVENT_ICON[ev.type]; const locked = !!ev.bookingId || ev.type === "clean";
                return (
                  <div draggable={!locked}
                    onDragStart={(e) => e.dataTransfer.setData("text/plain", JSON.stringify({ groupId: ev.groupId, fromCarId: car.id, fromDate: date }))}
                    onClick={(e) => { e.stopPropagation(); onEventClick(ev); }}
                    className="absolute top-2.5 bottom-2.5 flex items-center gap-1 overflow-hidden"
                    style={{ left: connL ? 0 : 3, right: connR ? 0 : 3, background: EVENT_COLOR[ev.type], color: PAPER, cursor: locked ? "pointer" : "grab",
                      borderTopLeftRadius: connL ? 0 : 999, borderBottomLeftRadius: connL ? 0 : 999, borderTopRightRadius: connR ? 0 : 999, borderBottomRightRadius: connR ? 0 : 999,
                      paddingLeft: connL ? 3 : 7, paddingRight: connR ? 3 : 5,
                      boxShadow: "0 1px 2px rgba(0,0,0,0.18)" }}
                    title={`${EVENT_LABEL[ev.type]} · ${ev.note} (${ev.startHour}:00–${ev.endHour}:00)`}>
                    {!connL ? (
                      <>{locked && <Lock size={8} className="flex-shrink-0" />}<EIcon size={9} className="flex-shrink-0" /><span className="text-[9px] font-semibold truncate">{ev.startHour}:00</span></>
                    ) : (
                      <span className="text-[9px] font-medium truncate opacity-80">{connR ? "" : `→${ev.endHour}:00`}</span>
                    )}
                  </div>
                );
              })()}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function DragCalendarView({ cars, scheduleEvents, setScheduleEvents, wide }) {
  const dayCount = wide ? 14 : DAYS_WINDOW;
  const [rangeStart, setRangeStart] = useState(addDays(APP_TODAY, -3));
  const [viewMode, setViewMode] = useState("agenda");
  const [modal, setModal] = useState(null);
  const scrollRef = useRef(null);
  const visibleDates = Array.from({ length: dayCount }, (_, i) => addDays(rangeStart, i));
  useEffect(() => { if (scrollRef.current) scrollRef.current.scrollLeft = 3 * DAY_COL_W; }, [rangeStart]);

  const eventsByDate = {};
  scheduleEvents.forEach((e) => { eventsByDate[`${e.carId}|${e.date}`] = e; });
  const groupEndDateOf = (groupId, carId) => { const all = scheduleEvents.filter((e) => e.groupId === groupId && e.carId === carId).map((e) => e.date); return all.sort()[all.length - 1]; };

  const openCreate = (carId, date) => setModal({ mode: "create", initial: { carId, date, groupId: `grp${groupCounter++}`, startHour: 9, endHour: 18, type: "booked", note: "" } });
  const openEdit = (ev) => {
    if (ev.bookingId) { setModal({ mode: "locked", initial: { ...ev, groupEndDate: groupEndDateOf(ev.groupId, ev.carId) } }); return; }
    const groupDates = scheduleEvents.filter((e) => e.groupId === ev.groupId && e.carId === ev.carId).map((e) => e.date).sort();
    const first = scheduleEvents.find((e) => e.groupId === ev.groupId && e.carId === ev.carId && e.date === groupDates[0]);
    const last = scheduleEvents.find((e) => e.groupId === ev.groupId && e.carId === ev.carId && e.date === groupDates[groupDates.length - 1]);
    setModal({ mode: "edit", initial: { carId: ev.carId, groupId: ev.groupId, date: groupDates[0], groupEndDate: groupDates[groupDates.length - 1], startHour: first.startHour, endHour: last.endHour, type: ev.type, note: ev.note } });
  };
  const saveEvent = (data) => {
    const fresh = expandRangeToEvents({ startDate: data.startDate, endDate: data.endDate, carId: data.carId, type: data.type, note: data.note, groupId: data.groupId, startHour: data.startHour, endHour: data.endHour, idPrefix: "m" });
    setScheduleEvents((prev) => [...prev.filter((e) => e.groupId !== data.groupId), ...fresh]);
    setModal(null);
  };
  const deleteEvent = (groupId) => { setScheduleEvents((prev) => prev.filter((e) => e.groupId !== groupId)); setModal(null); };
  const dropMove = (payload, targetCarId, targetDate) => {
    setScheduleEvents((prev) => {
      const groupEvs = prev.filter((e) => e.groupId === payload.groupId && e.carId === payload.fromCarId);
      if (groupEvs.some((e) => e.bookingId)) return prev;
      const delta = daysBetween(payload.fromDate, targetDate);
      const rest = prev.filter((e) => !(e.groupId === payload.groupId && e.carId === payload.fromCarId));
      const moved = groupEvs.map((e) => ({ ...e, carId: targetCarId, date: addDays(e.date, delta), id: `${e.id}-m` }));
      return [...rest, ...moved];
    });
  };

  // Collapse per-day event rows back into one entry per job (groupId), so a 3-day rental
  // shows as a single agenda item on its start day rather than three separate rows.
  // Cleaning tasks in view — surfaced as an explicit work list so the person doing the
  // cleaning knows the exact window they have, without digging into bookings.
  const cleanTasks = visibleDates.flatMap((date) =>
    scheduleEvents
      .filter((e) => e.type === "clean" && e.date === date)
      .map((e) => {
        const car = cars.find((x) => x.id === e.carId);
        // is the car booked again right after this window?
        const nextSame = scheduleEvents.find((x) => x.carId === e.carId && x.date === date && x.type === "booked" && x.startHour >= e.endHour);
        const nextDay = scheduleEvents.find((x) => x.carId === e.carId && x.date === addDays(date, 1) && x.type === "booked");
        return { ev: e, car, date, nextSame, nextDay, isToday: date === APP_TODAY, isPast: date < APP_TODAY };
      })
  ).sort((a, b) => (a.date + String(a.ev.startHour).padStart(2, "0")).localeCompare(b.date + String(b.ev.startHour).padStart(2, "0")));

  const agendaDays = visibleDates.map((date) => {
    const seen = new Set();
    const items = [];
    cars.forEach((car) => {
      const ev = eventsByDate[`${car.id}|${date}`];
      if (!ev) return;
      const key = `${car.id}|${ev.groupId}`;
      if (seen.has(key)) return;
      seen.add(key);
      const groupDates = scheduleEvents.filter((e) => e.groupId === ev.groupId && e.carId === car.id).map((e) => e.date).sort();
      const startDate = groupDates[0], endDate = groupDates[groupDates.length - 1];
      const first = scheduleEvents.find((e) => e.groupId === ev.groupId && e.carId === car.id && e.date === startDate);
      const last = scheduleEvents.find((e) => e.groupId === ev.groupId && e.carId === car.id && e.date === endDate);
      items.push({ ev, car, startDate, endDate, startHour: first ? first.startHour : ev.startHour, endHour: last ? last.endHour : ev.endHour, isStart: startDate === date, multiDay: startDate !== endDate });
    });
    return { date, items: items.sort((a, b) => a.startHour - b.startHour) };
  });

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-2">
        <button onClick={() => setRangeStart(addDays(rangeStart, -dayCount))} className="p-1.5 rounded-full" style={{ background: PAPER }}><ChevronLeft size={16} color={INK} /></button>
        <div className="text-[13px] font-semibold" style={{ color: INK }}>{formatThaiDateShort(visibleDates[0])} – {formatThaiDateShort(visibleDates[visibleDates.length - 1])}</div>
        <button onClick={() => setRangeStart(addDays(rangeStart, dayCount))} className="p-1.5 rounded-full" style={{ background: PAPER }}><ChevronRight size={16} color={INK} /></button>
      </div>
      <div className="flex items-center gap-2 mb-2">
        <input type="date" value={rangeStart} onChange={(e) => setRangeStart(e.target.value)} className="flex-1 text-[12px] rounded-md px-2 py-1.5 outline-none" style={{ background: PAPER, border: `1px solid ${PAPER_LINE}`, color: INK }} />
        <button onClick={() => setRangeStart(addDays(APP_TODAY, -3))} className="text-[12px] px-2.5 py-1.5 rounded-md font-medium" style={{ background: PAPER, color: INK }}>วันนี้</button>
      </div>
      <div className="flex gap-1.5 mb-3">
        {[{ k: "agenda", l: "รายการ" }, { k: "grid", l: "ตารางรวม" }].map((v) => (
          <button key={v.k} onClick={() => setViewMode(v.k)} className="flex-1 text-[12px] py-1.5 rounded-md font-medium" style={{ background: viewMode === v.k ? "#3B5BA5" : PAPER, color: viewMode === v.k ? PAPER : INK, border: `1px solid ${viewMode === v.k ? "#3B5BA5" : PAPER_LINE}` }}>{v.l}</button>
        ))}
      </div>
      {cleanTasks.length > 0 && (
        <div className="rounded-lg p-3 mb-3" style={{ background: "#2E7D8F14", border: "1px solid #2E7D8F55" }}>
          <div className="flex items-center gap-1.5 mb-2">
            <Sparkles size={14} color="#2E7D8F" />
            <span className="text-[12.5px] font-semibold" style={{ color: "#2E7D8F" }}>งานเคลียรถในช่วงนี้ ({cleanTasks.length} คัน)</span>
          </div>
          <div className={`grid gap-2 ${wide ? "grid-cols-2" : "grid-cols-1"}`}>
            {cleanTasks.map((t) => (
              <div key={t.ev.id} className="rounded-md p-2.5 flex items-start gap-2.5" style={{ background: "#FFFFFF", border: `1px solid ${PAPER_LINE}`, opacity: t.isPast ? 0.55 : 1 }}>
                <div className="rounded-md px-2 py-1.5 text-center flex-shrink-0" style={{ background: "#2E7D8F", color: "#fff", minWidth: 74 }}>
                  <div className="text-[13px] font-mono font-bold leading-tight">{String(t.ev.startHour).padStart(2, "0")}:00</div>
                  <div className="text-[9px]" style={{ color: "#ffffffcc" }}>ถึง {String(t.ev.endHour).padStart(2, "0")}:00</div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[12.5px] font-mono font-semibold truncate" style={{ color: INK }}>
                    {t.car ? t.car.plate : "-"} <span className="font-sans font-normal text-[11px]" style={{ color: MUTE }}>{t.car ? `${t.car.brand} ${t.car.model}` : ""}</span>
                  </div>
                  <div className="text-[10.5px]" style={{ color: MUTE }}>
                    {t.isToday ? "วันนี้" : formatDMY(t.date)} · มีเวลาทำความสะอาด {t.ev.endHour - t.ev.startHour} ชม.
                  </div>
                  <div className="text-[11px] font-medium mt-0.5" style={{ color: t.nextSame ? "#C1502E" : "#2E7D8F" }}>
                    {t.nextSame
                      ? `⚠ ต้องเสร็จก่อน ${String(t.nextSame.startHour).padStart(2, "0")}:00 — มีคิวส่งรถต่อทันที`
                      : t.nextDay
                        ? `พร้อมส่งต่อ ${String(t.ev.endHour).padStart(2, "0")}:00 · คิวถัดไปพรุ่งนี้`
                        : `พร้อมส่งต่อ ${String(t.ev.endHour).padStart(2, "0")}:00 · ยังไม่มีคิวถัดไป`}
                  </div>
                </div>
                <Lock size={11} color={MUTE} className="flex-shrink-0 mt-1" />
              </div>
            ))}
          </div>
          <div className="text-[10px] mt-2" style={{ color: MUTE }}>ช่วงเวลานี้ถูกล็อกอัตโนมัติหลังลูกค้าคืนรถ — ระบบจะไม่ให้จองทับ และแก้เวลาเองไม่ได้ (ผูกกับการจอง)</div>
        </div>
      )}
      <div className="flex flex-wrap gap-x-3 gap-y-1 mb-2">
        {EVENT_TYPES.map((t) => (
          <div key={t} className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ background: EVENT_COLOR[t] }} />
            <span className="text-[10.5px]" style={{ color: "#C9CDD3" }}>{EVENT_LABEL[t]}</span>
          </div>
        ))}
      </div>

      {viewMode === "agenda" ? (
        <div className="space-y-2">
          {agendaDays.map(({ date, items }) => {
            const isToday = date === APP_TODAY;
            const d = new Date(date + "T00:00:00");
            return (
              <div key={date} className="rounded-lg overflow-hidden" style={{ background: PAPER, border: `1px solid ${isToday ? "#3B5BA5" : PAPER_LINE}` }}>
                <div className="flex items-center justify-between px-3 py-2" style={{ background: isToday ? "#3B5BA51f" : "#FFFFFF80", borderBottom: `1px solid ${PAPER_LINE}` }}>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-[15px] font-mono font-bold" style={{ color: isToday ? "#3B5BA5" : INK }}>{d.getDate()}</span>
                    <span className="text-[11.5px]" style={{ color: isToday ? "#3B5BA5" : MUTE }}>{THAI_MONTHS_SHORT[d.getMonth()]} · วัน{THAI_WEEKDAYS[d.getDay()]}</span>
                    {isToday && <span className="text-[9.5px] px-1.5 py-0.5 rounded-full font-semibold" style={{ background: "#3B5BA5", color: PAPER }}>วันนี้</span>}
                  </div>
                  <span className="text-[10.5px]" style={{ color: MUTE }}>{items.length ? `${items.length} รายการ` : "ว่าง"}</span>
                </div>
                {items.length === 0 ? (
                  <div className="px-3 py-3 text-[12px]" style={{ color: MUTE }}>ไม่มีงานวันนี้ — รถว่างทุกคัน</div>
                ) : (
                  <div>
                    {items.map(({ ev, car, startDate, endDate, startHour, endHour, isStart, multiDay }, i) => {
                      const EIcon = EVENT_ICON[ev.type]; const locked = !!ev.bookingId || ev.type === "clean";
                      return (
                        <button key={`${car.id}-${ev.groupId}`} onClick={() => openEdit(ev)} className="w-full flex items-stretch gap-2.5 px-3 py-2.5 text-left" style={{ borderTop: i > 0 ? `1px solid ${PAPER_LINE}` : "none" }}>
                          <div className="w-1 rounded-full flex-shrink-0" style={{ background: EVENT_COLOR[ev.type] }} />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 mb-0.5">
                              <EIcon size={12} style={{ color: EVENT_COLOR[ev.type], flexShrink: 0 }} />
                              <span className="text-[12.5px] font-semibold truncate" style={{ color: INK }}>{EVENT_LABEL[ev.type]}</span>
                              {locked && <Lock size={10} color={MUTE} />}
                            </div>
                            <div className="text-[12px] font-mono truncate" style={{ color: INK }}>{car.plate} <span className="font-sans" style={{ color: MUTE }}>· {car.brand} {car.model}</span></div>
                            <div className="text-[11px] truncate" style={{ color: ev.type === "clean" ? "#2E7D8F" : MUTE }}>{ev.note}</div>
                            {ev.type === "clean" && <div className="text-[10px] mt-0.5 inline-flex items-center gap-1 px-1.5 py-0.5 rounded" style={{ background: "#2E7D8F14", color: "#2E7D8F" }}><Lock size={9} />ล็อกอัตโนมัติ · ห้ามจองทับ</div>}
                          </div>
                          <div className="text-right flex-shrink-0">
                            {multiDay ? (
                              <>
                                <div className="text-[11px] font-mono" style={{ color: isStart ? INK : MUTE }}>{isStart ? `เริ่ม ${startHour}:00` : "ต่อเนื่อง"}</div>
                                <div className="text-[9.5px]" style={{ color: MUTE }}>ถึง {formatDMY(endDate)} {endHour}:00</div>
                              </>
                            ) : (
                              <div className="text-[11px] font-mono" style={{ color: INK }}>{startHour}:00–{endHour}:00</div>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
                <button onClick={() => openCreate(cars[0] ? cars[0].id : null, date)} className="w-full py-2 text-[11.5px] font-medium flex items-center justify-center gap-1" style={{ borderTop: `1px solid ${PAPER_LINE}`, color: "#3B5BA5" }}><Plus size={12} />เพิ่มรายการวันนี้</button>
              </div>
            );
          })}
        </div>
      ) : (
      <>
      <div className="text-[11px] mb-2" style={{ color: "#C9CDD3" }}>เส้นน้ำเงิน = วันนี้ · ช่องเทา = เสาร์-อาทิตย์ · แถบยาว = จองต่อเนื่องหลายวัน · แตะช่องว่างเพื่อเพิ่มงาน · ลากแถบเพื่อย้ายวัน/คัน · 🔒 ผูกกับการจอง แก้ที่แท็บงานเช่า</div>
      <div ref={scrollRef} className="overflow-x-auto rounded-lg" style={{ background: PAPER, border: `1px solid ${PAPER_LINE}`, maxWidth: "100%", WebkitOverflowScrolling: "touch", touchAction: "pan-x" }}>
        <div style={{ width: 104 + dayCount * DAY_COL_W }}>
          <div className="flex" style={{ borderBottom: `2px solid ${PAPER_LINE}` }}>
            <div className="sticky left-0 w-[104px] flex-shrink-0 flex items-end pb-1.5 pl-2" style={{ background: PAPER, boxShadow: "2px 0 4px -2px rgba(0,0,0,0.18)" }}>
              <span className="text-[9.5px] font-medium" style={{ color: MUTE }}>รถ / สถานะว่าง</span>
            </div>
            {visibleDates.map((date) => {
              const d = new Date(date + "T00:00:00"); const isToday = date === APP_TODAY;
              const dow = d.getDay(); const isWeekend = dow === 0 || dow === 6;
              return (
                <div key={date} className="flex-shrink-0 text-center py-1.5" style={{ width: DAY_COL_W, background: isToday ? "#3B5BA514" : isWeekend ? "#00000008" : "transparent", borderLeft: isToday ? "2px solid #3B5BA5" : "none" }}>
                  <div className="text-[9.5px]" style={{ color: isToday ? "#3B5BA5" : isWeekend ? "#C1502E" : MUTE }}>{weekdayShort(date)}</div>
                  <div className="text-[13px] font-mono font-bold" style={{ color: isToday ? "#3B5BA5" : INK }}>{d.getDate()}</div>
                  <div className="text-[8.5px]" style={{ color: MUTE }}>{THAI_MONTHS_SHORT[d.getMonth()]}</div>
                </div>
              );
            })}
          </div>
          {cars.map((car, i) => <GanttRow key={car.id} car={car} visibleDates={visibleDates} eventsByDate={eventsByDate} onCellClick={openCreate} onEventClick={openEdit} onDropEvent={dropMove} zebra={i % 2 === 1} />)}
        </div>
      </div>
      </>
      )}
      {modal && (modal.initial && modal.initial.type === "clean"
        ? <CleanBlockModal initial={modal.initial} onClose={() => setModal(null)} />
        : <EventModal mode={modal.mode} initial={modal.initial} onSave={saveEvent} onDelete={deleteEvent} onClose={() => setModal(null)} />)}
    </div>
  );
}

/* ================= bookings ================= */
function ProofCheck({ label, doneLabel, urlValue, onAttach, onUnmark, readOnly, hint }) {
  const [zoomed, setZoomed] = useState(false);
  const done = !!urlValue;
  const isPdf = typeof urlValue === "string" && urlValue.startsWith("data:application/pdf");
  if (done) {
    return (
      <div className="rounded-md p-2 mb-1.5" style={{ background: "#3A7D5C0f", border: "1px solid #3A7D5C33" }}>
        <div className="flex items-center justify-between gap-2 mb-1.5">
          <div className="flex items-center gap-1.5 text-[12.5px]" style={{ color: "#3A7D5C" }}><Check size={14} />{doneLabel}</div>
          {!readOnly && <button onClick={onUnmark} className="text-[11px] flex-shrink-0" style={{ color: "#C1502E" }}>เปลี่ยนไฟล์</button>}
        </div>
        {isPdf ? (
          <div className="rounded overflow-hidden" style={{ border: `1px solid ${PAPER_LINE}`, background: "#FFFFFF" }}>
            <object data={urlValue} type="application/pdf" className="w-full" style={{ height: 140, display: "block" }}>
              <div className="w-full flex items-center justify-center gap-1.5" style={{ height: 140 }}>
                <FileText size={16} color="#C1502E" /><a href={urlValue} target="_blank" rel="noreferrer" className="text-[11px] underline" style={{ color: "#3B5BA5" }}>เปิดดู PDF</a>
              </div>
            </object>
          </div>
        ) : (
          <>
            <img src={urlValue} alt={label} className="w-full h-24 object-cover rounded cursor-zoom-in" onClick={() => setZoomed(true)} />
            {zoomed && <ImageLightbox url={urlValue} onClose={() => setZoomed(false)} />}
          </>
        )}
      </div>
    );
  }
  if (readOnly) return <div className="text-[12.5px] mb-1.5 flex items-center gap-1.5" style={{ color: MUTE }}><span style={{ width: 14, height: 14, borderRadius: 4, border: `1.5px solid ${MUTE}`, display: "inline-block" }} />{label} — ยังไม่มีหลักฐาน</div>;
  return (
    <div className="rounded-md p-2 mb-1.5" style={{ background: "#FFFFFF80", border: `1px solid ${PAPER_LINE}` }}>
      <PhotoAttach label={label} value="" onChange={(v) => v && onAttach(v)} hint={hint} />
    </div>
  );
}

function BookingForm({ booking, cars, onSave, onCancel, onDelete, onClose, readOnly, createdByName, termsText }) {
  useLockBodyScroll();
  const isNew = !booking;
  const isClosed = !!booking && (booking.status === "completed" || booking.status === "cancelled");
  const effectiveReadOnly = readOnly || isClosed;
  const [f, setF] = useState(() => booking ? { ...booking } : {
    firstName: "", lastName: "", phone: "", email: "", carId: cars[0] ? cars[0].id : null,
    startDate: APP_TODAY, startTime: "09:00", endDate: APP_TODAY, endTime: "18:00", pickupLocation: "", returnLocation: "",
    reservationDeposit: cars[0] && cars[0].reservationDeposit != null ? cars[0].reservationDeposit : 500, reservationDepositPaid: false, pickupDayPayment: null, pickupDayPaid: false,
    securityDeposit: cars[0] && cars[0].securityDeposit != null ? cars[0].securityDeposit : 1500, securityDepositCollected: false, securityDepositRefunded: false,
    contractSigned: false, idCardOrLicense: "", notes: "", status: "active",
  });
  const [showCancel, setShowCancel] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [depositRefunded, setDepositRefunded] = useState(false);
  const [msgOpen, setMsgOpen] = useState(false);
  const [confirmEmailOpen, setConfirmEmailOpen] = useState(false);
  const [showCustomRate, setShowCustomRate] = useState(false);
  const set = (k, v) => setF((p) => ({ ...p, [k]: v }));
  const car = cars.find((c) => c.id === f.carId);
  const calc = calcBookingTotal(f, car);
  const pickupDayPayment = f.pickupDayPayment != null ? f.pickupDayPayment : Math.max(0, calc.total - (f.reservationDeposit || 0));

  const inputCls = "w-full text-[13px] rounded-md px-2.5 py-2 outline-none";
  const inputStyle = { background: "#FFFFFF", border: `1px solid ${PAPER_LINE}`, color: INK };

  const submit = () => { if (!f.firstName.trim() || !f.phone.trim() || !f.carId) return; onSave({ ...f, id: f.id || `bk${bookingCounter++}`, pickupDayPayment, createdBy: f.createdBy || createdByName }); onClose(); };
  const confirmBooking = () => { if (!f.firstName.trim() || !f.phone.trim() || !f.carId) return; onSave({ ...f, status: "active", pickupDayPayment, createdBy: f.createdBy || createdByName }); setConfirmEmailOpen(true); };
  const submitCancel = () => { onCancel({ ...f, status: "cancelled", cancelReason, depositRefunded }); onClose(); };
  // Proof attachments persist immediately on attach so nothing is silently lost if the user
  // closes the modal without remembering to hit the separate "save" button. Deliberately does NOT
  // close the form — attaching a document is a mid-edit action, not "I'm done here".
  const persistPatch = (patch) => {
    const updated = { ...f, ...patch };
    setF(updated);
    onSave({ ...updated, id: updated.id || `bk${bookingCounter++}`, pickupDayPayment: updated.pickupDayPayment != null ? updated.pickupDayPayment : pickupDayPayment, createdBy: updated.createdBy || createdByName });
  };
  const canClose = !!(f.reservationSlipUrl && f.contractDocUrl && f.handoverPhotoUrl && f.returnSlipUrl);
  const confirmClose = () => {
    if (!canClose) return;
    onSave({ ...f, securityDepositRefunded: true, status: "completed", pickupDayPayment, createdBy: f.createdBy || createdByName });
    onClose();
  };
  const isPending = f.status === "pending";
  const cancelWord = isPending ? "ปฏิเสธคำขอ" : "ยกเลิกการจอง";

  return (
    <div className="fixed inset-0 z-40 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0" style={{ background: "#00000066" }} onClick={onClose} />
      <div className="relative w-full sm:max-w-sm lg:max-w-2xl rounded-t-2xl sm:rounded-2xl flex flex-col" style={{ background: PAPER, maxHeight: "88vh" }}>
        <div className="p-4 flex items-center justify-between border-b flex-shrink-0" style={{ borderColor: PAPER_LINE, background: PAPER }}>
          <div className="font-semibold text-[15px]" style={{ color: INK }}>{isNew ? "จองใหม่" : effectiveReadOnly ? "รายละเอียดการจอง" : "แก้ไขการจอง"}</div>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-black/5"><X size={18} color={INK} /></button>
        </div>
        <div className="p-4 flex-1 min-h-0 overflow-y-auto" style={{ WebkitOverflowScrolling: "touch", touchAction: "pan-y", overscrollBehavior: "contain" }}>
          {isPending && (
            <div className="rounded-md p-2.5 mb-3 text-[12px]" style={{ background: "#D69A2D1a", color: "#D69A2D", border: "1px solid #D69A2D55" }}>
              🔔 คำขอจองจากลูกค้า (ยังไม่ยืนยัน) — ตรวจสอบข้อมูล เพิ่มเงินโอนจอง/มัดจำ แล้วกด "ยืนยันการจอง" ด้านล่าง
            </div>
          )}
          {f.status === "completed" && (
            <div className="rounded-md p-2.5 mb-3 text-[12px]" style={{ background: "#3A7D5C14", color: "#3A7D5C", border: "1px solid #3A7D5C33" }}>
              ✅ ปิดงานแล้ว — คืนรถและคืนมัดจำเรียบร้อย ดูรายการนี้ได้ที่แท็บ "ประวัติ" (แก้ไขเพิ่มเติมไม่ได้แล้ว)
            </div>
          )}
          {f.status === "cancelled" && (
            <div className="rounded-md p-2.5 mb-3 text-[12px]" style={{ background: "#C1502E14", color: "#C1502E", border: "1px solid #C1502E33" }}>
              ยกเลิกแล้ว: {f.cancelReason || "-"}<br />เงินโอนจอง {f.depositRefunded ? "คืนให้ลูกค้าแล้ว" : "ริบเป็นรายได้ (แสดงในบัญชี)"}<br />ดูรายการนี้ได้ที่แท็บ "ประวัติ" (แก้ไขเพิ่มเติมไม่ได้แล้ว)
            </div>
          )}
          <div className="grid grid-cols-2 gap-2">
            <Field label="ชื่อ">{effectiveReadOnly ? <ReadText v={f.firstName} /> : <input className={inputCls} style={inputStyle} value={f.firstName} onChange={(e) => set("firstName", e.target.value)} />}</Field>
            <Field label="นามสกุล">{effectiveReadOnly ? <ReadText v={f.lastName} /> : <input className={inputCls} style={inputStyle} value={f.lastName} onChange={(e) => set("lastName", e.target.value)} />}</Field>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Field label={<span className="flex items-center gap-1"><Phone size={12} />เบอร์โทร</span>}>{effectiveReadOnly ? <ReadText v={f.phone} /> : <input className={inputCls} style={inputStyle} value={f.phone} onChange={(e) => set("phone", e.target.value)} />}</Field>
            <Field label={<span className="flex items-center gap-1"><Mail size={12} />อีเมล</span>}>{effectiveReadOnly ? <ReadText v={f.email} /> : <input className={inputCls} style={inputStyle} value={f.email} onChange={(e) => set("email", e.target.value)} />}</Field>
          </div>
          <Field label="รถที่จอง">{effectiveReadOnly ? <ReadText v={car ? `${car.plate} · ${car.brand} ${car.model}` : "-"} /> : (
            <select className={inputCls} style={inputStyle} value={f.carId || ""} onChange={(e) => { const id = Number(e.target.value); const sel = cars.find((c) => c.id === id); setF((p) => ({ ...p, carId: id, reservationDeposit: sel && sel.reservationDeposit != null ? sel.reservationDeposit : p.reservationDeposit, securityDeposit: sel && sel.securityDeposit != null ? sel.securityDeposit : p.securityDeposit })); }}>{cars.map((c) => <option key={c.id} value={c.id}>{c.plate} · {c.brand} {c.model}</option>)}</select>
          )}</Field>
          <div className="grid grid-cols-2 gap-2">
            <Field label="วันรับรถ">{effectiveReadOnly ? <ReadText v={formatDMY(f.startDate)} /> : <input type="date" className={inputCls} style={inputStyle} value={f.startDate} onChange={(e) => set("startDate", e.target.value)} />}</Field>
            <Field label="เวลารับ">{effectiveReadOnly ? <ReadText v={f.startTime} /> : <input type="time" className={inputCls} style={inputStyle} value={f.startTime} onChange={(e) => set("startTime", e.target.value)} />}</Field>
          </div>
          <Field label={<span className="flex items-center gap-1"><MapPin size={12} />สถานที่รับรถ</span>}>{effectiveReadOnly ? <ReadText v={f.pickupLocation} /> : <input className={inputCls} style={inputStyle} value={f.pickupLocation} onChange={(e) => set("pickupLocation", e.target.value)} placeholder="เช่น สนามบิน, ออฟฟิศ" />}</Field>
          <div className="grid grid-cols-2 gap-2">
            <Field label="วันคืนรถ">{effectiveReadOnly ? <ReadText v={formatDMY(f.endDate)} /> : <input type="date" className={inputCls} style={inputStyle} value={f.endDate} onChange={(e) => set("endDate", e.target.value)} />}</Field>
            <Field label="เวลาคืน">{effectiveReadOnly ? <ReadText v={f.endTime} /> : <input type="time" className={inputCls} style={inputStyle} value={f.endTime} onChange={(e) => set("endTime", e.target.value)} />}</Field>
          </div>
          <Field label={<span className="flex items-center gap-1"><MapPin size={12} />สถานที่คืนรถ</span>}>{effectiveReadOnly ? <ReadText v={f.returnLocation} /> : <input className={inputCls} style={inputStyle} value={f.returnLocation} onChange={(e) => set("returnLocation", e.target.value)} placeholder="เช่น สนามบิน, ออฟฟิศ" />}</Field>

          {car && (
            <div className="rounded-md p-3 mb-3" style={{ background: "#3B5BA514" }}>
              <div className="text-[12px] mb-1" style={{ color: "#3B5BA5" }}>
                {calc.days}วัน {calc.extraHours}ชม · {fmt(calc.dailySubtotal)}+{fmt(calc.hourSubtotal)} = <b className="text-[14px]">{fmt(calc.total)} บาท</b>
              </div>
              {calc.overridden && (
                <div className="text-[11px] mb-1.5" style={{ color: calc.discount > 0 ? "#3A7D5C" : "#C1502E" }}>
                  ราคาปกติ {fmt(calc.listTotal)} · {calc.discount > 0 ? `ลดให้ ${fmt(calc.discount)}` : `เก็บเพิ่ม ${fmt(-calc.discount)}`}
                </div>
              )}
              {!effectiveReadOnly && (
                <>
                  <button onClick={() => setShowCustomRate((v) => !v)} className="text-[11px] underline" style={{ color: "#3B5BA5" }}>
                    {showCustomRate ? "ซ่อนการตั้งราคาเฉพาะราย" : "ตั้งราคาเฉพาะรายนี้ (เช่น ลดให้ลูกค้าเช่าระยะยาว)"}
                  </button>
                  {showCustomRate && (
                    <div className="mt-2 pt-2" style={{ borderTop: "1px solid #3B5BA533" }}>
                      <div className="grid grid-cols-2 gap-2">
                        <label><div className="text-[10.5px] mb-1" style={{ color: MUTE }}>ราคา/วัน (ปกติ {fmt(car.rate)})</div>
                          <MoneyInput className={inputCls} style={inputStyle} value={f.customDailyRate != null ? f.customDailyRate : ""} onChange={(v) => set("customDailyRate", v)} placeholder={String(car.rate)} /></label>
                        <label><div className="text-[10.5px] mb-1" style={{ color: MUTE }}>ราคา/ชม.เกิน (ปกติ {fmt(car.hourlyRate)})</div>
                          <MoneyInput className={inputCls} style={inputStyle} value={f.customHourlyRate != null ? f.customHourlyRate : ""} onChange={(v) => set("customHourlyRate", v)} placeholder={String(car.hourlyRate)} /></label>
                      </div>
                      <label className="block mt-2"><div className="text-[10.5px] mb-1" style={{ color: MUTE }}>เหตุผลที่ปรับราคา (บันทึกไว้เป็นหลักฐาน)</div>
                        <input className={inputCls} style={inputStyle} value={f.rateNote || ""} onChange={(e) => set("rateNote", e.target.value)} placeholder="เช่น เช่า 10 วัน ลดให้วันละ 100" /></label>
                      {(f.customDailyRate !== "" && f.customDailyRate != null) && (
                        <button onClick={() => { set("customDailyRate", null); set("customHourlyRate", null); set("rateNote", ""); }} className="text-[11px] mt-2" style={{ color: "#C1502E" }}>ล้างราคาเฉพาะราย กลับไปใช้ราคาปกติ</button>
                      )}
                      <div className="text-[10px] mt-1.5" style={{ color: MUTE }}>* ปล่อยว่างไว้ = ใช้ราคามาตรฐานของรถคันนั้น · ราคานี้ใช้กับการจองรายนี้เท่านั้น ไม่กระทบรถคันอื่นหรือการจองอื่น</div>
                    </div>
                  )}
                </>
              )}
              {effectiveReadOnly && f.rateNote && <div className="text-[11px] mt-1" style={{ color: MUTE }}>เหตุผลปรับราคา: {f.rateNote}</div>}
            </div>
          )}
          <div className="grid grid-cols-2 gap-2">
            <Field label="เงินโอนจอง (บาท)">{effectiveReadOnly ? <ReadText v={fmt(f.reservationDeposit)} /> : <MoneyInput className={inputCls} style={inputStyle} value={f.reservationDeposit} onChange={(v) => set("reservationDeposit", v === "" ? 0 : Number(v))} />}</Field>
            <Field label="ยอดจ่ายวันรับรถ (บาท)">{effectiveReadOnly ? <ReadText v={fmt(pickupDayPayment)} /> : <MoneyInput className={inputCls} style={inputStyle} value={f.pickupDayPayment != null ? f.pickupDayPayment : pickupDayPayment} onChange={(v) => set("pickupDayPayment", v === "" ? 0 : Number(v))} />}</Field>
          </div>
          <Field label="เงินมัดจำค้ำประกัน (คืนวันส่งคืนรถ, บาท)">{effectiveReadOnly ? <ReadText v={fmt(f.securityDeposit)} /> : <MoneyInput className={inputCls} style={inputStyle} value={f.securityDeposit} onChange={(v) => set("securityDeposit", v === "" ? 0 : Number(v))} />}</Field>

          {!isNew && (
            <div className="mb-3">
              <div className="text-[11.5px] font-medium mb-1.5" style={{ color: INK }}>เอกสารประกอบ (ถ่าย/แนบรูปหรือไฟล์ PDF จากมือถือ — บันทึกทันทีที่แนบ)</div>
              <ProofCheck label="ตั๋วเดินทาง (ยืนยันตัวตนผู้จอง ถ้ามี)" doneLabel="มีตั๋วเดินทางแนบแล้ว" urlValue={f.travelTicketUrl} readOnly={effectiveReadOnly} hint="ถ่าย/แนบรูปตั๋วเครื่องบิน/รถทัวร์ที่มีชื่อลูกค้า"
                onAttach={(url) => persistPatch({ travelTicketUrl: url })}
                onUnmark={() => persistPatch({ travelTicketUrl: "" })} />
              <ProofCheck label="เงินโอนจอง" doneLabel="โอนเงินจองแล้ว" urlValue={f.reservationSlipUrl} readOnly={effectiveReadOnly} hint="ถ่าย/แนบรูปสลิปโอนเงินจอง"
                onAttach={(url) => persistPatch({ reservationSlipUrl: url, reservationDepositPaid: true })}
                onUnmark={() => persistPatch({ reservationSlipUrl: "", reservationDepositPaid: false })} />
              {f.status === "active" && (
                <>
                  <ProofCheck label="สัญญาเช่าที่เซ็นแล้ว" doneLabel="เซ็นสัญญาแล้ว" urlValue={f.contractDocUrl} readOnly={effectiveReadOnly} hint="ถ่าย/แนบรูปหรือ PDF สัญญาเช่าฉบับที่ลูกค้าเซ็นแล้ว (เก็บเป็นหลักฐานทางกฎหมาย)"
                    onAttach={(url) => persistPatch({ contractDocUrl: url, contractSigned: true })}
                    onUnmark={() => persistPatch({ contractDocUrl: "", contractSigned: false })} />
                  <ProofCheck label="ส่งมอบรถ" doneLabel="ส่งมอบรถแล้ว (จ่ายครบ + เก็บมัดจำ)" urlValue={f.handoverPhotoUrl} readOnly={effectiveReadOnly} hint="ถ่าย/แนบรูปตอนส่งมอบรถ"
                    onAttach={(url) => persistPatch({ handoverPhotoUrl: url, pickupDayPaid: true, securityDepositCollected: true })}
                    onUnmark={() => persistPatch({ handoverPhotoUrl: "", pickupDayPaid: false, securityDepositCollected: false })} />
                  <ProofCheck label="สลิปคืนมัดจำ/ปิดงาน" doneLabel="แนบสลิปคืนมัดจำแล้ว" urlValue={f.returnSlipUrl} readOnly={effectiveReadOnly} hint="ถ่าย/แนบรูปสลิปคืนมัดจำให้ลูกค้าตอนคืนรถ"
                    onAttach={(url) => persistPatch({ returnSlipUrl: url })}
                    onUnmark={() => persistPatch({ returnSlipUrl: "" })} />

                  <div className="rounded-md p-3 mt-1.5" style={{ background: canClose ? "#3A7D5C0f" : "#FFFFFF80", border: `1px solid ${canClose ? "#3A7D5C33" : PAPER_LINE}` }}>
                    <div className="text-[12px] font-semibold mb-2 flex items-center gap-1.5" style={{ color: canClose ? "#3A7D5C" : INK }}><Archive size={13} />ปิดงาน (คืนรถแล้ว)</div>
                    <div className="grid grid-cols-2 gap-2 mb-2">
                      <label><div className="text-[10.5px] mb-1" style={{ color: MUTE }}>วันคืนจริง</div>{effectiveReadOnly ? <ReadText v={formatDMY(f.actualEndDate || f.endDate)} /> : <input type="date" className={inputCls} style={inputStyle} value={f.actualEndDate || f.endDate} onChange={(e) => set("actualEndDate", e.target.value)} />}</label>
                      <label><div className="text-[10.5px] mb-1" style={{ color: MUTE }}>เวลาคืนจริง</div>{effectiveReadOnly ? <ReadText v={f.actualEndTime || f.endTime} /> : <input type="time" className={inputCls} style={inputStyle} value={f.actualEndTime || f.endTime} onChange={(e) => set("actualEndTime", e.target.value)} />}</label>
                    </div>
                    {(() => { const ac = calcActualBookingTotal(f, car); const planned = calc.total; return ac.total !== planned ? (
                      <div className="text-[11px] mb-2" style={{ color: "#C1502E" }}>คืนช้ากว่ากำหนด → ยอดจริง {ac.days}วัน{ac.extraHours ? ` ${ac.extraHours}ชม` : ""} = {fmt(ac.total)} บาท (จากเดิม {fmt(planned)})</div>
                    ) : <div className="text-[11px] mb-2" style={{ color: MUTE }}>คืนตรงเวลาหรือเร็วกว่ากำหนด — ยึดยอดตามที่จอง {fmt(planned)} บาท</div>; })()}
                    {!canClose && (
                      <div className="rounded-md p-2 mb-2 text-[11px]" style={{ background: "#D69A2D14", color: "#805B00" }}>
                        <div className="font-medium mb-0.5">ต้องแนบให้ครบก่อนปิดงานได้:</div>
                        <ul className="space-y-0.5">
                          {!f.reservationSlipUrl && <li>• สลิปโอนเงินจอง</li>}
                          {!f.contractDocUrl && <li>• สัญญาเช่าที่เซ็นแล้ว</li>}
                          {!f.handoverPhotoUrl && <li>• รูปส่งมอบรถ</li>}
                          {!f.returnSlipUrl && <li>• สลิปคืนมัดจำ/ปิดงาน</li>}
                        </ul>
                      </div>
                    )}
                    {!effectiveReadOnly && (
                      <button onClick={confirmClose} disabled={!canClose} className="w-full py-2.5 rounded-lg text-[13px] font-semibold flex items-center justify-center gap-1.5" style={{ background: canClose ? "#3A7D5C" : PAPER_LINE, color: canClose ? PAPER : MUTE }}>
                        <Check size={15} />ยืนยันปิดงาน
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          )}
          <Field label="หมายเหตุ">{effectiveReadOnly ? <ReadText v={f.notes} /> : <input className={inputCls} style={inputStyle} value={f.notes} onChange={(e) => set("notes", e.target.value)} />}</Field>

          {!effectiveReadOnly && car && (
            <button onClick={() => setMsgOpen(true)} className="w-full py-2.5 rounded-lg text-[12.5px] font-semibold flex items-center justify-center gap-1.5 mb-2" style={{ border: `1px solid #3B5BA5`, color: "#3B5BA5" }}><MessageSquare size={14} />สร้างข้อความสรุปส่งลูกค้า</button>
          )}
        </div>
        {!effectiveReadOnly && (
          <div className="p-4 pt-3 flex-shrink-0 border-t" style={{ borderColor: PAPER_LINE }}>
            {showCancel ? (
              <div className="rounded-md p-3 mb-2" style={{ background: "#C1502E0f", border: "1px solid #C1502E33" }}>
                <div className="text-[12.5px] font-medium mb-2" style={{ color: "#C1502E" }}>{cancelWord}</div>
                <input className={`${inputCls} mb-2`} style={inputStyle} placeholder="เหตุผล" value={cancelReason} onChange={(e) => setCancelReason(e.target.value)} />
                {!isPending && <label className="flex items-center gap-2 text-[12.5px] mb-2" style={{ color: INK }}><input type="checkbox" checked={depositRefunded} onChange={(e) => setDepositRefunded(e.target.checked)} />คืนเงินโอนจองให้ลูกค้า (ไม่ริบ)</label>}
                <div className="flex gap-2"><button onClick={() => setShowCancel(false)} className="flex-1 py-2 rounded-lg text-[12.5px]" style={{ border: `1px solid ${PAPER_LINE}`, color: INK }}>กลับ</button><button onClick={submitCancel} className="flex-1 py-2 rounded-lg text-[12.5px] font-semibold" style={{ background: "#C1502E", color: PAPER }}>ยืนยัน{cancelWord}</button></div>
              </div>
            ) : (
              <div className="flex gap-2">
                {!isNew && <button onClick={() => setShowCancel(true)} className="px-3 py-2.5 rounded-lg text-[12.5px]" style={{ border: `1px solid #C1502E`, color: "#C1502E" }}>{cancelWord}</button>}
                {isPending ? (
                  <button onClick={confirmBooking} className="flex-1 py-2.5 rounded-lg text-[13px] font-semibold flex items-center justify-center gap-1.5" style={{ background: "#3A7D5C", color: PAPER }}><Check size={15} />ยืนยันการจอง</button>
                ) : (
                  <button onClick={submit} className="flex-1 py-2.5 rounded-lg text-[13px] font-semibold" style={{ background: INK, color: PAPER }}>{isNew ? "บันทึกการจอง" : "บันทึกการแก้ไข"}</button>
                )}
              </div>
            )}
            {!showCancel && (
              <button onClick={onClose} className="w-full mt-2 py-2.5 rounded-lg text-[12.5px] flex items-center justify-center gap-1.5" style={{ border: `1px solid ${PAPER_LINE}`, color: MUTE }}><X size={13} />ปิดหน้าต่าง (ไม่บันทึกการแก้ไขที่ยังไม่ได้กดบันทึก)</button>
            )}
          </div>
        )}
        {effectiveReadOnly && (
          <div className="p-4 pt-3 flex-shrink-0 border-t" style={{ borderColor: PAPER_LINE }}>
            <button onClick={onClose} className="w-full py-2.5 rounded-lg text-[13px] font-semibold flex items-center justify-center gap-1.5" style={{ border: `1px solid ${PAPER_LINE}`, color: INK }}><X size={14} />ปิดหน้าต่าง</button>
          </div>
        )}
      </div>
      {msgOpen && car && <CopyableTextModal title="ข้อความสรุปการจอง" text={generateBookingMessage(f, car)} onClose={() => setMsgOpen(false)} />}
      {confirmEmailOpen && car && <CopyableTextModal title="อีเมลยืนยัน (จำลอง — คัดลอกไปส่งเองก่อน ระบบยังไม่ได้ต่ออีเมลจริง)" text={generateConfirmationEmail(f, car, termsText)} onClose={() => { setConfirmEmailOpen(false); onClose(); }} />}
    </div>
  );
}

function BookingsView({ bookings, cars, setBookings, setScheduleEvents, canEdit, sessionName, termsText, bankInfo, canEditSettings, onOpenSettings, wide }) {
  const actionable = bookings.filter((b) => b.status === "pending" || b.status === "active");
  const overdueJobs = getOverdueJobs(bookings);
  const pendingCount = actionable.filter((b) => b.status === "pending").length;
  const [filter, setFilter] = useState(pendingCount > 0 ? "pending" : "ทั้งหมด");
  const [formBooking, setFormBooking] = useState(undefined);
  const [toolMsg, setToolMsg] = useState(null);

  const filtered = actionable.filter((b) => filter === "ทั้งหมด" || b.status === filter).sort((a, b) => a.startDate.localeCompare(b.startDate));
  const statusLabel = (b) => { if (b.status === "pending") return { l: "รอยืนยัน", c: "#D69A2D" }; if (b.startDate <= APP_TODAY && APP_TODAY <= b.endDate) return { l: "กำลังเช่าอยู่", c: "#3B5BA5" }; if (b.endDate < APP_TODAY) return { l: "เลยกำหนดคืน — รอปิดงาน", c: "#C1502E" }; return { l: "จองล่วงหน้า", c: "#3A7D5C" }; };

  const saveBooking = (b) => {
    setBookings((prev) => (prev.some((x) => x.id === b.id) ? prev.map((x) => (x.id === b.id ? b : x)) : [...prev, b]));
    setScheduleEvents((prev) => [...prev.filter((e) => e.bookingId !== b.id), ...(b.status === "completed" || b.status === "cancelled" ? [] : expandBookingToEvents(b))]);
  };
  const cancelBooking = (b) => { setBookings((prev) => prev.map((x) => (x.id === b.id ? b : x))); setScheduleEvents((prev) => prev.filter((e) => e.bookingId !== b.id)); };
  const deleteBooking = (id) => { setBookings((prev) => prev.filter((x) => x.id !== id)); setScheduleEvents((prev) => prev.filter((e) => e.bookingId !== id)); setFormBooking(undefined); };

  return (
    <div className="p-4">
      {canEdit && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          <button onClick={() => setToolMsg({ title: "รายการรถว่าง + ราคา", text: generateAvailableCarsMessage(cars) })} className="text-[11.5px] px-2.5 py-1.5 rounded-full border flex items-center gap-1" style={{ borderColor: PAPER_LINE, background: PAPER, color: INK }}><MessageSquare size={12} />รถว่าง+ราคา</button>
          <button onClick={() => setToolMsg({ title: "เงื่อนไขสัญญา (สรุปย่อ)", text: termsText })} className="text-[11.5px] px-2.5 py-1.5 rounded-full border flex items-center gap-1" style={{ borderColor: PAPER_LINE, background: PAPER, color: INK }}><MessageSquare size={12} />เงื่อนไขสัญญา</button>
          <button onClick={() => setToolMsg({ title: "เลขบัญชีโอนเงิน", text: generateBankInfoMessage(bankInfo) })} className="text-[11.5px] px-2.5 py-1.5 rounded-full border flex items-center gap-1" style={{ borderColor: PAPER_LINE, background: PAPER, color: INK }}><MessageSquare size={12} />เลขบัญชี</button>
          {canEditSettings && <button onClick={onOpenSettings} className="text-[11.5px] px-2.5 py-1.5 rounded-full border flex items-center gap-1 ml-auto" style={{ borderColor: "#3B5BA5", background: PAPER, color: "#3B5BA5" }}><Settings size={12} />แก้ไขเงื่อนไข/บัญชี</button>}
        </div>
      )}
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <div className="flex gap-1.5 flex-wrap">
          {["pending", "active", "ทั้งหมด"].map((k) => (
            <button key={k} onClick={() => setFilter(k)} className="relative text-[12px] px-2.5 py-1.5 rounded-full border" style={{ borderColor: filter === k ? (k === "pending" ? "#D69A2D" : "#3B5BA5") : PAPER_LINE, background: filter === k ? (k === "pending" ? "#D69A2D" : "#3B5BA5") : "transparent", color: filter === k ? PAPER : "#C9CDD3" }}>
              {k === "pending" ? "รอยืนยัน" : k === "active" ? "กำลังใช้งาน" : "ทั้งหมด"}
              {k === "pending" && pendingCount > 0 && <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full text-[9px] font-bold flex items-center justify-center" style={{ background: "#C1502E", color: PAPER }}>{pendingCount}</span>}
            </button>
          ))}
        </div>
        {canEdit && <button onClick={() => setFormBooking(null)} className="flex items-center gap-1 text-[12px] font-semibold px-2.5 py-1.5 rounded-full" style={{ background: INK, color: PAPER }}><Plus size={13} />จองใหม่</button>}
      </div>
      {overdueJobs.length > 0 && (
        <div className="rounded-lg p-3 mb-3" style={{ background: "#C1502E14", border: "1px solid #C1502E55" }}>
          <div className="text-[12.5px] font-semibold mb-2 flex items-center gap-1.5" style={{ color: "#C1502E" }}>
            ⚠️ มี {overdueJobs.length} งานเลยกำหนดคืนแล้วแต่ยังไม่ได้ปิด
          </div>
          <div className="space-y-2">
            {overdueJobs.map(({ booking: b, daysOverdue, missing }) => {
              const c = cars.find((x) => x.id === b.carId);
              return (
                <button key={b.id} onClick={() => setFormBooking(b)} className="w-full text-left rounded-md p-2.5" style={{ background: "#FFFFFF", border: `1px solid ${PAPER_LINE}` }}>
                  <div className="text-[12px] font-medium" style={{ color: INK }}>{b.firstName} {b.lastName} · {c ? c.plate : "-"}</div>
                  <div className="text-[11px] mb-1" style={{ color: "#C1502E" }}>ครบกำหนดคืน {formatDMY(b.endDate)} — เลยมาแล้ว {daysOverdue} วัน</div>
                  {missing.length > 0 ? (
                    <div className="text-[10.5px]" style={{ color: MUTE }}>ยังขาด: {missing.join(", ")}</div>
                  ) : (
                    <div className="text-[10.5px]" style={{ color: "#3A7D5C" }}>เอกสารครบแล้ว — แตะเพื่อกดปิดงานได้เลย</div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
      <div className="text-[10.5px] mb-3 flex items-center gap-1" style={{ color: "#C9CDD3" }}><Archive size={11} />งานที่ปิดจบแล้ว (คืนรถแล้ว/ยกเลิก) ดูได้ที่แท็บ "ประวัติ"</div>
      {filter === "pending" && pendingCount === 0 && <div className="text-center text-[13px] py-6 mb-2" style={{ color: MUTE }}>ไม่มีคำขอจองใหม่รอตรวจสอบ</div>}
      {wide ? (
        <div className="rounded-lg overflow-hidden" style={{ background: PAPER, border: `1px solid ${PAPER_LINE}` }}>
          <table className="w-full" style={{ borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#FFFFFF80", borderBottom: `2px solid ${PAPER_LINE}` }}>
                {["ลูกค้า", "เบอร์โทร", "รถ", "รับรถ", "คืนรถ", "สถานะ", "เงิน/เอกสาร"].map((h) => (
                  <th key={h} className="text-left text-[11.5px] font-semibold px-3 py-2.5" style={{ color: INK }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((b, i) => {
                const car = cars.find((c) => c.id === b.carId);
                const s = statusLabel(b);
                return (
                  <tr key={b.id} onClick={() => setFormBooking(b)} className="cursor-pointer hover:bg-black/5"
                    style={{ borderBottom: i < filtered.length - 1 ? `1px solid ${PAPER_LINE}` : "none" }}>
                    <td className="px-3 py-2.5 text-[12.5px] font-medium" style={{ color: INK }}>{b.firstName} {b.lastName}</td>
                    <td className="px-3 py-2.5 text-[12px] font-mono" style={{ color: MUTE }}>{b.phone}</td>
                    <td className="px-3 py-2.5 text-[12px]" style={{ color: INK }}>
                      <div className="font-mono font-semibold">{car ? car.plate : "-"}</div>
                      <div className="text-[10.5px]" style={{ color: MUTE }}>{car ? `${car.brand} ${car.model}` : ""}</div>
                    </td>
                    <td className="px-3 py-2.5 text-[12px]" style={{ color: INK }}>{formatDMY(b.startDate)}<div className="text-[10.5px] font-mono" style={{ color: MUTE }}>{b.startTime}</div></td>
                    <td className="px-3 py-2.5 text-[12px]" style={{ color: INK }}>{formatDMY(b.endDate)}<div className="text-[10.5px] font-mono" style={{ color: MUTE }}>{b.endTime}</div></td>
                    <td className="px-3 py-2.5"><span className="text-[10.5px] font-semibold px-2 py-1 rounded-full whitespace-nowrap" style={{ color: s.c, background: `${s.c}1a` }}>{s.l}</span></td>
                    <td className="px-3 py-2.5">
                      <div className="flex gap-1 flex-wrap">
                        <span className="text-[10px] px-1.5 py-0.5 rounded border whitespace-nowrap" style={{ borderColor: PAPER_LINE, color: b.reservationDepositPaid ? "#3A7D5C" : MUTE }}>มัดจำ{b.reservationDepositPaid ? "✓" : "✗"}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded border whitespace-nowrap" style={{ borderColor: PAPER_LINE, color: b.contractSigned ? "#3A7D5C" : MUTE }}>สัญญา{b.contractSigned ? "✓" : "✗"}</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filtered.length === 0 && <div className="text-center text-[13px] py-10" style={{ color: MUTE }}>ไม่มีรายการ</div>}
        </div>
      ) : (
      <div className="space-y-2">
        {filtered.map((b) => {
          const car = cars.find((c) => c.id === b.carId);
          const s = statusLabel(b);
          return (
            <button key={b.id} onClick={() => setFormBooking(b)} className="w-full text-left rounded-lg p-3" style={{ background: PAPER, border: `1px solid ${PAPER_LINE}` }}>
              <div className="flex items-center justify-between mb-1">
                <div className="text-[13px] font-semibold" style={{ color: INK }}>{b.firstName} {b.lastName}</div>
                <span className="text-[10.5px] font-semibold px-1.5 py-0.5 rounded-full" style={{ color: s.c, background: `${s.c}1a` }}>{s.l}</span>
              </div>
              <div className="text-[11.5px] mb-1" style={{ color: MUTE }}>{car ? `${car.plate} · ${car.brand} ${car.model}` : "-"} · {formatDMY(b.startDate)}–{formatDMY(b.endDate)}</div>
              <div className="flex gap-1.5 flex-wrap">
                <span className="text-[10px] px-1.5 py-0.5 rounded border" style={{ borderColor: PAPER_LINE, color: b.reservationDepositPaid ? "#3A7D5C" : MUTE }}>มัดจำ{b.reservationDepositPaid ? "แล้ว" : "ยัง"} {fmt(b.reservationDeposit)}</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded border" style={{ borderColor: PAPER_LINE, color: b.contractSigned ? "#3A7D5C" : MUTE }}>สัญญา{b.contractSigned ? "เซ็นแล้ว" : "ยังไม่เซ็น"}</span>
              </div>
            </button>
          );
        })}
        {filtered.length === 0 && <div className="text-center text-[13px] py-10" style={{ color: MUTE }}>ไม่มีรายการ</div>}
      </div>
      )}
      {formBooking !== undefined && <BookingForm booking={formBooking} cars={cars} onSave={saveBooking} onCancel={cancelBooking} onDelete={deleteBooking} onClose={() => setFormBooking(undefined)} readOnly={!canEdit} createdByName={sessionName} termsText={termsText} wide={wide} />}
      {toolMsg && <CopyableTextModal title={toolMsg.title} text={toolMsg.text} onClose={() => setToolMsg(null)} />}
    </div>
  );
}

/* ================= archive (closed jobs) ================= */
function ArchiveDetailModal({ booking, car, onClose }) {
  useLockBodyScroll();
  const [zoomUrl, setZoomUrl] = useState(null);
  const evidences = [
    { label: "ตั๋วเดินทาง", url: booking.travelTicketUrl },
    { label: "สลิปโอนเงินจอง", url: booking.reservationSlipUrl },
    { label: "รูปส่งมอบรถ", url: booking.handoverPhotoUrl },
    { label: "สัญญาเช่าที่เซ็นแล้ว", url: booking.contractDocUrl },
    { label: "สลิปคืนมัดจำ/ปิดงาน", url: booking.returnSlipUrl },
  ];
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0" style={{ background: "#00000066" }} onClick={onClose} />
      <div className="relative w-full sm:max-w-sm lg:max-w-2xl rounded-t-2xl sm:rounded-2xl flex flex-col" style={{ background: PAPER, maxHeight: "88vh", minHeight: 0 }}>
        <div className="p-4 flex items-center justify-between border-b flex-shrink-0" style={{ borderColor: PAPER_LINE, background: PAPER }}>
          <div className="font-semibold text-[15px]" style={{ color: INK }}>{booking.firstName} {booking.lastName}</div>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-black/5"><X size={18} color={INK} /></button>
        </div>
        <div className="p-4 space-y-3 flex-1 min-h-0 overflow-y-auto" style={{ WebkitOverflowScrolling: "touch", touchAction: "pan-y", overscrollBehavior: "contain" }}>
          <span className="text-[10.5px] font-semibold px-2 py-1 rounded-full inline-block" style={{ color: booking.status === "completed" ? "#3A7D5C" : "#C1502E", background: booking.status === "completed" ? "#3A7D5C1a" : "#C1502E1a" }}>{booking.status === "completed" ? "ปิดงานปกติ" : "ยกเลิก"}</span>
          <div className="rounded-md p-3 text-[12.5px] space-y-1.5" style={{ background: "#FFFFFF80", border: `1px solid ${PAPER_LINE}` }}>
            <div className="flex items-center gap-1.5" style={{ color: INK }}><Phone size={12} />{booking.phone}</div>
            {booking.email && <div className="flex items-center gap-1.5" style={{ color: INK }}><Mail size={12} />{booking.email}</div>}
            <div style={{ color: INK }}>{car ? `${car.plate} · ${car.brand} ${car.model} ${car.ownerType === "partner" ? `(พาร์ทเนอร์: ${car.partnerName})` : "(รถเพจ)"}` : "-"}</div>
            <div style={{ color: INK }}>{formatDMY(booking.startDate)} {booking.startTime} {booking.pickupLocation} → {formatDMY(booking.endDate)} {booking.endTime} {booking.returnLocation}</div>
            {booking.actualEndDate && (booking.actualEndDate !== booking.endDate || booking.actualEndTime !== booking.endTime) && <div style={{ color: "#C1502E" }}>คืนจริง: {formatDMY(booking.actualEndDate)} {booking.actualEndTime}</div>}
          </div>
          <div className="rounded-md p-3 text-[12.5px] space-y-1" style={{ background: "#FFFFFF80", border: `1px solid ${PAPER_LINE}` }}>
            <div className="flex justify-between" style={{ color: MUTE }}><span>เงินโอนจอง</span><span className="font-mono" style={{ color: INK }}>{fmt(booking.reservationDeposit)} {booking.reservationDepositPaid ? "✓" : ""}</span></div>
            <div className="flex justify-between" style={{ color: MUTE }}><span>ยอดจ่ายวันรับรถ</span><span className="font-mono" style={{ color: INK }}>{fmt(booking.pickupDayPayment)} {booking.pickupDayPaid ? "✓" : ""}</span></div>
            <div className="flex justify-between" style={{ color: MUTE }}><span>มัดจำค้ำประกัน</span><span className="font-mono" style={{ color: INK }}>{fmt(booking.securityDeposit)} {booking.securityDepositRefunded ? "(คืนแล้ว ✓)" : booking.securityDepositCollected ? "(เก็บแล้ว ยังไม่คืน)" : ""}</span></div>
          </div>
          {booking.status === "cancelled" && <div className="rounded-md p-3 text-[12px]" style={{ background: "#C1502E0f", color: "#C1502E" }}>เหตุผลยกเลิก: {booking.cancelReason || "-"}<br />เงินโอนจอง: {booking.depositRefunded ? "คืนให้ลูกค้าแล้ว" : "ริบเป็นรายได้บริษัท"}</div>}
          {booking.notes && <div className="text-[12px]" style={{ color: MUTE }}>หมายเหตุ: {booking.notes}</div>}
          <div>
            <div className="text-[12px] font-semibold mb-1.5" style={{ color: INK }}>หลักฐานทั้งหมด</div>
            <div className="grid grid-cols-2 gap-2">
              {evidences.map((e) => {
                const isPdf = typeof e.url === "string" && e.url.startsWith("data:application/pdf");
                return (
                  <div key={e.label} className="rounded-md overflow-hidden" style={{ border: `1px solid ${PAPER_LINE}` }}>
                    {e.url ? (
                      isPdf ? (
                        <a href={e.url} target="_blank" rel="noreferrer" className="w-full h-20 flex flex-col items-center justify-center gap-1" style={{ background: "#FFFFFF80" }}>
                          <FileText size={18} color="#C1502E" /><span className="text-[9.5px] underline" style={{ color: "#3B5BA5" }}>เปิดดู PDF</span>
                        </a>
                      ) : (
                        <img src={e.url} alt={e.label} className="w-full h-20 object-cover cursor-zoom-in" onClick={() => setZoomUrl(e.url)} />
                      )
                    ) : (
                      <div className="w-full h-20 flex items-center justify-center" style={{ background: "#FFFFFF80", color: MUTE }}><FileText size={16} /></div>
                    )}
                    <div className="text-[10px] text-center py-1" style={{ color: MUTE }}>{e.label}{!e.url && " — ไม่มี"}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        <div className="p-4 pt-3 flex-shrink-0 border-t" style={{ borderColor: PAPER_LINE }}>
          <button onClick={onClose} className="w-full py-2.5 rounded-lg text-[13px] font-semibold flex items-center justify-center gap-1.5" style={{ border: `1px solid ${PAPER_LINE}`, color: INK }}><X size={14} />ปิดหน้าต่าง</button>
        </div>
      </div>
      {zoomUrl && <ImageLightbox url={zoomUrl} onClose={() => setZoomUrl(null)} />}
    </div>
  );
}
function ArchiveView({ bookings, cars, wide }) {
  const closed = bookings.filter((b) => b.status === "completed" || b.status === "cancelled");
  const years = [...new Set(closed.map((b) => b.startDate.slice(0, 4)))].sort().reverse();
  const [yearF, setYearF] = useState("ทั้งหมด");
  const [monthF, setMonthF] = useState("ทั้งหมด");
  const [statusF, setStatusF] = useState("ทั้งหมด");
  const [ownerF, setOwnerF] = useState("ทั้งหมด");
  const [catF, setCatF] = useState("ทั้งหมด");
  const [detail, setDetail] = useState(null);

  const filtered = closed.filter((b) => {
    const car = cars.find((c) => c.id === b.carId);
    if (yearF !== "ทั้งหมด" && b.startDate.slice(0, 4) !== yearF) return false;
    if (monthF !== "ทั้งหมด" && b.startDate.slice(5, 7) !== monthF) return false;
    if (statusF !== "ทั้งหมด" && b.status !== statusF) return false;
    if (ownerF !== "ทั้งหมด" && car && (ownerF === "page" ? car.ownerType === "partner" : car.ownerType !== "partner")) return false;
    if (catF !== "ทั้งหมด" && (!car || car.category !== catF)) return false;
    return true;
  }).sort((a, b) => b.startDate.localeCompare(a.startDate));

  const chipCls = (active) => "text-[11.5px] px-2.5 py-1 rounded-full border";
  const chipStyle = (active, color = "#3B5BA5") => ({ borderColor: active ? color : PAPER_LINE, background: active ? color : "transparent", color: active ? PAPER : "#C9CDD3" });
  const exportRaw = () => downloadJSON({ exportedAt: new Date().toISOString(), archivedBookings: filtered }, `fleetdesk-archive-${todayStr()}.json`);

  return (
    <div className="p-4">
      <div className="text-[13px] font-semibold mb-3" style={{ color: INK }}>แฟ้มงานที่ปิดแล้ว ({filtered.length} รายการ จากทั้งหมด {closed.length})</div>
      {(() => {
        const st = computeOutcomeStats(bookings);
        if (st.closedTotal === 0) return null;
        return (
          <div className="rounded-lg p-3 mb-3" style={{ background: PAPER, border: `1px solid ${PAPER_LINE}` }}>
            <div className="text-[12px] font-semibold mb-2" style={{ color: INK }}>สัดส่วนผลของงาน (จากงานที่ปิดแล้ว {st.closedTotal} งาน)</div>
            <div className="flex h-5 rounded-md overflow-hidden mb-2">
              {st.completed > 0 && <div className="flex items-center justify-center" style={{ width: `${st.completedPct}%`, background: "#3A7D5C" }}><span className="text-[9.5px] font-semibold" style={{ color: "#fff" }}>{st.completedPct}%</span></div>}
              {st.cancelled > 0 && <div className="flex items-center justify-center" style={{ width: `${st.cancelledPct}%`, background: "#C1502E" }}><span className="text-[9.5px] font-semibold" style={{ color: "#fff" }}>{st.cancelledPct}%</span></div>}
            </div>
            <div className={`grid gap-2 ${wide ? "grid-cols-4" : "grid-cols-2"}`}>
              <div><div className="text-[10.5px]" style={{ color: MUTE }}>ปิดงานสำเร็จ</div><div className="font-mono font-bold text-[14px]" style={{ color: "#3A7D5C" }}>{st.completed} <span className="text-[11px] font-sans">({st.completedPct}%)</span></div></div>
              <div><div className="text-[10.5px]" style={{ color: MUTE }}>ยกเลิก</div><div className="font-mono font-bold text-[14px]" style={{ color: "#C1502E" }}>{st.cancelled} <span className="text-[11px] font-sans">({st.cancelledPct}%)</span></div></div>
              <div><div className="text-[10.5px]" style={{ color: MUTE }}>กำลังดำเนินการ</div><div className="font-mono font-bold text-[14px]" style={{ color: "#3B5BA5" }}>{st.active}</div></div>
              <div><div className="text-[10.5px]" style={{ color: MUTE }}>เลยกำหนด ยังไม่ปิด</div><div className="font-mono font-bold text-[14px]" style={{ color: st.overdueOpen > 0 ? "#C1502E" : MUTE }}>{st.overdueOpen}</div></div>
            </div>
            {st.cancelReasons.length > 0 && (
              <div className="mt-2 pt-2" style={{ borderTop: `1px solid ${PAPER_LINE}` }}>
                <div className="text-[11px] font-medium mb-1" style={{ color: INK }}>สาเหตุการยกเลิกที่พบ</div>
                {st.cancelReasons.map(([r, nn]) => (
                  <div key={r} className="flex justify-between text-[11px]"><span style={{ color: MUTE }}>{r}</span><span className="font-mono" style={{ color: INK }}>{nn} ครั้ง</span></div>
                ))}
              </div>
            )}
          </div>
        );
      })()}
      <div className="grid grid-cols-2 gap-2 mb-2">
        <select className="text-[12px] rounded-md px-2 py-1.5 outline-none" style={{ background: PAPER, border: `1px solid ${PAPER_LINE}`, color: INK }} value={yearF} onChange={(e) => setYearF(e.target.value)}>
          <option>ทั้งหมด</option>{years.map((y) => <option key={y} value={y}>ปี {Number(y) + 543}</option>)}
        </select>
        <select className="text-[12px] rounded-md px-2 py-1.5 outline-none" style={{ background: PAPER, border: `1px solid ${PAPER_LINE}`, color: INK }} value={monthF} onChange={(e) => setMonthF(e.target.value)}>
          <option>ทั้งหมด</option>{THAI_MONTHS_SHORT.map((m, i) => <option key={i} value={String(i + 1).padStart(2, "0")}>{m}</option>)}
        </select>
      </div>
      <div className="flex flex-wrap gap-1.5 mb-2">
        {["ทั้งหมด", "completed", "cancelled"].map((s) => (<button key={s} onClick={() => setStatusF(s)} className={chipCls()} style={chipStyle(statusF === s, s === "cancelled" ? "#C1502E" : "#3A7D5C")}>{s === "ทั้งหมด" ? "ทั้งหมด" : s === "completed" ? "ปิดงานปกติ" : "ยกเลิก"}</button>))}
      </div>
      <div className="flex flex-wrap gap-1.5 mb-2">
        {[["ทั้งหมด", "เจ้าของรถ: ทั้งหมด"], ["page", "รถเพจ"], ["partner", "พาร์ทเนอร์"]].map(([k, l]) => (<button key={k} onClick={() => setOwnerF(k)} className={chipCls()} style={chipStyle(ownerF === k)}>{l}</button>))}
      </div>
      <div className="flex flex-wrap gap-1.5 mb-3">
        <button onClick={() => setCatF("ทั้งหมด")} className={chipCls()} style={chipStyle(catF === "ทั้งหมด")}>ประเภท: ทั้งหมด</button>
        {CATEGORIES.map((c) => (<button key={c} onClick={() => setCatF(c)} className={chipCls()} style={chipStyle(catF === c)}>{c}</button>))}
      </div>
      <button onClick={exportRaw} disabled={filtered.length === 0} className="w-full mb-4 py-2.5 rounded-lg text-[12.5px] font-semibold flex items-center justify-center gap-1.5" style={{ background: filtered.length === 0 ? PAPER_LINE : INK, color: filtered.length === 0 ? MUTE : PAPER }}><Download size={14} />ดาวน์โหลดข้อมูลดิบ (JSON) — {filtered.length} รายการที่กรองไว้</button>
      {wide ? (
        <div className="rounded-lg overflow-hidden" style={{ background: PAPER, border: `1px solid ${PAPER_LINE}` }}>
          <table className="w-full" style={{ borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#FFFFFF80", borderBottom: `2px solid ${PAPER_LINE}` }}>
                {["ลูกค้า", "เบอร์โทร", "รถ", "เจ้าของรถ", "ช่วงเวลาเช่า", "สถานะ", "หลักฐาน"].map((h) => (
                  <th key={h} className="text-left text-[11.5px] font-semibold px-3 py-2.5" style={{ color: INK }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((b, i) => {
                const car = cars.find((c) => c.id === b.carId);
                const docCount = [b.travelTicketUrl, b.reservationSlipUrl, b.handoverPhotoUrl, b.contractDocUrl, b.returnSlipUrl].filter(Boolean).length;
                return (
                  <tr key={b.id} onClick={() => setDetail(b)} className="cursor-pointer hover:bg-black/5" style={{ borderBottom: i < filtered.length - 1 ? `1px solid ${PAPER_LINE}` : "none" }}>
                    <td className="px-3 py-2.5 text-[12.5px] font-medium" style={{ color: INK }}>{b.firstName} {b.lastName}</td>
                    <td className="px-3 py-2.5 text-[12px] font-mono" style={{ color: MUTE }}>{b.phone}</td>
                    <td className="px-3 py-2.5 text-[12px]" style={{ color: INK }}>
                      <div className="font-mono font-semibold">{car ? car.plate : "-"}</div>
                      <div className="text-[10.5px]" style={{ color: MUTE }}>{car ? `${car.brand} ${car.model}` : ""}</div>
                    </td>
                    <td className="px-3 py-2.5 text-[11.5px]" style={{ color: MUTE }}>{car ? (car.ownerType === "partner" ? car.partnerName : "รถเพจ") : "-"}</td>
                    <td className="px-3 py-2.5 text-[12px]" style={{ color: INK }}>{formatDMY(b.startDate)}<div className="text-[10.5px]" style={{ color: MUTE }}>ถึง {formatDMY(b.endDate)}</div></td>
                    <td className="px-3 py-2.5"><span className="text-[10.5px] font-semibold px-2 py-1 rounded-full whitespace-nowrap" style={{ color: b.status === "completed" ? "#3A7D5C" : "#C1502E", background: b.status === "completed" ? "#3A7D5C1a" : "#C1502E1a" }}>{b.status === "completed" ? "ปิดงานปกติ" : "ยกเลิก"}</span></td>
                    <td className="px-3 py-2.5 text-[11.5px] font-mono" style={{ color: docCount >= 4 ? "#3A7D5C" : MUTE }}>{docCount}/5</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filtered.length === 0 && <div className="text-center text-[13px] py-10" style={{ color: MUTE }}>{closed.length === 0 ? "ยังไม่มีงานที่ปิดจบ" : "ไม่พบรายการตามเงื่อนไขที่เลือก"}</div>}
        </div>
      ) : (
      <div className="space-y-2">
        {filtered.map((b) => {
          const car = cars.find((c) => c.id === b.carId);
          return (
            <button key={b.id} onClick={() => setDetail(b)} className="w-full text-left rounded-lg p-3" style={{ background: PAPER, border: `1px solid ${PAPER_LINE}` }}>
              <div className="flex items-center justify-between mb-1">
                <div className="text-[13px] font-semibold" style={{ color: INK }}>{b.firstName} {b.lastName}</div>
                <span className="text-[10.5px] font-semibold px-1.5 py-0.5 rounded-full" style={{ color: b.status === "completed" ? "#3A7D5C" : "#C1502E", background: b.status === "completed" ? "#3A7D5C1a" : "#C1502E1a" }}>{b.status === "completed" ? "ปิดงานปกติ" : "ยกเลิก"}</span>
              </div>
              <div className="text-[11.5px]" style={{ color: MUTE }}>{car ? `${car.plate} · ${car.brand} ${car.model}` : "-"} · {formatDMY(b.startDate)}–{formatDMY(b.endDate)}</div>
            </button>
          );
        })}
        {filtered.length === 0 && <div className="text-center text-[13px] py-10" style={{ color: MUTE }}>{closed.length === 0 ? "ยังไม่มีงานที่ปิดจบ" : "ไม่พบรายการตามเงื่อนไขที่เลือก"}</div>}
      </div>
      )}
      {detail && <ArchiveDetailModal booking={detail} car={cars.find((c) => c.id === detail.carId)} onClose={() => setDetail(null)} />}
    </div>
  );
}

/* ================= finance panels ================= */
function OverviewPanel({ cars, onSelect, setCars, scheduleEvents }) {
  const pageCars = cars.filter((c) => c.ownerType !== "partner");
  const totals = pageCars.reduce((acc, c) => { const exp = Object.values(c.expense).reduce((a, b) => a + b, 0) + (c.gpsMonthlyFee || 0); acc.income += c.income; acc.expense += exp; acc.util += computeUtilization(c, scheduleEvents); return acc; }, { income: 0, expense: 0, util: 0 });
  const avgUtil = pageCars.length ? Math.round(totals.util / pageCars.length) : 0;
  const profit = totals.income - totals.expense;
  const financed = cars.filter((c) => c.loan);
  const bumpDays = (carId, delta) => setCars((prev) => prev.map((c) => c.id === carId ? { ...c, loan: { ...c.loan, daysRentedThisMonth: Math.max(0, c.loan.daysRentedThisMonth + delta) } } : c));
  return (
    <div>
      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="rounded-lg p-3" style={{ background: PAPER, border: `1px solid ${PAPER_LINE}` }}><div className="text-[11px] flex items-center gap-1" style={{ color: MUTE }}><TrendingUp size={12} />รายรับรถเพจ</div><div className="font-mono font-bold text-[15px]" style={{ color: "#3A7D5C" }}>{fmt(totals.income)}</div></div>
        <div className="rounded-lg p-3" style={{ background: PAPER, border: `1px solid ${PAPER_LINE}` }}><div className="text-[11px] flex items-center gap-1" style={{ color: MUTE }}><TrendingDown size={12} />รายจ่ายรถเพจ</div><div className="font-mono font-bold text-[15px]" style={{ color: "#C1502E" }}>{fmt(totals.expense)}</div></div>
        <div className="rounded-lg p-3" style={{ background: PAPER, border: `1px solid ${PAPER_LINE}` }}><div className="text-[11px] flex items-center gap-1" style={{ color: MUTE }}><Gauge size={12} />ใช้งานเฉลี่ย</div><div className="font-mono font-bold text-[15px]" style={{ color: INK }}>{avgUtil}%</div></div>
      </div>
      <div className="text-[10.5px] mb-3" style={{ color: "#C9CDD3" }}>* % ใช้งาน = จำนวนวันที่รถมีการจอง (type "booked") หารด้วยจำนวนวันที่ผ่านมาแล้วในเดือนนี้ (ไม่ใช่ตัวเลขสมมติ คำนวณจากตารางคิวงานจริง)</div>
      <div className="text-[12px] mb-4" style={{ color: "#C9CDD3" }}>กำไรดำเนินงานรถเพจเดือนนี้: <span className="font-mono font-semibold" style={{ color: profit >= 0 ? "#7DBF9E" : "#E38468" }}>{fmt(profit)} บาท</span></div>
      <div className="text-[13px] font-semibold mb-2" style={{ color: INK }}>รายได้ - รายจ่าย (รถเพจ)</div>
      <div className="space-y-2 mb-6">
        {pageCars.map((c) => { const exp = Object.values(c.expense).reduce((a, b) => a + b, 0) + (c.gpsMonthlyFee || 0); const p = c.income - exp; const s = STATUS[c.status]; const util = computeUtilization(c, scheduleEvents); return (
          <button key={c.id} onClick={() => onSelect(c)} className="w-full flex items-center gap-3 rounded-lg p-3 text-left" style={{ background: PAPER, border: `1px solid ${PAPER_LINE}` }}>
            <div className="w-1.5 self-stretch rounded-full" style={{ background: s.color }} />
            <div className="flex-1"><div className="text-[13px] font-mono font-semibold" style={{ color: INK }}>{c.plate} <span className="font-sans font-normal" style={{ color: MUTE }}>· {c.brand} {c.model}</span></div><div className="text-[11px]" style={{ color: MUTE }}>รับ {fmt(c.income)} · จ่าย {fmt(exp)} · ใช้งาน {util}%</div></div>
            <div className="font-mono font-semibold text-[13px]" style={{ color: p >= 0 ? "#3A7D5C" : "#C1502E" }}>{p >= 0 ? "+" : ""}{fmt(p)}</div>
          </button>
        ); })}
      </div>
      <div className="text-[13px] font-semibold mb-2 flex items-center gap-1.5" style={{ color: INK }}><PiggyBank size={15} />ค่าผ่อนรถ</div>
      {financed.length === 0 ? (<div className="text-[13px] rounded-lg p-3" style={{ color: MUTE, background: PAPER, border: `1px solid ${PAPER_LINE}` }}>ไม่มีรถที่ติดผ่อนอยู่ในกอง</div>) : (
        <div className="space-y-2">{financed.map((c) => (
          <div key={c.id} className="rounded-lg p-3" style={{ background: PAPER, border: `1px solid ${PAPER_LINE}` }}>
            <div className="flex items-center justify-between mb-2"><div className="text-[13px] font-mono font-semibold" style={{ color: INK }}>{c.plate} <span className="font-sans font-normal" style={{ color: MUTE }}>· {c.brand} {c.model}</span></div><div className="flex items-center gap-1"><button onClick={() => bumpDays(c.id, -1)} className="w-6 h-6 rounded-full text-[13px] font-bold" style={{ border: `1px solid ${PAPER_LINE}`, color: INK }}>-</button><button onClick={() => bumpDays(c.id, 1)} className="w-6 h-6 rounded-full text-[13px] font-bold" style={{ background: INK, color: PAPER }}>+</button></div></div>
            <LoanCard car={c} />
          </div>
        ))}</div>
      )}
    </div>
  );
}
function PnlLine({ label, value, bold, sub }) { return (<div className={`flex justify-between ${bold ? "text-[13.5px] font-semibold" : "text-[12.5px]"}`} style={{ color: INK, padding: bold ? "6px 0" : "3px 0" }}><span className={sub ? "pl-3" : ""} style={sub ? { color: MUTE } : {}}>{label}</span><span className="font-mono" style={{ color: value < 0 ? "#C1502E" : INK }}>{value < 0 ? "-" : ""}{fmt(Math.abs(value))}</span></div>); }
function StaffEditor({ staff, setOverhead }) {
  const update = (id, k, v) => setOverhead((p) => ({ ...p, staff: p.staff.map((s) => s.id === id ? { ...s, [k]: v } : s) }));
  const remove = (id) => setOverhead((p) => ({ ...p, staff: p.staff.filter((s) => s.id !== id) }));
  const add = (isOwner) => setOverhead((p) => ({ ...p, staff: [...p.staff, { id: staffCounter++, name: isOwner ? "เจ้าของ/หุ้นส่วนใหม่" : "พนักงานใหม่", position: "", salary: 0, isOwner }] }));
  const total = staff.reduce((s, p) => s + p.salary, 0);
  const inputCls = "w-full text-[12.5px] rounded-md px-2 py-1.5 outline-none"; const inputStyle = { background: "#FFFFFF", border: `1px solid ${PAPER_LINE}`, color: INK };
  return (
    <div className="rounded-lg p-3 mb-3" style={{ background: PAPER, border: `1px solid ${PAPER_LINE}` }}>
      <div className="flex items-center justify-between mb-2"><div className="text-[12px] font-semibold" style={{ color: INK }}>เงินเดือน แยกรายคน</div><div className="text-[11px] font-mono" style={{ color: MUTE }}>รวม {fmt(total)}/เดือน</div></div>
      <div className="space-y-2 mb-2">{staff.map((p) => (
        <div key={p.id} className="rounded-md p-2" style={{ background: p.isOwner ? "#D69A2D14" : "#FFFFFF80", border: `1px solid ${p.isOwner ? "#D69A2D55" : PAPER_LINE}` }}>
          <div className="grid grid-cols-2 gap-1.5 mb-1.5"><input className={inputCls} style={inputStyle} value={p.name} onChange={(e) => update(p.id, "name", e.target.value)} placeholder="ชื่อ" /><input className={inputCls} style={inputStyle} value={p.position} onChange={(e) => update(p.id, "position", e.target.value)} placeholder="ตำแหน่ง" /></div>
          <div className="flex items-center gap-1.5"><MoneyInput className={inputCls} style={inputStyle} value={p.salary} onChange={(v) => update(p.id, "salary", v === "" ? 0 : Number(v))} placeholder="เงินเดือน" /><label className="flex items-center gap-1 text-[11px] flex-shrink-0" style={{ color: p.isOwner ? "#D69A2D" : MUTE }}><input type="checkbox" checked={p.isOwner} onChange={(e) => update(p.id, "isOwner", e.target.checked)} />เจ้าของ</label><button onClick={() => remove(p.id)} className="p-1 rounded flex-shrink-0" style={{ color: "#C1502E" }}><Trash2 size={13} /></button></div>
        </div>
      ))}</div>
      <div className="flex gap-2"><button onClick={() => add(false)} className="flex-1 flex items-center justify-center gap-1 text-[11.5px] font-medium py-1.5 rounded-md" style={{ border: `1px solid ${PAPER_LINE}`, color: INK }}><Plus size={12} />เพิ่มพนักงาน</button><button onClick={() => add(true)} className="flex-1 flex items-center justify-center gap-1 text-[11.5px] font-medium py-1.5 rounded-md" style={{ border: `1px solid #D69A2D`, color: "#D69A2D" }}><Plus size={12} />เพิ่มเจ้าของ/หุ้นส่วน</button></div>
    </div>
  );
}
function MonthlyPanel({ cars, overhead, setOverhead, bookings, otherExpenses, claims, categories }) {
  const CURRENT_LABEL = "ส.ค. 2569 (ปัจจุบัน)";
  const monthOptions = [...HISTORY.map((h) => h.month + " 2569"), CURRENT_LABEL];
  const [selectedMonth, setSelectedMonth] = useState(CURRENT_LABEL);
  const [showAccounting, setShowAccounting] = useState(false);
  const isCurrent = selectedMonth === CURRENT_LABEL;
  const pnl = computePnL(cars, overhead, bookings, otherExpenses, APP_TODAY.slice(0, 7), categories, claims);
  const chartData = [...HISTORY, { month: "ส.ค.*", revenue: pnl.revenue, netProfit: pnl.netProfit }];
  const historicalMonth = HISTORY.find((h) => h.month + " 2569" === selectedMonth);
  const setOh = (k, v) => setOverhead((p) => ({ ...p, [k]: v }));
  const ohFields = [{ k: "rent", label: "ค่าเช่าที่จอด/ออฟฟิศ" }, { k: "marketing", label: "การตลาด/โฆษณา" }, { k: "platformFee", label: "ค่าคอมมิชชั่นแพลตฟอร์ม" }, { k: "other", label: "อื่นๆ" }];
  return (
    <div>
      <label className="block mb-3">
        <div className="text-[11px] mb-1" style={{ color: "#C9CDD3" }}>เลือกเดือนที่ต้องการดู</div>
        <select className="w-full text-[13px] rounded-md px-2.5 py-2 outline-none" style={{ background: PAPER, border: `1px solid ${PAPER_LINE}`, color: INK }} value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)}>
          {monthOptions.map((m) => <option key={m} value={m}>{m}</option>)}
        </select>
      </label>
      <div className="rounded-lg p-2 mb-4" style={{ background: PAPER, border: `1px solid ${PAPER_LINE}` }}>
        <ResponsiveContainer width="100%" height={170}>
          <ComposedChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={PAPER_LINE} />
            <XAxis dataKey="month" tick={{ fontSize: 10, fill: MUTE }} axisLine={{ stroke: PAPER_LINE }} tickLine={false} />
            <YAxis tick={{ fontSize: 9, fill: MUTE }} axisLine={false} tickLine={false} width={40} tickFormatter={(v) => `${Math.round(v / 1000)}k`} />
            <Tooltip formatter={(v) => fmt(v)} contentStyle={{ fontSize: 12, borderRadius: 8, border: `1px solid ${PAPER_LINE}` }} />
            <Bar dataKey="revenue" fill="#3B5BA5" radius={[4, 4, 0, 0]} barSize={16} name="รายได้" />
            <Line type="monotone" dataKey="netProfit" stroke="#3A7D5C" strokeWidth={2} dot={{ r: 3 }} name="กำไรสุทธิ" />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {!isCurrent && historicalMonth && (
        <>
          <div className="text-[13px] font-semibold mb-2" style={{ color: INK }}>สรุป · {selectedMonth}</div>
          <div className="rounded-lg p-3 mb-4" style={{ background: PAPER, border: `1px solid ${PAPER_LINE}` }}>
            <PnlLine label="รายได้รวม" value={historicalMonth.revenue} bold />
            <PnlLine label="กำไรสุทธิ" value={historicalMonth.netProfit} bold />
          </div>
          <div className="text-[10.5px] mb-4" style={{ color: "#C9CDD3" }}>* เดือนย้อนหลังตอนนี้มีแค่ยอดรวม เพราะข้อมูลย้อนหลังแบบละเอียด (แยกหมวดรายจ่าย) จะแม่นยำเมื่อระบบเก็บ transaction จริงครบทุกเดือน — ตอนนี้เห็นรายละเอียดเต็มได้เฉพาะเดือนปัจจุบันซึ่งคำนวณสดจากกองรถจริง</div>
        </>
      )}

      {isCurrent && (
      <>
      <div className="text-[13px] font-semibold mb-2" style={{ color: INK }}>งบกำไรขาดทุน · ส.ค. 2569</div>
      <div className="rounded-lg p-3 mb-2" style={{ background: PAPER, border: `1px solid ${PAPER_LINE}` }}>
        <PnlLine label="รายได้ค่าเช่ารถของเพจเอง" value={pnl.pageOwnRevenue} />
        <PnlLine label="รายได้ค่าคอมมิชชั่นจากรถพาร์ทเนอร์" value={pnl.commissionRevenue} />
        {pnl.otherIncome > 0 && <PnlLine label="รายได้อื่น (เงินมัดจำที่ริบจากลูกค้ายกเลิก)" value={pnl.otherIncome} />}
        <PnlLine label="ต้นทุนผันแปร (น้ำมัน/ล้าง/ซ่อม/GPS) - รถเพจ" value={-pnl.variableCost} sub />
        <PnlLine label="ประกันภัย/พ.ร.บ. - รถเพจ" value={-pnl.insurance} sub />
        <PnlLine label="เงินเดือนพนักงาน+เจ้าของ" value={-pnl.staffTotal} sub />
        <PnlLine label="ค่าใช้จ่ายส่วนกลางอื่น" value={-(pnl.overheadTotal - pnl.staffTotal - (pnl.otherBusiness || 0))} sub />
        {pnl.otherBusiness > 0 && <PnlLine label="รายจ่ายอื่นที่บันทึกไว้ (งานเลี้ยง/สำนักงาน/ฯลฯ)" value={-pnl.otherBusiness} sub />}
        <PnlLine label="ค่าเสื่อมราคารถเพจ" value={-pnl.depreciation} sub />
        <PnlLine label="ดอกเบี้ยจ่าย (รถเพจที่ผ่อนอยู่)" value={-pnl.interest} sub />
        <PnlLine label="ภาษีเงินได้นิติบุคคล (ประมาณ 20%)" value={-pnl.tax} sub />
        <div className="border-t my-1" style={{ borderColor: PAPER_LINE }} />
        <PnlLine label="กำไรสุทธิ" value={pnl.netProfit} bold />

        {showAccounting && (
          <div className="mt-3 pt-2 border-t" style={{ borderColor: PAPER_LINE }}>
            <div className="text-[11px] mb-1" style={{ color: MUTE }}>ชั้นกำไรแบบมาตรฐานบัญชี (ใช้ตอนคุยกับนักบัญชี/นักลงทุน)</div>
            <PnlLine label="EBITDA (ก่อนค่าเสื่อม ดอกเบี้ย ภาษี)" value={pnl.ebitda} bold />
            <PnlLine label="EBIT (ก่อนดอกเบี้ย ภาษี)" value={pnl.ebit} bold />
            <PnlLine label="กำไรก่อนภาษี (EBT)" value={pnl.ebt} bold />
          </div>
        )}
      </div>
      <button onClick={() => setShowAccounting((v) => !v)} className="w-full mb-4 py-2 rounded-lg text-[12px] font-medium" style={{ border: `1px solid ${PAPER_LINE}`, color: "#3B5BA5", background: PAPER }}>
        {showAccounting ? "ซ่อนรายละเอียดแบบนักบัญชี" : "ดูรายละเอียดแบบนักบัญชี (EBITDA / EBIT / EBT)"}
      </button>
      <div className="text-[10.5px] mb-4" style={{ color: "#C9CDD3" }}>* รายได้จากรถพาร์ทเนอร์นับเฉพาะส่วนคอมมิชชั่นที่เพจได้ ไม่รวมยอดเต็มที่ต้องจ่ายคืนให้พาร์ทเนอร์ (ดูที่แท็บ "พาร์ทเนอร์") ประมาณการนี้ควรตรวจกับผู้ทำบัญชีก่อนยื่นภาษีจริง</div>
      <div className="text-[13px] font-semibold mb-2" style={{ color: INK }}>ค่าใช้จ่ายส่วนกลาง (ปรับได้)</div>
      <StaffEditor staff={overhead.staff} setOverhead={setOverhead} />
      <div className="rounded-lg p-3 grid grid-cols-2 gap-2" style={{ background: PAPER, border: `1px solid ${PAPER_LINE}` }}>{ohFields.map((f) => (<label key={f.k} className="block"><div className="text-[11px] mb-1" style={{ color: MUTE }}>{f.label}</div><MoneyInput className="w-full text-[13px] rounded-md px-2 py-1.5 outline-none" style={{ background: "#FFFFFF", border: `1px solid ${PAPER_LINE}`, color: INK }} value={overhead[f.k]} onChange={(v) => setOh(f.k, v === "" ? 0 : Number(v))} /></label>))}</div>
      </>
      )}
    </div>
  );
}
function YearlyPanel({ cars, overhead, bookings, otherExpenses }) {
  const CURRENT_LABEL = `ปี ${CURRENT_YEAR_BE} (ปัจจุบัน)`;
  const yearOptions = [...YEARLY_SUMMARY_HISTORY.map((y) => `ปี ${y.year}`).reverse(), CURRENT_LABEL];
  const [selectedYear, setSelectedYear] = useState(CURRENT_LABEL);
  const isCurrent = selectedYear === CURRENT_LABEL;
  const pastYear = YEARLY_SUMMARY_HISTORY.find((y) => `ปี ${y.year}` === selectedYear);

  const pnl = computePnL(cars, overhead, bookings, otherExpenses, APP_TODAY.slice(0, 7));
  const ytdRevenue = HISTORY.reduce((s, m) => s + m.revenue, 0) + pnl.revenue;
  const ytdNetProfit = HISTORY.reduce((s, m) => s + m.netProfit, 0) + pnl.netProfit;
  const margin = ytdRevenue ? Math.round((ytdNetProfit / ytdRevenue) * 100) : 0;
  const ranked = cars.filter((c) => c.ownerType !== "partner").map((c) => ({ ...c, monthlyNet: carMonthlyNet(c) })).sort((a, b) => b.monthlyNet - a.monthlyNet);

  return (
    <div>
      <label className="block mb-3">
        <div className="text-[11px] mb-1" style={{ color: "#C9CDD3" }}>เลือกปีที่ต้องการดู (ย้อนหลังได้ {YEARLY_SUMMARY_HISTORY.length} ปี)</div>
        <select className="w-full text-[13px] rounded-md px-2.5 py-2 outline-none" style={{ background: PAPER, border: `1px solid ${PAPER_LINE}`, color: INK }} value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)}>
          {yearOptions.map((y) => <option key={y} value={y}>{y}</option>)}
        </select>
      </label>

      {isCurrent ? (
        <>
          <div className="text-[11px] mb-3" style={{ color: "#C9CDD3" }}>สะสมตั้งแต่ต้นปี (YTD ม.ค.–ส.ค. {CURRENT_YEAR_BE})</div>
          <div className="grid grid-cols-3 gap-2 mb-4">
            <div className="rounded-lg p-3" style={{ background: PAPER, border: `1px solid ${PAPER_LINE}` }}><div className="text-[11px]" style={{ color: MUTE }}>รายได้ YTD</div><div className="font-mono font-bold text-[14px]" style={{ color: "#3A7D5C" }}>{fmt(ytdRevenue)}</div></div>
            <div className="rounded-lg p-3" style={{ background: PAPER, border: `1px solid ${PAPER_LINE}` }}><div className="text-[11px]" style={{ color: MUTE }}>กำไรสุทธิ YTD</div><div className="font-mono font-bold text-[14px]" style={{ color: ytdNetProfit >= 0 ? "#3A7D5C" : "#C1502E" }}>{fmt(ytdNetProfit)}</div></div>
            <div className="rounded-lg p-3" style={{ background: PAPER, border: `1px solid ${PAPER_LINE}` }}><div className="text-[11px]" style={{ color: MUTE }}>อัตรากำไรสุทธิ</div><div className="font-mono font-bold text-[14px]" style={{ color: INK }}>{margin}%</div></div>
          </div>
          <div className="text-[13px] font-semibold mb-2" style={{ color: INK }}>อันดับความคุ้มค่าต่อคัน (เฉพาะรถเพจ)</div>
          <div className="rounded-lg overflow-hidden" style={{ background: PAPER, border: `1px solid ${PAPER_LINE}` }}>
            {ranked.map((c, i) => (
              <div key={c.id} className="flex items-center gap-2 px-3 py-2.5" style={{ borderBottom: i < ranked.length - 1 ? `1px solid ${PAPER_LINE}` : "none" }}>
                <div className="w-4 text-[11px] font-mono" style={{ color: MUTE }}>{i + 1}</div>
                <div className="flex-1 min-w-0"><div className="text-[12.5px] font-mono font-semibold truncate" style={{ color: INK }}>{c.plate} <span className="font-sans font-normal" style={{ color: MUTE }}>· {c.brand} {c.model}</span></div><div className="text-[10.5px]" style={{ color: MUTE }}>สุทธิ/เดือน {fmt(c.monthlyNet)} · ประมาณการ/ปี {fmt(c.monthlyNet * 12)}</div></div>
                <div className="font-mono font-semibold text-[12.5px]" style={{ color: c.monthlyNet >= 0 ? "#3A7D5C" : "#C1502E" }}>{c.monthlyNet >= 0 ? "+" : ""}{fmt(c.monthlyNet)}</div>
              </div>
            ))}
          </div>
        </>
      ) : (
        <>
          <div className="text-[11px] mb-3" style={{ color: "#C9CDD3" }}>สรุปรายปี · {selectedYear}</div>
          <div className="grid grid-cols-3 gap-2 mb-4">
            <div className="rounded-lg p-3" style={{ background: PAPER, border: `1px solid ${PAPER_LINE}` }}><div className="text-[11px]" style={{ color: MUTE }}>รายได้รวม</div><div className="font-mono font-bold text-[14px]" style={{ color: "#3A7D5C" }}>{fmt(pastYear.revenue)}</div></div>
            <div className="rounded-lg p-3" style={{ background: PAPER, border: `1px solid ${PAPER_LINE}` }}><div className="text-[11px]" style={{ color: MUTE }}>กำไรสุทธิ</div><div className="font-mono font-bold text-[14px]" style={{ color: "#3A7D5C" }}>{fmt(pastYear.netProfit)}</div></div>
            <div className="rounded-lg p-3" style={{ background: PAPER, border: `1px solid ${PAPER_LINE}` }}><div className="text-[11px]" style={{ color: MUTE }}>ใช้งานเฉลี่ย</div><div className="font-mono font-bold text-[14px]" style={{ color: INK }}>{pastYear.avgUtil}%</div></div>
          </div>
          <div className="text-[10.5px]" style={{ color: "#C9CDD3" }}>* ปีย้อนหลังตอนนี้มีแค่ยอดรวม เพราะรายละเอียดแยกรายคัน/รายเดือนของปีเก่าจะแม่นยำเมื่อระบบเก็บ transaction จริงครบทุกเดือนทุกปี — ตอนนี้เห็นรายละเอียดเต็มได้เฉพาะปีปัจจุบัน</div>
        </>
      )}
    </div>
  );
}
function CashRow({ label, value, sub, bold, tone }) {
  const color = tone === "in" ? "#3A7D5C" : tone === "out" ? "#C1502E" : INK;
  return (
    <div className={`flex justify-between ${bold ? "text-[13.5px] font-semibold" : "text-[12.5px]"}`} style={{ padding: bold ? "6px 0" : "3px 0" }}>
      <span className={sub ? "pl-3" : ""} style={{ color: sub ? MUTE : INK }}>{label}</span>
      <span className="font-mono" style={{ color }}>{tone === "out" ? "-" : tone === "in" ? "+" : ""}{fmt(Math.abs(value))}</span>
    </div>
  );
}
// Demand analytics: which car types actually get booked, and how that trends month by
// month. Built from real booking records so it doubles as an actual market survey rather
// than a guess about what customers want.
function computeDemandStats(cars, bookings, yearMonth) {
  const live = bookings.filter((b) => b.status !== "cancelled" && b.status !== "pending");
  const inMonth = (b) => !yearMonth || (b.startDate || "").slice(0, 7) === yearMonth;
  const daysInMonth = yearMonth ? new Date(Number(yearMonth.slice(0, 4)), Number(yearMonth.slice(5, 7)), 0).getDate() : 30;
  // month-to-date: only count days already elapsed, so early-month figures aren't misread
  const today = APP_TODAY;
  const elapsed = yearMonth === today.slice(0, 7) ? Number(today.slice(8, 10)) : daysInMonth;

  const byCategory = {};
  cars.forEach((car) => {
    const k = car.category || "อื่นๆ";
    if (!byCategory[k]) byCategory[k] = { category: k, fleetCount: 0, bookings: 0, days: 0, revenue: 0, capacityDays: 0 };
    byCategory[k].fleetCount += 1;
    byCategory[k].capacityDays += elapsed;
  });
  live.filter(inMonth).forEach((b) => {
    const car = cars.find((x) => x.id === b.carId);
    if (!car) return;
    const k = car.category || "อื่นๆ";
    if (!byCategory[k]) byCategory[k] = { category: k, fleetCount: 0, bookings: 0, days: 0, revenue: 0, capacityDays: elapsed };
    const t = calcBookingTotal(b, car);
    byCategory[k].bookings += 1;
    byCategory[k].days += t.days;
    byCategory[k].revenue += t.total;
  });
  const rows = Object.values(byCategory).map((r) => ({
    ...r,
    // yield = how much of this category's available days actually got rented
    yieldPct: r.capacityDays ? Math.round((r.days / r.capacityDays) * 100) : 0,
    revenuePerCar: r.fleetCount ? r.revenue / r.fleetCount : 0,
  })).sort((a, b) => b.yieldPct - a.yieldPct);

  // per-car demand ranking
  const perCar = cars.map((car) => {
    const bs = live.filter((b) => b.carId === car.id && inMonth(b));
    const days = bs.reduce((s, b) => s + calcBookingTotal(b, car).days, 0);
    const revenue = bs.reduce((s, b) => s + calcBookingTotal(b, car).total, 0);
    return { car, bookings: bs.length, days, revenue, yieldPct: elapsed ? Math.round((days / elapsed) * 100) : 0 };
  }).sort((a, b) => b.yieldPct - a.yieldPct);

  return { rows, perCar, elapsed, daysInMonth };
}

function DemandPanel({ cars, bookings, wide }) {
  const months = [...new Set(bookings.map((b) => (b.startDate || "").slice(0, 7)).filter(Boolean))].sort().reverse();
  const [ym, setYm] = useState(APP_TODAY.slice(0, 7));
  const st = computeDemandStats(cars, bookings, ym);
  const maxYield = Math.max(1, ...st.rows.map((r) => r.yieldPct));
  const isCurrent = ym === APP_TODAY.slice(0, 7);

  // month-over-month trend per category
  const trend = months.slice(0, 6).reverse().map((m) => {
    const s = computeDemandStats(cars, bookings, m);
    const row = { month: `${THAI_MONTHS_SHORT[Number(m.slice(5, 7)) - 1]}` };
    s.rows.forEach((r) => { row[r.category] = r.yieldPct; });
    return row;
  });
  const cats = [...new Set(st.rows.map((r) => r.category))];
  const palette = ["#3B5BA5", "#3A7D5C", "#D69A2D", "#C1502E", "#7A4FA3", "#2E7D8F"];

  return (
    <div>
      <label className="block mb-3">
        <div className="text-[11px] mb-1" style={{ color: "#C9CDD3" }}>เลือกเดือนที่ต้องการวิเคราะห์</div>
        <select className="w-full text-[13px] rounded-md px-2.5 py-2 outline-none" style={{ background: PAPER, border: `1px solid ${PAPER_LINE}`, color: INK }} value={ym} onChange={(e) => setYm(e.target.value)}>
          {months.map((m) => <option key={m} value={m}>{THAI_MONTHS_SHORT[Number(m.slice(5, 7)) - 1]} {Number(m.slice(0, 4)) + 543}{m === APP_TODAY.slice(0, 7) ? " (เดือนปัจจุบัน)" : ""}</option>)}
        </select>
      </label>
      {isCurrent && (
        <div className="rounded-md p-2.5 mb-3 text-[11px]" style={{ background: "#3B5BA514", color: "#3B5BA5" }}>
          <b>Month-to-date:</b> นับเฉพาะ {st.elapsed} วันที่ผ่านไปแล้วของเดือนนี้ (ไม่ใช่ {st.daysInMonth} วันเต็ม) ตัวเลข % จึงเทียบกันได้ตรงๆ ไม่ต่ำผิดปกติเพราะเดือนยังไม่จบ
        </div>
      )}

      <div className="text-[13px] font-semibold mb-2" style={{ color: INK }}>ความต้องการแยกตามประเภทรถ</div>
      <div className="rounded-lg overflow-hidden mb-4" style={{ background: PAPER, border: `1px solid ${PAPER_LINE}` }}>
        {st.rows.map((r, i) => (
          <div key={r.category} className="px-3 py-2.5" style={{ borderBottom: i < st.rows.length - 1 ? `1px solid ${PAPER_LINE}` : "none" }}>
            <div className="flex items-center justify-between mb-1">
              <div className="text-[12.5px] font-semibold" style={{ color: INK }}>{r.category} <span className="text-[10.5px] font-normal" style={{ color: MUTE }}>({r.fleetCount} คันในกอง)</span></div>
              <div className="font-mono font-bold text-[14px]" style={{ color: r.yieldPct >= 60 ? "#3A7D5C" : r.yieldPct >= 30 ? "#D69A2D" : "#C1502E" }}>{r.yieldPct}%</div>
            </div>
            <div className="h-2 rounded-full overflow-hidden mb-1" style={{ background: PAPER_LINE }}>
              <div className="h-full rounded-full" style={{ width: `${(r.yieldPct / maxYield) * 100}%`, background: r.yieldPct >= 60 ? "#3A7D5C" : r.yieldPct >= 30 ? "#D69A2D" : "#C1502E" }} />
            </div>
            <div className="text-[10.5px]" style={{ color: MUTE }}>
              ถูกจอง {r.bookings} ครั้ง · {r.days} วัน · รายได้ {fmt(r.revenue)} · เฉลี่ยต่อคัน {fmt(r.revenuePerCar)}
            </div>
          </div>
        ))}
        {st.rows.length === 0 && <div className="p-4 text-center text-[13px]" style={{ color: MUTE }}>ยังไม่มีข้อมูลการจองในเดือนนี้</div>}
      </div>

      {trend.length > 1 && cats.length > 0 && (
        <>
          <div className="text-[13px] font-semibold mb-2" style={{ color: INK }}>แนวโน้มความต้องการรายเดือน (% การใช้งาน)</div>
          <div className="rounded-lg p-2 mb-4" style={{ background: PAPER, border: `1px solid ${PAPER_LINE}` }}>
            <ResponsiveContainer width="100%" height={200}>
              <ComposedChart data={trend} margin={{ top: 5, right: 5, left: -22, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={PAPER_LINE} />
                <XAxis dataKey="month" tick={{ fontSize: 10, fill: MUTE }} axisLine={{ stroke: PAPER_LINE }} tickLine={false} />
                <YAxis tick={{ fontSize: 9, fill: MUTE }} axisLine={false} tickLine={false} width={38} tickFormatter={(v) => `${v}%`} />
                <Tooltip formatter={(v) => `${v}%`} contentStyle={{ fontSize: 12, borderRadius: 8, border: `1px solid ${PAPER_LINE}` }} />
                {cats.map((k, i) => <Line key={k} type="monotone" dataKey={k} stroke={palette[i % palette.length]} strokeWidth={2} dot={{ r: 3 }} name={k} />)}
              </ComposedChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap gap-x-3 gap-y-1 px-1 pb-1">
              {cats.map((k, i) => (<div key={k} className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm" style={{ background: palette[i % palette.length] }} /><span className="text-[10.5px]" style={{ color: MUTE }}>{k}</span></div>))}
            </div>
          </div>
        </>
      )}

      <div className="text-[13px] font-semibold mb-2" style={{ color: INK }}>อันดับรถที่ถูกจองบ่อยที่สุด</div>
      <div className="rounded-lg overflow-hidden mb-3" style={{ background: PAPER, border: `1px solid ${PAPER_LINE}` }}>
        {st.perCar.map((r, i) => (
          <div key={r.car.id} className="flex items-center gap-2 px-3 py-2.5" style={{ borderBottom: i < st.perCar.length - 1 ? `1px solid ${PAPER_LINE}` : "none" }}>
            <div className="w-4 text-[11px] font-mono" style={{ color: MUTE }}>{i + 1}</div>
            <div className="flex-1 min-w-0">
              <div className="text-[12.5px] font-mono font-semibold truncate" style={{ color: INK }}>{r.car.plate} <span className="font-sans font-normal" style={{ color: MUTE }}>· {r.car.brand} {r.car.model} ({r.car.category})</span></div>
              <div className="text-[10.5px]" style={{ color: MUTE }}>{r.bookings} ครั้ง · {r.days} วัน · {fmt(r.revenue)} บาท</div>
            </div>
            <div className="font-mono font-semibold text-[13px]" style={{ color: r.yieldPct >= 60 ? "#3A7D5C" : r.yieldPct >= 30 ? "#D69A2D" : "#C1502E" }}>{r.yieldPct}%</div>
          </div>
        ))}
      </div>
      <div className="text-[10.5px]" style={{ color: "#C9CDD3" }}>* % = จำนวนวันที่ถูกเช่าจริง ÷ จำนวนวันที่รถพร้อมให้เช่าในช่วงนั้น · ใช้ตัดสินใจว่าควรซื้อรถประเภทไหนเพิ่ม หรือประเภทไหนควรลดราคา/ปล่อยขาย</div>
    </div>
  );
}

function CashFlowPanel({ cars, overhead, bookings, otherExpenses, claims, categories }) {
  const cf = computeCashFlow(cars, overhead, bookings, otherExpenses, APP_TODAY.slice(0, 7), categories, claims);
  const pnl = computePnL(cars, overhead, bookings, otherExpenses, APP_TODAY.slice(0, 7), categories, claims);
  const gap = pnl.netProfit - cf.netCash;
  return (
    <div>
      <div className="grid grid-cols-3 gap-2 mb-3">
        <div className="rounded-lg p-3" style={{ background: PAPER, border: `1px solid ${PAPER_LINE}` }}><div className="text-[11px]" style={{ color: MUTE }}>เงินเข้าจริง</div><div className="font-mono font-bold text-[14px]" style={{ color: "#3A7D5C" }}>{fmt(cf.cashIn)}</div></div>
        <div className="rounded-lg p-3" style={{ background: PAPER, border: `1px solid ${PAPER_LINE}` }}><div className="text-[11px]" style={{ color: MUTE }}>เงินออกจริง</div><div className="font-mono font-bold text-[14px]" style={{ color: "#C1502E" }}>{fmt(cf.cashOut)}</div></div>
        <div className="rounded-lg p-3" style={{ background: cf.netCash >= 0 ? "#3A7D5C14" : "#C1502E14", border: `1px solid ${cf.netCash >= 0 ? "#3A7D5C55" : "#C1502E55"}` }}><div className="text-[11px]" style={{ color: MUTE }}>เงินสดสุทธิ</div><div className="font-mono font-bold text-[14px]" style={{ color: cf.netCash >= 0 ? "#3A7D5C" : "#C1502E" }}>{fmt(cf.netCash)}</div></div>
      </div>

      {cf.netCash < 0 && (
        <div className="rounded-lg p-3 mb-3 text-[12px]" style={{ background: "#C1502E14", border: "1px solid #C1502E55", color: "#C1502E" }}>
          ⚠️ เดือนนี้เงินสดติดลบ {fmt(Math.abs(cf.netCash))} บาท — แม้งบกำไรขาดทุนจะดูมีกำไร แต่เงินที่ออกจริงมากกว่าเงินที่เข้าจริง ต้องมีเงินสำรองมาเติมไม่งั้นจ่ายค่างวด/เงินเดือนไม่ทัน
        </div>
      )}

      <div className="text-[13px] font-semibold mb-2" style={{ color: INK }}>เงินเข้า-ออกจริง เดือนนี้</div>
      <div className="rounded-lg p-3 mb-3" style={{ background: PAPER, border: `1px solid ${PAPER_LINE}` }}>
        <CashRow label="ค่าเช่าที่เก็บได้แล้ว" value={cf.cashInRental} tone="in" />
        {cf.forfeited > 0 && <CashRow label="เงินจองที่ริบจากลูกค้ายกเลิก" value={cf.forfeited} tone="in" />}
        <div className="border-t my-1" style={{ borderColor: PAPER_LINE }} />
        <CashRow label="ค่าใช้จ่ายรถ (น้ำมัน/ล้าง/ซ่อม/ประกัน/GPS)" value={cf.carCashOut} tone="out" sub />
        <CashRow label="เงินเดือนพนักงาน+เจ้าของ" value={cf.staffCashOut} tone="out" sub />
        <CashRow label="ค่าใช้จ่ายส่วนกลาง" value={cf.overheadCashOut} tone="out" sub />
        <CashRow label="ค่างวดรถ (เต็มจำนวน เงินต้น+ดอกเบี้ย)" value={cf.loanCashOut} tone="out" sub />
        {cf.partnerPayout > 0 && <CashRow label="จ่ายคืนพาร์ทเนอร์" value={cf.partnerPayout} tone="out" sub />}
        {cf.otherBusinessOut > 0 && <CashRow label="รายจ่ายอื่นของบริษัท" value={cf.otherBusinessOut} tone="out" sub />}
        {cf.claimsPaidTotal > 0 && <CashRow label="จ่ายคืนพนักงานที่สำรองจ่าย" value={cf.claimsPaidTotal} tone="out" sub />}
        {cf.otherIncomeIn > 0 && <CashRow label="รายได้อื่น" value={cf.otherIncomeIn} tone="in" sub />}
        {(cf.investOut > 0 || cf.investIn > 0) && <div className="border-t mt-1.5 pt-1.5" style={{ borderColor: PAPER_LINE }}><div className="text-[10.5px] mb-0.5" style={{ color: "#7A4FA3" }}>กลุ่มลงทุน (ไม่กระทบกำไร)</div></div>}
        {cf.investIn > 0 && <CashRow label="ขายทรัพย์สิน/ขายรถออก" value={cf.investIn} tone="in" sub />}
        {cf.investOut > 0 && <CashRow label="ซื้อรถ/ปรับปรุงออฟฟิศ/อุปกรณ์ถาวร" value={cf.investOut} tone="out" sub />}
        {(cf.finOut > 0 || cf.finIn > 0) && <div className="border-t mt-1.5 pt-1.5" style={{ borderColor: PAPER_LINE }}><div className="text-[10.5px] mb-0.5" style={{ color: "#D69A2D" }}>กลุ่มจัดหาเงิน (ไม่กระทบกำไร)</div></div>}
        {cf.finIn > 0 && <CashRow label="รับเงินกู้ / เจ้าของเติมเงินเข้า" value={cf.finIn} tone="in" sub />}
        {cf.finOut > 0 && <CashRow label="คืนเงินต้น / เจ้าของถอนไปใช้ส่วนตัว" value={cf.finOut} tone="out" sub />}
        <div className="border-t my-1" style={{ borderColor: PAPER_LINE }} />
        <CashRow label="เงินสดคงเหลือสุทธิ" value={cf.netCash} bold tone={cf.netCash >= 0 ? "in" : "out"} />
      </div>

      <div className="rounded-lg p-3 mb-3 text-[11px]" style={{ background: "#FFFFFF80", border: `1px solid ${PAPER_LINE}` }}>
        <div className="text-[12px] font-semibold mb-1.5" style={{ color: INK }}>เงินที่ "ไม่กระทบกำไร" ไปอยู่ไหนในบัญชี?</div>
        <div style={{ color: MUTE }}>
          <b style={{ color: INK }}>ไม่ไปรวมในรายจ่ายของเพจ</b> — งบกำไรขาดทุนจะไม่เห็นเงินก้อนนี้เลย เพราะไม่ใช่ต้นทุนการหารายได้<br />
          มันปรากฏแค่ 2 ที่: (1) หน้านี้ ในกลุ่มลงทุน/จัดหาเงิน และ (2) ยอดเงินสดคงเหลือ<br />
          ตัวอย่าง: ซื้อรถ 800,000 — งบกำไรขาดทุนไม่ขยับ แต่เงินสดหาย 800,000 แล้วรถจะค่อยๆ กลายเป็นรายจ่ายผ่านค่าเสื่อมเดือนละก้อน
        </div>
        <div className="mt-2 pt-2" style={{ borderTop: `1px solid ${PAPER_LINE}` }}>
          <div className="text-[12px] font-semibold mb-1" style={{ color: INK }}>เงินเบิกของพนักงาน — พอกดว่าจ่ายคืนแล้ว เกิดอะไรขึ้น?</div>
          <div style={{ color: MUTE }}>
            <b style={{ color: INK }}>ตอนอนุมัติ</b> → เข้างบกำไรขาดทุนเป็นรายจ่ายทันที (มีใบเสร็จแล้ว = ต้นทุนเกิดแล้ว) แต่ยังไม่ตัดเงินสด แสดงเป็น "ค้างจ่ายคืนพนักงาน"<br />
            <b style={{ color: INK }}>ตอนกดจ่ายคืนแล้ว</b> → ตัดเงินสดออก และยอดค้างจ่ายหายไป · <b style={{ color: INK }}>ไม่ต้องบันทึกอะไรเพิ่ม</b> ระบบลงบัญชีให้ครบแล้ว<br />
            การโอนเงินจริงยังต้องทำเองที่ธนาคาร ระบบเป็นแค่ที่บันทึกว่าจ่ายแล้ว
          </div>
        </div>
      </div>
      <div className="rounded-lg p-3 mb-4 text-[11px]" style={{ background: "#3B5BA514", color: "#3B5BA5" }}>
        <b>ทำไมกำไรกับเงินสดไม่เท่ากัน?</b><br />
        กำไรทางบัญชีเดือนนี้ {fmt(pnl.netProfit)} บาท แต่เงินสดจริง {fmt(cf.netCash)} บาท ต่างกัน {fmt(Math.abs(gap))} บาท<br />
        เพราะ (1) ค่างวดรถจ่ายเต็มจำนวนแต่ทางบัญชีคิดเป็นรายจ่ายแค่ดอกเบี้ย (2) ค่าเสื่อมราคาเป็นรายจ่ายแต่ไม่มีเงินออกจริง (3) ลูกค้าบางรายยังไม่จ่าย (4) เงินที่เจ้าของถอนไปใช้ส่วนตัวหักจากเงินสดแต่ไม่ลดกำไร
      </div>

      <div className="text-[13px] font-semibold mb-2 flex items-center gap-1.5" style={{ color: INK }}>💰 เงินมัดจำค้ำประกันที่ถือไว้</div>
      <div className="rounded-lg p-3 mb-4" style={{ background: PAPER, border: `1px solid ${PAPER_LINE}` }}>
        <div className="flex justify-between items-baseline">
          <span className="text-[12.5px]" style={{ color: INK }}>ยอดรวมที่ต้องคืนลูกค้า</span>
          <span className="font-mono font-bold text-[15px]" style={{ color: "#D69A2D" }}>{fmt(cf.securityHeld)}</span>
        </div>
        <div className="text-[10.5px] mt-1" style={{ color: MUTE }}>* เงินก้อนนี้อยู่ในบัญชีก็จริง แต่ไม่ใช่รายได้ ต้องคืนลูกค้าตอนคืนรถ อย่านับรวมเป็นกำไรหรือเอาไปใช้</div>
      </div>

      <div className="text-[13px] font-semibold mb-2" style={{ color: INK }}>ยอดค้างรับจากลูกค้า</div>
      {cf.outstandingList.length === 0 ? (
        <div className="rounded-lg p-3 text-[12.5px]" style={{ background: PAPER, border: `1px solid ${PAPER_LINE}`, color: "#3A7D5C" }}>✓ ไม่มียอดค้างรับ เก็บเงินครบทุกงาน</div>
      ) : (
        <>
          <div className="rounded-lg p-3 mb-2" style={{ background: "#D69A2D14", border: "1px solid #D69A2D55" }}>
            <div className="flex justify-between items-baseline">
              <span className="text-[12.5px] font-medium" style={{ color: "#805B00" }}>ค้างรับทั้งหมด {cf.outstandingList.length} งาน</span>
              <span className="font-mono font-bold text-[15px]" style={{ color: "#C1502E" }}>{fmt(cf.outstanding)}</span>
            </div>
          </div>
          <div className="space-y-2">
            {cf.outstandingList.map(({ booking: b, items, total }) => {
              const c = cars.find((x) => x.id === b.carId);
              const overdue = b.endDate < APP_TODAY;
              return (
                <div key={b.id} className="rounded-lg p-3" style={{ background: PAPER, border: `1px solid ${overdue ? "#C1502E55" : PAPER_LINE}` }}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="text-[12.5px] font-semibold" style={{ color: INK }}>{b.firstName} {b.lastName}</div>
                    <div className="font-mono font-semibold text-[13px]" style={{ color: "#C1502E" }}>{fmt(total)}</div>
                  </div>
                  <div className="text-[11px] mb-1" style={{ color: MUTE }}>{c ? `${c.plate} · ${c.brand} ${c.model}` : "-"} · {formatDMY(b.startDate)}–{formatDMY(b.endDate)} · {b.phone}</div>
                  <div className="flex flex-wrap gap-1">
                    {items.map((i) => <span key={i.label} className="text-[10px] px-1.5 py-0.5 rounded border" style={{ borderColor: PAPER_LINE, color: MUTE }}>{i.label} {fmt(i.amount)}</span>)}
                    {overdue && <span className="text-[10px] px-1.5 py-0.5 rounded font-medium" style={{ background: "#C1502E14", color: "#C1502E" }}>เลยกำหนดคืนแล้ว</span>}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

/* ================= staff reimbursement claims ================= */
function ClaimsView({ claims, setClaims, cars, categories, session, wide }) {
  const isOwner = session.role === "owner";
  const [tab, setTab] = useState(isOwner ? "review" : "mine");
  const [adding, setAdding] = useState(false);
  const [detail, setDetail] = useState(null);
  const [fRequester, setFRequester] = useState("ทั้งหมด");
  const [fCategory, setFCategory] = useState("ทั้งหมด");
  const [fYear, setFYear] = useState("ทั้งหมด");
  const [fMonth, setFMonth] = useState("ทั้งหมด");
  const blank = { paymentDate: APP_TODAY, amount: "", category: "car_repair", carId: "", description: "", receiptUrl: "", extraDocUrl: "" };
  const [form, setForm] = useState(blank);
  const inputCls = "w-full text-[13px] rounded-md px-2.5 py-2 outline-none";
  const inputStyle = { background: "#FFFFFF", border: `1px solid ${PAPER_LINE}`, color: INK };

  const mine = claims.filter((q) => q.requesterName === session.name);
  const pending = claims.filter((q) => q.status === "pending");
  const approvedUnpaid = claims.filter((q) => q.status === "approved");
  const base = tab === "mine" ? mine : tab === "review" ? pending : tab === "topay" ? approvedUnpaid : claims;
  const requesters = [...new Set(claims.map((q) => q.requesterName))];
  const shown = base.filter((q) => {
    if (fRequester !== "ทั้งหมด" && q.requesterName !== fRequester) return false;
    if (fCategory !== "ทั้งหมด" && q.category !== fCategory) return false;
    if (fYear !== "ทั้งหมด" && (q.paymentDate || "").slice(0, 4) !== fYear) return false;
    if (fMonth !== "ทั้งหมด" && (q.paymentDate || "").slice(5, 7) !== fMonth) return false;
    return true;
  });
  const sorted = [...shown].sort((a, b) => (b.requestDate || "").localeCompare(a.requestDate || ""));
  const shownTotal = sorted.reduce((s, q) => s + (q.amount || 0), 0);
  const owedTotal = approvedUnpaid.reduce((s, q) => s + (q.amount || 0), 0);

  const submit = () => {
    const amt = Number(form.amount);
    if (!form.description.trim() || !amt || amt <= 0 || !form.receiptUrl) return;
    setClaims((prev) => [...prev, {
      id: `cl${claimCounter++}`, requesterName: session.name, requestDate: APP_TODAY, requestedAt: new Date().toISOString(), reviewedAtTime: "",
      paymentDate: form.paymentDate, amount: amt, category: form.category,
      carId: form.carId ? Number(form.carId) : null, description: form.description.trim(),
      receiptUrl: form.receiptUrl, extraDocUrl: form.extraDocUrl,
      status: "pending", reviewedBy: "", reviewedAt: "", rejectReason: "", paidAt: "",
    }]);
    setForm(blank); setAdding(false); setTab("mine");
  };
  const decide = (id, status, reason) => setClaims((prev) => prev.map((q) => q.id === id
    ? { ...q, status, reviewedBy: session.name, reviewedAt: APP_TODAY, reviewedAtTime: new Date().toISOString(), rejectReason: reason || "" } : q));
  const markPaid = (id) => setClaims((prev) => prev.map((q) => q.id === id ? { ...q, status: "paid", paidAt: APP_TODAY, paidAtTime: new Date().toISOString() } : q));

  const tabs = isOwner
    ? [{ k: "review", l: `รออนุมัติ (${pending.length})` }, { k: "topay", l: `รอจ่ายคืน (${approvedUnpaid.length})` }, { k: "mine", l: "ของฉัน" }, { k: "all", l: "ทั้งหมด" }]
    : [{ k: "mine", l: "คำร้องของฉัน" }, { k: "all", l: "ทั้งหมด" }];

  return (
    <div className="p-4">
      {isOwner && owedTotal > 0 && (
        <div className="rounded-lg p-3 mb-3" style={{ background: "#3B5BA514", border: "1px solid #3B5BA555" }}>
          <div className="flex justify-between items-baseline">
            <span className="text-[12.5px] font-medium" style={{ color: "#3B5BA5" }}>ค้างจ่ายคืนพนักงาน {approvedUnpaid.length} รายการ</span>
            <span className="font-mono font-bold text-[15px]" style={{ color: "#3B5BA5" }}>{fmt(owedTotal)}</span>
          </div>
          <div className="text-[10.5px] mt-1" style={{ color: MUTE }}>อนุมัติแล้วแต่ยังไม่ได้จ่ายคืน — นับเป็นรายจ่ายในงบแล้ว แต่ยังไม่ตัดเงินสด</div>
        </div>
      )}

      <div className="flex items-center justify-between mb-3 gap-2 flex-wrap">
        <div className="flex gap-1.5 flex-wrap">
          {tabs.map((t) => (
            <button key={t.k} onClick={() => setTab(t.k)} className="text-[12px] px-2.5 py-1.5 rounded-full border"
              style={{ borderColor: tab === t.k ? "#3B5BA5" : PAPER_LINE, background: tab === t.k ? "#3B5BA5" : "transparent", color: tab === t.k ? PAPER : "#C9CDD3" }}>{t.l}</button>
          ))}
        </div>
        <button onClick={() => setAdding(true)} className="flex items-center gap-1 text-[12px] font-semibold px-2.5 py-1.5 rounded-full" style={{ background: INK, color: PAPER }}><Plus size={13} />ขอเบิกเงิน</button>
      </div>

      <div className="rounded-lg p-2.5 mb-3" style={{ background: PAPER, border: `1px solid ${PAPER_LINE}` }}>
        <div className="flex items-center gap-1.5 mb-2"><Filter size={12} color={MUTE} /><span className="text-[11px] font-medium" style={{ color: INK }}>กรองรายการ</span></div>
        <div className={`grid gap-2 ${wide ? "grid-cols-4" : "grid-cols-2"}`}>
          <select className="text-[11.5px] rounded-md px-2 py-1.5 outline-none" style={{ background: "#FFFFFF", border: `1px solid ${PAPER_LINE}`, color: INK }} value={fRequester} onChange={(e) => setFRequester(e.target.value)}>
            <option value="ทั้งหมด">ผู้เบิก: ทั้งหมด</option>
            {requesters.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
          <select className="text-[11.5px] rounded-md px-2 py-1.5 outline-none" style={{ background: "#FFFFFF", border: `1px solid ${PAPER_LINE}`, color: INK }} value={fCategory} onChange={(e) => setFCategory(e.target.value)}>
            <option value="ทั้งหมด">ประเภท: ทั้งหมด</option>
            {(categories || DEFAULT_EXPENSE_CATEGORIES).filter((ct) => ct.flow === "operating" && ct.dir === "out").map((ct) => <option key={ct.key} value={ct.key}>{ct.label}</option>)}
          </select>
          <select className="text-[11.5px] rounded-md px-2 py-1.5 outline-none" style={{ background: "#FFFFFF", border: `1px solid ${PAPER_LINE}`, color: INK }} value={fYear} onChange={(e) => setFYear(e.target.value)}>
            <option value="ทั้งหมด">ปี: ทั้งหมด</option>
            {[...new Set(claims.map((q) => (q.paymentDate || "").slice(0, 4)).filter(Boolean))].sort().reverse().map((y) => <option key={y} value={y}>ปี {Number(y) + 543}</option>)}
          </select>
          <select className="text-[11.5px] rounded-md px-2 py-1.5 outline-none" style={{ background: "#FFFFFF", border: `1px solid ${PAPER_LINE}`, color: INK }} value={fMonth} onChange={(e) => setFMonth(e.target.value)}>
            <option value="ทั้งหมด">เดือน: ทั้งหมด</option>
            {THAI_MONTHS_SHORT.map((m, i) => <option key={i} value={String(i + 1).padStart(2, "0")}>{m}</option>)}
          </select>
        </div>
        {sorted.length > 0 && <div className="text-[11px] mt-2 pt-2 border-t flex justify-between" style={{ borderColor: PAPER_LINE }}><span style={{ color: MUTE }}>แสดง {sorted.length} รายการ</span><span className="font-mono font-semibold" style={{ color: INK }}>รวม {fmt(shownTotal)} บาท</span></div>}
      </div>

      {sorted.length === 0 ? (
        <div className="rounded-lg p-4 text-center text-[13px]" style={{ background: PAPER, border: `1px solid ${PAPER_LINE}`, color: MUTE }}>ไม่มีรายการตามเงื่อนไขที่กรอง</div>
      ) : (
        <div className={wide ? "grid grid-cols-2 gap-2 items-start" : "space-y-2"}>
          {sorted.map((q) => {
            const st = CLAIM_STATUS[q.status] || CLAIM_STATUS.pending;
            const car = cars.find((x) => x.id === q.carId);
            const ct = catOf(q.category, categories);
            return (
              <button key={q.id} onClick={() => setDetail(q)} className="w-full text-left rounded-lg p-3" style={{ background: PAPER, border: `1px solid ${PAPER_LINE}` }}>
                <div className="flex items-start justify-between gap-2 mb-1">
                  <div className="text-[12.5px] font-semibold min-w-0 truncate" style={{ color: INK }}>{q.description}</div>
                  <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full flex-shrink-0 whitespace-nowrap" style={{ color: st.color, background: `${st.color}1a` }}>{st.label}</span>
                </div>
                <div className="text-[11px] mb-1" style={{ color: MUTE }}>{q.requesterName} · {ct.label}{car ? ` · ${car.plate}` : ""}</div>
                <div className="flex items-center justify-between">
                  <span className="text-[10.5px]" style={{ color: MUTE }}>จ่ายเมื่อ {formatDMY(q.paymentDate)} · ยื่น {formatDateTime(q.requestedAt, q.requestDate)}</span>
                  <span className="font-mono font-bold text-[13px]" style={{ color: INK }}>{fmt(q.amount)}</span>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {adding && (
        <div className="fixed inset-0 z-40 flex items-end sm:items-center justify-center">
          <div className="absolute inset-0" style={{ background: "#00000066" }} onClick={() => setAdding(false)} />
          <div className="relative w-full sm:max-w-sm lg:max-w-2xl rounded-t-2xl sm:rounded-2xl flex flex-col" style={{ background: PAPER, maxHeight: "88vh", minHeight: 0 }}>
            <div className="p-4 flex items-center justify-between border-b flex-shrink-0" style={{ borderColor: PAPER_LINE }}>
              <div className="font-semibold text-[15px]" style={{ color: INK }}>ขอเบิกเงิน</div>
              <button onClick={() => setAdding(false)} className="p-1.5 rounded-full hover:bg-black/5"><X size={18} color={INK} /></button>
            </div>
            <div className="p-4 flex-1 min-h-0 overflow-y-auto" style={{ WebkitOverflowScrolling: "touch", touchAction: "pan-y", overscrollBehavior: "contain" }}>
              <div className="flex items-center gap-1.5 mb-3 pb-2" style={{ borderBottom: `2px solid ${PAPER_LINE}` }}>
                <Pencil size={15} color="#C1502E" />
                <span className="text-[14px] font-bold" style={{ color: INK }}>กรอกรายละเอียดการเบิก</span>
              </div>

              <label className="block mb-3">
                <div className="text-[12px] font-medium mb-1" style={{ color: INK }}>ผู้ขอเบิก <span style={{ color: "#C1502E" }}>*</span></div>
                <div className="w-full text-[13px] rounded-md px-2.5 py-2 flex items-center justify-between" style={{ background: "#EDE7DA", border: `1px solid ${PAPER_LINE}`, color: INK }}>
                  <span>{session.name}</span><span className="text-[10px]" style={{ color: MUTE }}>ดึงจากบัญชีที่เข้าสู่ระบบ</span>
                </div>
              </label>

              <label className="block mb-3">
                <div className="text-[12px] font-medium mb-1" style={{ color: INK }}>วันที่ชำระเงิน <span style={{ color: "#C1502E" }}>*</span></div>
                <input type="date" className={inputCls} style={inputStyle} value={form.paymentDate} onChange={(e) => setForm((p) => ({ ...p, paymentDate: e.target.value }))} />
              </label>

              <label className="block mb-3">
                <div className="text-[12px] font-medium mb-1" style={{ color: INK }}>จำนวนเงินที่ขอเบิก <span style={{ color: "#C1502E" }}>*</span></div>
                <div className="text-[10.5px] mb-1.5" style={{ color: MUTE }}>โปรดระบุเป็นจำนวนเต็มเสมอ และไม่เกินจำนวนเงินในใบเสร็จ</div>
                <div className="flex items-center gap-2">
                  <MoneyInput className={inputCls} style={inputStyle} value={form.amount} onChange={(v) => setForm((p) => ({ ...p, amount: v }))} />
                  <span className="text-[13px] flex-shrink-0" style={{ color: MUTE }}>บาท</span>
                </div>
              </label>

              <div className={wide ? "grid grid-cols-2 gap-2 mb-3" : "mb-3"}>
                <label className={wide ? "" : "block mb-3"}>
                  <div className="text-[12px] font-medium mb-1" style={{ color: INK }}>ประเภทค่าใช้จ่าย <span style={{ color: "#C1502E" }}>*</span></div>
                  <select className={inputCls} style={inputStyle} value={form.category} onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}>
                    {(categories || DEFAULT_EXPENSE_CATEGORIES).filter((ct) => ct.flow === "operating" && ct.dir === "out").map((ct) => <option key={ct.key} value={ct.key}>{ct.label}</option>)}
                  </select>
                </label>
                <label className="block">
                  <div className="text-[12px] font-medium mb-1" style={{ color: INK }}>เกี่ยวกับรถคันไหน <span className="text-[10px]" style={{ color: MUTE }}>(ถ้ามี)</span></div>
                  <select className={inputCls} style={inputStyle} value={form.carId} onChange={(e) => setForm((p) => ({ ...p, carId: e.target.value }))}>
                    <option value="">ไม่ระบุ</option>
                    {cars.map((x) => <option key={x.id} value={x.id}>{x.plate} · {x.brand} {x.model}</option>)}
                  </select>
                </label>
              </div>

              <label className="block mb-4">
                <div className="text-[12px] font-medium mb-1" style={{ color: INK }}>หมายเหตุ <span style={{ color: "#C1502E" }}>*</span></div>
                <textarea rows={3} className="w-full text-[13px] rounded-md px-2.5 py-2 outline-none" style={inputStyle}
                  value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                  placeholder="ระบุรายละเอียด เช่น เปลี่ยนผ้าเบรกหน้า ร้านเจริญยนต์ — หากไม่ระบุกรุณาใส่เครื่องหมาย '–'" />
              </label>

              <div className="flex items-center gap-1.5 mb-3 pb-2" style={{ borderBottom: `2px solid ${PAPER_LINE}` }}>
                <Mail size={15} color="#C1502E" />
                <span className="text-[14px] font-bold" style={{ color: INK }}>แนบเอกสาร</span>
                <span className="text-[10.5px]" style={{ color: MUTE }}>(jpg, png, pdf)</span>
              </div>

              <div className="rounded-lg p-3 mb-2" style={{ background: "#FFFFFF80", border: `1px solid ${PAPER_LINE}` }}>
                <div className="text-[12.5px] font-medium mb-2" style={{ color: INK }}>1. ใบเสร็จรับเงิน <span style={{ color: "#C1502E" }}>*</span></div>
                <PhotoAttach value={form.receiptUrl} onChange={(v) => setForm((p) => ({ ...p, receiptUrl: v }))} hint="ถ่ายรูปใบเสร็จ หรือแนบไฟล์ PDF" />
              </div>
              <div className="rounded-lg p-3 mb-3" style={{ background: "#FFFFFF80", border: `1px solid ${PAPER_LINE}` }}>
                <div className="text-[12.5px] font-medium mb-2" style={{ color: INK }}>2. เอกสารอื่นๆ ที่เกี่ยวข้อง <span className="text-[10px]" style={{ color: MUTE }}>(ถ้ามี)</span></div>
                <PhotoAttach value={form.extraDocUrl} onChange={(v) => setForm((p) => ({ ...p, extraDocUrl: v }))} hint="เช่น รูปรถก่อน-หลังทำสี" />
              </div>

              {(!form.description.trim() || !Number(form.amount) || !form.receiptUrl) && (
                <div className="rounded-md p-2.5 text-[11.5px]" style={{ background: "#C1502E0f", border: "1px solid #C1502E33", color: "#C1502E" }}>
                  ยังกรอกไม่ครบ: {[!Number(form.amount) && "จำนวนเงิน", !form.description.trim() && "หมายเหตุ", !form.receiptUrl && "ใบเสร็จรับเงิน"].filter(Boolean).join(" · ")}
                </div>
              )}
            </div>
            <div className="p-4 pt-3 flex-shrink-0 border-t flex gap-2" style={{ borderColor: PAPER_LINE }}>
              <button onClick={() => setAdding(false)} className="flex-1 py-2.5 rounded-lg text-[12.5px]" style={{ border: `1px solid ${PAPER_LINE}`, color: INK }}>ยกเลิก</button>
              <button onClick={submit} disabled={!form.description.trim() || !Number(form.amount) || !form.receiptUrl}
                className="flex-1 py-2.5 rounded-lg text-[13px] font-semibold"
                style={{ background: (!form.description.trim() || !Number(form.amount) || !form.receiptUrl) ? PAPER_LINE : INK, color: (!form.description.trim() || !Number(form.amount) || !form.receiptUrl) ? MUTE : PAPER }}>ส่งคำร้อง</button>
            </div>
          </div>
        </div>
      )}

      {detail && <ClaimDetail claim={detail} cars={cars} categories={categories} isOwner={isOwner} session={session} onClose={() => setDetail(null)}
        onDecide={(s, r) => { decide(detail.id, s, r); setDetail(null); }} onPay={() => { markPaid(detail.id); setDetail(null); }}
        onUpdate={(patch) => { setClaims((prev) => prev.map((q) => q.id === detail.id ? { ...q, ...patch } : q)); setDetail((d) => ({ ...d, ...patch })); }}
        onCancel={() => { setClaims((prev) => prev.map((q) => q.id === detail.id ? { ...q, status: "cancelled" } : q)); setDetail(null); }}
        onRevoke={() => { setClaims((prev) => prev.filter((q) => q.id !== detail.id)); setDetail(null); }} />}
    </div>
  );
}

function ClaimDetail({ claim, cars, categories, isOwner, session, onClose, onDecide, onPay, onUpdate, onCancel, onRevoke }) {
  useLockBodyScroll();
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState("");
  const [zoom, setZoom] = useState(null);
  const [editing, setEditing] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [confirmRevoke, setConfirmRevoke] = useState(false);
  const [draft, setDraft] = useState({ ...claim });
  // A claim can only be changed by the person who filed it, and only before a decision.
  // Once approved/rejected it is locked as an audit record.
  const isMine = session && claim.requesterName === session.name;
  const editable = isMine && claim.status === "pending";
  const eIn = "w-full text-[13px] rounded-md px-2.5 py-2 outline-none";
  const eStyle = { background: "#FFFFFF", border: `1px solid ${PAPER_LINE}`, color: INK };
  const st = CLAIM_STATUS[claim.status] || CLAIM_STATUS.pending;
  const car = cars.find((x) => x.id === claim.carId);
  const ct = catOf(claim.category, categories);
  const docs = [{ label: "ใบเสร็จ", url: claim.receiptUrl }, { label: "เอกสารเพิ่มเติม", url: claim.extraDocUrl }].filter((d) => d.url);
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0" style={{ background: "#00000066" }} onClick={onClose} />
      <div className="relative w-full sm:max-w-sm lg:max-w-2xl rounded-t-2xl sm:rounded-2xl flex flex-col" style={{ background: PAPER, maxHeight: "88vh", minHeight: 0 }}>
        <div className="p-4 flex items-center justify-between border-b flex-shrink-0" style={{ borderColor: PAPER_LINE }}>
          <div className="font-semibold text-[15px]" style={{ color: INK }}>รายละเอียดคำร้องเบิกเงิน</div>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-black/5"><X size={18} color={INK} /></button>
        </div>
        <div className="p-4 flex-1 min-h-0 overflow-y-auto space-y-3" style={{ WebkitOverflowScrolling: "touch", touchAction: "pan-y", overscrollBehavior: "contain" }}>
          <span className="text-[11px] font-semibold px-2 py-1 rounded-full inline-block" style={{ color: st.color, background: `${st.color}1a` }}>{st.label}</span>
          <div className="rounded-md p-3 text-[12.5px] space-y-1.5" style={{ background: "#FFFFFF80", border: `1px solid ${PAPER_LINE}` }}>
            <div className="text-[14px] font-semibold" style={{ color: INK }}>{claim.description}</div>
            <div className="font-mono font-bold text-[18px]" style={{ color: INK }}>{fmt(claim.amount)} บาท</div>
            <div style={{ color: MUTE }}>ผู้ขอเบิก: <span style={{ color: INK }}>{claim.requesterName}</span></div>
            <div style={{ color: MUTE }}>ประเภท: <span style={{ color: INK }}>{ct.label}</span>{car && <> · รถ <span className="font-mono" style={{ color: INK }}>{car.plate}</span></>}</div>
            <div style={{ color: MUTE }}>จ่ายเงินเมื่อ {formatDMY(claim.paymentDate)} · ส่งคำร้อง {formatDMY(claim.requestDate)}</div>
          </div>
          <div className="rounded-md p-3 text-[12px]" style={{ background: "#FFFFFF80", border: `1px solid ${PAPER_LINE}` }}>
            <div className="text-[12px] font-semibold mb-1.5" style={{ color: INK }}>ประวัติการดำเนินการ</div>
            <div className="flex gap-2 items-start mb-1"><span className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0" style={{ background: "#3B5BA5" }} /><div><span style={{ color: INK }}>ส่งคำร้อง</span> <span style={{ color: MUTE }}>โดย {claim.requesterName} · {formatDateTime(claim.requestedAt, claim.requestDate)}</span></div></div>
            {claim.reviewedBy ? (
              <div className="flex gap-2 items-start mb-1"><span className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0" style={{ background: claim.status === "rejected" ? "#C1502E" : "#3A7D5C" }} /><div><span style={{ color: INK }}>{claim.status === "rejected" ? "ไม่อนุมัติ" : "อนุมัติ"}</span> <span style={{ color: MUTE }}>โดย {claim.reviewedBy} · {formatDateTime(claim.reviewedAtTime, claim.reviewedAt)}</span></div></div>
            ) : claim.status === "pending" ? (
              <div className="flex gap-2 items-start mb-1"><span className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0" style={{ background: "#D69A2D" }} /><span style={{ color: MUTE }}>รอผู้มีอำนาจอนุมัติ</span></div>
            ) : null}
            {claim.paidAt && <div className="flex gap-2 items-start"><span className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0" style={{ background: "#3A7D5C" }} /><div><span style={{ color: INK }}>จ่ายคืนแล้ว</span> <span style={{ color: MUTE }}>· {formatDateTime(claim.paidAtTime, claim.paidAt)}</span></div></div>}
            {claim.editedAt && <div className="flex gap-2 items-start"><span className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0" style={{ background: MUTE }} /><span style={{ color: MUTE }}>แก้ไขล่าสุด {formatDateTime(claim.editedAt)}</span></div>}
            {claim.rejectReason && <div className="mt-1.5 pt-1.5 border-t" style={{ borderColor: PAPER_LINE, color: "#C1502E" }}>เหตุผล: {claim.rejectReason}</div>}
            <div className="text-[10px] mt-2 pt-1.5 border-t" style={{ borderColor: PAPER_LINE, color: MUTE }}>* ตอนนี้ใช้ผู้อนุมัติระดับเดียว รองรับการเพิ่มลำดับขั้นตามวงเงินได้ในอนาคต</div>
          </div>
          {docs.length > 0 && (
            <div className="grid grid-cols-2 gap-2">
              {docs.map((d) => {
                const isPdf = String(d.url).startsWith("data:application/pdf");
                return (
                  <div key={d.label} className="rounded-md overflow-hidden" style={{ border: `1px solid ${PAPER_LINE}` }}>
                    {isPdf ? (
                      <object data={d.url} type="application/pdf" className="w-full" style={{ height: 96, display: "block" }}>
                        <a href={d.url} target="_blank" rel="noreferrer" className="w-full h-24 flex flex-col items-center justify-center gap-1" style={{ background: "#FFFFFF80" }}><FileText size={18} color="#C1502E" /><span className="text-[9.5px] underline" style={{ color: "#3B5BA5" }}>เปิด PDF</span></a>
                      </object>
                    ) : <img src={d.url} alt={d.label} className="w-full h-24 object-cover cursor-zoom-in" onClick={() => setZoom(d.url)} />}
                    <div className="text-[10px] text-center py-1" style={{ color: MUTE }}>{d.label}</div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        {editable && (
          <div className="p-4 pt-3 flex-shrink-0 border-t" style={{ borderColor: PAPER_LINE }}>
            {editing ? (
              <div className="max-h-[52vh] overflow-y-auto pr-1" style={{ WebkitOverflowScrolling: "touch", overscrollBehavior: "contain" }}>
                <div className="text-[12px] font-semibold mb-2" style={{ color: INK }}>แก้ไขคำร้อง (แก้ได้ทุกช่องก่อนถูกอนุมัติ)</div>
                <div className="grid grid-cols-2 gap-2 mb-2">
                  <label><div className="text-[10.5px] mb-1" style={{ color: MUTE }}>วันที่ชำระเงิน</div><input type="date" className={eIn} style={eStyle} value={draft.paymentDate} onChange={(e) => setDraft((p) => ({ ...p, paymentDate: e.target.value }))} /></label>
                  <label><div className="text-[10.5px] mb-1" style={{ color: MUTE }}>จำนวนเงิน</div><MoneyInput className={eIn} style={eStyle} value={draft.amount} onChange={(v) => setDraft((p) => ({ ...p, amount: v }))} /></label>
                </div>
                <div className="grid grid-cols-2 gap-2 mb-2">
                  <label><div className="text-[10.5px] mb-1" style={{ color: MUTE }}>ประเภทค่าใช้จ่าย</div>
                    <select className={eIn} style={eStyle} value={draft.category} onChange={(e) => setDraft((p) => ({ ...p, category: e.target.value }))}>
                      {(categories || DEFAULT_EXPENSE_CATEGORIES).filter((ct) => ct.flow === "operating" && ct.dir === "out").map((ct) => <option key={ct.key} value={ct.key}>{ct.label}</option>)}
                    </select>
                  </label>
                  <label><div className="text-[10.5px] mb-1" style={{ color: MUTE }}>เกี่ยวกับรถคันไหน</div>
                    <select className={eIn} style={eStyle} value={draft.carId || ""} onChange={(e) => setDraft((p) => ({ ...p, carId: e.target.value ? Number(e.target.value) : null }))}>
                      <option value="">ไม่ระบุ</option>
                      {cars.map((x) => <option key={x.id} value={x.id}>{x.plate} · {x.brand} {x.model}</option>)}
                    </select>
                  </label>
                </div>
                <label className="block mb-2"><div className="text-[10.5px] mb-1" style={{ color: MUTE }}>หมายเหตุ</div>
                  <textarea rows={2} className={eIn} style={eStyle} value={draft.description} onChange={(e) => setDraft((p) => ({ ...p, description: e.target.value }))} />
                </label>
                <div className="mb-2"><PhotoAttach label="ใบเสร็จรับเงิน" value={draft.receiptUrl} onChange={(v) => setDraft((p) => ({ ...p, receiptUrl: v }))} hint="เปลี่ยนใบเสร็จได้" /></div>
                <div className="mb-3"><PhotoAttach label="เอกสารอื่นๆ (ถ้ามี)" value={draft.extraDocUrl} onChange={(v) => setDraft((p) => ({ ...p, extraDocUrl: v }))} /></div>
                <div className="flex gap-2">
                  <button onClick={() => { setEditing(false); setDraft({ ...claim }); }} className="flex-1 py-2 rounded-lg text-[12.5px]" style={{ border: `1px solid ${PAPER_LINE}`, color: INK }}>ยกเลิกการแก้ไข</button>
                  <button onClick={() => { onUpdate({ ...draft, amount: Number(draft.amount) || 0, editedAt: new Date().toISOString() }); setEditing(false); }} disabled={!draft.description || !Number(draft.amount) || !draft.receiptUrl}
                    className="flex-1 py-2 rounded-lg text-[12.5px] font-semibold"
                    style={{ background: (!draft.description || !Number(draft.amount) || !draft.receiptUrl) ? PAPER_LINE : INK, color: (!draft.description || !Number(draft.amount) || !draft.receiptUrl) ? MUTE : PAPER }}>บันทึกการแก้ไข</button>
                </div>
              </div>
            ) : confirmCancel ? (
              <div className="flex gap-2">
                <button onClick={() => setConfirmCancel(false)} className="flex-1 py-2.5 rounded-lg text-[12.5px]" style={{ border: `1px solid ${PAPER_LINE}`, color: INK }}>ไม่ยกเลิก</button>
                <button onClick={onCancel} className="flex-1 py-2.5 rounded-lg text-[12.5px] font-semibold" style={{ background: "#C1502E", color: PAPER }}>ยืนยันยกเลิกคำร้อง</button>
              </div>
            ) : (
              <>
                <div className="text-[10.5px] mb-2" style={{ color: MUTE }}>คำร้องยังไม่ถูกพิจารณา — แก้ไขหรือยกเลิกเองได้</div>
                <div className="flex gap-2">
                  <button onClick={() => setConfirmCancel(true)} className="px-3 py-2.5 rounded-lg text-[12.5px]" style={{ border: `1px solid #C1502E`, color: "#C1502E" }}>ยกเลิกคำร้อง</button>
                  <button onClick={() => setEditing(true)} className="flex-1 py-2.5 rounded-lg text-[13px] font-semibold flex items-center justify-center gap-1.5" style={{ background: INK, color: PAPER }}><Pencil size={14} />แก้ไขคำร้อง</button>
                </div>
              </>
            )}
          </div>
        )}
        {isMine && claim.status !== "pending" && (
          <div className="p-4 pt-3 flex-shrink-0 border-t text-[11px]" style={{ borderColor: PAPER_LINE, color: MUTE }}>
            คำร้องถูกพิจารณาแล้ว — แก้ไขหรือยกเลิกไม่ได้ ถูกบันทึกเป็นหลักฐานถาวร
          </div>
        )}
        {isOwner && (claim.status === "pending" || claim.status === "approved") && (
          <div className="p-4 pt-3 flex-shrink-0 border-t" style={{ borderColor: PAPER_LINE }}>
            {rejecting ? (
              <div>
                <input className="w-full text-[13px] rounded-md px-2.5 py-2 outline-none mb-2" style={{ background: "#FFFFFF", border: `1px solid ${PAPER_LINE}`, color: INK }} placeholder="เหตุผลที่ไม่อนุมัติ" value={reason} onChange={(e) => setReason(e.target.value)} />
                <div className="flex gap-2">
                  <button onClick={() => setRejecting(false)} className="flex-1 py-2 rounded-lg text-[12.5px]" style={{ border: `1px solid ${PAPER_LINE}`, color: INK }}>กลับ</button>
                  <button onClick={() => onDecide("rejected", reason)} className="flex-1 py-2 rounded-lg text-[12.5px] font-semibold" style={{ background: "#C1502E", color: PAPER }}>ยืนยันไม่อนุมัติ</button>
                </div>
              </div>
            ) : claim.status === "pending" ? (
              <div className="flex gap-2">
                <button onClick={() => setRejecting(true)} className="px-3 py-2.5 rounded-lg text-[12.5px]" style={{ border: `1px solid #C1502E`, color: "#C1502E" }}>ไม่อนุมัติ</button>
                <button onClick={() => onDecide("approved")} className="flex-1 py-2.5 rounded-lg text-[13px] font-semibold flex items-center justify-center gap-1.5" style={{ background: "#3A7D5C", color: PAPER }}><Check size={15} />อนุมัติ</button>
              </div>
            ) : (
              <>
                <button onClick={onPay} className="w-full py-2.5 rounded-lg text-[13px] font-semibold flex items-center justify-center gap-1.5 mb-2" style={{ background: INK, color: PAPER }}><Wallet size={15} />บันทึกว่าจ่ายคืนแล้ว</button>
                {confirmRevoke ? (
                  <div className="rounded-md p-2.5" style={{ background: "#C1502E0f", border: "1px solid #C1502E33" }}>
                    <div className="text-[11.5px] mb-2" style={{ color: "#C1502E" }}>ยกเลิกการอนุมัติจะ<b>ลบคำร้องนี้ออกจากระบบถาวร</b> เพื่อให้ผู้เบิกยื่นใหม่ได้ — ยอดจะถูกถอนออกจากบัญชีด้วย</div>
                    <div className="flex gap-2">
                      <button onClick={() => setConfirmRevoke(false)} className="flex-1 py-2 rounded-lg text-[12.5px]" style={{ border: `1px solid ${PAPER_LINE}`, color: INK }}>ไม่ยกเลิก</button>
                      <button onClick={onRevoke} className="flex-1 py-2 rounded-lg text-[12.5px] font-semibold" style={{ background: "#C1502E", color: PAPER }}>ยืนยันยกเลิก+ลบคำร้อง</button>
                    </div>
                  </div>
                ) : (
                  <button onClick={() => setConfirmRevoke(true)} className="w-full py-2 rounded-lg text-[12px]" style={{ border: `1px solid #C1502E`, color: "#C1502E" }}>ยกเลิกการอนุมัติ (กรณีอนุมัติผิด)</button>
                )}
              </>
            )}
          </div>
        )}
      </div>
      {zoom && <ImageLightbox url={zoom} onClose={() => setZoom(null)} />}
    </div>
  );
}

function ExpensePanel({ otherExpenses, setOtherExpenses, yearMonth, categories, setCategories, cars, onBuyCar }) {
  const cats = categories || DEFAULT_EXPENSE_CATEGORIES;
  const [form, setForm] = useState({ date: APP_TODAY, category: "staff_welfare", description: "", amount: "", receiptUrl: "", carId: "" });
  const [adding, setAdding] = useState(false);
  const [manageCats, setManageCats] = useState(false);
  const ox = splitExpenses(otherExpenses, yearMonth, cats);
  const sorted = [...ox.list].sort((a, b) => (b.date || "").localeCompare(a.date || ""));
  const cat = catOf(form.category, cats);
  const flowInfo = FLOW_TYPES[cat.flow] || FLOW_TYPES.operating;
  const inputCls = "w-full text-[13px] rounded-md px-2.5 py-2 outline-none";
  const inputStyle = { background: "#FFFFFF", border: `1px solid ${PAPER_LINE}`, color: INK };

  const add = () => {
    const amt = Number(form.amount);
    if (!form.description.trim() || !amt || amt <= 0) return;
    const entry = { id: `ox${expenseCounter++}`, date: form.date, category: form.category, description: form.description.trim(), amount: amt, receiptUrl: form.receiptUrl, carId: form.carId ? Number(form.carId) : null };
    setOtherExpenses((prev) => [...prev, entry]);
    const wasBuyCar = form.category === "buy_car";
    setForm({ date: APP_TODAY, category: form.category, description: "", amount: "", receiptUrl: "", carId: "" });
    setAdding(false);
    if (wasBuyCar && onBuyCar) onBuyCar(amt);
  };
  const remove = (id) => setOtherExpenses((prev) => prev.filter((e) => e.id !== id));

  const groups = [
    { flow: "operating", dir: "out", label: "รายจ่ายดำเนินงาน", total: ox.businessTotal, hint: "ลดกำไร · หักภาษีได้ถ้ามีใบเสร็จ" },
    { flow: "operating", dir: "in", label: "รายได้อื่น", total: ox.otherIncomeTotal, hint: "เพิ่มกำไร" },
    { flow: "investing", dir: "out", label: "ลงทุน (ซื้อทรัพย์สิน)", total: ox.investOutTotal, hint: "ไม่ลดกำไร · ทยอยเป็นรายจ่ายผ่านค่าเสื่อม" },
    { flow: "financing", dir: "out", label: "จัดหาเงิน (จ่ายออก)", total: ox.finOutTotal, hint: "ไม่ลดกำไร · เช่น เจ้าของถอน คืนเงินต้น" },
  ].filter((g) => g.total > 0);

  return (
    <div>
      <div className="rounded-lg p-3 mb-3 text-[11.5px]" style={{ background: "#3B5BA514", color: "#3B5BA5" }}>
        <b>เงินเข้า-ออกแบ่งเป็น 3 กลุ่ม</b><br />
        <b>ดำเนินงาน</b> = งานประจำวัน กระทบกำไร · <b>ลงทุน</b> = ซื้อของใช้หลายปี (ซื้อรถ ปรับปรุงออฟฟิศ) ไม่กระทบกำไร · <b>จัดหาเงิน</b> = เงินกู้/เงินเจ้าของ ไม่กระทบกำไร<br />
        เลือกหมวดให้ถูก ระบบจะลงบัญชีให้เองอัตโนมัติ
      </div>

      {groups.length > 0 && (
        <div className={`grid gap-2 mb-3 ${groups.length > 2 ? "grid-cols-2" : "grid-cols-" + groups.length}`}>
          {groups.map((g) => {
            const fi = FLOW_TYPES[g.flow];
            return (
              <div key={g.flow + g.dir} className="rounded-lg p-3" style={{ background: `${fi.color}12`, border: `1px solid ${fi.color}44` }}>
                <div className="text-[11px]" style={{ color: fi.color }}>{g.label}</div>
                <div className="font-mono font-bold text-[15px]" style={{ color: fi.color }}>{fmt(g.total)}</div>
                <div className="text-[9.5px] mt-0.5" style={{ color: MUTE }}>{g.hint}</div>
              </div>
            );
          })}
        </div>
      )}

      {!adding ? (
        <div className="flex gap-2 mb-3">
          <button onClick={() => setAdding(true)} className="flex-1 py-2.5 rounded-lg text-[13px] font-semibold flex items-center justify-center gap-1.5" style={{ background: INK, color: PAPER }}><Plus size={14} />บันทึกรายการใหม่</button>
          <button onClick={() => setManageCats(true)} className="px-3 py-2.5 rounded-lg text-[12.5px] flex items-center gap-1" style={{ border: `1px solid ${PAPER_LINE}`, color: INK, background: PAPER }}><Settings size={13} />หมวดหมู่</button>
        </div>
      ) : (
        <div className="rounded-lg p-3 mb-3" style={{ background: PAPER, border: `1px solid ${PAPER_LINE}` }}>
          <div className="text-[12.5px] font-semibold mb-2" style={{ color: INK }}>บันทึกรายการใหม่</div>
          <label className="block mb-2"><div className="text-[11px] mb-1" style={{ color: MUTE }}>หมวดหมู่</div>
            <select className={inputCls} style={inputStyle} value={form.category} onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}>
              {["operating", "investing", "financing"].map((fl) => (
                <optgroup key={fl} label={FLOW_TYPES[fl].label}>
                  {cats.filter((ct) => ct.flow === fl).map((ct) => <option key={ct.key} value={ct.key}>{ct.dir === "in" ? "↓ รับ · " : "↑ จ่าย · "}{ct.label}</option>)}
                </optgroup>
              ))}
            </select>
          </label>
          <div className="rounded-md p-2 mb-2 text-[10.5px]" style={{ background: `${flowInfo.color}14`, color: flowInfo.color }}>
            กลุ่ม<b>{flowInfo.label}</b> · {flowInfo.hitsProfit ? (cat.dir === "in" ? "เพิ่มทั้งกำไรและเงินสด" : "ลดทั้งกำไรและเงินสด หักภาษีได้ถ้ามีใบเสร็จ") : (cat.dir === "in" ? "เงินเข้าอย่างเดียว ไม่นับเป็นรายได้ ไม่เสียภาษี" : "เงินออกอย่างเดียว ไม่ลดกำไร หักภาษีไม่ได้")}
            {cat.note && <div className="mt-0.5" style={{ color: MUTE }}>{cat.note}</div>}
          </div>
          <div className="grid grid-cols-2 gap-2 mb-2">
            <label><div className="text-[11px] mb-1" style={{ color: MUTE }}>วันที่</div><input type="date" className={inputCls} style={inputStyle} value={form.date} onChange={(e) => setForm((p) => ({ ...p, date: e.target.value }))} /></label>
            <label><div className="text-[11px] mb-1" style={{ color: MUTE }}>จำนวนเงิน (บาท)</div><MoneyInput className={inputCls} style={inputStyle} value={form.amount} onChange={(v) => setForm((p) => ({ ...p, amount: v }))} /></label>
          </div>
          <label className="block mb-2"><div className="text-[11px] mb-1" style={{ color: MUTE }}>รายละเอียด</div><input className={inputCls} style={inputStyle} value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} placeholder="เช่น เลี้ยงทีมงานหลังปิดยอด" /></label>
          {cat.flow === "operating" && cat.dir === "out" && (
            <label className="block mb-2"><div className="text-[11px] mb-1" style={{ color: MUTE }}>เกี่ยวกับรถคันไหน (ถ้ามี)</div>
              <select className={inputCls} style={inputStyle} value={form.carId} onChange={(e) => setForm((p) => ({ ...p, carId: e.target.value }))}>
                <option value="">ไม่ระบุ</option>
                {(cars || []).map((x) => <option key={x.id} value={x.id}>{x.plate} · {x.brand} {x.model}</option>)}
              </select>
            </label>
          )}
          {form.category === "buy_car" && (
            <div className="rounded-md p-2 mb-2 text-[11px]" style={{ background: "#7A4FA314", color: "#7A4FA3" }}>หลังบันทึก ระบบจะเปิดหน้าเพิ่มรถในกองรถให้ต่อทันที พร้อมกรอกราคาซื้อให้แล้ว</div>
          )}
          <div className="mb-2"><PhotoAttach label="ใบเสร็จ/หลักฐาน" value={form.receiptUrl} onChange={(v) => setForm((p) => ({ ...p, receiptUrl: v }))} hint="ถ่ายรูปใบเสร็จ หรือแนบ PDF" /></div>
          <div className="flex gap-2">
            <button onClick={() => setAdding(false)} className="flex-1 py-2 rounded-lg text-[12.5px]" style={{ border: `1px solid ${PAPER_LINE}`, color: INK }}>ยกเลิก</button>
            <button onClick={add} className="flex-1 py-2 rounded-lg text-[12.5px] font-semibold" style={{ background: INK, color: PAPER }}>บันทึก</button>
          </div>
        </div>
      )}

      <div className="text-[13px] font-semibold mb-2" style={{ color: INK }}>รายการเดือนนี้ ({sorted.length})</div>
      {sorted.length === 0 ? (
        <div className="rounded-lg p-3 text-[12.5px]" style={{ background: PAPER, border: `1px solid ${PAPER_LINE}`, color: MUTE }}>ยังไม่มีรายการในเดือนนี้</div>
      ) : (
        <div className="space-y-2">
          {sorted.map((e) => {
            const ct = e.cat || catOf(e.category, cats);
            const fi = FLOW_TYPES[ct.flow] || FLOW_TYPES.operating;
            const car = (cars || []).find((x) => x.id === e.carId);
            return (
              <div key={e.id} className="rounded-lg p-3 flex items-start gap-2.5" style={{ background: PAPER, border: `1px solid ${PAPER_LINE}` }}>
                <div className="w-1 self-stretch rounded-full flex-shrink-0" style={{ background: fi.color }} />
                <div className="flex-1 min-w-0">
                  <div className="text-[12.5px] font-medium" style={{ color: INK }}>{e.description}</div>
                  <div className="text-[11px]" style={{ color: MUTE }}>{formatDMY(e.date)} · {ct.label}{car ? ` · ${car.plate}` : ""}</div>
                  <div className="text-[10px] mt-0.5" style={{ color: fi.color }}>{fi.label}{!fi.hitsProfit && " · ไม่กระทบกำไร"}</div>
                  {!e.receiptUrl && fi.hitsProfit && ct.dir === "out" && <div className="text-[10px] mt-0.5" style={{ color: "#C1502E" }}>⚠️ ยังไม่มีใบเสร็จ อาจหักภาษีไม่ได้</div>}
                </div>
                {e.receiptUrl && <div className="w-10 h-10 rounded overflow-hidden flex-shrink-0" style={{ border: `1px solid ${PAPER_LINE}` }}>
                  {String(e.receiptUrl).startsWith("data:application/pdf") ? <div className="w-full h-full flex items-center justify-center" style={{ background: "#FFFFFF80" }}><FileText size={14} color="#C1502E" /></div> : <img src={e.receiptUrl} alt="ใบเสร็จ" className="w-full h-full object-cover" />}
                </div>}
                <div className="text-right flex-shrink-0">
                  <div className="font-mono font-semibold text-[13px]" style={{ color: ct.dir === "in" ? "#3A7D5C" : fi.color }}>{ct.dir === "in" ? "+" : "-"}{fmt(e.amount)}</div>
                  <button onClick={() => remove(e.id)} className="text-[10px] mt-1" style={{ color: "#C1502E" }}>ลบ</button>
                </div>
              </div>
            );
          })}
        </div>
      )}
      <div className="text-[10.5px] mt-3" style={{ color: "#C9CDD3" }}>* ถ้าจดทะเบียนเป็นนิติบุคคล การที่เจ้าของถอนเงินออกมีผลทางภาษีที่ต้องจัดการให้ถูกต้อง ควรปรึกษาผู้ทำบัญชี</div>

      {manageCats && <CategoryManager categories={cats} setCategories={setCategories} onClose={() => setManageCats(false)} />}
    </div>
  );
}

function CategoryManager({ categories, setCategories, onClose }) {
  useLockBodyScroll();
  const [form, setForm] = useState({ label: "", flow: "operating", dir: "out", note: "" });
  const inputCls = "w-full text-[12.5px] rounded-md px-2 py-1.5 outline-none";
  const inputStyle = { background: "#FFFFFF", border: `1px solid ${PAPER_LINE}`, color: INK };
  const add = () => {
    if (!form.label.trim()) return;
    const key = `custom_${Date.now()}`;
    setCategories((prev) => [...prev, { key, label: form.label.trim(), flow: form.flow, dir: form.dir, note: form.note.trim(), system: false }]);
    setForm({ label: "", flow: form.flow, dir: form.dir, note: "" });
  };
  const rename = (key, label) => setCategories((prev) => prev.map((c) => c.key === key ? { ...c, label } : c));
  const remove = (key) => setCategories((prev) => prev.filter((c) => c.key !== key));
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0" style={{ background: "#00000066" }} onClick={onClose} />
      <div className="relative w-full sm:max-w-sm lg:max-w-2xl rounded-t-2xl sm:rounded-2xl flex flex-col" style={{ background: PAPER, maxHeight: "85vh", minHeight: 0 }}>
        <div className="p-4 flex items-center justify-between border-b flex-shrink-0" style={{ borderColor: PAPER_LINE }}>
          <div className="font-semibold text-[15px] flex items-center gap-1.5" style={{ color: INK }}><Settings size={16} />จัดการหมวดหมู่</div>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-black/5"><X size={18} color={INK} /></button>
        </div>
        <div className="p-4 flex-1 min-h-0 overflow-y-auto" style={{ WebkitOverflowScrolling: "touch", touchAction: "pan-y", overscrollBehavior: "contain" }}>
          <div className="rounded-lg p-3 mb-3" style={{ background: "#FFFFFF80", border: `1px solid ${PAPER_LINE}` }}>
            <div className="text-[12px] font-semibold mb-2" style={{ color: INK }}>เพิ่มหมวดใหม่</div>
            <input className={`${inputCls} mb-2`} style={inputStyle} placeholder="ชื่อหมวด เช่น ค่าเช่าโกดัง" value={form.label} onChange={(e) => setForm((p) => ({ ...p, label: e.target.value }))} />
            <div className="grid grid-cols-2 gap-2 mb-2">
              <label><div className="text-[10.5px] mb-1" style={{ color: MUTE }}>กลุ่ม</div>
                <select className={inputCls} style={inputStyle} value={form.flow} onChange={(e) => setForm((p) => ({ ...p, flow: e.target.value }))}>
                  {Object.keys(FLOW_TYPES).map((k) => <option key={k} value={k}>{FLOW_TYPES[k].label}{FLOW_TYPES[k].hitsProfit ? " (กระทบกำไร)" : " (ไม่กระทบกำไร)"}</option>)}
                </select>
              </label>
              <label><div className="text-[10.5px] mb-1" style={{ color: MUTE }}>ทิศทาง</div>
                <select className={inputCls} style={inputStyle} value={form.dir} onChange={(e) => setForm((p) => ({ ...p, dir: e.target.value }))}>
                  <option value="out">จ่ายออก</option><option value="in">รับเข้า</option>
                </select>
              </label>
            </div>
            <input className={`${inputCls} mb-2`} style={inputStyle} placeholder="คำอธิบายเพิ่มเติม (ไม่บังคับ)" value={form.note} onChange={(e) => setForm((p) => ({ ...p, note: e.target.value }))} />
            <button onClick={add} className="w-full py-2 rounded-lg text-[12.5px] font-semibold" style={{ background: INK, color: PAPER }}>เพิ่มหมวด</button>
          </div>
          {["operating", "investing", "financing"].map((fl) => (
            <div key={fl} className="mb-3">
              <div className="text-[12px] font-semibold mb-1.5" style={{ color: FLOW_TYPES[fl].color }}>{FLOW_TYPES[fl].label}{!FLOW_TYPES[fl].hitsProfit && " · ไม่กระทบกำไร"}</div>
              <div className="space-y-1.5">
                {categories.filter((ct) => ct.flow === fl).map((ct) => (
                  <div key={ct.key} className="flex items-center gap-2 rounded-md p-2" style={{ background: "#FFFFFF80", border: `1px solid ${PAPER_LINE}` }}>
                    <span className="text-[10px] flex-shrink-0 px-1.5 py-0.5 rounded" style={{ background: ct.dir === "in" ? "#3A7D5C1a" : "#C1502E1a", color: ct.dir === "in" ? "#3A7D5C" : "#C1502E" }}>{ct.dir === "in" ? "รับ" : "จ่าย"}</span>
                    <input className="flex-1 text-[12px] bg-transparent outline-none min-w-0" style={{ color: INK }} value={ct.label} onChange={(e) => rename(ct.key, e.target.value)} />
                    {ct.system ? <span className="text-[9.5px] flex-shrink-0" style={{ color: MUTE }}>มาตรฐาน</span>
                      : <button onClick={() => remove(ct.key)} className="p-1 flex-shrink-0" style={{ color: "#C1502E" }}><Trash2 size={12} /></button>}
                  </div>
                ))}
              </div>
            </div>
          ))}
          <div className="text-[10.5px]" style={{ color: MUTE }}>* หมวดมาตรฐานเปลี่ยนชื่อได้ แต่ลบไม่ได้ เพราะระบบใช้อ้างอิงในการคำนวณบัญชี</div>
        </div>
        <div className="p-4 pt-3 flex-shrink-0 border-t" style={{ borderColor: PAPER_LINE }}>
          <button onClick={onClose} className="w-full py-2.5 rounded-lg text-[13px] font-semibold" style={{ border: `1px solid ${PAPER_LINE}`, color: INK }}>ปิดหน้าต่าง</button>
        </div>
      </div>
    </div>
  );
}

function PartnerPanel({ cars }) {
  const partnerCars = cars.filter((c) => c.ownerType === "partner");
  if (partnerCars.length === 0) return <div className="text-[13px] rounded-lg p-3" style={{ color: MUTE, background: PAPER, border: `1px solid ${PAPER_LINE}` }}>ยังไม่มีรถพาร์ทเนอร์ในกอง</div>;
  return (
    <div className="space-y-2">
      {partnerCars.map((c) => { const p = computePartnerPayout(c); return (
        <div key={c.id} className="rounded-lg p-3" style={{ background: PAPER, border: `1px solid ${PAPER_LINE}` }}>
          <div className="flex items-center gap-1.5 mb-2"><Handshake size={14} color="#3B5BA5" /><div className="text-[13px] font-semibold" style={{ color: INK }}>{c.plate} · {c.brand} {c.model}</div></div>
          <div className="text-[11.5px] mb-2" style={{ color: MUTE }}>เจ้าของ: {c.partnerName} · หักเพจ {c.commissionPct}% · หัก ณ ที่จ่าย {c.withholdingPct}%</div>
          <div className="text-[12px] space-y-1" style={{ color: MUTE }}>
            <div className="flex justify-between"><span>รายได้รวม</span><span className="font-mono" style={{ color: INK }}>{fmt(c.income)}</span></div>
            <div className="flex justify-between"><span>หัก %เข้าเพจ</span><span className="font-mono" style={{ color: INK }}>-{fmt(p.commission)}</span></div>
            <div className="flex justify-between"><span>หัก ณ ที่จ่าย</span><span className="font-mono" style={{ color: INK }}>-{fmt(p.withholding)}</span></div>
            <div className="flex justify-between"><span>หักค่าใช้จ่ายรถ (น้ำมัน/ล้าง/ซ่อม/ประกัน/GPS)</span><span className="font-mono" style={{ color: INK }}>-{fmt(p.carExp)}</span></div>
            <div className="flex justify-between font-semibold pt-1.5 border-t" style={{ borderColor: PAPER_LINE, color: INK }}><span>ยอดสุทธิจ่ายพาร์ทเนอร์</span><span className="font-mono">{fmt(p.netPayout)}</span></div>
          </div>
        </div>
      ); })}
    </div>
  );
}
function FinanceView({ cars, onSelect, setCars, overhead, setOverhead, bookings, scheduleEvents, otherExpenses, setOtherExpenses, claims, categories, setCategories, onBuyCar, wide }) {
  const [sub, setSub] = useState("cash");
  const subs = [{ k: "cash", l: "เงินสด/ค้างรับ" }, { k: "demand", l: "ความต้องการตลาด" }, { k: "expenses", l: "รายจ่ายอื่น" }, { k: "overview", l: "ภาพรวม" }, { k: "monthly", l: "รายเดือน" }, { k: "yearly", l: "รายปี (YTD)" }, { k: "partner", l: "พาร์ทเนอร์" }];
  return (
    <div className="p-4">
      <div className="flex gap-1.5 mb-4 flex-wrap">{subs.map((s) => (<button key={s.k} onClick={() => setSub(s.k)} className="text-[12px] px-2.5 py-1.5 rounded-full border font-medium" style={{ borderColor: sub === s.k ? "#3B5BA5" : PAPER_LINE, background: sub === s.k ? "#3B5BA5" : "transparent", color: sub === s.k ? PAPER : "#C9CDD3" }}>{s.l}</button>))}</div>
      {sub === "cash" && <CashFlowPanel cars={cars} overhead={overhead} bookings={bookings} otherExpenses={otherExpenses} claims={claims} categories={categories} />}
      {sub === "demand" && <DemandPanel cars={cars} bookings={bookings} wide={wide} />}
      {sub === "expenses" && <ExpensePanel otherExpenses={otherExpenses} setOtherExpenses={setOtherExpenses} yearMonth={APP_TODAY.slice(0, 7)} categories={categories} setCategories={setCategories} cars={cars} onBuyCar={onBuyCar} />}
      {sub === "overview" && <OverviewPanel cars={cars} onSelect={onSelect} setCars={setCars} scheduleEvents={scheduleEvents} />}
      {sub === "monthly" && <MonthlyPanel cars={cars} overhead={overhead} setOverhead={setOverhead} bookings={bookings} otherExpenses={otherExpenses} claims={claims} categories={categories} />}
      {sub === "yearly" && <YearlyPanel cars={cars} overhead={overhead} bookings={bookings} otherExpenses={otherExpenses} />}
      {sub === "partner" && <PartnerPanel cars={cars} />}
    </div>
  );
}

/* ================= export modal ================= */
function ExportModal({ role, cars, overhead, bookings, scheduleEvents, otherExpenses, claims, categories, onClose }) {
  useLockBodyScroll();
  const options = EXPORT_OPTIONS.filter((o) => o.roles.includes(role));
  const [selected, setSelected] = useState(new Set());
  const toggle = (k) => setSelected((prev) => { const n = new Set(prev); n.has(k) ? n.delete(k) : n.add(k); return n; });
  const handleDownload = () => {
    const xlsxSheets = [];
    selected.forEach((k) => {
      if (k === "fleet_customer") xlsxSheets.push(...buildFleetCustomerSheets(cars));
      if (k === "accounting_tax") xlsxSheets.push(...buildAccountingSheets(cars, overhead, bookings, otherExpenses));
      if (k === "investor_finance") xlsxSheets.push(...buildInvestorSheets(cars, overhead, bookings, scheduleEvents, otherExpenses));
      if (k === "raw_excel") xlsxSheets.push(...buildRawDataSheets(cars, overhead, bookings, scheduleEvents, otherExpenses, claims, categories));
    });
    if (xlsxSheets.length) buildAndDownloadWorkbook(xlsxSheets, `fleetdesk-export-${todayStr()}.xlsx`);
    if (selected.has("full_backup")) downloadJSON({ exportedAt: new Date().toISOString(), cars, overhead, bookings, scheduleEvents, otherExpenses, claims, categories }, `fleetdesk-backup-${todayStr()}.json`);
    onClose();
  };
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0" style={{ background: "#00000066" }} onClick={onClose} />
      <div className="relative w-full sm:max-w-sm lg:max-w-2xl rounded-t-2xl sm:rounded-2xl flex flex-col" style={{ background: PAPER, maxHeight: "85vh", minHeight: 0 }}>
        <div className="p-4 flex items-center justify-between border-b flex-shrink-0" style={{ borderColor: PAPER_LINE, background: PAPER }}><div className="font-semibold text-[15px] flex items-center gap-1.5" style={{ color: INK }}><Download size={17} />ส่งออกข้อมูล</div><button onClick={onClose} className="p-1.5 rounded-full hover:bg-black/5"><X size={18} color={INK} /></button></div>
        <div className="p-4 flex-1 min-h-0 overflow-y-auto" style={{ WebkitOverflowScrolling: "touch", touchAction: "pan-y", overscrollBehavior: "contain" }}>
          <div className="text-[11.5px] mb-3" style={{ color: MUTE }}>เลือกได้มากกว่า 1 อย่าง — ไฟล์ Excel จะรวมเป็นไฟล์เดียว แยกเป็นแต่ละชีท</div>
          <div className="space-y-2 mb-4">{options.map((o) => (
            <label key={o.key} className="flex items-start gap-2.5 rounded-lg p-3 cursor-pointer" style={{ background: selected.has(o.key) ? "#3B5BA514" : "#FFFFFF80", border: `1px solid ${selected.has(o.key) ? "#3B5BA5" : PAPER_LINE}` }}>
              <input type="checkbox" className="mt-0.5" checked={selected.has(o.key)} onChange={() => toggle(o.key)} />
              <div><div className="text-[13px] font-medium" style={{ color: INK }}>{o.label} <span className="text-[10px] font-mono" style={{ color: MUTE }}>· {o.type.toUpperCase()}</span></div><div className="text-[11px] mt-0.5" style={{ color: MUTE }}>{o.desc}</div></div>
            </label>
          ))}</div>
          <button onClick={handleDownload} disabled={selected.size === 0} className="w-full py-2.5 rounded-lg text-[13px] font-semibold flex items-center justify-center gap-1.5" style={{ background: selected.size === 0 ? PAPER_LINE : INK, color: selected.size === 0 ? MUTE : PAPER }}><Download size={14} />ดาวน์โหลด</button>
        </div>
        <div className="p-4 pt-3 flex-shrink-0 border-t" style={{ borderColor: PAPER_LINE }}>
          <button onClick={onClose} className="w-full py-2.5 rounded-lg text-[13px] font-semibold flex items-center justify-center gap-1.5" style={{ border: `1px solid ${PAPER_LINE}`, color: INK }}><X size={14} />ปิดหน้าต่าง</button>
        </div>
      </div>
    </div>
  );
}

/* ================= accounts manager ================= */
function AccountsManager({ accounts, setAccounts, currentId, onClose }) {
  useLockBodyScroll();
  const [name, setName] = useState(""); const [email, setEmail] = useState(""); const [role, setRole] = useState("staff");
  const inputCls = "w-full text-[12.5px] rounded-md px-2 py-1.5 outline-none"; const inputStyle = { background: "#FFFFFF", border: `1px solid ${PAPER_LINE}`, color: INK };
  const add = () => { if (!name.trim() || !email.trim()) return; setAccounts((prev) => [...prev, { id: `u${accountCounter++}`, name, email, role }]); setName(""); setEmail(""); };
  const remove = (id) => { if (id === currentId) return; setAccounts((prev) => prev.filter((a) => a.id !== id)); };
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0" style={{ background: "#00000066" }} onClick={onClose} />
      <div className="relative w-full sm:max-w-sm lg:max-w-2xl rounded-t-2xl sm:rounded-2xl flex flex-col" style={{ background: PAPER, maxHeight: "85vh", minHeight: 0 }}>
        <div className="p-4 flex items-center justify-between border-b flex-shrink-0" style={{ borderColor: PAPER_LINE, background: PAPER }}><div className="font-semibold text-[15px] flex items-center gap-1.5" style={{ color: INK }}><Users size={16} />จัดการบัญชีผู้ใช้</div><button onClick={onClose} className="p-1.5 rounded-full hover:bg-black/5"><X size={18} color={INK} /></button></div>
        <div className="p-4 flex-1 min-h-0 overflow-y-auto" style={{ WebkitOverflowScrolling: "touch", touchAction: "pan-y", overscrollBehavior: "contain" }}>
          <div className="space-y-2 mb-4">{accounts.map((a) => (
            <div key={a.id} className="flex items-center gap-2 rounded-lg p-2.5" style={{ background: "#FFFFFF80", border: `1px solid ${PAPER_LINE}` }}>
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold flex-shrink-0" style={{ background: ROLE_COLOR[a.role], color: PAPER }}>{a.name[0]}</div>
              <div className="flex-1 min-w-0"><div className="text-[12.5px] font-medium truncate" style={{ color: INK }}>{a.name}</div><div className="text-[10.5px] truncate" style={{ color: MUTE }}>{a.email}</div></div>
              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full flex-shrink-0" style={{ color: ROLE_COLOR[a.role], background: `${ROLE_COLOR[a.role]}1a` }}>{ROLE_LABEL[a.role]}</span>
              {a.id !== currentId && <button onClick={() => remove(a.id)} className="p-1 flex-shrink-0" style={{ color: "#C1502E" }}><Trash2 size={14} /></button>}
            </div>
          ))}</div>
          <div className="rounded-lg p-3" style={{ background: "#FFFFFF80", border: `1px solid ${PAPER_LINE}` }}>
            <div className="text-[12px] font-semibold mb-2" style={{ color: INK }}>เพิ่มบัญชีใหม่</div>
            <input className={`${inputCls} mb-2`} style={inputStyle} placeholder="ชื่อ" value={name} onChange={(e) => setName(e.target.value)} />
            <input className={`${inputCls} mb-2`} style={inputStyle} placeholder="อีเมล" value={email} onChange={(e) => setEmail(e.target.value)} />
            <div className="flex gap-1.5 mb-2">{Object.keys(ROLE_LABEL).map((r) => (<button key={r} onClick={() => setRole(r)} className="flex-1 text-[11px] py-1.5 rounded-full border" style={{ borderColor: ROLE_COLOR[r], background: role === r ? ROLE_COLOR[r] : "transparent", color: role === r ? PAPER : ROLE_COLOR[r] }}>{ROLE_LABEL[r]}</button>))}</div>
            <button onClick={add} className="w-full py-2 rounded-lg text-[12.5px] font-semibold" style={{ background: INK, color: PAPER }}>เพิ่มบัญชี (รหัสผ่านเดโม: {DEMO_PASSWORD})</button>
          </div>
        </div>
        <div className="p-4 pt-3 flex-shrink-0 border-t" style={{ borderColor: PAPER_LINE }}>
          <button onClick={onClose} className="w-full py-2.5 rounded-lg text-[13px] font-semibold flex items-center justify-center gap-1.5" style={{ border: `1px solid ${PAPER_LINE}`, color: INK }}><X size={14} />ปิดหน้าต่าง</button>
        </div>
      </div>
    </div>
  );
}

function SettingsModal({ termsText, setTermsText, bankInfo, setBankInfo, onClose }) {
  useLockBodyScroll();
  const [draftTerms, setDraftTerms] = useState(termsText);
  const inputCls = "w-full text-[12.5px] rounded-md px-2 py-1.5 outline-none"; const inputStyle = { background: "#FFFFFF", border: `1px solid ${PAPER_LINE}`, color: INK };
  const updateBank = (i, k, v) => setBankInfo((prev) => prev.map((b, idx) => idx === i ? { ...b, [k]: v } : b));
  const removeBank = (i) => setBankInfo((prev) => prev.filter((_, idx) => idx !== i));
  const addBank = () => setBankInfo((prev) => [...prev, { bank: "", accountNo: "", accountName: "" }]);
  const saveTerms = () => setTermsText(draftTerms);
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0" style={{ background: "#00000066" }} onClick={onClose} />
      <div className="relative w-full sm:max-w-sm lg:max-w-2xl rounded-t-2xl sm:rounded-2xl flex flex-col" style={{ background: PAPER, maxHeight: "85vh", minHeight: 0 }}>
        <div className="p-4 flex items-center justify-between border-b flex-shrink-0" style={{ borderColor: PAPER_LINE, background: PAPER }}><div className="font-semibold text-[15px] flex items-center gap-1.5" style={{ color: INK }}><Settings size={16} />แก้ไขเงื่อนไข/บัญชี</div><button onClick={onClose} className="p-1.5 rounded-full hover:bg-black/5"><X size={18} color={INK} /></button></div>
        <div className="p-4 flex-1 min-h-0 overflow-y-auto" style={{ WebkitOverflowScrolling: "touch", touchAction: "pan-y", overscrollBehavior: "contain" }}>
          <div className="text-[12px] font-semibold mb-2" style={{ color: INK }}>เงื่อนไขการเช่ารถ</div>
          <textarea rows={10} className="w-full text-[12px] rounded-md p-2.5 outline-none mb-2 font-mono" style={{ background: "#FFFFFF", border: `1px solid ${PAPER_LINE}`, color: INK }} value={draftTerms} onChange={(e) => setDraftTerms(e.target.value)} />
          <button onClick={saveTerms} className="w-full mb-5 py-2 rounded-lg text-[12.5px] font-semibold" style={{ background: INK, color: PAPER }}>บันทึกเงื่อนไข</button>

          <div className="text-[12px] font-semibold mb-2" style={{ color: INK }}>บัญชีธนาคารสำหรับโอนเงิน</div>
          <div className="space-y-2 mb-2">{bankInfo.map((b, i) => (
            <div key={i} className="rounded-md p-2.5" style={{ background: "#FFFFFF80", border: `1px solid ${PAPER_LINE}` }}>
              <input className={`${inputCls} mb-1.5`} style={inputStyle} placeholder="ธนาคาร เช่น กสิกรไทย (KBank)" value={b.bank} onChange={(e) => updateBank(i, "bank", e.target.value)} />
              <input className={`${inputCls} mb-1.5`} style={inputStyle} placeholder="เลขบัญชี" value={b.accountNo} onChange={(e) => updateBank(i, "accountNo", e.target.value)} />
              <div className="flex items-center gap-1.5">
                <input className={inputCls} style={inputStyle} placeholder="ชื่อบัญชี" value={b.accountName} onChange={(e) => updateBank(i, "accountName", e.target.value)} />
                <button onClick={() => removeBank(i)} className="p-1.5 rounded flex-shrink-0" style={{ color: "#C1502E" }}><Trash2 size={14} /></button>
              </div>
            </div>
          ))}</div>
          <button onClick={addBank} className="w-full py-2 rounded-lg text-[12.5px] font-semibold flex items-center justify-center gap-1" style={{ border: `1px solid ${PAPER_LINE}`, color: INK }}><Plus size={13} />เพิ่มบัญชี</button>
        </div>
        <div className="p-4 pt-3 flex-shrink-0 border-t" style={{ borderColor: PAPER_LINE }}>
          <button onClick={onClose} className="w-full py-2.5 rounded-lg text-[13px] font-semibold flex items-center justify-center gap-1.5" style={{ border: `1px solid ${PAPER_LINE}`, color: INK }}><X size={14} />ปิดหน้าต่าง</button>
        </div>
      </div>
    </div>
  );
}

/* ================= public homepage ================= */
// Placeholder company landing page. Structure follows a standard rental-company site;
// visual design is intentionally simple so it can be replaced with a real design later.
const COMPANY = {
  name: "ไทยรถเช่า",
  tagline: "เช่ารถง่าย ราคาตรงไปตรงมา รับรถได้ถึงสนามบิน",
  phone: "093-421-2761",
  lineId: "@thairentcar",
  email: "contact@thairentcar.example",
  address: "กรุงเทพฯ · นนทบุรี · สมุทรปราการ",
};
function HomePage({ cars, onBook, onStaffLogin }) {
  const [wideHome, setWideHome] = useState(() => { const p = loadLayoutPref(); return p === "desktop" ? true : p === "mobile" ? false : null; });
  const [winW, setWinW] = useState(typeof window !== "undefined" ? window.innerWidth : 1024);
  useEffect(() => {
    const onResize = () => setWinW(window.innerWidth);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  const wide = wideHome !== null ? wideHome : winW >= 1024;

  const available = cars.filter((c) => c.status === "available").slice(0, wide ? 4 : 3);
  const minRate = cars.length ? Math.min(...cars.map((c) => c.rate)) : 0;
  const features = [
    { icon: ShieldCheck, title: "ประกันชั้น 1 ทุกคัน", desc: "ขับสบายใจ มีประกันคุ้มครองเต็มรูปแบบ" },
    { icon: MapPin, title: "รับ-ส่งถึงที่", desc: "สนามบิน สถานีขนส่ง หรือจุดที่นัดหมาย" },
    { icon: Wallet, title: "ราคาชัดเจน", desc: "แจ้งราคารวมก่อนจอง ไม่มีค่าใช้จ่ายแอบแฝง" },
    { icon: Sparkles, title: "รถสะอาดพร้อมใช้", desc: "ล้างและตรวจเช็คสภาพก่อนส่งมอบทุกครั้ง" },
  ];
  const steps = [
    { n: 1, title: "เลือกวันและรถ", desc: "เช็ควันว่างและราคาได้เองตลอด 24 ชม." },
    { n: 2, title: "ส่งคำขอจอง", desc: "กรอกข้อมูล แนบตั๋วเดินทาง รับทราบเงื่อนไข" },
    { n: 3, title: "โอนมัดจำ", desc: "โอนเพื่อล็อกคิวรถ แล้วแนบสลิปยืนยัน" },
    { n: 4, title: "รับรถ", desc: "เจอกันตามจุดนัด เซ็นสัญญา แล้วออกเดินทาง" },
  ];

  return (
    <div className="min-h-screen w-full overflow-x-hidden" style={{ background: PAPER }}>
      <style>{FONTS}</style>

      {/* top bar */}
      <div className="sticky top-0 z-20" style={{ background: BOARD }}>
        <div className={`${wide ? "max-w-5xl" : "max-w-md"} mx-auto px-4 py-3 flex items-center justify-between`}>
          <div style={{ fontFamily: "'Oswald', sans-serif", letterSpacing: "0.03em" }} className="text-lg font-bold uppercase text-white">{COMPANY.name}</div>
          <div className="flex items-center gap-2">
            <button onClick={() => { const next = !wide; setWideHome(next); saveLayoutPref(next ? "desktop" : "mobile"); }} title={`กว้าง ${winW}px`} className="text-[11px] px-2 py-1.5 rounded-md flex items-center gap-1" style={{ color: "#9BA0A8" }}><Eye size={12} />{wide ? "มือถือ" : "คอม"}</button>
            <button onClick={onBook} className="text-[12px] font-semibold px-3 py-1.5 rounded-full" style={{ background: PAPER, color: INK }}>จองรถ</button>
          </div>
        </div>
      </div>

      {/* hero */}
      <div style={{ background: BOARD, backgroundImage: "radial-gradient(#3A3E45 1px, transparent 1px)", backgroundSize: "16px 16px" }}>
        <div className={`${wide ? "max-w-5xl" : "max-w-md"} mx-auto px-4 pt-8 pb-10 ${wide ? "flex items-center gap-8" : ""}`}>
          <div className={wide ? "flex-1" : ""}>
            <div className="text-[11px] mb-2 inline-block px-2 py-1 rounded-full" style={{ background: "#3A7D5C22", color: "#7DBF9E" }}>ว่างพร้อมให้เช่า {cars.filter((c) => c.status === "available").length} คัน</div>
            <h1 style={{ fontFamily: "'Oswald', sans-serif", lineHeight: 1.15 }} className={`${wide ? "text-4xl" : "text-2xl"} font-bold text-white mb-3`}>
              {COMPANY.tagline}
            </h1>
            <p className="text-[13px] mb-5" style={{ color: "#C9CDD3" }}>
              เริ่มต้นเพียง <span className="font-mono font-bold text-white">{fmt(minRate)}</span> บาท/วัน · จองออนไลน์ได้เอง ไม่ต้องรอแอดมินตอบ
            </p>
            <div className="flex flex-wrap gap-2">
              <button onClick={onBook} className="px-5 py-3 rounded-lg text-[13px] font-semibold flex items-center gap-2" style={{ background: PAPER, color: INK }}>
                <CalendarDays size={16} />เช็ครถว่าง &amp; จองเลย
              </button>
              <a href={`tel:${COMPANY.phone}`} className="px-5 py-3 rounded-lg text-[13px] font-semibold flex items-center gap-2" style={{ border: "1px solid #FFFFFF44", color: "#FFFFFF" }}>
                <Phone size={16} />{COMPANY.phone}
              </a>
            </div>
          </div>
          {wide && (
            <div className="flex-1 grid grid-cols-2 gap-3">
              {available.slice(0, 4).map((car) => (
                <div key={car.id} className="rounded-lg p-2" style={{ background: PAPER }}>
                  <CarPanelIcon car={car} />
                  <div className="text-[11.5px] font-semibold mt-1.5 truncate" style={{ color: INK }}>{car.brand} {car.model}</div>
                  <div className="text-[10.5px]" style={{ color: MUTE }}>{fmt(car.rate)} บาท/วัน</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* features */}
      <div className={`${wide ? "max-w-5xl" : "max-w-md"} mx-auto px-4 py-8`}>
        <div className={`grid gap-3 ${wide ? "grid-cols-4" : "grid-cols-2"}`}>
          {features.map((f) => (
            <div key={f.title} className="rounded-lg p-3" style={{ background: "#FFFFFF80", border: `1px solid ${PAPER_LINE}` }}>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-2" style={{ background: "#3B5BA514" }}><f.icon size={16} color="#3B5BA5" /></div>
              <div className="text-[12.5px] font-semibold mb-0.5" style={{ color: INK }}>{f.title}</div>
              <div className="text-[11px]" style={{ color: MUTE }}>{f.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* featured cars */}
      <div className={`${wide ? "max-w-5xl" : "max-w-md"} mx-auto px-4 pb-8`}>
        <div className="flex items-baseline justify-between mb-3">
          <h2 className="text-[15px] font-bold" style={{ color: INK }}>รถที่ว่างตอนนี้</h2>
          <button onClick={onBook} className="text-[12px] font-medium" style={{ color: "#3B5BA5" }}>ดูทั้งหมด →</button>
        </div>
        <div className={`grid gap-3 ${wide ? "grid-cols-4" : "grid-cols-2"}`}>
          {available.map((car) => {
            const colorObj = COLORS.find((c) => c.key === car.color);
            return (
              <button key={car.id} onClick={onBook} className="text-left rounded-lg p-2.5" style={{ background: "#FFFFFF80", border: `1px solid ${PAPER_LINE}` }}>
                <CarPanelIcon car={car} />
                <div className="flex items-center gap-1.5 mt-2">
                  <div className="text-[12.5px] font-semibold truncate" style={{ color: INK }}>{car.brand} {car.model}</div>
                  {colorObj && <span className="w-2.5 h-2.5 rounded-full border flex-shrink-0" style={{ background: colorObj.hex, borderColor: PAPER_LINE }} />}
                </div>
                <div className="text-[10.5px] mb-1.5" style={{ color: MUTE }}>{car.category} · {car.fuel} · {car.doors}</div>
                <div className="font-mono font-bold text-[13px]" style={{ color: "#3A7D5C" }}>{fmt(car.rate)} <span className="text-[10px] font-sans font-normal" style={{ color: MUTE }}>บาท/วัน</span></div>
              </button>
            );
          })}
        </div>
      </div>

      {/* how it works */}
      <div style={{ background: "#FFFFFF80", borderTop: `1px solid ${PAPER_LINE}`, borderBottom: `1px solid ${PAPER_LINE}` }}>
        <div className={`${wide ? "max-w-5xl" : "max-w-md"} mx-auto px-4 py-8`}>
          <h2 className="text-[15px] font-bold mb-4" style={{ color: INK }}>เช่ารถกับเราง่ายๆ 4 ขั้นตอน</h2>
          <div className={`grid gap-3 ${wide ? "grid-cols-4" : "grid-cols-1"}`}>
            {steps.map((s) => (
              <div key={s.n} className="flex gap-3 items-start">
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-[12px] font-bold flex-shrink-0" style={{ background: "#3B5BA5", color: PAPER }}>{s.n}</div>
                <div>
                  <div className="text-[12.5px] font-semibold" style={{ color: INK }}>{s.title}</div>
                  <div className="text-[11px]" style={{ color: MUTE }}>{s.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* contact + CTA */}
      <div className={`${wide ? "max-w-5xl" : "max-w-md"} mx-auto px-4 py-8`}>
        <div className="rounded-xl p-5 text-center" style={{ background: BOARD }}>
          <div className="text-[16px] font-bold text-white mb-1">พร้อมออกเดินทางแล้วใช่มั้ย?</div>
          <div className="text-[12px] mb-4" style={{ color: "#C9CDD3" }}>เช็ควันว่างและราคาได้เลย ใช้เวลาไม่ถึง 2 นาที</div>
          <button onClick={onBook} className="px-6 py-3 rounded-lg text-[13px] font-semibold" style={{ background: PAPER, color: INK }}>เช็ครถว่าง &amp; จองเลย</button>
          <div className="mt-4 pt-4 flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 text-[11.5px]" style={{ borderTop: "1px solid #FFFFFF22", color: "#C9CDD3" }}>
            <span className="flex items-center gap-1"><Phone size={12} />{COMPANY.phone}</span>
            <span className="flex items-center gap-1"><MessageSquare size={12} />LINE {COMPANY.lineId}</span>
            <span className="flex items-center gap-1"><Mail size={12} />{COMPANY.email}</span>
          </div>
        </div>
      </div>

      {/* footer with discreet staff entry */}
      <div style={{ borderTop: `1px solid ${PAPER_LINE}` }}>
        <div className={`${wide ? "max-w-5xl" : "max-w-md"} mx-auto px-4 py-5 flex flex-wrap items-center justify-between gap-2`}>
          <div className="text-[11px]" style={{ color: MUTE }}>© 2569 {COMPANY.name} · {COMPANY.address}</div>
          <button onClick={onStaffLogin} className="text-[11px] flex items-center gap-1" style={{ color: MUTE }}><Lock size={11} />สำหรับเจ้าหน้าที่</button>
        </div>
      </div>
    </div>
  );
}

/* ================= customer self-service ================= */
function CustomerAvailabilityView({ cars, scheduleEvents, onExit, onSubmitBooking, termsText, bankInfo }) {
  const [date, setDate] = useState(APP_TODAY);
  const [forcedWide, setForcedWide] = useState(() => { const p = loadLayoutPref(); return p === "desktop" ? true : p === "mobile" ? false : null; });
  const [winW, setWinW] = useState(typeof window !== "undefined" ? window.innerWidth : 1024);
  useEffect(() => {
    const onResize = () => setWinW(window.innerWidth);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  const wideView = forcedWide !== null ? forcedWide : winW >= 1024;
  const [bookingCar, setBookingCar] = useState(null);
  const [galleryCar, setGalleryCar] = useState(null);
  useLockBodyScroll(!!bookingCar);
  const [reqForm, setReqForm] = useState({ firstName: "", lastName: "", phone: "", email: "", startDate: APP_TODAY, startTime: "09:00", endDate: APP_TODAY, endTime: "18:00", pickupLocation: "", returnLocation: "", travelTicketUrl: "", noTicket: false, termsAccepted: false, reservationSlipUrl: "" });
  const [submitted, setSubmitted] = useState(null);
  const DISPLAY_START = 7, DISPLAY_END = 22;

  // PRIVACY: the public page must never expose who booked a car. Strip every event down
  // to time ranges only — no names, phone numbers, notes or booking ids — BEFORE the UI
  // can touch it, so a future UI change cannot accidentally leak another customer's data.
  const publicEvents = scheduleEvents.map((e) => ({
    carId: e.carId, date: e.date, startHour: e.startHour, endHour: e.endHour,
    kind: e.type === "booked" ? "taken" : e.type === "clean" ? "prep" : "unavailable",
  }));

  // Says only THAT a car is unavailable, never who has it or why in customer terms.
  const busyReason = (car) => {
    if (car.status === "maintenance") return "รถเข้าอู่ซ่อมบำรุง";
    if (car.status === "wash") return "รถอยู่ระหว่างเตรียมความพร้อม";
    const evs = publicEvents.filter((e) => e.carId === car.id && e.date === date);
    if (evs.some((e) => e.kind === "taken")) return "มีผู้เช่าแล้วในวันนี้";
    if (evs.some((e) => e.kind === "prep")) return "อยู่ระหว่างเตรียมรถ";
    if (evs.length) return "ไม่พร้อมให้บริการในวันนี้";
    return "ไม่ว่างในวันที่เลือก";
  };

  const availabilityFor = (carId) => {
    // reads the sanitised list, not raw bookings
    const busyRaw = publicEvents.filter((e) => e.carId === carId && e.date === date).map((e) => [e.startHour, e.endHour]);
    const busy = mergeIntervals(busyRaw.map(([s, e]) => [Math.max(s, DISPLAY_START), Math.min(e, DISPLAY_END)]).filter(([s, e]) => e > s));
    const free = getFreeWindows(busy, DISPLAY_START, DISPLAY_END);
    return { busy, free };
  };
  const hasConflict = (carId, startDate, startTime, endDate, endTime) => {
    const startH = parseInt((startTime || "00:00").split(":")[0], 10);
    const endH = parseInt((endTime || "00:00").split(":")[0], 10) || 24;
    let d = startDate; let safety = 0;
    while (safety++ < 60) {
      const isFirst = d === startDate, isLast = d === endDate;
      const sh = isFirst ? startH : 0; const eh = isLast ? endH : 24;
      const merged = mergeIntervals(publicEvents.filter((e) => e.carId === carId && e.date === d).map((e) => [e.startHour, e.endHour]));
      if (merged.some(([s, e]) => s < eh && e > sh)) return true;
      if (d === endDate) break;
      d = addDays(d, 1);
    }
    return false;
  };

  const openBooking = (car) => { setBookingCar(car); setReqForm((p) => ({ ...p, startDate: date, endDate: date })); };
  const rangeInvalid = reqForm.endDate < reqForm.startDate;
  const conflict = bookingCar && !rangeInvalid && hasConflict(bookingCar.id, reqForm.startDate, reqForm.startTime, reqForm.endDate, reqForm.endTime);
  const liveTotal = bookingCar && !rangeInvalid ? calcBookingTotal(reqForm, bookingCar) : null;
  // Deposit slip is mandatory: the slot is only held once money has actually moved.
  const missingRequired = !reqForm.firstName.trim() || !reqForm.phone.trim() || !reqForm.pickupLocation.trim() || !reqForm.returnLocation.trim() || (!reqForm.noTicket && !reqForm.travelTicketUrl.trim()) || !reqForm.termsAccepted || !reqForm.reservationSlipUrl;
  const canSubmit = bookingCar && !rangeInvalid && !conflict && !reqForm.noTicket && !missingRequired;

  const submitRequest = () => {
    // re-check conflict right before writing — guards against another booking landing in the moment between opening this modal and pressing submit
    if (!canSubmit || hasConflict(bookingCar.id, reqForm.startDate, reqForm.startTime, reqForm.endDate, reqForm.endTime)) return;
    const booking = {
      id: `bk${bookingCounter++}`, status: "pending", bookingSource: "customer",
      firstName: reqForm.firstName, lastName: reqForm.lastName, phone: reqForm.phone, email: reqForm.email || "",
      carId: bookingCar.id, startDate: reqForm.startDate, startTime: reqForm.startTime, endDate: reqForm.endDate, endTime: reqForm.endTime,
      pickupLocation: reqForm.pickupLocation, returnLocation: reqForm.returnLocation,
      travelTicketUrl: reqForm.travelTicketUrl, termsAcceptedAt: new Date().toISOString(),
      reservationDeposit: bookingCar.reservationDeposit || 500, reservationDepositPaid: !!reqForm.reservationSlipUrl, reservationSlipUrl: reqForm.reservationSlipUrl, pickupDayPayment: null, pickupDayPaid: false,
      securityDeposit: bookingCar.securityDeposit || 0, securityDepositCollected: false, securityDepositRefunded: false, handoverPhotoUrl: "", returnSlipUrl: "",
      contractSigned: false, idCardOrLicense: "", notes: "จองผ่านหน้าลูกค้า (self-service) — รอเจ้าหน้าที่ตรวจสอบและยืนยัน",
      cancelReason: "", depositRefunded: false, createdBy: "ลูกค้า (จองเอง)",
    };
    onSubmitBooking(booking);
    setSubmitted({ car: bookingCar, ...reqForm, total: liveTotal });
  };

  if (submitted) {
    return (
      <div className="min-h-screen w-full overflow-x-hidden flex items-center justify-center p-4" style={{ background: BOARD, backgroundImage: "radial-gradient(#3A3E45 1px, transparent 1px)", backgroundSize: "16px 16px" }}>
        <style>{FONTS}</style>
        <div className="w-full max-w-sm rounded-2xl p-5" style={{ background: PAPER }}>
          <div className="text-center mb-3"><Check size={36} color="#3A7D5C" className="mx-auto mb-2" /><div className="text-[15px] font-semibold" style={{ color: INK }}>ส่งคำขอจองแล้ว — จองคิวไว้ให้แล้ว</div><div className="text-[12px]" style={{ color: MUTE }}>ทางร้านจะติดต่อกลับเพื่อยืนยันเร็วๆ นี้ค่ะ ช่วงเวลานี้ถูกล็อคไว้ให้คุณแล้ว รถคันนี้จะไม่แสดงว่างให้คนอื่นจองซ้ำ</div></div>
          <div className="rounded-lg p-3 mb-3 text-[12.5px] space-y-1" style={{ background: "#FFFFFF80", border: `1px solid ${PAPER_LINE}`, color: INK }}>
            <div>{submitted.car.brand} {submitted.car.model} ({(COLORS.find((c) => c.key === submitted.car.color) || {}).label})</div>
            <div>{formatThaiDateShort(submitted.startDate)} {submitted.startTime} ({submitted.pickupLocation}) → {formatThaiDateShort(submitted.endDate)} {submitted.endTime} ({submitted.returnLocation})</div>
            <div>{submitted.total.days}วัน {submitted.total.extraHours}ชม · ราคาโดยประมาณ: <b>{fmt(submitted.total.total)} บาท</b></div>
          </div>
          <div className="rounded-lg p-3 mb-4 text-[12px]" style={{ background: "#3B5BA514", color: "#3B5BA5" }}>{reqForm.reservationSlipUrl ? "ได้รับสลิปโอนมัดจำแล้ว ทางร้านกำลังตรวจสอบค่ะ" : `กรุณาโอนมัดจำ ${fmt(submitted.car.reservationDeposit || 500)} บาท แล้วแจ้งสลิปกับทางร้าน:`}<br />{!reqForm.reservationSlipUrl && bankInfo.map((b, i) => <div key={i}>{b.bank} {b.accountNo} ({b.accountName})</div>)}</div>
          <button onClick={onExit} className="w-full py-2.5 rounded-lg text-[13px] font-semibold" style={{ background: INK, color: PAPER }}>กลับหน้าหลัก</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full overflow-x-hidden" style={{ background: BOARD, backgroundImage: "radial-gradient(#3A3E45 1px, transparent 1px)", backgroundSize: "16px 16px" }}>
      <style>{FONTS}</style>
      <div className={`${wideView ? "max-w-5xl" : "max-w-md"} mx-auto pb-8`}>
        <div className="px-4 pt-6 pb-3 flex items-center justify-between gap-2">
          <div><div style={{ fontFamily: "'Oswald', sans-serif", letterSpacing: "0.03em" }} className="text-xl font-bold uppercase text-white">เช็ครถว่าง</div><div className="text-[11px]" style={{ color: MUTE }}>มุมมองลูกค้า — ไม่ต้องเข้าสู่ระบบ</div></div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <button onClick={() => { const next = !wideView; setForcedWide(next); saveLayoutPref(next ? "desktop" : "mobile"); }} title={`กว้าง ${winW}px`} className="text-[11.5px] px-2.5 py-1.5 rounded-full flex items-center gap-1" style={{ background: PAPER, color: INK }}><Eye size={13} />{wideView ? "แบบมือถือ" : "แบบคอม"}</button>
            <button onClick={onExit} className="text-[12px] px-2.5 py-1.5 rounded-full flex items-center gap-1" style={{ background: PAPER, color: INK }}><ChevronLeft size={13} />หน้าแรก</button>
          </div>
        </div>
        <div className="px-4 pb-1 text-[11px]" style={{ color: "#C9CDD3" }}>เลือกวันเริ่มต้นเพื่อดูว่าง — ถ้าจะเช่าหลายวัน ปรับช่วงวันได้ตอนกดจอง</div>
        <div className="px-4 pb-3 flex items-center gap-2">
          <button onClick={() => setDate(addDays(date, -1))} className="p-1.5 rounded-full" style={{ background: PAPER }}><ChevronLeft size={16} color={INK} /></button>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="flex-1 text-[12.5px] rounded-md px-2 py-1.5 outline-none text-center" style={{ background: PAPER, border: `1px solid ${PAPER_LINE}`, color: INK }} />
          <button onClick={() => setDate(addDays(date, 1))} className="p-1.5 rounded-full" style={{ background: PAPER }}><ChevronRight size={16} color={INK} /></button>
        </div>
        <div className={`px-4 ${wideView ? "grid grid-cols-2 xl:grid-cols-3 gap-3 items-start" : "space-y-3"}`}>
          {cars.map((car) => {
            const { busy, free } = availabilityFor(car.id);
            const colorObj = COLORS.find((c) => c.key === car.color);
            const isFullyFree = busy.length === 0;
            const isFullyBusy = free.length === 0;
            return (
              <div key={car.id} className="rounded-lg p-3" style={{ background: PAPER, border: `1px solid ${PAPER_LINE}` }}>
                <div className="flex gap-3">
                  <button onClick={() => (car.photos && car.photos.length > 1) && setGalleryCar(car)} className="w-20 flex-shrink-0 relative text-left">
                    <CarPanelIcon car={car} />
                    {car.photos && car.photos.length > 1 && (
                      <span className="absolute bottom-0.5 right-0.5 text-[9px] px-1 py-0.5 rounded flex items-center gap-0.5" style={{ background: "#00000099", color: "#fff" }}>
                        <ImageIcon size={8} />{car.photos.length}
                      </span>
                    )}
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-[13.5px] flex items-center gap-1.5" style={{ color: INK }}>{car.brand} {car.model}{colorObj && <span className="w-2.5 h-2.5 rounded-full border" style={{ background: colorObj.hex, borderColor: PAPER_LINE }} />}</div>
                    <div className="text-[11px] mb-1" style={{ color: MUTE }}>{car.category} · {car.fuel} · {fmt(car.rate)} บาท/วัน</div>
                    <div className="relative h-6 rounded-md overflow-hidden mb-1.5" style={{ background: "#C1502E40" }}>
                      {free.map(([s, e], i) => (<div key={i} className="absolute top-0 bottom-0" style={{ left: `${((s - DISPLAY_START) / (DISPLAY_END - DISPLAY_START)) * 100}%`, width: `${((e - s) / (DISPLAY_END - DISPLAY_START)) * 100}%`, background: "#3A7D5C" }} />))}
                      <div className="absolute inset-0 flex items-center justify-between px-2 pointer-events-none">
                        <span className="text-[9px] font-medium" style={{ color: "#FFFFFFcc" }}>{DISPLAY_START}:00</span>
                        <span className="text-[9px] font-medium" style={{ color: "#FFFFFFcc" }}>{DISPLAY_END}:00</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Availability verdict — made large and unmissable so customers instantly
                    see whether they can book and, if not, exactly why. */}
                {isFullyBusy ? (
                  <div className="mt-3 rounded-xl p-3.5 text-center" style={{ background: "#C1502E", color: "#FFFFFF" }}>
                    <div className="text-[17px] font-bold mb-0.5">จองวันนี้ไม่ได้</div>
                    <div className="text-[12.5px]" style={{ color: "#FFFFFFdd" }}>{busyReason(car)}</div>
                    <div className="text-[11.5px] mt-1.5 pt-1.5" style={{ borderTop: "1px solid #FFFFFF33", color: "#FFFFFFcc" }}>ลองเลือกวันอื่น หรือดูรถคันอื่นที่ว่าง</div>
                  </div>
                ) : (
                  <button onClick={() => openBooking(car)} className="w-full mt-3 rounded-xl p-3.5" style={{ background: "#3A7D5C", color: "#FFFFFF" }}>
                    <div className="text-[18px] font-bold leading-tight">{fmt(car.rate)} บาท<span className="text-[13px] font-medium">/วัน</span></div>
                    <div className="text-[12.5px] mt-0.5" style={{ color: "#FFFFFFe6" }}>
                      {isFullyFree ? "ว่างทั้งวัน — จองได้เลย" : `ว่างช่วง ${free.map(([s, e]) => `${s}:00–${e}:00`).join(", ")}`}
                    </div>
                    <div className="text-[12px] font-semibold mt-2 pt-2 flex items-center justify-center gap-1" style={{ borderTop: "1px solid #FFFFFF33" }}>
                      แตะเพื่อจองคันนี้ <ChevronRight size={14} />
                    </div>
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
      {galleryCar && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center">
          <div className="absolute inset-0" style={{ background: "#000000cc" }} onClick={() => setGalleryCar(null)} />
          <div className="relative w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl flex flex-col" style={{ background: PAPER, maxHeight: "88vh", minHeight: 0 }}>
            <div className="p-4 flex items-center justify-between border-b flex-shrink-0" style={{ borderColor: PAPER_LINE }}>
              <div className="text-[14px] font-semibold" style={{ color: INK }}>{galleryCar.brand} {galleryCar.model} · {(galleryCar.photos || []).length} รูป</div>
              <button onClick={() => setGalleryCar(null)} className="p-1.5 rounded-full hover:bg-black/5"><X size={18} color={INK} /></button>
            </div>
            <div className="p-4 flex-1 min-h-0 overflow-y-auto grid grid-cols-2 gap-2" style={{ WebkitOverflowScrolling: "touch", touchAction: "pan-y", overscrollBehavior: "contain" }}>
              {(galleryCar.photos || []).map((p, i) => (
                <img key={i} src={p} alt={`รูปที่ ${i + 1}`} className="w-full h-32 object-cover rounded-md" style={{ border: `1px solid ${PAPER_LINE}` }} />
              ))}
            </div>
            <div className="p-4 pt-3 flex-shrink-0 border-t" style={{ borderColor: PAPER_LINE }}>
              <button onClick={() => { const cc = galleryCar; setGalleryCar(null); openBooking(cc); }} className="w-full py-2.5 rounded-lg text-[13px] font-semibold" style={{ background: INK, color: PAPER }}>จองคันนี้</button>
            </div>
          </div>
        </div>
      )}
      {bookingCar && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div className="absolute inset-0" style={{ background: "#00000066" }} onClick={() => setBookingCar(null)} />
          <div className="relative w-full sm:max-w-sm lg:max-w-2xl rounded-t-2xl sm:rounded-2xl flex flex-col" style={{ background: PAPER, maxHeight: "88vh", minHeight: 0 }}>
            <div className="p-4 flex items-center justify-between border-b flex-shrink-0" style={{ borderColor: PAPER_LINE, background: PAPER }}>
              <div className="text-[14px] font-semibold" style={{ color: INK }}>จอง {bookingCar.brand} {bookingCar.model}</div>
              <button onClick={() => setBookingCar(null)} className="p-1.5 rounded-full hover:bg-black/5"><X size={18} color={INK} /></button>
            </div>
            <div className="p-4 flex-1 min-h-0 overflow-y-auto" style={{ WebkitOverflowScrolling: "touch", touchAction: "pan-y", overscrollBehavior: "contain" }}>
            <div className="grid grid-cols-2 gap-2 mb-2">
              <input className="text-[13px] rounded-md px-2.5 py-2 outline-none" style={{ background: "#FFFFFF", border: `1px solid ${PAPER_LINE}`, color: INK }} placeholder="ชื่อ" value={reqForm.firstName} onChange={(e) => setReqForm((p) => ({ ...p, firstName: e.target.value }))} />
              <input className="text-[13px] rounded-md px-2.5 py-2 outline-none" style={{ background: "#FFFFFF", border: `1px solid ${PAPER_LINE}`, color: INK }} placeholder="นามสกุล" value={reqForm.lastName} onChange={(e) => setReqForm((p) => ({ ...p, lastName: e.target.value }))} />
            </div>
            <input className="w-full text-[13px] rounded-md px-2.5 py-2 outline-none mb-2" style={{ background: "#FFFFFF", border: `1px solid ${PAPER_LINE}`, color: INK }} placeholder="เบอร์โทร" value={reqForm.phone} onChange={(e) => setReqForm((p) => ({ ...p, phone: e.target.value }))} />
            <input className="w-full text-[13px] rounded-md px-2.5 py-2 outline-none mb-3" style={{ background: "#FFFFFF", border: `1px solid ${PAPER_LINE}`, color: INK }} placeholder="อีเมล (ถ้ามี)" value={reqForm.email} onChange={(e) => setReqForm((p) => ({ ...p, email: e.target.value }))} />
            <div className="grid grid-cols-2 gap-2 mb-2">
              <label><div className="text-[11px] mb-1" style={{ color: MUTE }}>วันรับรถ</div><input type="date" className="w-full text-[13px] rounded-md px-2.5 py-2 outline-none" style={{ background: "#FFFFFF", border: `1px solid ${PAPER_LINE}`, color: INK }} value={reqForm.startDate} onChange={(e) => setReqForm((p) => ({ ...p, startDate: e.target.value }))} /></label>
              <label><div className="text-[11px] mb-1" style={{ color: MUTE }}>เวลารับ</div><input type="time" className="w-full text-[13px] rounded-md px-2.5 py-2 outline-none" style={{ background: "#FFFFFF", border: `1px solid ${PAPER_LINE}`, color: INK }} value={reqForm.startTime} onChange={(e) => setReqForm((p) => ({ ...p, startTime: e.target.value }))} /></label>
            </div>
            <label className="block mb-2"><div className="text-[11px] mb-1 flex items-center gap-1" style={{ color: MUTE }}><MapPin size={11} />สถานที่รับรถ</div><input className="w-full text-[13px] rounded-md px-2.5 py-2 outline-none" style={{ background: "#FFFFFF", border: `1px solid ${PAPER_LINE}`, color: INK }} placeholder="เช่น สนามบิน, ขนส่ง" value={reqForm.pickupLocation} onChange={(e) => setReqForm((p) => ({ ...p, pickupLocation: e.target.value }))} /></label>
            <div className="grid grid-cols-2 gap-2 mb-2">
              <label><div className="text-[11px] mb-1" style={{ color: MUTE }}>วันคืนรถ</div><input type="date" min={reqForm.startDate} className="w-full text-[13px] rounded-md px-2.5 py-2 outline-none" style={{ background: "#FFFFFF", border: `1px solid ${PAPER_LINE}`, color: INK }} value={reqForm.endDate} onChange={(e) => setReqForm((p) => ({ ...p, endDate: e.target.value }))} /></label>
              <label><div className="text-[11px] mb-1" style={{ color: MUTE }}>เวลาคืน</div><input type="time" className="w-full text-[13px] rounded-md px-2.5 py-2 outline-none" style={{ background: "#FFFFFF", border: `1px solid ${PAPER_LINE}`, color: INK }} value={reqForm.endTime} onChange={(e) => setReqForm((p) => ({ ...p, endTime: e.target.value }))} /></label>
            </div>
            <label className="block mb-3"><div className="text-[11px] mb-1 flex items-center gap-1" style={{ color: MUTE }}><MapPin size={11} />สถานที่คืนรถ</div><input className="w-full text-[13px] rounded-md px-2.5 py-2 outline-none" style={{ background: "#FFFFFF", border: `1px solid ${PAPER_LINE}`, color: INK }} placeholder="เช่น สนามบิน, ขนส่ง" value={reqForm.returnLocation} onChange={(e) => setReqForm((p) => ({ ...p, returnLocation: e.target.value }))} /></label>

            {rangeInvalid && <div className="text-[11.5px] mb-3 rounded-md p-2" style={{ background: "#C1502E14", color: "#C1502E" }}>วันคืนรถต้องไม่ก่อนวันรับรถ</div>}
            {!rangeInvalid && conflict && <div className="text-[11.5px] mb-3 rounded-md p-2" style={{ background: "#C1502E14", color: "#C1502E" }}>ช่วงเวลานี้รถคันนี้ไม่ว่างแล้ว (อาจมีคนจองไปก่อน) กรุณาเลือกคันอื่นหรือช่วงเวลาอื่น</div>}
            {!rangeInvalid && !conflict && liveTotal && <div className="text-[12px] mb-3 rounded-md p-2.5" style={{ background: "#3B5BA514", color: "#3B5BA5" }}>{liveTotal.days}วัน {liveTotal.extraHours}ชม · ราคาโดยประมาณ <b>{fmt(liveTotal.total)} บาท</b></div>}

            <div className="rounded-md p-3 mb-3" style={{ background: "#FFFFFF80", border: `1px solid ${PAPER_LINE}` }}>
              {!reqForm.noTicket && <PhotoAttach label="รูปตั๋วเดินทาง (เครื่องบิน/รถทัวร์) ที่มีชื่อคุณ" value={reqForm.travelTicketUrl} onChange={(v) => setReqForm((p) => ({ ...p, travelTicketUrl: v }))} hint="ถ่ายหรือแนบรูปตั๋ว/บอร์ดดิ้งพาส ให้เห็นชื่อคุณชัดเจน" />}
              <label className="flex items-center gap-2 text-[11.5px] mt-2" style={{ color: MUTE }}><input type="checkbox" checked={reqForm.noTicket} onChange={(e) => setReqForm((p) => ({ ...p, noTicket: e.target.checked, travelTicketUrl: "" }))} />ไม่มีตั๋ว (ขับรถส่วนตัวมาเอง)</label>
              {reqForm.noTicket && <div className="text-[11.5px] mt-2 rounded-md p-2" style={{ background: "#D69A2D14", color: "#D69A2D" }}>ถ้าไม่มีตั๋วเดินทาง ระบบจองออนไลน์ยังไม่รองรับกรณีนี้ค่ะ กรุณาทักแชทติดต่อทางร้านโดยตรงเพื่อให้เจ้าหน้าที่จองให้แทน</div>}
            </div>

            <div className="rounded-md p-3 mb-3" style={{ background: "#FFFFFF80", border: `1px solid ${PAPER_LINE}` }}>
              <div className="text-[12px] font-medium mb-1.5" style={{ color: INK }}>เงื่อนไขการเช่ารถ</div>
              <div className="text-[11px] whitespace-pre-line max-h-24 overflow-y-auto mb-2 pr-1" style={{ color: MUTE, WebkitOverflowScrolling: "touch" }}>{termsText}</div>
              <label className="flex items-center gap-2 text-[12px] font-medium" style={{ color: INK }}><input type="checkbox" checked={reqForm.termsAccepted} onChange={(e) => setReqForm((p) => ({ ...p, termsAccepted: e.target.checked }))} />ฉันอ่านและรับทราบเงื่อนไขการเช่ารถแล้ว</label>
            </div>

            <div className="rounded-md p-3 mb-3" style={{ background: "#3B5BA514", border: "1px solid #3B5BA533" }}>
              <div className="text-[12.5px] font-semibold mb-1.5 flex items-center gap-1.5" style={{ color: "#3B5BA5" }}><PiggyBank size={14} />โอนมัดจำเพื่อล็อคคิวจอง (บังคับ)</div>
              <div className="text-[12px] mb-2" style={{ color: INK }}>มัดจำจอง: <b className="font-mono">{fmt(bookingCar.reservationDeposit || 500)} บาท</b> <span style={{ color: MUTE }}>(หักออกจากยอดรวมวันรับรถ)</span><br />มัดจำค้ำประกัน: <b className="font-mono">{fmt(bookingCar.securityDeposit || 0)} บาท</b> <span style={{ color: MUTE }}>(เก็บวันรับรถ คืนให้วันคืนรถ)</span></div>
              <div className="rounded-md p-2 mb-2 text-[11.5px] space-y-0.5" style={{ background: "#FFFFFF", border: `1px solid ${PAPER_LINE}`, color: INK }}>
                {bankInfo.map((b, i) => <div key={i}>{b.bank} · {b.accountNo} · {b.accountName}</div>)}
              </div>
              <PhotoAttach label="สลิปโอนมัดจำ (จำเป็น — ต้องโอนก่อนจึงจะส่งคำขอได้)" value={reqForm.reservationSlipUrl} onChange={(v) => setReqForm((p) => ({ ...p, reservationSlipUrl: v }))} />
            </div>

            {!reqForm.noTicket && missingRequired && (
              <div className="rounded-md p-3 mb-3 text-[11.5px]" style={{ background: "#C1502E0f", border: "1px solid #C1502E33" }}>
                <div className="font-medium mb-1" style={{ color: "#C1502E" }}>กรอก/แนบให้ครบก่อนส่งคำขอ:</div>
                <ul className="space-y-0.5" style={{ color: "#C1502E" }}>
                  {!reqForm.firstName.trim() && <li>• ชื่อ</li>}
                  {!reqForm.phone.trim() && <li>• เบอร์โทร</li>}
                  {!reqForm.pickupLocation.trim() && <li>• สถานที่รับรถ</li>}
                  {!reqForm.returnLocation.trim() && <li>• สถานที่คืนรถ</li>}
                  {!reqForm.travelTicketUrl.trim() && <li>• รูปตั๋วเดินทาง (แตะกล่องด้านบนเพื่อถ่าย/แนบรูป)</li>}
                  {!reqForm.termsAccepted && <li>• ติ๊กรับทราบเงื่อนไขการเช่ารถ</li>}
                  {!reqForm.reservationSlipUrl && <li>• สลิปโอนมัดจำ (ต้องโอนก่อนจึงจะจองได้)</li>}
                </ul>
              </div>
            )}

            </div>
            <div className="p-4 pt-3 flex-shrink-0 border-t" style={{ borderColor: PAPER_LINE }}>
              <div className="flex gap-2"><button onClick={() => setBookingCar(null)} className="flex-1 py-2.5 rounded-lg text-[12.5px]" style={{ border: `1px solid ${PAPER_LINE}`, color: INK }}>ยกเลิก</button><button onClick={submitRequest} disabled={!canSubmit} className="flex-1 py-2.5 rounded-lg text-[13px] font-semibold" style={{ background: !canSubmit ? PAPER_LINE : INK, color: !canSubmit ? MUTE : PAPER }}>ส่งคำขอจอง</button></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ================= login ================= */
function LoginScreen({ accounts, onLogin, onPublicView, onBackHome }) {
  const [pwEmail, setPwEmail] = useState(accounts[0].email); const [pw, setPw] = useState(""); const [err, setErr] = useState(""); const [showDemoAccounts, setShowDemoAccounts] = useState(false);
  const submitPw = () => { const acc = accounts.find((a) => a.email === pwEmail); if (pw !== DEMO_PASSWORD) { setErr(`รหัสผ่านไม่ถูกต้อง (เดโม: ${DEMO_PASSWORD})`); return; } onLogin(acc); };
  const inputCls = "w-full text-[13px] rounded-md px-2.5 py-2 outline-none"; const inputStyle = { background: "#FFFFFF", border: `1px solid ${PAPER_LINE}`, color: INK };
  return (
    <div className="min-h-screen w-full overflow-x-hidden flex items-center justify-center p-4" style={{ background: BOARD, backgroundImage: "radial-gradient(#3A3E45 1px, transparent 1px)", backgroundSize: "16px 16px" }}>
      <style>{FONTS}</style>
      <div className="w-full max-w-sm rounded-2xl p-5" style={{ background: PAPER }}>
        <div className="text-center mb-4"><div style={{ fontFamily: "'Oswald', sans-serif", letterSpacing: "0.03em", color: INK }} className="text-2xl font-bold uppercase">Fleet Desk</div><div className="text-[12px]" style={{ color: MUTE }}>สำหรับเจ้าหน้าที่ · เข้าสู่ระบบเพื่อจัดการกองรถ</div></div>
        <div className="rounded-md p-2.5 mb-4 text-[10.5px]" style={{ background: "#3B5BA514", color: "#3B5BA5" }}>
          <b>หมายเหตุสำหรับตอนใช้งานจริง:</b> หน้านี้ควรอยู่คนละลิงก์กับหน้าลูกค้า เช่น หน้าลูกค้าอยู่ที่ <span className="font-mono">ชื่อเว็บ.com</span> ส่วนหน้านี้อยู่ที่ <span className="font-mono">ชื่อเว็บ.com/admin</span> ลูกค้าจะได้ไม่เห็นว่ามีบัญชีพนักงานอะไรบ้าง
        </div>
        <button onClick={() => setShowDemoAccounts((v) => !v)} className="w-full mb-2 py-2 rounded-lg text-[11.5px] font-medium" style={{ border: `1px solid ${PAPER_LINE}`, color: MUTE }}>
          {showDemoAccounts ? "ซ่อนบัญชีทดสอบ" : "แสดงบัญชีทดสอบ (เฉพาะเดโม)"}
        </button>
        {showDemoAccounts && (<>
        <div className="text-[12px] font-semibold mb-2" style={{ color: INK }}>เข้าสู่ระบบด้วย Gmail (จำลอง)</div>
        <div className="space-y-1.5 mb-2">{accounts.map((acc) => (
          <button key={acc.id} onClick={() => onLogin(acc)} className="w-full flex items-center gap-2.5 rounded-lg p-2.5 text-left" style={{ background: "#FFFFFF80", border: `1px solid ${PAPER_LINE}` }}>
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-bold flex-shrink-0" style={{ background: ROLE_COLOR[acc.role], color: PAPER }}>{acc.name[0]}</div>
            <div className="flex-1 min-w-0"><div className="text-[12.5px] font-medium truncate" style={{ color: INK }}>{acc.name}</div><div className="text-[10.5px] truncate" style={{ color: MUTE }}>{acc.email}</div></div>
            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full flex-shrink-0" style={{ color: ROLE_COLOR[acc.role], background: `${ROLE_COLOR[acc.role]}1a` }}>{ROLE_LABEL[acc.role]}</span>
          </button>
        ))}</div>
        <div className="text-[10px] mb-4" style={{ color: MUTE }}>* จำลองหน้าจอเลือกบัญชี Google ให้ดูรูปแบบเท่านั้น การเชื่อม OAuth จริงต้องมี backend server ซึ่งทำในเดโมนี้ไม่ได้</div>
        </>)}
        <div className="flex items-center gap-2 mb-4"><div className="flex-1 h-px" style={{ background: PAPER_LINE }} /><span className="text-[11px]" style={{ color: MUTE }}>เข้าสู่ระบบ</span><div className="flex-1 h-px" style={{ background: PAPER_LINE }} /></div>
        <div className="text-[12px] font-semibold mb-2" style={{ color: INK }}>เข้าสู่ระบบด้วย Username / Password</div>
        <select className={`${inputCls} mb-2`} style={inputStyle} value={pwEmail} onChange={(e) => { setPwEmail(e.target.value); setErr(""); }}>{accounts.map((a) => <option key={a.id} value={a.email}>{a.name} ({a.email})</option>)}</select>
        <input type="password" className={`${inputCls} mb-1`} style={inputStyle} placeholder={`รหัสผ่าน (เดโม: ${DEMO_PASSWORD})`} value={pw} onChange={(e) => { setPw(e.target.value); setErr(""); }} />
        {err && <div className="text-[11px] mb-2" style={{ color: "#C1502E" }}>{err}</div>}
        <button onClick={submitPw} className="w-full py-2.5 rounded-lg text-[13px] font-semibold mt-2" style={{ background: INK, color: PAPER }}>เข้าสู่ระบบ</button>
        <button onClick={onPublicView} className="w-full py-2.5 rounded-lg text-[12.5px] font-medium mt-3 flex items-center justify-center gap-1.5" style={{ border: `1px solid #3B5BA5`, color: "#3B5BA5" }}><Eye size={14} />เปิดหน้าลูกค้า (จำลองลิงก์ ชื่อเว็บ.com)</button>
        {onBackHome && <button onClick={onBackHome} className="w-full py-2 text-[11.5px] mt-2 flex items-center justify-center gap-1" style={{ color: MUTE }}><ChevronLeft size={13} />กลับหน้าแรกของเว็บ</button>}
      </div>
    </div>
  );
}

/* ================= app ================= */
export default function App() {
  // Restore previously saved data if present; otherwise start from seed data.
  const saved = useState(() => loadSaved())[0];
  const [accounts, setAccounts] = useState(() => (saved && saved.accounts) || MOCK_ACCOUNTS);
  const [session, setSession] = useState(null);
  const [publicMode, setPublicMode] = useState(false);
  // Entry routing. In production these map to real URLs:
  //   "home"  -> yourdomain.com          (public company site)
  //   "staff" -> yourdomain.com/admin    (staff login)
  const [entry, setEntry] = useState("home");
  const [cars, setCars] = useState(() => (saved && saved.cars) || INITIAL_CARS);
  const [overhead, setOverhead] = useState(() => (saved && saved.overhead) || DEFAULT_OVERHEAD);
  const [scheduleEvents, setScheduleEvents] = useState(() => {
    const base = (saved && saved.scheduleEvents) || [
      ...INITIAL_SCHEDULE_EVENTS,
      ...INITIAL_BOOKINGS.filter((b) => b.status !== "cancelled").flatMap(expandBookingToEvents),
    ];
    const bk = (saved && saved.bookings) || INITIAL_BOOKINGS;
    return ensureCleanBuffers(base, bk);
  });
  const [bookings, setBookings] = useState(() => (saved && saved.bookings) || INITIAL_BOOKINGS);
  const [termsText, setTermsText] = useState(() => (saved && saved.termsText) || DEFAULT_CONTRACT_TERMS_TEXT);
  const [bankInfo, setBankInfo] = useState(() => (saved && saved.bankInfo) || DEFAULT_COMPANY_BANK_INFO);
  const [otherExpenses, setOtherExpenses] = useState(() => (saved && saved.otherExpenses) || INITIAL_OTHER_EXPENSES);
  const [claims, setClaims] = useState(() => (saved && saved.claims) || INITIAL_CLAIMS);
  const [categories, setCategories] = useState(() => (saved && saved.categories) || DEFAULT_EXPENSE_CATEGORIES);
  const [saveIssue, setSaveIssue] = useState(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const [storageKB, setStorageKB] = useState(0);
  const [tab, setTab] = useState("fleet");
  const [selected, setSelected] = useState(null);
  const [formCar, setFormCar] = useState(undefined);
  const [exportOpen, setExportOpen] = useState(false);
  const [accountsOpen, setAccountsOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  // Layout: auto-detect by actual container width, but allow a manual override.
  // Needed because the app may run inside a narrow preview panel / iframe whose width
  // is much smaller than the physical screen, so CSS breakpoints alone pick the wrong layout.
  const [forcedLayout, setForcedLayout] = useState(() => loadLayoutPref()); // null = auto | "desktop" | "mobile"
  const [winW, setWinW] = useState(typeof window !== "undefined" ? window.innerWidth : 1024);
  useEffect(() => {
    const onResize = () => setWinW(window.innerWidth);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  const isDesktop = forcedLayout ? forcedLayout === "desktop" : winW >= 1024;
  const LayoutToggle = ({ dark }) => (
    <button onClick={() => { const next = isDesktop ? "mobile" : "desktop"; setForcedLayout(next); saveLayoutPref(next); }}
      title={`สลับเป็นเลย์เอาต์${isDesktop ? "มือถือ" : "คอมพิวเตอร์"} (ตอนนี้กว้าง ${winW}px)`}
      className="flex items-center gap-1.5 px-2 py-1.5 rounded-md text-[11.5px] font-medium"
      style={dark ? { color: "#9BA0A8" } : { background: PAPER, color: INK }}>
      <Eye size={13} />{isDesktop ? "ดูแบบมือถือ" : "ดูแบบคอม"}
    </button>
  );

  const submitCustomerBooking = (booking) => {
    setBookings((prev) => [...prev, booking]);
    setScheduleEvents((prev) => [...prev, ...expandBookingToEvents(booking)]);
  };

  // Persist working data on every change. Runs on all screens (including the customer
  // booking flow) so a customer request submitted from the public page is not lost.
  useEffect(() => {
    const r = saveState({ accounts, cars, overhead, scheduleEvents, bookings, termsText, bankInfo, otherExpenses, claims, categories });
    setSaveIssue(r.ok ? null : r.reason);
    setStorageKB(estimateStorageKB());
  }, [accounts, cars, overhead, scheduleEvents, bookings, termsText, bankInfo, otherExpenses, claims, categories]);

  if (publicMode) return <CustomerAvailabilityView cars={cars} scheduleEvents={scheduleEvents} onExit={() => { setPublicMode(false); setEntry("home"); }} onSubmitBooking={submitCustomerBooking} termsText={termsText} bankInfo={bankInfo} />;
  if (!session && entry === "home") return <HomePage cars={cars} onBook={() => setPublicMode(true)} onStaffLogin={() => setEntry("staff")} />;
  if (!session) return <LoginScreen accounts={accounts} onLogin={(acc) => { setSession(acc); setTab(ROLE_TABS[acc.role][0]); }} onPublicView={() => setPublicMode(true)} onBackHome={() => setEntry("home")} />;

  const allowedTabs = ROLE_TABS[session.role];
  const editFleet = canEditFleetTab(session.role);
  const seeFinance = canSeeFinanceInfo(session.role);
  const editBooking = canEditBookingTab(session.role);

  const saveCar = (car) => { setCars((prev) => { const exists = prev.some((c) => c.id === car.id); return exists ? prev.map((c) => c.id === car.id ? car : c) : [...prev, car]; }); setSelected((s) => s && s.id === car.id ? car : s); setFormCar(undefined); };
  const deleteCar = (id) => { setCars((prev) => prev.filter((c) => c.id !== id)); setFormCar(undefined); setSelected(null); };
  const resetAllData = () => {
    clearSaved();
    setAccounts(MOCK_ACCOUNTS);
    setCars(INITIAL_CARS);
    setOverhead(DEFAULT_OVERHEAD);
    setBookings(INITIAL_BOOKINGS);
    setScheduleEvents([...INITIAL_SCHEDULE_EVENTS, ...INITIAL_BOOKINGS.filter((b) => b.status !== "cancelled").flatMap(expandBookingToEvents)]);
    setTermsText(DEFAULT_CONTRACT_TERMS_TEXT);
    setBankInfo(DEFAULT_COMPANY_BANK_INFO);
    setOtherExpenses(INITIAL_OTHER_EXPENSES);
    setClaims(INITIAL_CLAIMS);
    setCategories(DEFAULT_EXPENSE_CATEGORIES);
    setSaveIssue(null);
  };

  const logout = () => { setSession(null); setEntry("home"); setTab("fleet"); setSelected(null); setFormCar(undefined); setExportOpen(false); setAccountsOpen(false); setSettingsOpen(false); };

  return (
    <div className="min-h-screen w-full overflow-x-hidden" style={{ background: BOARD, backgroundImage: "radial-gradient(#3A3E45 1px, transparent 1px)", backgroundSize: "16px 16px" }}>
      <style>{FONTS}</style>

      {/* ===== DESKTOP: sidebar + wide content ===== */}
      {isDesktop && (
      <div className="flex h-screen overflow-hidden">
        <aside className="w-60 flex-shrink-0 flex flex-col overflow-y-auto" style={{ background: "#1F2226" }}>
          <div className="px-5 py-5 border-b" style={{ borderColor: "#00000040" }}>
            <div style={{ fontFamily: "'Oswald', sans-serif", letterSpacing: "0.03em" }} className="text-xl font-bold uppercase text-white">Fleet Desk</div>
            <div className="text-[11px]" style={{ color: MUTE }}>ระบบจัดการรถเช่า</div>
          </div>
          <div className="px-5 py-4 border-b flex items-center gap-2" style={{ borderColor: "#00000040" }}>
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-bold flex-shrink-0" style={{ background: ROLE_COLOR[session.role], color: PAPER }}>{session.name[0]}</div>
            <div className="min-w-0">
              <div className="text-[12.5px] text-white truncate">{session.name}</div>
              <div className="text-[10px] font-semibold" style={{ color: ROLE_COLOR[session.role] }}>{ROLE_LABEL[session.role]}</div>
            </div>
          </div>
          <nav className="flex-1 py-3">
            {allowedTabs.map((k) => { const t = TAB_META[k]; const active = tab === k; const badge = k === "booking" ? bookings.filter((b) => b.status === "pending").length : 0; return (
              <button key={k} onClick={() => setTab(k)} className="w-full flex items-center gap-2.5 px-5 py-2.5 text-[13px] font-medium relative"
                style={{ background: active ? PAPER : "transparent", color: active ? INK : "#9BA0A8", borderLeft: `3px solid ${active ? "#3B5BA5" : "transparent"}` }}>
                <t.icon size={16} />{t.label}
                {badge > 0 && <span className="ml-auto w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center" style={{ background: "#C1502E", color: PAPER }}>{badge}</span>}
              </button>
            ); })}
          </nav>
          <div className="px-3 py-3 border-t space-y-1" style={{ borderColor: "#00000040" }}>
            <button onClick={() => setPublicMode(true)} className="w-full flex items-center gap-2 px-2 py-2 rounded-md text-[12px]" style={{ color: "#9BA0A8" }}><Eye size={14} />ดูมุมมองลูกค้า</button>
            {session.role === "owner" && <button onClick={() => setAccountsOpen(true)} className="w-full flex items-center gap-2 px-2 py-2 rounded-md text-[12px]" style={{ color: "#9BA0A8" }}><Users size={14} />จัดการผู้ใช้</button>}
            <button onClick={() => setExportOpen(true)} className="w-full flex items-center gap-2 px-2 py-2 rounded-md text-[12px]" style={{ color: "#9BA0A8" }}><Download size={14} />ส่งออกข้อมูล</button>
            <button onClick={logout} className="w-full flex items-center gap-2 px-2 py-2 rounded-md text-[12px]" style={{ color: "#9BA0A8" }}><LogOut size={14} />ออกจากระบบ</button>
            <div className="pt-1 border-t" style={{ borderColor: "#00000040" }}><LayoutToggle dark /></div>
            <div className="px-2 pt-1 text-[10px]" style={{ color: saveIssue ? "#E38468" : "#6B7078" }}>
              {saveIssue === "quota" ? "⚠️ พื้นที่เก็บเต็ม — ข้อมูลใหม่ไม่ถูกบันทึก" : saveIssue ? "⚠️ บันทึกไม่สำเร็จ" : `บันทึกอัตโนมัติแล้ว · ใช้ ${storageKB} KB`}
            </div>
            <button onClick={() => { if (confirmReset) { resetAllData(); setConfirmReset(false); } else setConfirmReset(true); }}
              className="w-full flex items-center gap-2 px-2 py-2 rounded-md text-[11.5px]" style={{ color: confirmReset ? "#E38468" : "#6B7078" }}>
              <Trash2 size={12} />{confirmReset ? "กดอีกครั้งเพื่อยืนยันล้างข้อมูล" : "ล้างข้อมูลทั้งหมด (กลับค่าเริ่มต้น)"}
            </button>
          </div>
        </aside>
        <main className="flex-1 min-w-0 flex flex-col">
          <div className="px-6 py-3 flex items-center justify-between flex-shrink-0" style={{ background: "#00000020" }}>
            <div className="text-[15px] font-semibold text-white">{TAB_META[tab] ? TAB_META[tab].label : ""}</div>
            <div className="text-[12px]" style={{ color: MUTE }}>{formatThaiDateShort(APP_TODAY)} · {cars.length} คันในกอง</div>
          </div>
          <div className="flex-1 min-h-0 overflow-y-auto" style={{ background: PAPER }}>
            <div className="max-w-6xl mx-auto">
              {tab === "fleet" && <FleetView cars={cars} events={scheduleEvents} onSelect={setSelected} onAdd={() => setFormCar(null)} canEdit={editFleet} wide />}
              {tab === "schedule" && allowedTabs.includes("schedule") && <DragCalendarView cars={cars} scheduleEvents={scheduleEvents} setScheduleEvents={setScheduleEvents} wide />}
              {tab === "booking" && allowedTabs.includes("booking") && <BookingsView bookings={bookings} cars={cars} setBookings={setBookings} setScheduleEvents={setScheduleEvents} canEdit={editBooking} sessionName={session.name} termsText={termsText} bankInfo={bankInfo} canEditSettings={session.role === "owner"} onOpenSettings={() => setSettingsOpen(true)} wide />}
              {tab === "archive" && allowedTabs.includes("archive") && <ArchiveView bookings={bookings} cars={cars} wide />}
              {tab === "claims" && allowedTabs.includes("claims") && <ClaimsView claims={claims} setClaims={setClaims} cars={cars} categories={categories} session={session} wide />}
              {tab === "finance" && allowedTabs.includes("finance") && <FinanceView cars={cars} onSelect={setSelected} setCars={setCars} overhead={overhead} setOverhead={setOverhead} bookings={bookings} scheduleEvents={scheduleEvents} otherExpenses={otherExpenses} setOtherExpenses={setOtherExpenses} claims={claims} categories={categories} setCategories={setCategories} onBuyCar={(amt) => setFormCar({ __newFromPurchase: true, purchaseCost: amt })} wide />}
            </div>
          </div>
        </main>
      </div>
      )}

      {/* ===== MOBILE: top-tab layout ===== */}
      {!isDesktop && (
      <div className="max-w-md mx-auto pb-8">
        <div className="px-4 pt-6 pb-2 flex items-center justify-between">
          <div><div style={{ fontFamily: "'Oswald', sans-serif", letterSpacing: "0.03em" }} className="text-xl font-bold uppercase text-white">Fleet Desk</div><div className="text-[11px]" style={{ color: MUTE }}>{formatThaiDateShort(APP_TODAY)} · {cars.length} คันในกอง</div></div>
          <div className="flex items-center gap-1.5">
            <button onClick={() => setPublicMode(true)} className="p-2 rounded-full" style={{ background: PAPER }}><Eye size={15} color={INK} /></button>
            {session.role === "owner" && <button onClick={() => setAccountsOpen(true)} className="p-2 rounded-full" style={{ background: PAPER }}><Users size={15} color={INK} /></button>}
            <button onClick={() => setExportOpen(true)} className="p-2 rounded-full" style={{ background: PAPER }}><Download size={15} color={INK} /></button>
            <button onClick={logout} className="p-2 rounded-full" style={{ background: PAPER }}><LogOut size={15} color={INK} /></button>
          </div>
        </div>
        <div className="px-4 pb-1 flex items-center gap-2 flex-wrap">
          <LayoutToggle />
          <span className="text-[10px]" style={{ color: saveIssue ? "#E38468" : MUTE }}>
            {saveIssue === "quota" ? "⚠️ พื้นที่เต็ม" : saveIssue ? "⚠️ บันทึกไม่สำเร็จ" : `บันทึกแล้ว · ${storageKB} KB`}
          </span>
          <button onClick={() => { if (confirmReset) { resetAllData(); setConfirmReset(false); } else setConfirmReset(true); }}
            className="text-[10px] flex items-center gap-1" style={{ color: confirmReset ? "#E38468" : MUTE }}>
            <Trash2 size={11} />{confirmReset ? "ยืนยันล้าง?" : "ล้างข้อมูล"}
          </button>
        </div>
        <div className="px-4 pb-3 flex items-center gap-1.5">
          <div className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold" style={{ background: ROLE_COLOR[session.role], color: PAPER }}>{session.name[0]}</div>
          <span className="text-[11.5px] text-white">{session.name}</span>
          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full" style={{ color: ROLE_COLOR[session.role], background: `${ROLE_COLOR[session.role]}22` }}>{ROLE_LABEL[session.role]}</span>
        </div>
        <div className="px-4 flex gap-1 mb-1 overflow-x-auto">
          {allowedTabs.map((k) => { const t = TAB_META[k]; const active = tab === k; const badge = k === "booking" ? bookings.filter((b) => b.status === "pending").length : 0; return (
            <button key={k} onClick={() => setTab(k)} className="relative flex-1 flex items-center justify-center gap-1 py-2 rounded-t-lg text-[11.5px] font-semibold flex-shrink-0" style={{ background: active ? PAPER : "transparent", color: active ? INK : "#9BA0A8", minWidth: 62 }}>
              <t.icon size={13} />{t.label}
              {badge > 0 && <span className="absolute top-0.5 right-1 w-4 h-4 rounded-full text-[9px] font-bold flex items-center justify-center" style={{ background: "#C1502E", color: PAPER }}>{badge}</span>}
            </button>
          ); })}
        </div>
        <div style={{ background: PAPER }} className="min-h-[60vh] pb-4">
          {tab === "fleet" && <FleetView cars={cars} events={scheduleEvents} onSelect={setSelected} onAdd={() => setFormCar(null)} canEdit={editFleet} />}
          {tab === "schedule" && allowedTabs.includes("schedule") && <DragCalendarView cars={cars} scheduleEvents={scheduleEvents} setScheduleEvents={setScheduleEvents} />}
          {tab === "booking" && allowedTabs.includes("booking") && <BookingsView bookings={bookings} cars={cars} setBookings={setBookings} setScheduleEvents={setScheduleEvents} canEdit={editBooking} sessionName={session.name} termsText={termsText} bankInfo={bankInfo} canEditSettings={session.role === "owner"} onOpenSettings={() => setSettingsOpen(true)} />}
          {tab === "archive" && allowedTabs.includes("archive") && <ArchiveView bookings={bookings} cars={cars} />}
          {tab === "claims" && allowedTabs.includes("claims") && <ClaimsView claims={claims} setClaims={setClaims} cars={cars} categories={categories} session={session} />}
          {tab === "finance" && allowedTabs.includes("finance") && <FinanceView cars={cars} onSelect={setSelected} setCars={setCars} overhead={overhead} setOverhead={setOverhead} bookings={bookings} scheduleEvents={scheduleEvents} otherExpenses={otherExpenses} setOtherExpenses={setOtherExpenses} claims={claims} categories={categories} setCategories={setCategories} onBuyCar={(amt) => setFormCar({ __newFromPurchase: true, purchaseCost: amt })} />}
        </div>
      </div>
      )}

      <Drawer car={selected} events={scheduleEvents} onClose={() => setSelected(null)} onEdit={(c) => setFormCar(c)} canEdit={editFleet} canSeeFinance={seeFinance} />
      {formCar !== undefined && <CarForm car={formCar} onSave={saveCar} onClose={() => setFormCar(undefined)} onDelete={deleteCar} showFinance={session.role === "owner"} />}
      {exportOpen && <ExportModal role={session.role} cars={cars} overhead={overhead} bookings={bookings} scheduleEvents={scheduleEvents} otherExpenses={otherExpenses} claims={claims} categories={categories} onClose={() => setExportOpen(false)} />}
      {accountsOpen && <AccountsManager accounts={accounts} setAccounts={setAccounts} currentId={session.id} onClose={() => setAccountsOpen(false)} />}
      {settingsOpen && <SettingsModal termsText={termsText} setTermsText={setTermsText} bankInfo={bankInfo} setBankInfo={setBankInfo} onClose={() => setSettingsOpen(false)} />}
    </div>
  );
}
