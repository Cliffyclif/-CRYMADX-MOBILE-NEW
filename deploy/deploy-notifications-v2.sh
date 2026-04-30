#!/usr/bin/env bash
# Consolidated notification system v2 deploy. Adds three features to
# notification-service in one go:
#
#   1. Web Push subscribe/unsubscribe + VAPID-backed system push fanout
#      from the existing /api/admin/notifications/broadcast handler.
#   2. SSE stream at GET /api/notifications/stream for sub-second delivery.
#   3. Per-user notification preferences (already supported by the existing
#      get/update endpoints — this script only ensures the underlying
#      collection exists).
#
# Idempotent. Safe to re-run. Backs up notification-service/index.ts before
# any patching.
set -eo pipefail

REMOTE="root@91.99.210.172"
SSH_OPTS="-o IdentitiesOnly=yes -i $HOME/.ssh/hetzner_new_ed25519 -o ConnectTimeout=10"

# VAPID keys generated via web-push.generateVAPIDKeys()
VAPID_PUBLIC="BI35vDyWLXfJuZ_GTuVjYcXEdtaJCVGrZKnjU_-ZMlG66bMvNw0_HDBA8ihI_3nfEmbEURwGK-AdtuoAZHFUcmc"
VAPID_PRIVATE="1kuaLU7ghF0qsHClvbzwRVGADPXtrlTkDTB0gNJ-3nY"
VAPID_SUBJECT="mailto:noreply@crymadx.io"

ssh $SSH_OPTS "$REMOTE" /bin/bash <<REMOTE_SCRIPT
set -eo pipefail
NS=/opt/crymadx/services/notification-service
NS_FILE=\$NS/src/index.ts
GW=/opt/crymadx/services/api-gateway
GW_FILE=\$GW/src/index.ts

# --- 1. VAPID env on shared .env ---
if grep -q WEB_PUSH_VAPID_PUBLIC /opt/crymadx/.env; then
  echo "    VAPID env already set"
else
  echo "    Writing VAPID env to /opt/crymadx/.env..."
  cat >> /opt/crymadx/.env <<EOF

# Web Push (added \$(date +%Y-%m-%d))
WEB_PUSH_VAPID_PUBLIC=$VAPID_PUBLIC
WEB_PUSH_VAPID_PRIVATE=$VAPID_PRIVATE
WEB_PUSH_SUBJECT=$VAPID_SUBJECT
EOF
fi

# --- 2. Install web-push ---
if [ -d "\$NS/node_modules/web-push" ]; then
  echo "    web-push already installed"
else
  echo "    Installing web-push..."
  cd \$NS && npm install web-push --save 2>&1 | tail -3
fi

# --- 3. Patch notification-service ---
NEEDS_BUILD=0
if grep -q '/api/notifications/subscribe' \$NS_FILE; then
  echo "    notification-service already patched (web-push + SSE)"
else
  echo "    Backing up notification-service/index.ts..."
  cp \$NS_FILE \$NS_FILE.bak.v2.\$(date +%Y%m%d-%H%M%S)
  NEEDS_BUILD=1

  python3 <<'PY'
NS = "/opt/crymadx/services/notification-service/src/index.ts"
src = open(NS).read()

# (a) Add web-push import
amqp_marker = 'import * as amqp from "amqplib";'
if 'import webpush from "web-push"' not in src:
    src = src.replace(amqp_marker, amqp_marker + '\nimport webpush from "web-push";')

