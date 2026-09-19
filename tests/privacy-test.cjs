const { JSDOM } = require("jsdom");
const dom = new JSDOM('<!DOCTYPE html><html><body><div id="root"></div></body></html>', { runScripts:"outside-only", pretendToBeVisual:true, url:"https://example.com/" });
const { window } = dom;
global.window = window; global.document = window.document;
Object.defineProperty(global, "navigator", { value: window.navigator, configurable: true });
Object.assign(global, { HTMLElement: window.HTMLElement, Element: window.Element, Node: window.Node,
  localStorage: window.localStorage, FileReader: window.FileReader, Image: window.Image });
global.requestAnimationFrame = (cb)=>setTimeout(cb,0); global.cancelAnimationFrame = clearTimeout;
window.matchMedia = window.matchMedia || (()=>({matches:false,addListener(){},removeListener(){},addEventListener(){},removeEventListener(){}}));
const errors=[]; const orig=console.error;
console.error=(...a)=>{const s=a.map(String).join(" "); if(!/not wrapped in act|validateDOMNesting|Warning:/.test(s)) errors.push(s);};
require("../build/bundle-test.js");

const click=(pred)=>{const els=[...window.document.querySelectorAll("button,[role=button]")];const el=els.find(e=>pred(e.textContent||""));if(el){el.dispatchEvent(new window.MouseEvent("click",{bubbles:true}));return true;}return false;};
const wait=(ms)=>new Promise(r=>setTimeout(r,ms));

// names/phones that exist in seed bookings and must NEVER appear on the public page
const SECRETS=["กิตติธาดา","อร ","นภา","วารี","กันต์","เอกชัย","ปิยะ","มาลี","ธนกร",
               "081-234-5678","089-777-8899","086-222-3344","084-666-7788","085-111-2233"];

(async()=>{
  await wait(600);
  // go to the customer booking page
  click(t=>t.includes("เช็ครถว่าง"));
  await wait(700);
  const txt = window.document.getElementById("root").textContent;
  console.error=orig;
  console.log("on customer page:", txt.includes("เช็ครถว่าง") || txt.includes("จองคันนี้") || txt.includes("จองวันนี้ไม่ได้") ? "YES" : "NO");
  const leaked = SECRETS.filter(s => txt.includes(s));
  console.log("leaked identifiers:", leaked.length ? leaked.join(" | ") : "NONE");
  console.log("runtime errors:", errors.filter(e=>!/Warning:/.test(e)).length);
  process.exit(leaked.length===0 ? 0 : 1);
})();
