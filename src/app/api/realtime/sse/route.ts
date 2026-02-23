import { NextRequest } from "next/server";
import { getSessionUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      let closed = false;
      req.signal.addEventListener("abort", () => {
        closed = true;
        controller.close();
      });

      // Send initial unread count
      const sendUnread = async () => {
        if (closed) return;
        try {
          const unread = await prisma.notification.count({
            where: { userId: user.id, isRead: false },
          });
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "unread", count: unread })}\n\n`));
        } catch {
          closed = true;
          controller.close();
        }
      };

      await sendUnread();
      // Poll every 15 seconds as SSE fallback
      const interval = setInterval(() => {
        if (closed) { clearInterval(interval); return; }
        sendUnread();
      }, 15_000);

      req.signal.addEventListener("abort", () => clearInterval(interval));
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
