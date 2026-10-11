import "server-only";

/**
 * Cloudflare R2 object storage over its S3-compatible API.
 *
 * Implements AWS Signature Version 4 with node:crypto rather than pulling in
 * the AWS SDK: the surface we need is four signed requests, and this keeps the
 * dependency tree (and the client bundle) small.
 *
 * Credentials live in R2_ACCOUNT_ID / R2_ACCESS_KEY_ID / R2_SECRET_ACCESS_KEY
 * and must never be committed.
 */

import crypto from "node:crypto";

const SERVICE = "s3";
const REGION = "auto";
const ALGORITHM = "AWS4-HMAC-SHA256";

export interface R2Config {
  accountId: string;
  bucket: string;
  accessKeyId: string;
  secretAccessKey: string;
  /** Optional public base URL (custom domain or r2.dev) for public objects. */
  publicUrl?: string;
}

export function getR2Config(): R2Config | null {
  const accountId = process.env.R2_ACCOUNT_ID;
  const bucket = process.env.R2_BUCKET;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  if (!accountId || !bucket || !accessKeyId || !secretAccessKey) return null;
  const publicUrl = process.env.R2_PUBLIC_URL?.replace(/\/+$/, "");
  return { accountId, bucket, accessKeyId, secretAccessKey, publicUrl };
}

export function requireR2Config(): R2Config {
  const config = getR2Config();
  if (!config) {
    throw new Error(
      "R2 storage is not configured. Set R2_ACCOUNT_ID, R2_BUCKET, R2_ACCESS_KEY_ID and R2_SECRET_ACCESS_KEY. See .env.example.",
    );
  }
  return config;
}

export function isR2Configured(): boolean {
  return getR2Config() !== null;
}

const sha256 = (data: crypto.BinaryLike) =>
  crypto.createHash("sha256").update(data).digest("hex");

const hmac = (key: crypto.BinaryLike | Buffer, data: string) =>
  crypto.createHmac("sha256", key).update(data, "utf8").digest();

