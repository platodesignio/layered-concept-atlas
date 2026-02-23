/**
 * リアルタイム統合モジュール
 * REALTIME_PROVIDER=pusher または ably で切替
 *
 * Pusher採用理由: Vercel Edge環境での安定動作実績・無料枠200接続/day
 * Ably採用理由: SSE fallback内蔵・より大きい無料枠
 * 障害時フォールバック: SSEポーリング (/api/realtime/sse) で未読更新を維持
 */

export type RealtimeEvent = {
  channel: string;
  event: string;
  data: unknown;
};

export async function publishEvent(evt: RealtimeEvent): Promise<void> {
  const provider = process.env.REALTIME_PROVIDER;
  if (provider === "pusher") {
    await publishPusher(evt);
  } else if (provider === "ably") {
    await publishAbly(evt);
  }
  // 未設定の場合はSSEクライアントへのpollに委ねる
}

async function publishPusher(evt: RealtimeEvent): Promise<void> {
  const Pusher = (await import("pusher")).default;
  const pusher = new Pusher({
    appId: process.env.REALTIME_APP_ID!,
    key: process.env.REALTIME_KEY!,
    secret: process.env.REALTIME_SECRET!,
    cluster: process.env.REALTIME_CLUSTER ?? "ap3",
    useTLS: true,
  });
  await pusher.trigger(evt.channel, evt.event, evt.data);
}

async function publishAbly(evt: RealtimeEvent): Promise<void> {
  const Ably = await import("ably");
  const client = new Ably.Rest(process.env.REALTIME_SECRET!);
  const channel = client.channels.get(evt.channel);
  await channel.publish(evt.event, evt.data);
}

export function getClientConfig(): Record<string, string> {
  const provider = process.env.REALTIME_PROVIDER ?? "none";
  if (provider === "pusher") {
    return {
      provider: "pusher",
      key: process.env.NEXT_PUBLIC_REALTIME_KEY ?? "",
      cluster: process.env.REALTIME_CLUSTER ?? "ap3",
    };
  }
  if (provider === "ably") {
    return {
      provider: "ably",
      key: process.env.NEXT_PUBLIC_REALTIME_KEY ?? "",
    };
  }
  return { provider: "sse" };
}
