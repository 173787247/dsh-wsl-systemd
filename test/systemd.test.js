import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { assertUnit } from "../lib/systemd.js";

describe("unit", () => {
  it("ok", () => assert.equal(assertUnit("ollama.service"), "ollama.service"));
  it("bad", () => assert.throws(() => assertUnit("x;y"), /invalid/));
});
