import fs from "node:fs";
import path from "node:path";
import {
  CHANNEL_ID,
  DEFAULT_STATS,
  UPLOADS_PLAYLIST_ID,
  VIDEOS,
  type ChannelStats,
  type SupporterEntry,
  type Video,
  type YouTubeFeedResponse,
} from "./channel";

let cachedYouTubeFeed: { data: YouTubeFeedResponse; expiresAt: number } | null = null;
const CACHE_TTL_MS = 60_000;

const supportersStore: SupporterEntry[] = [];

function getEnvVar(key: string): string {
  if (typeof process !== "undefined" && process.env && process.env[key]) {
    return (process.env[key] as string).trim();
  }
  try {
    const envPath = path.resolve(process.cwd(), ".env");
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, "utf-8");
      for (const line of content.split(/\r?\n/)) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#")) continue;
        const eqIdx = trimmed.indexOf("=");
        if (eqIdx === -1) continue;
        const k = trimmed.slice(0, eqIdx).trim();
        if (k === key) {
          return trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, "");
        }
      }
    }
  } catch {
    // ignore fs read errors
  }
  return "";
}

function parseIsoDuration(iso: string | undefined): { formatted: string; totalSeconds: number } {
  if (!iso) return { formatted: "", totalSeconds: 0 };
  const match = /^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/i.exec(iso);
  if (!match) return { formatted: "", totalSeconds: 0 };
  const hours = Number(match[1] ?? 0);
  const minutes = Number(match[2] ?? 0);
  const seconds = Number(match[3] ?? 0);
  const totalSeconds = hours * 3600 + minutes * 60 + seconds;
  if (hours > 0) {
    return {
      formatted: `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`,
      totalSeconds,
    };
  }
  return {
    formatted: `${minutes}:${String(seconds).padStart(2, "0")}`,
    totalSeconds,
  };
}

