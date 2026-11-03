// Tallkeep in Docker: get the newest Tallkeep server, if the license allows it.
//
//   node get-server.mjs <folder> [--have <version>]
//
// Reads latest.json from Tallkeep's public download repo, downloads the server bundle into
// <folder>/<version>, checks its fingerprint and prints the folder to use. Prints nothing (and
// changes nothing) when there's nothing newer, the license's updates have ended, or the download
// fails; the container then starts the version it already has.
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { execFileSync } from "node:child_process";

const RAW = process.env.TALLKEEP_DOWNLOADS || "https://raw.githubusercontent.com/sunnyneon/tallkeep-desktop/main";
const root = process.argv[2];
const haveArg = process.argv.indexOf("--have");
const have = haveArg > 0 ? process.argv[haveArg + 1] : "0";
const say = (...a) => console.error("Tallkeep update:", ...a);

const newer = (a, b) => {
  const x = String(a).split(".").map(Number);
  const y = String(b).split(".").map(Number);
  for (let i = 0; i < 3; i++) if ((x[i] || 0) !== (y[i] || 0)) return (x[i] || 0) > (y[i] || 0);
  return false;
};

// The license's "updates until" date (the server checks the key itself; this only follows it).
function updatesUntil() {
  try {
    const dataDir = process.env.TALLKEEP_DATA || "/data";
    const saved = JSON.parse(fs.readFileSync(path.join(dataDir, "license.json"), "utf8"));
    const m = /^TK1\.([A-Za-z0-9_-]+)\./.exec(saved.key ?? "");
    if (!m) return null;
    return JSON.parse(Buffer.from(m[1], "base64url").toString("utf8")).updates ?? null;
  } catch {
    return null;
  }
}

try {
  if (!root) throw new Error("no folder given");
  const res = await fetch(`${RAW}/latest.json`, { signal: AbortSignal.timeout(20000) });
  if (!res.ok) throw new Error(`latest.json: ${res.status}`);
  const info = await res.json();
  const s = info.server;
  if (!s?.file || !s?.sha256) throw new Error("this release has no server for Docker");
  // Already downloaded before?
  const dir = path.join(root, info.version);
  if (fs.existsSync(path.join(dir, "server.bundle.mjs"))) {
    if (newer(info.version, have)) console.log(dir);
    process.exit(0);
  }
  if (!newer(info.version, have)) process.exit(0);
  const until = updatesUntil();
  if (until && String(info.date ?? "").slice(0, 10) > until) {
    say(`Tallkeep ${info.version} is out; your license's updates ended ${until}. Renew at https://app.tallkeep.com/upgrade`);
    process.exit(0);
  }
  say(`downloading Tallkeep ${info.version}…`);
  const r = await fetch(`${RAW}/v${info.version}/${s.file}`, { signal: AbortSignal.timeout(300000) });
  if (!r.ok) throw new Error(`download: ${r.status}`);
  const buf = Buffer.from(await r.arrayBuffer());
  if (crypto.createHash("sha256").update(buf).digest("hex") !== s.sha256)
    throw new Error("the download didn't match its fingerprint");
  fs.mkdirSync(root, { recursive: true });
  const tmp = `${dir}.part`;
  fs.rmSync(tmp, { recursive: true, force: true });
  fs.mkdirSync(tmp, { recursive: true });
  const tgz = path.join(root, "download.tgz");
  fs.writeFileSync(tgz, buf);
  execFileSync("tar", ["xzf", tgz, "-C", tmp, "--strip-components=1"]);
  fs.rmSync(tgz, { force: true });
  if (!fs.existsSync(path.join(tmp, "server.bundle.mjs"))) throw new Error("the download is missing its server");
  fs.renameSync(tmp, dir);
  // Keep only this version and the one before it.
  const keep = new Set([info.version, have]);
  for (const n of fs.readdirSync(root))
    if (!keep.has(n)) fs.rmSync(path.join(root, n), { recursive: true, force: true });
  say(`Tallkeep ${info.version} is ready.`);
  console.log(dir);
} catch (e) {
  say(`couldn't check for a new version (${e.message}); starting the one this container has.`);
}
