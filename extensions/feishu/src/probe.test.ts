import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createFeishuClient } from "./client.js";
import { probeFeishu, _resetCacheForTest } from "./probe.js";

// Mock client.js
vi.mock("./client.js", () => ({
  createFeishuClient: vi.fn(),
}));

describe("probeFeishu caching", () => {
  const mockRequest = vi.fn();
  const mockClient = { request: mockRequest };
  const mockCreds = { appId: "test-app", appSecret: "test-secret" };

  beforeEach(() => {
    vi.clearAllMocks();
    _resetCacheForTest();
    vi.mocked(createFeishuClient).mockReturnValue(mockClient as any);
    mockRequest.mockResolvedValue({
      code: 0,
      bot: { bot_name: "Test Bot", open_id: "ou_123" },
    });
    // Reset Date.now
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should cache successful results for 60 seconds", async () => {
    // First call - should hit API
    const result1 = await probeFeishu(mockCreds);
    expect(result1.ok).toBe(true);
    expect(mockRequest).toHaveBeenCalledTimes(1);

    // Second call immediately - should use cache
    const result2 = await probeFeishu(mockCreds);
    expect(result2.ok).toBe(true);
    expect(mockRequest).toHaveBeenCalledTimes(1); // Still 1

    // Advance time by 4 minutes - should still use cache
    vi.advanceTimersByTime(4 * 60 * 1000);
    const result3 = await probeFeishu(mockCreds);
    expect(result3.ok).toBe(true);
    expect(mockRequest).toHaveBeenCalledTimes(1); // Still 1

    // Advance time past 5 minutes (300s) - should hit API again
    vi.advanceTimersByTime(300000 + 1000);
    const result4 = await probeFeishu(mockCreds);
    expect(result4.ok).toBe(true);
    expect(mockRequest).toHaveBeenCalledTimes(2); // Now 2
  });

  it("should NOT cache errors", async () => {
    mockRequest.mockResolvedValueOnce({ code: 999, msg: "Error" });

    // First call - error
    const result1 = await probeFeishu(mockCreds);
    expect(result1.ok).toBe(false);
    expect(mockRequest).toHaveBeenCalledTimes(1);

    // Reset mock for success
    mockRequest.mockResolvedValueOnce({
      code: 0,
      bot: { bot_name: "Test Bot", open_id: "ou_123" },
    });

    // Second call immediately - should retry API because error wasn't cached
    const result2 = await probeFeishu(mockCreds);
    expect(result2.ok).toBe(true);
    expect(mockRequest).toHaveBeenCalledTimes(2);
  });

  it("should use different cache entries for different credentials", async () => {
    // Call with creds A
    await probeFeishu(mockCreds);
    expect(mockRequest).toHaveBeenCalledTimes(1);

    // Call with creds B
    await probeFeishu({ appId: "other-app", appSecret: "other-secret" });
    expect(mockRequest).toHaveBeenCalledTimes(2);
  });
});