/** Percent-encode per RFC 3986, leaving `/` intact for object key paths. */
function encodePath(value: string): string {
  return value
    .split("/")
    .map((segment) =>
      encodeURIComponent(segment).replace(/[!'()*]/g, (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`),
    )
    .join("/");
}

function endpoint(config: R2Config): string {
  return `https://${config.accountId}.r2.cloudflarestorage.com`;
}

/** "YYYYMMDDTHHMMSSZ" */
function amzDate(date: Date): { stamp: string; day: string } {
  const iso = date.toISOString().replace(/[:-]|\.\d{3}/g, "");
  return { stamp: iso, day: iso.slice(0, 8) };
}

function signingKey(secret: string, day: string): Buffer {
  const kDate = hmac(`AWS4${secret}`, day);
  const kRegion = hmac(kDate, REGION);
  const kService = hmac(kRegion, SERVICE);
  return hmac(kService, "aws4_request");
}

interface SignedRequest {
  method: "GET" | "PUT" | "DELETE" | "POST" | "HEAD";
  key: string;
  query?: Record<string, string>;
  headers?: Record<string, string>;
  body?: Buffer;
  contentType?: string;
}

/** Signs and performs a request against the bucket. */
async function signedFetch(
  config: R2Config,
  req: SignedRequest,
): Promise<Response> {
  const { stamp, day } = amzDate(new Date());
  const payloadHash = sha256(req.body ?? Buffer.alloc(0));

  const canonicalUri = `/${config.bucket}/${encodePath(req.key)}`;

  const queryEntries = Object.entries(req.query ?? {}).sort(([a], [b]) =>
    a < b ? -1 : a > b ? 1 : 0,
  );
  const canonicalQuery = queryEntries
    .map(([k, v]) => [encodeURIComponent(k), encodeURIComponent(v)])
    .map(([k, v]) => `${k}=${v}`)
    .join("&");

  const headers: Record<string, string> = {
    host: `${config.accountId}.r2.cloudflarestorage.com`,
    "x-amz-content-sha256": payloadHash,
    "x-amz-date": stamp,
    ...(req.contentType ? { "content-type": req.contentType } : {}),
    ...req.headers,
  };

  const sortedHeaderNames = Object.keys(headers).sort();
  const canonicalHeaders = sortedHeaderNames
    .map((name) => `${name}:${String(headers[name]).trim()}\n`)
    .join("");
  const signedHeaders = sortedHeaderNames.join(";");

  const canonicalRequest = [
    req.method,
    canonicalUri,
    canonicalQuery,
    canonicalHeaders,
    signedHeaders,
    payloadHash,
  ].join("\n");

  const scope = `${day}/${REGION}/${SERVICE}/aws4_request`;
  const stringToSign = [
    ALGORITHM,
    stamp,
    scope,
    sha256(canonicalRequest),
  ].join("\n");

  const signature = crypto
    .createHmac("sha256", signingKey(config.secretAccessKey, day))
    .update(stringToSign, "utf8")
    .digest("hex");

  const authorization = `${ALGORITHM} Credential=${config.accessKeyId}/${scope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

  const url = `${endpoint(config)}${canonicalUri}${canonicalQuery ? `?${canonicalQuery}` : ""}`;

  return fetch(url, {
    method: req.method,
    headers: { ...headers, authorization: authorization },
    body: req.body as BodyInit | undefined,
  });
}

/* ------------------------------------------------------------------ */
/* Operations                                                          */
/* ------------------------------------------------------------------ */

export interface PutResult {
  key: string;
  etag: string;
  size: number;
}

/** Uploads an object. `key` is the path inside the bucket, e.g. "media/x.webp". */
export async function putObject(
  key: string,
  body: Buffer,
  contentType: string,
): Promise<PutResult> {
  const config = requireR2Config();
  const response = await signedFetch(config, {
    method: "PUT",
    key,
    body,
    contentType,
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(
      `R2 upload failed (${response.status} ${response.statusText}): ${detail.slice(0, 300)}`,
    );
  }

  return {
    key,
    etag: response.headers.get("etag") ?? "",
    size: body.byteLength,
  };
}

export async function getObject(key: string): Promise<{
  body: Buffer;
  contentType: string;
}> {
  const config = requireR2Config();
  const response = await signedFetch(config, { method: "GET", key });
  if (!response.ok) {
    throw new Error(`R2 download failed (${response.status} ${response.statusText})`);
  }
  return {
    body: Buffer.from(await response.arrayBuffer()),
    contentType: response.headers.get("content-type") ?? "application/octet-stream",
  };
}

export async function deleteObject(key: string): Promise<void> {
  const config = requireR2Config();
  const response = await signedFetch(config, { method: "DELETE", key });
  if (!response.ok && response.status !== 404) {
    throw new Error(`R2 delete failed (${response.status} ${response.statusText})`);
  }
}

export interface StoredObject {
  key: string;
  size: number;
  lastModified: string;
  etag: string;
}

export async function listObjects(prefix = "", limit = 200): Promise<StoredObject[]> {
  const config = requireR2Config();
  const response = await signedFetch(config, {
    method: "GET",
    key: "",
    query: { "list-type": "2", prefix, "max-keys": String(Math.min(limit, 1000)) },
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(
      `R2 list failed (${response.status} ${response.statusText}): ${detail.slice(0, 300)}`,
    );
  }

  const xml = await response.text();
  const items: StoredObject[] = [];
  const contentsRe = /<Contents>([\s\S]*?)<\/Contents>/g;
  let match: RegExpExecArray | null;
  while ((match = contentsRe.exec(xml))) {
    const block = match[1];
    const pick = (tag: string) =>
      new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`).exec(block)?.[1] ?? "";
    items.push({
      key: decodeXml(pick("Key")),
      size: Number(pick("Size")) || 0,
      lastModified: pick("LastModified"),
      etag: pick("ETag").replace(/"/g, ""),
    });
  }
  return items.sort((a, b) => b.lastModified.localeCompare(a.lastModified));
}

function decodeXml(value: string): string {
  return value
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&");
}

/* ------------------------------------------------------------------ */
/* URLs                                                                */
/* ------------------------------------------------------------------ */

/**
 * Public URL for an object when the bucket is exposed, otherwise a presigned
 * GET URL valid for `expiresIn` seconds.
 */
export function getObjectUrl(key: string, expiresIn = 3600): string {
  const config = getR2Config();
  if (!config) return "";
  const encoded = encodePath(key);
  if (config.publicUrl) return `${config.publicUrl}/${encoded}`;

  const { stamp, day } = amzDate(new Date());
  const scope = `${day}/${REGION}/${SERVICE}/aws4_request`;
  const canonicalUri = `/${config.bucket}/${encoded}`;
  const host = `${config.accountId}.r2.cloudflarestorage.com`;
  const signedHeaders = "host";

  const query = [
    `X-Amz-Algorithm=${ALGORITHM}`,
    `X-Amz-Credential=${encodeURIComponent(`${config.accessKeyId}/${scope}`)}`,
    `X-Amz-Date=${stamp}`,
    `X-Amz-Expires=${expiresIn}`,
    `X-Amz-SignedHeaders=${signedHeaders}`,
  ].join("&");

  const canonicalRequest = [
    "GET",
    canonicalUri,
    query,
    `host:${host}\n`,
    signedHeaders,
    "UNSIGNED-PAYLOAD",
  ].join("\n");

  const stringToSign = [
    ALGORITHM,
    stamp,
    scope,
    sha256(canonicalRequest),
  ].join("\n");

  const signature = crypto
    .createHmac("sha256", signingKey(config.secretAccessKey, day))
    .update(stringToSign, "utf8")
    .digest("hex");

  return `${endpoint(config)}${canonicalUri}?${query}&X-Amz-Signature=${signature}`;
}

/** Builds a safe object key and prevents overwriting via traversal. */
export function buildObjectKey(folder: string, filename: string): string {
  const safeName = filename
    .replace(/[^a-zA-Z0-9._-]/g, "-")
    .replace(/-+/g, "-")
    .slice(-80);
  const stamp = new Date().toISOString().slice(0, 10);
  return `${folder}/${stamp}-${safeName}`;
}
