import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";
import { getClientConfig } from "@/lib/realtime";

export async function GET(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const config = getClientConfig();

  if (config.provider === "pusher") {
    const { searchParams } = new URL(req.url);
    const socketId = searchParams.get("socket_id") ?? "";
    const channelName = searchParams.get("channel_name") ?? "";

    if (channelName.startsWith("private-") || channelName.startsWith("presence-")) {
      const Pusher = (await import("pusher")).default;
      const pusher = new Pusher({
        appId: process.env.REALTIME_APP_ID!,
        key: process.env.REALTIME_KEY!,
        secret: process.env.REALTIME_SECRET!,
        cluster: process.env.REALTIME_CLUSTER ?? "ap3",
        useTLS: true,
      });
      const auth = pusher.authorizeChannel(socketId, channelName, {
        user_id: user.id,
        user_info: { id: user.id, name: user.displayName ?? user.name },
      });
      return NextResponse.json(auth);
    }
  }

  if (config.provider === "ably") {
    const Ably = await import("ably");
    const rest = new Ably.Rest(process.env.REALTIME_SECRET!);
    const tokenRequest = await rest.auth.createTokenRequest({ clientId: user.id });
    return NextResponse.json(tokenRequest);
  }

  return NextResponse.json({ config });
}
