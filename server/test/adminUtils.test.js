const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

// Load admin/js/utils.js
const utilsCode = fs.readFileSync(path.join(__dirname, "../../admin/js/utils.js"), "utf8");
// Evaluate in module scope
const fn = new Function(utilsCode + "\nreturn Utils;");
const Utils = fn();

describe("Admin Utils Module", () => {
  it("escapeHtml should escape &, <, >, \", and '", () => {
    const raw = `<b>"Hello" & 'World'</b>`;
    const escaped = Utils.escapeHtml(raw);
    assert.strictEqual(escaped, "&lt;b&gt;&quot;Hello&quot; &amp; &#39;World&#39;&lt;/b&gt;");
  });

  it("escapeHtml should handle null and undefined safely", () => {
    assert.strictEqual(Utils.escapeHtml(null), "");
    assert.strictEqual(Utils.escapeHtml(undefined), "");
  });

  it("escapeJs should escape backslashes, single quotes, double quotes, and newlines", () => {
    const raw = "Doctor's \"Special\" \\ App\nNew line";
    const escaped = Utils.escapeJs(raw);
    assert.strictEqual(escaped, "Doctor\\'s \\\"Special\\\" \\\\ App\\nNew line");
  });

  it("timeAgo should format timestamps appropriately", () => {
    const now = new Date().toISOString();
    assert.strictEqual(Utils.timeAgo(now), "just now");
    assert.strictEqual(Utils.timeAgo(null), "never");
  });

  it("truncate should truncate long strings with ellipsis", () => {
    const longStr = "A".repeat(100);
    assert.strictEqual(Utils.truncate(longStr, 10).length, 11); // 10 chars + '…'
    assert.strictEqual(Utils.truncate("Short", 10), "Short");
  });
});
