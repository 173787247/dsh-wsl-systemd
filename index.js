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
    description: "Whether systemctl/journalctl are available; XDG_RUNTIME_DIR + user bus probe.",
    parameters: { type: "object", additionalProperties: false, properties: {} },
    output: { schema: { type: "object", additionalProperties: true }, render: (_a, v) => [{ type: "text", text: JSON.stringify(v, null, 2) }] },
    timeoutMs: 8_000,
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

  async function executeJournal(args) {
    return userJournal({ unit: args.unit, lines: args.lines, timeoutMs });
  }

  const journalParams = {
    type: "object",
    additionalProperties: false,
    required: ["unit"],
    properties: { unit: { type: "string" }, lines: { type: "number" } },
  };
  const journalOutput = {
    schema: { type: "object", additionalProperties: true },
    render: (_a, v) => [{ type: "text", text: v.ok === false ? v.error : v.output }],
  };

  ctx.tools.register({
    name: "journal_tail",
    description: "journalctl --user -u <unit> recent lines (capped). Read-only.",
    parameters: journalParams,
    output: journalOutput,
    timeoutMs,
    isConcurrencySafe: () => true,
    async execute(args) {
      try {
        return await executeJournal(args);
      } catch (e) {
        return { ok: false, error: e instanceof Error ? e.message : String(e) };
      }
    },
    presentCall: () => ({ card: "generic", title: "journal tail" }),
    presentResult: (_a, r) => ({ card: "generic", title: "journal tail", content: r.content }),
  });

  ctx.tools.register({
    name: "systemd_user_journal",
    description: "Alias of journal_tail (read-only).",
    parameters: journalParams,
    output: journalOutput,
    timeoutMs,
    isConcurrencySafe: () => true,
    async execute(args) {
      try {
        return await executeJournal(args);
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
