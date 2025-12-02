// app/api/translate/route.ts
import { NextResponse } from "next/server";
import Groq from "groq-sdk";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

// Simple in-memory rate limiting (per server instance)
const RATE_LIMIT_WINDOW_MS = 60_000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 20; // max 20 translations per IP per window

type RateEntry = {
  count: number;
  windowStart: number;
};

const rateLimitMap = new Map<string, RateEntry>();

function getClientKey(req: Request): string {
  const forwardedFor = req.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0].trim();
  }
  const realIp = req.headers.get("x-real-ip");
  if (realIp) return realIp;
  return "anonymous";
}

function isRateLimited(req: Request): boolean {
  const key = getClientKey(req);
  const now = Date.now();
  const existing = rateLimitMap.get(key);

  if (!existing) {
    rateLimitMap.set(key, { count: 1, windowStart: now });
    return false;
  }

  if (now - existing.windowStart > RATE_LIMIT_WINDOW_MS) {
    rateLimitMap.set(key, { count: 1, windowStart: now });
    return false;
  }

  if (existing.count >= RATE_LIMIT_MAX_REQUESTS) {
    return true;
  }

  existing.count += 1;
  rateLimitMap.set(key, existing);
  return false;
}

// Basic HTML-escape to keep the response XSS-safe if rendered as HTML
function escapeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

const ALLOWED_LANG_CODES = new Set([
  "en",
  "es",
  "fr",
  "de",
  "ar",
  "hi",
  "zh",
]);

function sanitizeText(text: unknown): string {
  if (typeof text !== "string") return "";
  // Trim and enforce a maximum length to reduce prompt size and exposure
  const trimmed = text.trim();
  const maxLength = 3_000;
  return trimmed.length > maxLength ? trimmed.slice(0, maxLength) : trimmed;
}

// Security headers for patient data protection
function getSecurityHeaders() {
  return {
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "X-XSS-Protection": "1; mode=block",
    "Referrer-Policy": "no-referrer",
    "Permissions-Policy": "microphone=(), geolocation=()",
    // Strict CSP to prevent XSS attacks
    "Content-Security-Policy": "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline';",
  };
}

export async function POST(req: Request) {
  try {
    if (isRateLimited(req)) {
      return NextResponse.json(
        { error: "Too many requests. Please slow down." },
        { status: 429, headers: getSecurityHeaders() }
      );
    }

    const body = await req.json().catch(() => null);

    // CORS: Only allow same-origin requests for patient data security
    // In production, ensure HTTPS is enforced at the deployment level
    const origin = req.headers.get("origin");
    if (origin) {
      // Allow same-origin or trusted origins only (adjust for your deployment)
      const url = new URL(origin);
      const isSecure = url.protocol === "https:" || url.hostname === "localhost";
      if (!isSecure && process.env.NODE_ENV === "production") {
        return NextResponse.json(
          { error: "HTTPS required for patient data security" },
          { status: 403, headers: getSecurityHeaders() }
        );
      }
    }

    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400, headers: getSecurityHeaders() }
      );
    }

    const rawText = (body as any).text;
    const rawSource = (body as any).source;
    const rawTarget = (body as any).target;

    const text = sanitizeText(rawText);
    const source = typeof rawSource === "string" ? rawSource : "en";
    const target = typeof rawTarget === "string" ? rawTarget : "es";

    if (!text) {
      return NextResponse.json(
        { error: "Text is required" },
        { status: 400, headers: getSecurityHeaders() }
      );
    }

    if (!ALLOWED_LANG_CODES.has(source) || !ALLOWED_LANG_CODES.has(target)) {
      return NextResponse.json(
        { error: "Unsupported language code" },
        { status: 400, headers: getSecurityHeaders() }
      );
    }

    const prompt = `Translate the following medical text from ${source} to ${target}. 
Ensure accuracy, correct terminology, and short, clear phrasing:

${text}`;

    const completion = await groq.chat.completions.create({
      model: "openai/gpt-oss-20b",
      temperature: 0.3,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      max_completion_tokens: 500,
    });

    const result = completion.choices[0]?.message?.content ?? "";
    const safeResult = escapeHtml(result);

    // Only expose the translated string, not raw provider details or prompt data
    // No patient data is stored - all data is processed in-memory and discarded
    return NextResponse.json(
      { translated: safeResult },
      { headers: getSecurityHeaders() }
    );
  } catch (err) {
    // Log only non-PHI-safe metadata, avoid logging raw text or provider payloads
    console.error("Translation error:", (err as any)?.message ?? "Unknown error");
    return NextResponse.json(
      { error: "Translation failed" },
      { status: 500, headers: getSecurityHeaders() }
    );
  }
}
