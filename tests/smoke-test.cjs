const { JSDOM } = require("jsdom");
const dom = new JSDOM('<!DOCTYPE html><html><body><div id="root"></div></body></html>', { runScripts:"outside-only", pretendToBeVisual:true, url:"https://example.com/" });
const { window } = dom;
global.window = window; global.document = window.document;
Object.defineProperty(global, "navigator", { value: window.navigator, configurable: true });
Object.assign(global, {
  HTMLElement: window.HTMLElement, Element: window.Element, Node: window.Node,
  localStorage: window.localStorage, FileReader: window.FileReader, Image: window.Image });
global.requestAnimationFrame = (cb)=>setTimeout(cb,0); global.cancelAnimationFrame = clearTimeout;
window.matchMedia = window.matchMedia || (()=>({matches:false,addListener(){},removeListener(){},addEventListener(){},removeEventListener(){}}));

const errors = [];
window.addEventListener("error", e => errors.push(e.message));
const orig = console.error;
console.error = (...a)=>{ const s=a.map(String).join(" "); if(!/not wrapped in act|validateDOMNesting|Warning:/.test(s)) errors.push(s); };

require("../build/bundle-test.js");

const click = (pred) => {
  const els = [...window.document.querySelectorAll("button, [role=button]")];
  const el = els.find(e => pred(e.textContent || ""));
  if (el) { el.dispatchEvent(new window.MouseEvent("click", { bubbles:true })); return true; }
  return false;
};
const wait = (ms) => new Promise(r => setTimeout(r, ms));

(async () => {
  await wait(600);
  const steps = [];
  steps.push(["homepage rendered", window.document.getElementById("root").textContent.includes("เช็ครถว่าง")]);

  steps.push(["open staff login", click(t => t.includes("สำหรับเจ้าหน้าที่"))]);
  await wait(300);
  steps.push(["show demo accounts", click(t => t.includes("แสดงบัญชีทดสอบ"))]);
  await wait(300);
  steps.push(["login as owner", click(t => t.includes("คุณสมชาย"))]);
  await wait(600);

  const tabs = ["คิวงาน","งานเช่า","ประวัติ","เบิกเงิน","บัญชี","กองรถ"];
  for (const t of tabs) {
    const ok = click(x => x.trim() === t);
    await wait(450);
    steps.push([`tab ${t}`, ok]);
  }
  // finance sub-tabs
  for (const s of ["เงินสด/ค้างรับ","ความต้องการตลาด","รายจ่ายอื่น","ภาพรวม","รายเดือน","รายปี (YTD)","พาร์ทเนอร์"]) {
    click(x => x.trim() === "บัญชี"); await wait(200);
    const ok = click(x => x.trim() === s); await wait(400);
    steps.push([`finance:${s}`, ok]);
  }

  console.error = orig;
  console.log("--- navigation smoke ---");
  steps.forEach(([n,ok]) => console.log(` ${ok ? "ok " : "MISS"} ${n}`));
  const real = errors.filter(e => !/Warning:/.test(e));
  console.log("runtime errors:", real.length);
  real.slice(0,8).forEach(e => console.log("  !", String(e).slice(0,220)));
  process.exit(real.length === 0 ? 0 : 1);
})();
