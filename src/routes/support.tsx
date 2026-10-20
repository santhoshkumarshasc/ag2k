import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import {
  ArrowLeft,
  Copy,
  Heart,
  Menu,
  RefreshCw,
  Sparkles,
  X,
  Youtube,
} from "lucide-react";
import logo from "@/assets/ag2k-logo.png.asset.json";
import {
  CHANNEL_URL,
  SUBSCRIBE_URL,
  type SupporterEntry,
} from "@/lib/channel";

export const Route = createFileRoute("/support")({
  head: () => ({
    meta: [
      { title: "Support AG2K_TAMILAN — Pay with Razorpay" },
      {
        name: "description",
        content:
          "Support AG2K_TAMILAN directly with Razorpay and join the live AG Soldiers Supporter Wall.",
      },
      { property: "og:title", content: "Support AG2K_TAMILAN — Pay with Razorpay" },
      {
        property: "og:description",
        content:
          "Support AG2K_TAMILAN via Razorpay and see live verified supporters on the AG Soldiers Wall.",
      },
    ],
  }),
  component: SupportPage,
});

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => {
      open: () => void;
      on: (event: string, callback: (response: unknown) => void) => void;
    };
  }
}

function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === "undefined") return resolve(false);
    if (window.Razorpay) return resolve(true);
    const existing = document.querySelector(
      'script[src="https://checkout.razorpay.com/v1/checkout.js"]',
    );
    if (existing) {
      existing.addEventListener("load", () => resolve(Boolean(window.Razorpay)));
      existing.addEventListener("error", () => resolve(false));
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve(Boolean(window.Razorpay));
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

function SupportNav() {
  const [open, setOpen] = useState(false);

  return (
    <header className="fixed inset-x-0 top-0 z-40 border-b border-border bg-background/90 backdrop-blur-lg">
      <nav
        className="mx-auto flex max-w-7xl items-center justify-between gap-8 px-5 py-4"
        aria-label="Support Navigation"
      >
        <Link
          to="/"
          className="flex shrink-0 items-center gap-2.5 whitespace-nowrap font-display text-lg font-black tracking-wider"
        >
          <img
            src={logo.url}
            alt="AG2K_TAMILAN"
            referrerPolicy="no-referrer"
            className="h-9 w-9 shrink-0 rounded-full object-cover"
          />
          <span>
            AG2K<span className="text-neon">_TAMILAN</span>
          </span>
        </Link>

        <ul className="hidden items-center gap-7 lg:flex">
          <li>
            <Link
              to="/"
              className="whitespace-nowrap text-sm text-muted-foreground transition hover:text-foreground"
            >
              Home
            </Link>
          </li>
          <li>
            <a
              href="/#videos"
              className="whitespace-nowrap text-sm text-muted-foreground transition hover:text-foreground"
            >
              Live Uploads
            </a>
          </li>
          <li>
            <a
              href="#razorpay-checkout"
              className="whitespace-nowrap text-sm text-muted-foreground transition hover:text-foreground"
            >
              Pay with Razorpay
            </a>
          </li>
          <li>
            <a
              href="#supporters-wall"
              className="whitespace-nowrap text-sm text-muted-foreground transition hover:text-foreground"
            >
              Supporters Wall
            </a>
          </li>
        </ul>

        <div className="hidden shrink-0 lg:block">
          <a
            href={SUBSCRIBE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex shrink-0 items-center gap-2 whitespace-nowrap rounded-full bg-neon px-5 py-2 text-sm font-bold text-primary-foreground shadow-glow transition hover:scale-105"
          >
            <Youtube className="h-4 w-4" /> Subscribe on YouTube
          </a>
        </div>

        <button
          className="lg:hidden"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          onClick={() => setOpen(!open)}
        >
          {open ? <X /> : <Menu />}
        </button>
      </nav>

      {open && (
        <div className="border-t border-border px-5 pb-6 pt-3 lg:hidden">
          <ul className="flex flex-col gap-1">
            <li>
              <Link
                to="/"
                onClick={() => setOpen(false)}
                className="block rounded-lg px-3 py-2.5 hover:bg-muted"
              >
                Home
              </Link>
            </li>
            <li>
              <a
                href="/#videos"
                onClick={() => setOpen(false)}
                className="block rounded-lg px-3 py-2.5 hover:bg-muted"
              >
                Live Uploads
              </a>
            </li>
            <li>
              <a
                href="#razorpay-checkout"
                onClick={() => setOpen(false)}
                className="block rounded-lg px-3 py-2.5 hover:bg-muted"
              >
                Pay with Razorpay
              </a>
            </li>
            <li>
              <a
                href="#supporters-wall"
                onClick={() => setOpen(false)}
                className="block rounded-lg px-3 py-2.5 hover:bg-muted"
              >
                Supporters Wall
              </a>
            </li>
          </ul>
        </div>
      )}
    </header>
  );
}

function SupportFooter() {
  const navLinks = [
    { label: "Home", href: "/#home" },
    { label: "About", href: "/#about" },
    { label: "Videos", href: "/#videos" },
    { label: "Achievements", href: "/#achievements" },
    { label: "Contact", href: "/#contact" },
  ];

  return (
    <footer className="border-t border-border px-5 py-12">
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-6 text-center">
        <p className="font-display text-xl font-black">
          AG2K<span className="text-neon">_TAMILAN</span>
        </p>
        <ul className="flex flex-wrap justify-center gap-5 text-sm text-muted-foreground">
          {navLinks.map((n) => (
            <li key={n.label}>
              <a href={n.href} className="hover:text-foreground">
                {n.label}
              </a>
            </li>
          ))}
          <li>
            <Link to="/support" className="font-semibold text-secondary hover:text-foreground">
              Support (Razorpay)
            </Link>
          </li>
        </ul>
        <a
          href={CHANNEL_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-sm hover:text-primary"
        >
          <Youtube className="h-5 w-5" /> @AG2K_TAMILAN
        </a>
        <p className="text-sm text-muted-foreground">Made with passion. Powered by creativity.</p>
        <p className="text-xs text-muted-foreground">
          © {new Date().getFullYear()} AG2K_TAMILAN. All rights reserved.
        </p>
      </div>
    </footer>
  );
}

function SupportPage() {
  const [amount, setAmount] = useState<string>("100");
  const [supporterName, setSupporterName] = useState("");
  const [gameTag, setGameTag] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  const [supporters, setSupporters] = useState<SupporterEntry[]>([]);
  const [syncingWall, setSyncingWall] = useState(false);
  const [syncedLiveApi, setSyncedLiveApi] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [completedReceipt, setCompletedReceipt] = useState<SupporterEntry | null>(null);
  const [copiedId, setCopiedId] = useState(false);

  const numericAmount = Number(amount);

  const syncSupportersWall = useCallback(async () => {
    setSyncingWall(true);
    try {
      const res = await fetch("/api/razorpay/supporters");
      if (res.ok) {
        const data = (await res.json()) as {
          supporters?: SupporterEntry[];
          syncedLive?: boolean;
          lastSyncedAt?: string;
        };
        if (Array.isArray(data.supporters)) {
          setSupporters(data.supporters);
        }
        setSyncedLiveApi(Boolean(data.syncedLive));
        if (data.lastSyncedAt) {
          setLastSyncedAt(data.lastSyncedAt);
        }
      }
    } catch {
      // ignore network error during background poll
    } finally {
      setSyncingWall(false);
    }
  }, []);

  useEffect(() => {
    void loadRazorpayScript();
    void syncSupportersWall();

    const interval = setInterval(() => {
      void syncSupportersWall();
    }, 30_000);
    return () => clearInterval(interval);
  }, [syncSupportersWall]);

  const handlePayWithRazorpay = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setCompletedReceipt(null);

    const trimmedName = supporterName.trim();
    const trimmedEmail = email.trim();

    if (!trimmedName) {
      setErrorMsg("Please enter your name or YouTube handle.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setErrorMsg("Please enter a valid email address for your Razorpay receipt.");
      return;
    }
    if (!Number.isFinite(numericAmount) || numericAmount < 10 || numericAmount > 100000) {
      setErrorMsg("Please enter a valid amount between ₹10 and ₹1,00,000.");
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch("/api/razorpay/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: numericAmount,
          currency: "INR",
          supporterName: trimmedName,
          gameTag: gameTag.trim(),
          email: trimmedEmail,
          message: message.trim(),
        }),
      });

      const orderData = (await res.json()) as {
        error?: string;
        orderId?: string | null;
        amount?: number;
        currency?: string;
        keyId?: string | null;
      };

      if (!res.ok || !orderData.amount) {
        setErrorMsg(orderData.error || "Unable to initialize Razorpay order.");
        setSubmitting(false);
        return;
      }

      if (!orderData.keyId) {
        setErrorMsg(
          "Razorpay gateway is not configured on the server yet. Please set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.",
        );
        setSubmitting(false);
        return;
      }

      const sdkLoaded = await loadRazorpayScript();
      if (!sdkLoaded || !window.Razorpay) {
        setErrorMsg("Razorpay Checkout SDK could not be loaded. Please check your connection.");
        setSubmitting(false);
        return;
      }

      const options: Record<string, unknown> = {
        key: orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency || "INR",
        name: "AG2K_TAMILAN",
        description: "Creator Support",
        image: window.location.origin + logo.url,
        ...(orderData.orderId ? { order_id: orderData.orderId } : {}),
        prefill: {
          name: trimmedName,
          email: trimmedEmail,
        },
        notes: {
          supporterName: trimmedName,
          gameTag: gameTag.trim(),
          message: message.trim(),
        },
        theme: {
          color: "#2563EB",
        },
        handler: async (response: {
          razorpay_payment_id?: string;
          razorpay_order_id?: string;
          razorpay_signature?: string;
        }) => {
          try {
            const verifyRes = await fetch("/api/razorpay/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id ?? orderData.orderId,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                amount: numericAmount,
                currency: orderData.currency || "INR",
                supporterName: trimmedName,
                gameTag: gameTag.trim(),
                message: message.trim(),
              }),
            });
            const verifyData = (await verifyRes.json()) as {
              ok?: boolean;
              error?: string;
              supporter?: SupporterEntry;
              supporters?: SupporterEntry[];
            };

            if (!verifyRes.ok || !verifyData.supporter) {
              setErrorMsg(verifyData.error || "Razorpay payment verification failed.");
              return;
            }

            setCompletedReceipt(verifyData.supporter);
            if (verifyData.supporters) {
              setSupporters(verifyData.supporters);
            }
            setMessage("");
            void syncSupportersWall();
          } catch {
            setErrorMsg("Could not verify Razorpay payment with server.");
          } finally {
            setSubmitting(false);
          }
        },
        modal: {
          ondismiss: () => {
            setSubmitting(false);
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", (resp: unknown) => {
        const errObj = resp as { error?: { description?: string } };
        setErrorMsg(
          errObj?.error?.description || "Payment was declined by Razorpay. Please try again.",
        );
        setSubmitting(false);
      });
      rzp.open();
    } catch {
      setErrorMsg("Network error while connecting to Razorpay.");
      setSubmitting(false);
    }
  };

  const totalSupportedAmount = supporters.reduce((acc, s) => acc + s.amount, 0);

  return (
    <div className="flex min-h-screen flex-col justify-between overflow-x-hidden">
      <SupportNav />

      <main className="mx-auto w-full max-w-4xl px-5 pb-24 pt-28">
        {/* Back link & Hero */}
        <div className="mb-10 text-center">
          <div className="mb-6 flex justify-center">
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-sm text-muted-foreground transition hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" /> Back to AG2K_TAMILAN Home
            </Link>
          </div>

          <p className="mb-3 text-sm uppercase tracking-[0.25em] text-secondary">
            Creator Support · Razorpay
          </p>
          <h1
            className="font-display text-4xl font-black leading-tight sm:text-5xl"
            style={{ textWrap: "balance" }}
          >
            SUPPORT <span className="text-neon">AG2K_TAMILAN</span>
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">
            Support the channel directly via Razorpay and get featured on the live AG Soldiers
            Supporter Wall.
          </p>
        </div>

        {/* Single Centered Pay with Razorpay Card */}
        <section id="razorpay-checkout" className="mx-auto max-w-xl">
          <div className="glass rounded-3xl p-7 sm:p-9">
            <div className="flex items-center justify-between gap-4 border-b border-border pb-5">
              <div>
                <h2 className="font-display text-xl font-black">PAY WITH RAZORPAY</h2>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Official Razorpay Secure Checkout
                </p>
              </div>
              <div className="text-right">
                <span className="text-xs text-muted-foreground">Amount</span>
                <p className="font-display text-2xl font-black text-secondary tabular-nums">
                  ₹
                  {Number.isFinite(numericAmount) && numericAmount > 0
                    ? numericAmount.toLocaleString("en-IN")
                    : 0}
                </p>
              </div>
            </div>

            {completedReceipt && (
              <div className="mt-5 rounded-2xl border border-secondary/50 bg-secondary/10 p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-secondary">
                      Razorpay Payment Verified
                    </p>
                    <h3 className="mt-1 font-display text-lg font-black tabular-nums">
                      ₹{completedReceipt.amount.toLocaleString("en-IN")} Support Confirmed
                    </h3>
                  </div>
                  <Sparkles className="h-5 w-5 shrink-0 text-secondary" />
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  Synced to the AG Soldiers Supporter Wall below.
                </p>
                <div className="mt-3 flex items-center justify-between rounded-xl bg-background/60 px-3.5 py-2 text-xs">
                  <span className="font-mono tabular-nums text-muted-foreground">
                    ID: {completedReceipt.paymentId}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      void navigator.clipboard?.writeText(completedReceipt.paymentId);
                      setCopiedId(true);
                      setTimeout(() => setCopiedId(false), 2000);
                    }}
                    className="inline-flex items-center gap-1 font-bold text-secondary hover:underline"
                  >
                    <Copy className="h-3.5 w-3.5" /> {copiedId ? "Copied" : "Copy ID"}
                  </button>
                </div>
              </div>
            )}

            <form onSubmit={handlePayWithRazorpay} className="mt-6 space-y-4" noValidate>
              <label className="grid gap-1.5 text-xs font-medium text-muted-foreground">
                Support Amount (INR) *
                <div className="relative">
                  <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 font-bold text-secondary">
                    ₹
                  </span>
                  <input
                    type="number"
                    required
                    min={10}
                    max={100000}
                    placeholder="100"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full rounded-xl border border-input bg-muted/50 py-3 pl-9 pr-4 text-base font-bold tabular-nums text-foreground outline-none focus:border-primary"
                  />
                </div>
              </label>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="grid gap-1.5 text-xs font-medium text-muted-foreground">
                  Your Name / YouTube Handle *
                  <input
                    type="text"
                    required
                    maxLength={60}
                    placeholder="e.g. Bala_TamilGaming"
                    value={supporterName}
                    onChange={(e) => setSupporterName(e.target.value)}
                    className="w-full rounded-xl border border-input bg-muted/50 px-3.5 py-2.5 text-sm text-foreground outline-none focus:border-primary"
                  />
                </label>

                <label className="grid gap-1.5 text-xs font-medium text-muted-foreground">
                  In-Game / Discord Tag
                  <input
                    type="text"
                    maxLength={40}
                    placeholder="e.g. BalaCraft#1234"
                    value={gameTag}
                    onChange={(e) => setGameTag(e.target.value)}
                    className="w-full rounded-xl border border-input bg-muted/50 px-3.5 py-2.5 text-sm text-foreground outline-none focus:border-primary"
                  />
                </label>
              </div>

              <label className="grid gap-1.5 text-xs font-medium text-muted-foreground">
                Email Address (for Razorpay Receipt) *
                <input
                  type="email"
                  required
                  maxLength={120}
                  placeholder="soldier@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-input bg-muted/50 px-3.5 py-2.5 text-sm text-foreground outline-none focus:border-primary"
                />
              </label>

              <label className="grid gap-1.5 text-xs font-medium text-muted-foreground">
                Live Stream Shoutout Message
                <textarea
                  rows={3}
                  maxLength={280}
                  placeholder="Write a message for the stream..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full rounded-xl border border-input bg-muted/50 px-3.5 py-2.5 text-sm text-foreground outline-none focus:border-primary"
                />
              </label>

              {errorMsg && (
                <p role="alert" className="text-xs font-medium text-destructive">
                  {errorMsg}
                </p>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="flex w-full items-center justify-center gap-2 rounded-full bg-neon py-3.5 font-bold text-primary-foreground shadow-glow transition hover:scale-[1.01] disabled:opacity-60"
              >
                <Heart className="h-4 w-4 fill-current" />
                {submitting
                  ? "Opening Razorpay..."
                  : `Pay ₹${Number.isFinite(numericAmount) && numericAmount > 0 ? numericAmount.toLocaleString("en-IN") : 0} with Razorpay`}
              </button>
            </form>
          </div>
        </section>

        {/* AG SOLDIERS SUPPORTER WALL — Synced with Live Razorpay Data */}
        <section id="supporters-wall" className="mt-20">
          <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <p className="mb-2 text-sm uppercase tracking-[0.25em] text-secondary">
                {syncedLiveApi ? "Razorpay Live API Synced" : "Razorpay Verified Contributions"}
              </p>
              <h2 className="font-display text-3xl font-black">AG SOLDIERS SUPPORTER WALL</h2>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <span className="tabular-nums">
                  {supporters.length} {supporters.length === 1 ? "Supporter" : "Supporters"}
                </span>
                <span aria-hidden="true">·</span>
                <span className="tabular-nums">
                  ₹{totalSupportedAmount.toLocaleString("en-IN")} Total Raised
                </span>
                {lastSyncedAt && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span className="tabular-nums">
                      Synced{" "}
                      {new Date(lastSyncedAt).toLocaleTimeString("en-IN", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={() => void syncSupportersWall()}
              disabled={syncingWall}
              className="inline-flex shrink-0 items-center gap-1.5 self-start whitespace-nowrap rounded-xl border border-border bg-card px-4 py-2.5 text-xs font-bold transition hover:border-primary disabled:opacity-60 sm:self-auto"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${syncingWall ? "animate-spin" : ""}`} />
              {syncingWall ? "Syncing Razorpay..." : "Sync Razorpay Live"}
            </button>
          </div>

          {supporters.length === 0 ? (
            <div className="glass rounded-3xl p-10 text-center">
              <p className="font-display text-lg font-bold">No Razorpay supporters recorded yet</p>
              <p className="mx-auto mt-2 max-w-md text-xs text-muted-foreground">
                Verified Razorpay payments automatically sync and appear here in real time.
              </p>
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2">
              {supporters.map((sup) => (
                <div
                  key={sup.id}
                  className="glass flex flex-col justify-between rounded-2xl p-6 transition hover:border-primary/50"
                >
                  <div>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-bold text-foreground">{sup.name}</h3>
                        <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                          <span>{sup.tierName}</span>
                          {sup.gameTag && (
                            <>
                              <span aria-hidden="true">·</span>
                              <span>{sup.gameTag}</span>
                            </>
                          )}
                        </div>
                      </div>
                      <span className="font-display text-lg font-black text-secondary tabular-nums">
                        ₹{sup.amount.toLocaleString("en-IN")}
                      </span>
                    </div>

                    <p className="mt-4 text-sm leading-relaxed text-foreground/90">
                      “{sup.message}”
                    </p>
                  </div>

                  <div className="mt-5 flex items-center justify-between border-t border-border pt-3 text-xs text-muted-foreground">
                    <span className="tabular-nums">
                      {new Date(sup.createdAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                    <span className="font-mono tabular-nums">{sup.paymentId}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      <SupportFooter />
    </div>
  );
}
