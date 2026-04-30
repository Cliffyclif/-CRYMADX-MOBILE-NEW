/**
 * BACKEND PATCH — Web Push (closed-app system push)
 *
 * Adds these endpoints to notification-service/src/index.ts:
 *   POST   /api/notifications/subscribe    (user JWT) — store push subscription
 *   DELETE /api/notifications/subscribe    (user JWT) — remove subscription
 *
 * And EXTENDS the existing /api/admin/notifications/broadcast handler so it
 * also fires Web Push to every recipient's stored subscriptions via the
 * `web-push` library.
 *
 * Required env vars (set on /opt/crymadx/.env):
 *   WEB_PUSH_VAPID_PUBLIC=BI35vDyWLXfJuZ_GTuVjYcXEdtaJCVGrZKnjU_-ZMlG66bMvNw0_HDBA8ihI_3nfEmbEURwGK-AdtuoAZHFUcmc
 *   WEB_PUSH_VAPID_PRIVATE=1kuaLU7ghF0qsHClvbzwRVGADPXtrlTkDTB0gNJ-3nY
 *   WEB_PUSH_SUBJECT=mailto:noreply@crymadx.io
 *
 * The deploy script handles all of: npm install web-push, env writes, code
 * patching, build, restart.
 */

// ===== ADD AT TOP (after other imports, near `import * as amqp from "amqplib"`) =====
import webpush from "web-push"

// Configure VAPID (called once at module load if env vars present)
if (process.env.WEB_PUSH_VAPID_PUBLIC && process.env.WEB_PUSH_VAPID_PRIVATE) {
  webpush.setVapidDetails(
    process.env.WEB_PUSH_SUBJECT || "mailto:noreply@crymadx.io",
    process.env.WEB_PUSH_VAPID_PUBLIC,
    process.env.WEB_PUSH_VAPID_PRIVATE,
  )
  console.log("[NOTIFY] Web Push configured (VAPID set)")
} else {
  console.warn("[NOTIFY] Web Push DISABLED — set WEB_PUSH_VAPID_PUBLIC / _PRIVATE")
}

// Helper: send a Web Push notification, swallowing 410 (subscription expired)
async function sendWebPush(
  subscription: any,
  payload: { title: string; body: string; icon?: string; href?: string; category?: string },
): Promise<{ success: boolean; expired?: boolean; error?: string }> {
  if (!process.env.WEB_PUSH_VAPID_PUBLIC) return { success: false, error: "VAPID not configured" }
  try {
    await webpush.sendNotification(subscription, JSON.stringify(payload), { TTL: 60 * 60 * 24 })
    return { success: true }
  } catch (err: any) {
    // 404/410 = subscription is dead, browser unsubscribed it. Caller should delete it.
    if (err.statusCode === 404 || err.statusCode === 410) {
      return { success: false, expired: true }
    }
    return { success: false, error: err.message ?? String(err) }
  }
}

// ===== ADD (just before /health, alongside other notification routes) =====

/** POST /api/notifications/subscribe — register a Web Push subscription for the user */
app.post("/api/notifications/subscribe", authMiddleware, async (req: any, res: any) => {
  try {
    const { subscription, userAgent } = req.body ?? {}
    if (!subscription?.endpoint || !subscription?.keys?.p256dh || !subscription?.keys?.auth) {
      return res.status(400).json({ error: "invalid subscription" })
    }
    const { MongoClient } = require("mongodb")
    const client = new MongoClient(process.env.MONGODB_URI!)
    await client.connect()
    const db = client.db("crymadx")
    const subs = db.collection("push_subscriptions")
    // Upsert by endpoint — same browser re-subscribing should replace, not duplicate
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
    )
    await client.close()
    res.json({ success: true })
  } catch (e: any) {
    console.error("[PUSH-SUBSCRIBE] Error:", e)
    res.status(500).json({ error: e.message })
  }
})

/** DELETE /api/notifications/subscribe — unregister a Web Push subscription */
app.delete("/api/notifications/subscribe", authMiddleware, async (req: any, res: any) => {
  try {
    const endpoint = req.body?.endpoint || req.query.endpoint
    if (!endpoint) return res.status(400).json({ error: "endpoint required" })
    const { MongoClient } = require("mongodb")
    const client = new MongoClient(process.env.MONGODB_URI!)
    await client.connect()
    const db = client.db("crymadx")
    await db.collection("push_subscriptions").deleteOne({ endpoint, userId: req.userId })
    await client.close()
    res.json({ success: true })
  } catch (e: any) {
    console.error("[PUSH-UNSUBSCRIBE] Error:", e)
    res.status(500).json({ error: e.message })
  }
})

// ===== REPLACE the immediate-fanout block inside /api/admin/notifications/broadcast =====
// The original code looks like:
//
//   if (!scheduledFor && recipientIds.length > 0) {
//     const docs = recipientIds.map(...)
//     await notifs.insertMany(docs, { ordered: false })
//   }
//
// Replace it with this version, which ALSO fires Web Push to every recipient's
// subscriptions:
/*
    if (!scheduledFor && recipientIds.length > 0) {
      const docs = recipientIds.map(userId => ({
        userId,
        type: category,
        title,
        body,
        icon,
        href,
        sentAt: now,
        createdAt: now,
        read: false,
        broadcastId,
        data: { broadcastId, category },
        success: true,
      }))
      await notifs.insertMany(docs, { ordered: false })

      // Fire Web Push to all subscribed devices (best-effort, non-blocking)
      const subs = db.collection("push_subscriptions")
      const subDocs = await subs.find({ userId: { $in: recipientIds } }).toArray()
      if (subDocs.length > 0) {
        const pushPayload = { title, body, icon, href, category }
        const expiredEndpoints: string[] = []
        await Promise.allSettled(subDocs.map(async (s: any) => {
          const r = await sendWebPush({ endpoint: s.endpoint, keys: s.keys }, pushPayload)
          if (r.expired) expiredEndpoints.push(s.endpoint)
        }))
        // Garbage-collect dead subscriptions
        if (expiredEndpoints.length > 0) {
          await subs.deleteMany({ endpoint: { $in: expiredEndpoints } })
          console.log(`[NOTIFY] Cleaned up ${expiredEndpoints.length} expired push subscriptions`)
        }
        console.log(`[NOTIFY] Fired ${subDocs.length} web pushes for broadcast ${broadcastId}`)
      }
    }
*/
