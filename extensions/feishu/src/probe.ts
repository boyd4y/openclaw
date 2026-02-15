import type { FeishuProbeResult } from "./types.js";
import { createFeishuClient, type FeishuClientCredentials } from "./client.js";

// Cache probe results to avoid excessive API calls
const PROBE_CACHE_TTL_MS = 60 * 60_000; // 60 minutes
interface ProbeCacheEntry {
  result: FeishuProbeResult;
  timestamp: number;
  credsKey: string;
}
let probeCache: ProbeCacheEntry | null = null;

export function _resetCacheForTest() {
  probeCache = null;
}

export async function probeFeishu(creds?: FeishuClientCredentials): Promise<FeishuProbeResult> {
  if (!creds?.appId || !creds?.appSecret) {
    return {
      ok: false,
      error: "missing credentials (appId, appSecret)",
    };
  }

  const credsKey = `${creds.appId}:${creds.appSecret}`;
  const now = Date.now();
  if (
    probeCache &&
    probeCache.credsKey === credsKey &&
    now - probeCache.timestamp < PROBE_CACHE_TTL_MS
  ) {
    return probeCache.result;
  }

  try {
    const client = createFeishuClient(creds);
    // Use bot/v3/info API to get bot information
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- SDK generic request method
    const response = await (client as any).request({
      method: "GET",
      url: "/open-apis/bot/v3/info",
      data: {},
    });

    if (response.code !== 0) {
      const result: FeishuProbeResult = {
        ok: false,
        appId: creds.appId,
        error: `API error: ${response.msg || `code ${response.code}`}`,
      };
      // Do not cache errors to allow retry
      return result;
    }

    const bot = response.bot || response.data?.bot;
    const result: FeishuProbeResult = {
      ok: true,
      appId: creds.appId,
      botName: bot?.bot_name,
      botOpenId: bot?.open_id,
    };

    probeCache = {
      result,
      timestamp: now,
      credsKey,
    };

    return result;
  } catch (err) {
    return {
      ok: false,
      appId: creds.appId,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}
