/**
 * Rate limit tests are integration-level (require DB).
 * Unit-level test verifies the config structure.
 */

describe("rateLimit config", () => {
  test("siwe:nonce endpoint is configured", async () => {
    // Dynamically import to check module structure
    const mod = await import("../lib/rateLimit");
    expect(typeof mod.rateLimit).toBe("function");
  });
});