export async function fetchYouTubeLiveFeed(forceRefresh = false): Promise<YouTubeFeedResponse> {
  if (!forceRefresh && cachedYouTubeFeed && Date.now() < cachedYouTubeFeed.expiresAt) {
    return cachedYouTubeFeed.data;
  }

  const apiKey = getEnvVar("YOUTUBE_API_KEY");
  const channelId = getEnvVar("YOUTUBE_CHANNEL_ID") || CHANNEL_ID;

  if (!apiKey) {
    return {
      stats: DEFAULT_STATS,
      videos: VIDEOS,
      source: "fallback",
    };
  }

  try {
    const channelRes = await fetch(
      `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics,contentDetails&id=${encodeURIComponent(channelId)}&key=${encodeURIComponent(apiKey)}`,
    );

    if (!channelRes.ok) {
      throw new Error(`YouTube channels API returned ${channelRes.status}`);
    }

    const channelJson = (await channelRes.json()) as {
      items?: Array<{
        snippet?: {
          title?: string;
          description?: string;
          customUrl?: string;
          thumbnails?: { high?: { url?: string }; medium?: { url?: string } };
        };
        statistics?: {
          subscriberCount?: string;
          viewCount?: string;
          videoCount?: string;
        };
        contentDetails?: {
          relatedPlaylists?: {
            uploads?: string;
          };
        };
      }>;
    };

    const channelItem = channelJson.items?.[0];
    const uploadsPlaylistId =
      channelItem?.contentDetails?.relatedPlaylists?.uploads || UPLOADS_PLAYLIST_ID;

    const stats: ChannelStats = {
      subscriberCount: Number(
        channelItem?.statistics?.subscriberCount ?? DEFAULT_STATS.subscriberCount,
      ),
      viewCount: Number(channelItem?.statistics?.viewCount ?? DEFAULT_STATS.viewCount),
      videoCount: Number(channelItem?.statistics?.videoCount ?? DEFAULT_STATS.videoCount),
      title: channelItem?.snippet?.title || DEFAULT_STATS.title,
      description: channelItem?.snippet?.description || DEFAULT_STATS.description,
      customUrl: channelItem?.snippet?.customUrl || DEFAULT_STATS.customUrl,
      avatarUrl:
        channelItem?.snippet?.thumbnails?.high?.url ||
        channelItem?.snippet?.thumbnails?.medium?.url ||
        DEFAULT_STATS.avatarUrl,
      isLiveData: true,
      updatedAt: new Date().toISOString(),
    };

    const playlistRes = await fetch(
      `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet,contentDetails&playlistId=${encodeURIComponent(uploadsPlaylistId)}&maxResults=12&key=${encodeURIComponent(apiKey)}`,
    );

    if (!playlistRes.ok) {
      throw new Error(`YouTube playlistItems API returned ${playlistRes.status}`);
    }

    const playlistJson = (await playlistRes.json()) as {
      items?: Array<{
        snippet?: {
          title?: string;
          description?: string;
          publishedAt?: string;
          resourceId?: { videoId?: string };
          thumbnails?: {
            maxres?: { url?: string };
            high?: { url?: string };
            medium?: { url?: string };
          };
        };
        contentDetails?: {
          videoId?: string;
          videoPublishedAt?: string;
        };
      }>;
    };

    const rawItems = playlistJson.items ?? [];
    const videoIds = rawItems
      .map((item) => item.contentDetails?.videoId || item.snippet?.resourceId?.videoId)
      .filter((id): id is string => Boolean(id));

    const detailsMap = new Map<
      string,
      {
        views?: number;
        likes?: number;
        comments?: number;
        duration?: string;
        totalSeconds?: number;
        isLiveStream?: boolean;
        isLiveNow?: boolean;
      }
    >();

    if (videoIds.length > 0) {
      const videosRes = await fetch(
        `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics,contentDetails,liveStreamingDetails&id=${encodeURIComponent(videoIds.join(","))}&key=${encodeURIComponent(apiKey)}`,
      );
      if (videosRes.ok) {
        const videosJson = (await videosRes.json()) as {
          items?: Array<{
            id?: string;
            snippet?: {
              liveBroadcastContent?: string;
            };
            statistics?: {
              viewCount?: string;
              likeCount?: string;
              commentCount?: string;
            };
            contentDetails?: {
              duration?: string;
            };
            liveStreamingDetails?: {
              actualStartTime?: string;
              scheduledStartTime?: string;
            };
          }>;
        };
        for (const v of videosJson.items ?? []) {
          if (!v.id) continue;
          const { formatted, totalSeconds } = parseIsoDuration(v.contentDetails?.duration);
          const views =
            v.statistics?.viewCount !== undefined ? Number(v.statistics.viewCount) : undefined;
          const likes =
            v.statistics?.likeCount !== undefined ? Number(v.statistics.likeCount) : undefined;
          const comments =
            v.statistics?.commentCount !== undefined
              ? Number(v.statistics.commentCount)
              : undefined;
          detailsMap.set(v.id, {
            ...(views !== undefined ? { views } : {}),
            ...(likes !== undefined ? { likes } : {}),
            ...(comments !== undefined ? { comments } : {}),
            ...(formatted ? { duration: formatted, totalSeconds } : {}),
            isLiveStream: Boolean(v.liveStreamingDetails),
            isLiveNow: v.snippet?.liveBroadcastContent === "live",
          });
        }
      }
    }

    const videos: Video[] = rawItems
      .map((item): Video | null => {
        const id = item.contentDetails?.videoId || item.snippet?.resourceId?.videoId;
        if (!id) return null;
        const title = item.snippet?.title || "Untitled Video";
        const description = item.snippet?.description || "";
        const date =
          item.contentDetails?.videoPublishedAt ||
          item.snippet?.publishedAt ||
          new Date().toISOString();
        const details = detailsMap.get(id);
        const lowerText = `${title} ${description}`.toLowerCase();
        const isShort =
          lowerText.includes("#shorts") ||
          lowerText.includes("#short") ||
          (details?.totalSeconds !== undefined &&
            details.totalSeconds > 0 &&
            details.totalSeconds <= 65);
        const isLiveStream = Boolean(details?.isLiveStream) || /\blive\b/i.test(title);
        const thumbnail =
          item.snippet?.thumbnails?.maxres?.url ||
          item.snippet?.thumbnails?.high?.url ||
          item.snippet?.thumbnails?.medium?.url ||
          `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;

        return {
          id,
          title,
          date,
          ...(details?.views !== undefined ? { views: details.views } : {}),
          ...(details?.likes !== undefined ? { likes: details.likes } : {}),
          ...(details?.comments !== undefined ? { comments: details.comments } : {}),
          ...(details?.duration ? { duration: details.duration } : {}),
          isLiveStream,
          isLiveNow: Boolean(details?.isLiveNow),
          isShort,
          thumbnail,
          description,
        };
      })
      .filter((v): v is Video => v !== null);

    const payload: YouTubeFeedResponse = {
      stats,
      videos: videos.length > 0 ? videos : VIDEOS,
      source: "youtube_api",
    };

    cachedYouTubeFeed = {
      data: payload,
      expiresAt: Date.now() + CACHE_TTL_MS,
    };

    return payload;
  } catch (error) {
    console.warn("[YouTube API] Falling back to cached/snapshot feed:", error);
    return {
      stats: DEFAULT_STATS,
      videos: VIDEOS,
      source: "fallback",
    };
  }
}

async function syncLiveRazorpaySupporters(): Promise<{
  supporters: SupporterEntry[];
  syncedLive: boolean;
}> {
  const keyId = getEnvVar("RAZORPAY_KEY_ID");
  const keySecret = getEnvVar("RAZORPAY_KEY_SECRET");

  if (!keyId || !keySecret) {
    return {
      supporters: supportersStore,
      syncedLive: false,
    };
  }

  try {
    const auth = Buffer.from(`${keyId}:${keySecret}`).toString("base64");
    const res = await fetch("https://api.razorpay.com/v1/payments?count=50", {
      method: "GET",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/json",
      },
    });

    if (!res.ok) {
      return {
        supporters: supportersStore,
        syncedLive: false,
      };
    }

    const data = (await res.json()) as {
      items?: Array<{
        id: string;
        amount: number;
        currency: string;
        status: string;
        email?: string;
        contact?: string;
        description?: string;
        notes?: Record<string, string | undefined>;
        created_at: number;
      }>;
    };

    const validPayments = (data.items ?? []).filter(
      (item) => item.status === "captured" || item.status === "authorized",
    );

    const byPaymentId = new Map<string, SupporterEntry>();
    for (const existing of supportersStore) {
      byPaymentId.set(existing.paymentId, existing);
    }

    for (const p of validPayments) {
      const notes = p.notes ?? {};
      const nameFromEmail = p.email ? p.email.split("@")[0] : undefined;
      const supporterName = (
        notes["supporterName"] ||
        notes["name"] ||
        nameFromEmail ||
        "AG Soldier"
      )
        .trim()
        .slice(0, 60);
      const gameTag = (notes["gameTag"] || notes["discord"] || "").trim().slice(0, 40);
      const message = (
        notes["message"] ||
        p.description ||
        "Supported AG2K_TAMILAN via Razorpay"
      )
        .trim()
        .slice(0, 280);

      byPaymentId.set(p.id, {
        id: `rzp-${p.id}`,
        name: supporterName,
        ...(gameTag ? { gameTag } : {}),
        amount: Math.max(1, Math.round(p.amount / 100)),
        currency: (p.currency || "INR").toUpperCase(),
        tierName: "Razorpay Support",
        message,
        paymentId: p.id,
        createdAt: new Date(p.created_at * 1000).toISOString(),
        verified: true,
      });
    }

    const merged = Array.from(byPaymentId.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );

    supportersStore.length = 0;
    supportersStore.push(...merged.slice(0, 50));

    return {
      supporters: supportersStore,
      syncedLive: true,
    };
  } catch {
    return {
      supporters: supportersStore,
      syncedLive: false,
    };
  }
}

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}

export async function handleApiRequest(request: Request): Promise<Response | null> {
  const url = new URL(request.url, "http://localhost:3000");

  if (url.pathname === "/api/youtube" && request.method === "GET") {
    const forceRefresh = url.searchParams.get("refresh") === "1";
    const feed = await fetchYouTubeLiveFeed(forceRefresh);
    return jsonResponse(feed);
  }

  if (url.pathname === "/api/razorpay/supporters" && request.method === "GET") {
    const syncResult = await syncLiveRazorpaySupporters();
    return jsonResponse({
      supporters: syncResult.supporters,
      syncedLive: syncResult.syncedLive,
      lastSyncedAt: new Date().toISOString(),
    });
  }

  if (url.pathname === "/api/razorpay/order" && request.method === "POST") {
    try {
      const body = (await request.json()) as {
        amount?: number;
        currency?: string;
        supporterName?: string;
        gameTag?: string;
        email?: string;
        message?: string;
      };

      const rawAmount = Number(body.amount ?? 0);
      if (!Number.isFinite(rawAmount) || rawAmount < 10 || rawAmount > 100000) {
        return jsonResponse(
          { error: "Please enter a valid support amount between ₹10 and ₹1,00,000." },
          400,
        );
      }

      const amountInPaise = Math.round(rawAmount * 100);
      const currency = (body.currency || "INR").toUpperCase();
      const keyId = getEnvVar("RAZORPAY_KEY_ID");
      const keySecret = getEnvVar("RAZORPAY_KEY_SECRET");
      const receipt = `ag2k_${Date.now()}`;

      if (keyId && keySecret) {
        const auth = Buffer.from(`${keyId}:${keySecret}`).toString("base64");
        const rzpRes = await fetch("https://api.razorpay.com/v1/orders", {
          method: "POST",
          headers: {
            Authorization: `Basic ${auth}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            amount: amountInPaise,
            currency,
            receipt,
            notes: {
              supporterName: body.supporterName || "AG Soldier",
              gameTag: body.gameTag || "",
              message: body.message || "",
            },
          }),
        });

        if (rzpRes.ok) {
          const rzpOrder = (await rzpRes.json()) as { id: string; amount: number; currency: string };
          return jsonResponse({
            mode: "razorpay_order",
            orderId: rzpOrder.id,
            amount: rzpOrder.amount,
            currency: rzpOrder.currency,
            keyId,
            receipt,
          });
        }
      }

      return jsonResponse({
        mode: "razorpay_client",
        orderId: null,
        amount: amountInPaise,
        currency,
        keyId: keyId || null,
        receipt,
      });
    } catch (error) {
      return jsonResponse(
        { error: error instanceof Error ? error.message : "Failed to initialize Razorpay order." },
        500,
      );
    }
  }

  if (url.pathname === "/api/razorpay/verify" && request.method === "POST") {
    try {
      const body = (await request.json()) as {
        razorpay_order_id?: string;
        razorpay_payment_id?: string;
        razorpay_signature?: string;
        amount?: number;
        currency?: string;
        supporterName?: string;
        gameTag?: string;
        message?: string;
      };

      const paymentId = body.razorpay_payment_id?.trim();
      if (!paymentId) {
        return jsonResponse({ error: "Missing Razorpay payment ID." }, 400);
      }

      const keySecret = getEnvVar("RAZORPAY_KEY_SECRET");
      let signatureVerified = true;
      if (keySecret && body.razorpay_order_id && body.razorpay_signature) {
        const crypto = await import("node:crypto");
        const expected = crypto
          .createHmac("sha256", keySecret)
          .update(`${body.razorpay_order_id}|${paymentId}`)
          .digest("hex");
        signatureVerified = expected === body.razorpay_signature;
        if (!signatureVerified) {
          return jsonResponse({ error: "Razorpay payment signature verification failed." }, 400);
        }
      }

      const amountInRupees = Math.max(10, Math.round(Number(body.amount ?? 100)));
      const supporterName = (body.supporterName || "AG Soldier").trim().slice(0, 60);
      const gameTag = (body.gameTag || "").trim().slice(0, 40);
      const message = (body.message || "Supported AG2K_TAMILAN via Razorpay!")
        .trim()
        .slice(0, 280);

      const entry: SupporterEntry = {
        id: `rzp-${paymentId}`,
        name: supporterName,
        ...(gameTag ? { gameTag } : {}),
        amount: amountInRupees,
        currency: body.currency || "INR",
        tierName: "Razorpay Support",
        message,
        paymentId,
        createdAt: new Date().toISOString(),
        verified: signatureVerified,
      };

      const existingIdx = supportersStore.findIndex((s) => s.paymentId === paymentId);
      if (existingIdx !== -1) {
        supportersStore[existingIdx] = entry;
      } else {
        supportersStore.unshift(entry);
      }

      await syncLiveRazorpaySupporters();

      return jsonResponse({
        ok: true,
        supporter: entry,
        supporters: supportersStore,
      });
    } catch (error) {
      return jsonResponse(
        { error: error instanceof Error ? error.message : "Failed to verify Razorpay payment." },
        500,
      );
    }
  }

  return null;
}
