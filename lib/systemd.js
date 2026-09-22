import { spawn } from "node:child_process";

export function which(cmd) {
  const safe = String(cmd || "").replace(/[^a-zA-Z0-9._+-]/g, "");
  if (!safe) return Promise.resolve("");
  return new Promise((r) => {
    const child = spawn("bash", ["-lc", `command -v ${safe}`], { stdio: ["ignore", "pipe", "ignore"] });
    let out = "";
    child.stdout.on("data", (d) => (out += d));
    child.on("close", (c) => r(c === 0 ? out.trim() : ""));
  });
}

export function assertUnit(name) {
  const n = String(name || "").trim();
  // user units like ollama.service
  if (!n || !/^[A-Za-z0-9@._+-]+\.(service|timer|socket|target)$/.test(n) || n.length > 128) {
    throw new Error("invalid systemd unit name");
  }
  return n;
}

export function run(bin, args, timeoutMs = 15_000) {
  return new Promise((resolvePromise, reject) => {
    const child = spawn(bin, args, { stdio: ["ignore", "pipe", "pipe"] });
    let stdout = "";
    let stderr = "";
    const t = setTimeout(() => {
      child.kill("SIGKILL");
      reject(new Error("timeout"));
    }, timeoutMs);
    child.stdout.on("data", (d) => {
      stdout += d;
      if (stdout.length > 200_000) child.kill("SIGKILL");
    });
    child.stderr.on("data", (d) => (stderr += d));
    child.on("close", (code) => {
      clearTimeout(t);
      resolvePromise({ code, stdout, stderr });
    });
    child.on("error", (e) => {
      clearTimeout(t);
      reject(e);
    });
  });
}

export async function systemdStatus() {
  return {
    ok: true,
    systemctl: (await which("systemctl")) || null,
    userSession: process.env.XDG_RUNTIME_DIR || null,
  };
}

export async function userListUnits({ timeoutMs = 15_000, maxOut = 40_000 } = {}) {
  const bin = (await which("systemctl")) || "systemctl";
  const { code, stdout, stderr } = await run(
    bin,
    ["--user", "list-units", "--type=service", "--all", "--no-pager", "--plain"],
    timeoutMs,
  );
  if (code !== 0) throw new Error(`systemctl --user list-units failed: ${stderr || code}`);
  return { ok: true, truncated: stdout.length > maxOut, output: stdout.slice(0, maxOut) };
}

export async function userShow({ unit, timeoutMs = 15_000 } = {}) {
  const u = assertUnit(unit);
  const bin = (await which("systemctl")) || "systemctl";
  const { code, stdout, stderr } = await run(
    bin,
    ["--user", "show", u, "-p", "Id", "-p", "ActiveState", "-p", "SubState", "-p", "MainPID", "-p", "FragmentPath", "--no-pager"],
    timeoutMs,
  );
  if (code !== 0) throw new Error(`systemctl show failed: ${stderr || code}`);
  const props = {};
  for (const line of stdout.split("\n")) {
    const i = line.indexOf("=");
    if (i > 0) props[line.slice(0, i)] = line.slice(i + 1);
  }
  return { ok: true, unit: u, ...props };
}

export async function userJournal({ unit, lines = 50, timeoutMs = 15_000, maxOut = 40_000 } = {}) {
  const u = assertUnit(unit);
  const n = Math.min(200, Math.max(1, Number(lines) || 50));
  const bin = (await which("journalctl")) || "journalctl";
  const { code, stdout, stderr } = await run(
    bin,
    ["--user", "-u", u, "-n", String(n), "--no-pager", "-o", "short-iso"],
    timeoutMs,
  );
  if (code !== 0) throw new Error(`journalctl failed: ${stderr || code}`);
  return { ok: true, unit: u, truncated: stdout.length > maxOut, output: stdout.slice(0, maxOut) };
}
