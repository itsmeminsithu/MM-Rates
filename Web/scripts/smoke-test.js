"use strict";
const base = (process.env.BASE_URL || "http://127.0.0.1:3000").replace(/\/$/, "");

async function check(path, expected) {
  const response = await fetch(`${base}${path}`, { redirect: "manual" });
  const text = await response.text();
  if (!expected.includes(response.status)) throw new Error(`${path}: expected ${expected.join("/")}, got ${response.status}: ${text.slice(0, 200)}`);
  console.log(`[smoke] ${path} -> ${response.status}`);
}

(async () => {
  await check("/v1/health/live", [200]);
  await check("/v1/health/ready", process.env.REQUIRE_READY === "1" ? [200] : [200, 503]);
  await check("/v1/latest", [200]);
  await check("/", [200]);
})().catch((error) => { console.error(error); process.exitCode = 1; });