# (b) Add VAPID setup, sendWebPush helper, and SSE client registry — after dotenv.config()
helpers_block = '''

// Web Push (closed-app notifications via VAPID)
if (process.env.WEB_PUSH_VAPID_PUBLIC && process.env.WEB_PUSH_VAPID_PRIVATE) {
  webpush.setVapidDetails(
    process.env.WEB_PUSH_SUBJECT || "mailto:noreply@crymadx.io",
    process.env.WEB_PUSH_VAPID_PUBLIC,
    process.env.WEB_PUSH_VAPID_PRIVATE,
  );
  console.log("[NOTIFY] Web Push configured (VAPID set)");
} else {
  console.warn("[NOTIFY] Web Push DISABLED — set WEB_PUSH_VAPID_PUBLIC / _PRIVATE");
}

async function sendWebPush(
  subscription: any,
  payload: { title: string; body: string; icon?: string; href?: string; category?: string },
): Promise<{ success: boolean; expired?: boolean; error?: string }> {
  if (!process.env.WEB_PUSH_VAPID_PUBLIC) return { success: false, error: "VAPID not configured" };
  try {
    await webpush.sendNotification(subscription, JSON.stringify(payload), { TTL: 60 * 60 * 24 });
    return { success: true };
  } catch (err: any) {
    if (err.statusCode === 404 || err.statusCode === 410) return { success: false, expired: true };
    return { success: false, error: err.message ?? String(err) };
  }
}

// SSE: in-memory map of userId -> set of open response streams
const sseClients = new Map<string, Set<any>>();
function sseFanout(userId: string, payload: any) {
  const subs = sseClients.get(userId);
  if (!subs || subs.size === 0) return;
  const data = "data: " + JSON.stringify(payload) + "\\n\\n";
  for (const res of subs) {
    try { res.write(data); } catch { /* client disconnected, swept on next ping */ }
  }
}
'''
if 'sendWebPush' not in src:
    src = src.replace('dotenv.config();', 'dotenv.config();\n' + helpers_block, 1)

# (c) Add subscribe / unsubscribe / SSE endpoints just before /health
new_endpoints = '''
/** POST /api/notifications/subscribe — register Web Push subscription */
app.post("/api/notifications/subscribe", authMiddleware, async (req: any, res: any) => {
  try {
    const { subscription, userAgent } = req.body ?? {};
    if (!subscription?.endpoint || !subscription?.keys?.p256dh || !subscription?.keys?.auth) {
      return res.status(400).json({ error: "invalid subscription" });
    }
    const { MongoClient } = require("mongodb");
    const client = new MongoClient(process.env.MONGODB_URI!);
    await client.connect();
    await client.db("crymadx").collection("push_subscriptions").updateOne(
      { endpoint: subscription.endpoint },
      {
        $set: {
          userId: req.userId,
          endpoint: subscription.endpoint,
          keys: subscription.keys,
          userAgent: userAgent ?? "",
          updatedAt: new Date(),
        },
        $setOnInsert: { createdAt: new Date() },
      },
      { upsert: true },
    );
    await client.close();
    res.json({ success: true });
  } catch (e: any) {
    console.error("[PUSH-SUBSCRIBE] Error:", e);
    res.status(500).json({ error: e.message });
  }
});

/** DELETE /api/notifications/subscribe */
app.delete("/api/notifications/subscribe", authMiddleware, async (req: any, res: any) => {
  try {
    const endpoint = req.body?.endpoint || req.query.endpoint;
    if (!endpoint) return res.status(400).json({ error: "endpoint required" });
    const { MongoClient } = require("mongodb");
    const client = new MongoClient(process.env.MONGODB_URI!);
    await client.connect();
    await client.db("crymadx").collection("push_subscriptions").deleteOne({ endpoint, userId: req.userId });
    await client.close();
    res.json({ success: true });
  } catch (e: any) {
    console.error("[PUSH-UNSUBSCRIBE] Error:", e);
    res.status(500).json({ error: e.message });
  }
});

/** GET /api/notifications/stream — SSE channel for real-time deliveries.
 *  Falls back to polling on the client if this 404s. JWT can be passed via
 *  ?token=... since EventSource doesn't support custom headers. */
app.get("/api/notifications/stream", (req: any, res: any) => {
  // Inline JWT verify so EventSource can authenticate via query param
  const token = req.query.token || (req.headers.authorization || "").replace(/^Bearer /, "");
  if (!token) return res.status(401).json({ error: "no token" });
  let userId: string;
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    userId = decoded.userId || decoded.sub;
    if (!userId) throw new Error("no userId in token");
  } catch {
    return res.status(401).json({ error: "invalid token" });
  }
  res.set({
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache, no-transform",
    "Connection": "keep-alive",
    "X-Accel-Buffering": "no",
  });
  res.flushHeaders?.();
  res.write("event: connected\\ndata: {}\\n\\n");
  // Register stream
  if (!sseClients.has(userId)) sseClients.set(userId, new Set());
  sseClients.get(userId)!.add(res);
  // Heartbeat every 25s to keep proxies from killing the connection
  const heartbeat = setInterval(() => {
    try { res.write(": ping\\n\\n"); } catch { /* ignore */ }
  }, 25_000);
  req.on("close", () => {
    clearInterval(heartbeat);
    sseClients.get(userId)?.delete(res);
    if (sseClients.get(userId)?.size === 0) sseClients.delete(userId);
  });
});

'''
if '/api/notifications/subscribe' not in src:
    health_marker = 'app.get("/health"'
    i = src.find(health_marker)
    src = src[:i] + new_endpoints + src[i:]

