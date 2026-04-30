#!/usr/bin/env bash
# Deploy Web Push (closed-app system push) on top of the existing notification
# system. Adds:
#   - npm install web-push in notification-service
#   - VAPID env vars to /opt/crymadx/.env
#   - import + helpers + 2 new endpoints
#   - extends /api/admin/notifications/broadcast to fire Web Push
#
# Idempotent. Safe to re-run.
set -euo pipefail

REMOTE="root@91.99.210.172"
SSH_OPTS="-o IdentitiesOnly=yes -i $HOME/.ssh/hetzner_new_ed25519 -o ConnectTimeout=10"

# VAPID keys — generated locally via web-push.generateVAPIDKeys()
VAPID_PUBLIC="BI35vDyWLXfJuZ_GTuVjYcXEdtaJCVGrZKnjU_-ZMlG66bMvNw0_HDBA8ihI_3nfEmbEURwGK-AdtuoAZHFUcmc"
VAPID_PRIVATE="1kuaLU7ghF0qsHClvbzwRVGADPXtrlTkDTB0gNJ-3nY"
VAPID_SUBJECT="mailto:noreply@crymadx.io"

ssh $SSH_OPTS "$REMOTE" /bin/bash <<REMOTE_SCRIPT
set -euo pipefail
NS=/opt/crymadx/services/notification-service
NS_FILE=\$NS/src/index.ts

# --- 1. Env vars ---
ENV_FILE=/opt/crymadx/.env
if grep -q WEB_PUSH_VAPID_PUBLIC \$ENV_FILE; then
  echo "    VAPID env already set"
else
  echo "    Writing VAPID env to /opt/crymadx/.env..."
  cat >> \$ENV_FILE <<EOF

# Web Push (added $(date +%Y-%m-%d))
WEB_PUSH_VAPID_PUBLIC=$VAPID_PUBLIC
WEB_PUSH_VAPID_PRIVATE=$VAPID_PRIVATE
WEB_PUSH_SUBJECT=$VAPID_SUBJECT
EOF
fi

# --- 2. Install web-push package ---
if [ -d "\$NS/node_modules/web-push" ]; then
  echo "    web-push already installed"
else
  echo "    Installing web-push..."
  cd \$NS
  npm install web-push --save 2>&1 | tail -3
fi

# --- 3. Patch source ---
if grep -q '/api/notifications/subscribe' \$NS_FILE; then
  echo "    notification-service already has Web Push patch"
else
  echo "    Backing up notification-service/index.ts..."
  cp \$NS_FILE \$NS_FILE.bak.webpush.\$(date +%Y%m%d-%H%M%S)

  python3 <<'PY'
import re

NS = "/opt/crymadx/services/notification-service/src/index.ts"
src = open(NS).read()

# (a) Add `import webpush` after the amqp import
amqp_marker = 'import * as amqp from "amqplib";'
if 'import webpush from "web-push"' not in src:
    src = src.replace(amqp_marker, amqp_marker + '\nimport webpush from "web-push";')

# (b) Add VAPID setup + sendWebPush helper near the top after dotenv.config()
vapid_block = '''

// Web Push (closed-app system notifications via VAPID)
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
'''
if 'sendWebPush' not in src:
    src = src.replace('dotenv.config();', 'dotenv.config();\n' + vapid_block, 1)

# (c) Add subscribe / unsubscribe endpoints (just before the /health route)
subscribe_block = '''
/** POST /api/notifications/subscribe — register Web Push subscription for the user */
app.post("/api/notifications/subscribe", authMiddleware, async (req: any, res: any) => {
  try {
    const { subscription, userAgent } = req.body ?? {};
    if (!subscription?.endpoint || !subscription?.keys?.p256dh || !subscription?.keys?.auth) {
      return res.status(400).json({ error: "invalid subscription" });
    }
    const { MongoClient } = require("mongodb");
    const client = new MongoClient(process.env.MONGODB_URI!);
    await client.connect();
    const db = client.db("crymadx");
    const subs = db.collection("push_subscriptions");
    await subs.updateOne(
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

/** DELETE /api/notifications/subscribe — unregister a Web Push subscription */
app.delete("/api/notifications/subscribe", authMiddleware, async (req: any, res: any) => {
  try {
    const endpoint = req.body?.endpoint || req.query.endpoint;
    if (!endpoint) return res.status(400).json({ error: "endpoint required" });
    const { MongoClient } = require("mongodb");
    const client = new MongoClient(process.env.MONGODB_URI!);
    await client.connect();
    const db = client.db("crymadx");
    await db.collection("push_subscriptions").deleteOne({ endpoint, userId: req.userId });
    await client.close();
    res.json({ success: true });
  } catch (e: any) {
    console.error("[PUSH-UNSUBSCRIBE] Error:", e);
    res.status(500).json({ error: e.message });
  }
});

'''
if '/api/notifications/subscribe' not in src:
    health_marker = 'app.get("/health"'
    i = src.find(health_marker)
    if i == -1:
        raise SystemExit("could not find /health marker")
    src = src[:i] + subscribe_block + src[i:]

# (d) Inside the broadcast handler, add Web Push fanout after the insertMany.
# Anchor on the exact line we wrote in the previous patch.
push_fanout = '''
      // Fire Web Push to all subscribed devices (best-effort, non-blocking)
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
          console.log("[NOTIFY] Cleaned " + expiredEndpoints.length + " expired push subs");
        }
        console.log("[NOTIFY] Fired " + subDocs.length + " web pushes for broadcast " + broadcastId);
      }
'''
if 'pushSubs.find({ userId: { $in: recipientIds }' not in src:
    insertmany_marker = 'await notifs.insertMany(docs, { ordered: false })'
    if insertmany_marker in src:
        src = src.replace(insertmany_marker, insertmany_marker + ';\n' + push_fanout, 1)
    else:
        print("    WARN: could not find insertMany marker; web-push fanout NOT wired")

open(NS, "w").write(src)
print("    notification-service patched.")
PY
fi

# --- 4. Build + restart ---
echo "    Building notification-service..."
cd \$NS && npm run build 2>&1 | tail -5
echo "    Restarting notification-service..."
pm2 restart notification-service

echo ""
echo "==> Smoke testing Web Push endpoints..."
sleep 3
curl -sI -o /dev/null -w "    POST /api/notifications/subscribe (no auth, expect 401) -> HTTP %{http_code}\\n" \\
  -X POST http://127.0.0.1:3000/api/notifications/subscribe
curl -sI -o /dev/null -w "    DELETE /api/notifications/subscribe (no auth, expect 401) -> HTTP %{http_code}\\n" \\
  -X DELETE http://127.0.0.1:3000/api/notifications/subscribe
echo ""
echo "==> Web Push deployed."
REMOTE_SCRIPT

echo ""
echo "✅ Web Push backend ready. Closed-app pushes will fire on the next admin broadcast."
