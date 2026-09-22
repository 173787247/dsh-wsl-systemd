import { systemdStatus, userListUnits, userShow, userJournal } from "./lib/systemd.js";

export const name = "dsh-wsl-systemd";
export const inject = ["tools", "systemPrompt"];

export function apply(ctx, config = {}) {
  if (config.enabled === false) {
    console.log("[dsh-wsl-systemd] disabled");
    return;
  }
  const timeoutMs = positive(config.timeoutMs, 15_000);
  console.log("[dsh-wsl-systemd] user-session status only (no start/stop)");

  ctx.systemPrompt.section({
    name: "tool:systemd",
    order: 122,
    text: "dsh-wsl-systemd inspects systemd --user units (list/show/journal). It cannot start/stop/enable services. Useful for Ollama or self-hosted API user units in WSL.",
  });

  ctx.tools.register({
    name: "systemd_status",
    description: "Whether systemctl is available; show XDG_RUNTIME_DIR hint.",
    parameters: { type: "object", additionalProperties: false, properties: {} },
    output: { schema: { type: "object", additionalProperties: true }, render: (_a, v) => [{ type: "text", text: JSON.stringify(v) }] },
    timeoutMs: 5_000,
    isConcurrencySafe: () => true,
    async execute() {
      return systemdStatus();
    },
    presentCall: () => ({ card: "generic", title: "systemd status" }),
    presentResult: (_a, r) => ({ card: "generic", title: "systemd status", content: r.content }),
  });

  ctx.tools.register({
    name: "systemd_user_list",
    description: "systemctl --user list-units --type=service (capped).",
    parameters: { type: "object", additionalProperties: false, properties: {} },
    output: {
      schema: { type: "object", additionalProperties: true },
      render: (_a, v) => [{ type: "text", text: v.ok === false ? v.error : v.output }],
    },
    timeoutMs,
    isConcurrencySafe: () => true,
    async execute() {
      try {
        return await userListUnits({ timeoutMs });
      } catch (e) {
        return { ok: false, error: e instanceof Error ? e.message : String(e) };
      }
    },
    presentCall: () => ({ card: "generic", title: "user units" }),
    presentResult: (_a, r) => ({ card: "generic", title: "user units", content: r.content }),
  });

  ctx.tools.register({
    name: "systemd_user_show",
    description: "systemctl --user show <unit> (ActiveState, MainPID, …).",
    parameters: {
      type: "object",
      additionalProperties: false,
      required: ["unit"],
      properties: { unit: { type: "string", description: "e.g. ollama.service" } },
    },
    output: {
      schema: { type: "object", additionalProperties: true },
      render: (_a, v) => [{ type: "text", text: v.ok === false ? v.error : JSON.stringify(v, null, 2) }],
    },
    timeoutMs,
    isConcurrencySafe: () => true,
    async execute(args) {
      try {
        return await userShow({ unit: args.unit, timeoutMs });
      } catch (e) {
        return { ok: false, error: e instanceof Error ? e.message : String(e) };
      }
    },
    presentCall: () => ({ card: "generic", title: "user show" }),
    presentResult: (_a, r) => ({ card: "generic", title: "user show", content: r.content }),
  });

  ctx.tools.register({
    name: "systemd_user_journal",
    description: "journalctl --user -u <unit> recent lines (capped).",
    parameters: {
      type: "object",
      additionalProperties: false,
      required: ["unit"],
      properties: { unit: { type: "string" }, lines: { type: "number" } },
    },
    output: {
      schema: { type: "object", additionalProperties: true },
      render: (_a, v) => [{ type: "text", text: v.ok === false ? v.error : v.output }],
    },
    timeoutMs,
    isConcurrencySafe: () => true,
    async execute(args) {
      try {
        return await userJournal({ unit: args.unit, lines: args.lines, timeoutMs });
      } catch (e) {
        return { ok: false, error: e instanceof Error ? e.message : String(e) };
      }
    },
    presentCall: () => ({ card: "generic", title: "user journal" }),
    presentResult: (_a, r) => ({ card: "generic", title: "user journal", content: r.content }),
  });
}

function positive(v, fb) {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : fb;
}