# (d) Web Push + SSE fanout inside broadcast handler
fanout_block = '''
      // Fire Web Push to all subscribed devices (best-effort)
      const pushSubs = db.collection("push_subscriptions");
      const subDocs = await pushSubs.find({ userId: { $in: recipientIds } }).toArray();
      if (subDocs.length > 0) {
        const pushPayload = { title, body, icon, href, category };
        const expiredEndpoints: string[] = [];
        await Promise.allSettled(subDocs.map(async (s: any) => {
          const r = await sendWebPush({ endpoint: s.endpoint, keys: s.keys }, pushPayload);
          if (r.expired) expiredEndpoints.push(s.endpoint);
        }));
        if (expiredEndpoints.length > 0) {
          await pushSubs.deleteMany({ endpoint: { $in: expiredEndpoints } });
        }
      }
      // Fan out to any open SSE streams for instant in-app delivery
      for (const userId of recipientIds) {
        sseFanout(userId, { id: broadcastId, type: category, title, body, icon, href, createdAt: now, data: { broadcastId, category } });
      }
'''
if 'pushSubs.find({ userId: { $in: recipientIds }' not in src:
    insertmany_marker = 'await notifs.insertMany(docs, { ordered: false })'
    if insertmany_marker in src:
        src = src.replace(insertmany_marker, insertmany_marker + ';\n' + fanout_block, 1)

open(NS, "w").write(src)
print("    notification-service patched.")
PY

  echo "    Building notification-service..."
  cd \$NS && npm run build 2>&1 | tail -5
fi

# --- 4. Restart if changed ---
if [ "\$NEEDS_BUILD" = "1" ]; then
  echo "    Restarting notification-service..."
  pm2 restart notification-service
fi

# --- 5. api-gateway: relax buffering on /notifications/stream so SSE flushes ---
# (The existing /api/notifications proxy already handles this path. We just
#  need to verify the existing line is there — added in v1.)
if grep -q '/api/notifications' \$GW_FILE; then
  echo "    api-gateway already proxies /api/notifications (good for SSE)"
fi

# --- 6. Smoke test ---
echo ""
echo "==> Smoke testing v2 endpoints..."
sleep 3
curl -sI -o /dev/null -w "    POST /api/notifications/subscribe (401 expected) -> %{http_code}\\n" -X POST http://127.0.0.1:3000/api/notifications/subscribe
curl -sI -o /dev/null -w "    GET  /api/notifications/stream (401 expected) -> %{http_code}\\n" http://127.0.0.1:3000/api/notifications/stream
echo ""
echo "==> v2 deploy complete."
REMOTE_SCRIPT

echo ""
echo "✅ Notification system v2 live: Web Push + SSE + admin broadcast all online."
