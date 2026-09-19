#!/usr/bin/env node
/**
 * สร้างไฟล์เว็บสำเร็จรูป 1 ไฟล์ (build/fleet-desk-web.html)
 *
 * ขั้นตอน:
 *   1. bundle JS ด้วย esbuild (target es2019 — ห้ามใช้ esnext เพราะ Safari เก่า parse ไม่ผ่าน)
 *   2. compile Tailwind เฉพาะคลาสที่ใช้จริง (ห้ามใช้ CDN ใน production)
 *   3. ฝัง CSS + JS + ตัวดักจับ error ลงใน HTML ไฟล์เดียว
 *
 * ใช้: npm run build
 */
const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const BUILD = path.join(ROOT, "build");
fs.mkdirSync(BUILD, { recursive: true });

const run = (cmd) => execSync(cmd, { cwd: ROOT, stdio: "inherit" });

console.log("[1/3] bundling JS...");
run(
  "npx esbuild src/entry.jsx --bundle --format=iife --minify " +
  "--loader:.jsx=jsx --jsx=automatic --target=es2019 " +
  `--outfile=${path.join("build", "bundle.js")} ` +
  '--define:process.env.NODE_ENV=\'"production"\''
);

console.log("[2/3] compiling Tailwind...");
run(
  "npx tailwindcss -c tailwind.config.js -i src/tw-input.css " +
  `-o ${path.join("build", "tw-out.css")} --minify`
);

console.log("[3/3] assembling HTML...");
const js = fs.readFileSync(path.join(BUILD, "bundle.js"), "utf8");
const css = fs.readFileSync(path.join(BUILD, "tw-out.css"), "utf8");

// ตัวดักจับ error: บนมือถือเปิด devtools ไม่ได้ ถ้าแอปพังจะเห็นแค่หน้าขาว
// ตัวนี้ทำให้เห็นสาเหตุจริงบนหน้าจอ — ห้ามเอาออก
const errorCatcher = `
(function () {
  var shown = false;
  function show(msg) {
    if (shown) return; shown = true;
    try {
      var r = document.getElementById("root"); if (r) r.style.display = "none";
      document.getElementById("bootErrMsg").textContent = String(msg);
      document.getElementById("bootUA").textContent = navigator.userAgent;
      document.getElementById("bootErr").style.display = "block";
    } catch (e) {}
  }
  window.addEventListener("error", function (e) {
    show((e && e.message ? e.message : "unknown error") +
         (e && e.filename ? "\\n" + e.filename + ":" + e.lineno + ":" + e.colno : ""));
  });
  window.addEventListener("unhandledrejection", function (e) {
    show("Promise rejected: " + (e && e.reason ? (e.reason.message || e.reason) : "unknown"));
  });
  setTimeout(function () {
    var r = document.getElementById("root");
    if (r && r.children.length === 0) show("แอปโหลดแล้วแต่ไม่แสดงผล (React ไม่ mount ภายใน 6 วินาที)");
  }, 6000);
})();`;

const html = `<!DOCTYPE html>
<html lang="th">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>Fleet Desk — ระบบจัดการรถเช่า</title>
<style>${css}</style>
<style>
  html, body { margin:0; padding:0; background:#2A2E33; -webkit-text-size-adjust:100%; }
  #root { min-height:100vh; }
  #bootErr { display:none; margin:0; padding:16px; font:13px/1.6 -apple-system,system-ui,sans-serif;
             background:#2A2E33; color:#F6F1E7; min-height:100vh; }
  #bootErr pre { white-space:pre-wrap; word-break:break-word; background:#00000055; padding:12px;
                 border-radius:8px; color:#E38468; font-size:12px; }
</style>
</head>
<body>
<div id="root"></div>
<div id="bootErr">
  <h2 style="margin:0 0 8px;font-size:16px">เปิดแอปไม่สำเร็จ</h2>
  <p style="margin:0 0 12px;color:#C9CDD3">กรุณาถ่ายหน้าจอข้อความด้านล่างส่งให้ผู้พัฒนา</p>
  <pre id="bootErrMsg"></pre>
  <p style="margin:12px 0 0;color:#8A8F98;font-size:11px">อุปกรณ์: <span id="bootUA"></span></p>
</div>
<script>${errorCatcher}</script>
<script>
${js}
</script>
</body>
</html>`;

const out = path.join(BUILD, "fleet-desk-web.html");
fs.writeFileSync(out, html);
console.log(`\n✓ เสร็จแล้ว: build/fleet-desk-web.html (${(html.length / 1024 / 1024).toFixed(2)} MB)`);
