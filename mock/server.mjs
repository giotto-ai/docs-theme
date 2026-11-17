import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL(".", import.meta.url));

try {
  const envFile = await readFile(join(root, "..", ".env.local"), "utf8");
  for (const line of envFile.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const separator = trimmed.indexOf("=");
    if (separator === -1) continue;
    const key = trimmed.slice(0, separator).trim();
    const value = trimmed.slice(separator + 1).trim().replace(/^['"]|['"]$/g, "");
    if (key && process.env[key] === undefined) process.env[key] = value;
  }
} catch {
  // Local data remains available when no environment file is configured.
}

const port = Number(process.env.GIOTTO_MOCK_PORT || 4173);
const mimeTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".svg": "image/svg+xml",
};

let oauthTokenCache = null;

function slugify(value = "") {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "") || "item";
}

function stripHtml(value = "") {
  return value
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeArticleBody(body = "") {
  const headings = [];
  const headingCounts = new Map();
  const normalizedBody = body
    .replace(/<p([^>]*)>(?:\s|&nbsp;|\u00a0|<br\s*\/?>)*<\/p>/gi, "")
    .replace(/<h([1-6])([^>]*)>([\s\S]*?)<\/h\1>/gi, (match, level, attributes, content) => {
      const heading = stripHtml(content).replace(/\u00a0/g, " ").trim();
      if (!heading) return "";
      const baseId = slugify(heading);
      const count = (headingCounts.get(baseId) || 0) + 1;
      headingCounts.set(baseId, count);
      const id = count === 1 ? baseId : `${baseId}-${count}`;
      headings.push(heading);
      return `<h${level}${attributes.replace(/\s+id=["'][^"']*["']/i, "")} id="${id}">${content}</h${level}>`;
    });
  return { body: normalizedBody, headings: headings.length ? headings : ["Overview", "Next steps"] };
}

function extractArticleSummary(body = "") {
  const firstParagraph = body.match(/<p\b[^>]*>([\s\S]*?)<\/p>/i)?.[1] || "";
  return stripHtml(firstParagraph).replace(/\u00a0/g, " ").trim() || stripHtml(body).slice(0, 180);
}

function removeSummaryParagraph(body = "", summary = "") {
  let removed = false;
  return body.replace(/<p\b([^>]*)>([\s\S]*?)<\/p>/gi, (match, attributes, content) => {
    const paragraph = stripHtml(content).replace(/\u00a0/g, " ").trim();
    if (!removed && paragraph && paragraph === summary) {
      removed = true;
      return "";
    }
    return match;
  });
}

function getZendeskConfig() {
  const subdomain = process.env.ZENDESK_SUBDOMAIN;
  const clientId = process.env.ZENDESK_OAUTH_CLIENT_ID;
  const clientSecret = process.env.ZENDESK_OAUTH_CLIENT_SECRET;
  const scope = process.env.ZENDESK_OAUTH_SCOPE || "hc:read";
  if (!subdomain || !clientId || !clientSecret) throw new Error("Zendesk OAuth is not configured");
  return { subdomain, clientId, clientSecret, scope };
}

function cacheZendeskToken(payload) {
  oauthTokenCache = {
    value: payload.access_token,
    refreshToken: payload.refresh_token || oauthTokenCache?.refreshToken,
    expiresAt: Date.now() + Math.max(60, Number(payload.expires_in || 3600) - 60) * 1000,
  };
  return oauthTokenCache.value;
}

async function exchangeZendeskToken(body) {
  const { subdomain, clientId, clientSecret } = getZendeskConfig();

  const response = await fetch(`https://${subdomain}.zendesk.com/oauth/tokens`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ ...body, client_id: clientId, client_secret: clientSecret }),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || !payload.access_token) {
    throw new Error(`Zendesk OAuth request failed (${response.status}): ${payload.error_description || payload.error || "unknown error"}`);
  }
  return cacheZendeskToken(payload);
}

async function getZendeskAccessToken() {
  if (oauthTokenCache && oauthTokenCache.expiresAt > Date.now()) return oauthTokenCache.value;
  if (oauthTokenCache?.refreshToken) {
    return exchangeZendeskToken({
      grant_type: "refresh_token",
      refresh_token: oauthTokenCache.refreshToken,
    });
  }
  throw new Error("Zendesk authorization required; open /oauth/start first");
}

function redirectUri() {
  return `http://127.0.0.1:${port}/oauth/callback`;
}

function createOAuthState(verifier) {
  const payload = Buffer.from(JSON.stringify({ verifier, issuedAt: Date.now() })).toString("base64url");
  const signature = createHmac("sha256", getZendeskConfig().clientSecret).update(payload).digest("base64url");
  return `${payload}.${signature}`;
}

function readOAuthState(state) {
  const [payload, signature] = String(state || "").split(".");
  if (!payload || !signature) throw new Error("Invalid OAuth state");
  const expected = createHmac("sha256", getZendeskConfig().clientSecret).update(payload).digest("base64url");
  const actualBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  if (actualBuffer.length !== expectedBuffer.length || !timingSafeEqual(actualBuffer, expectedBuffer)) {
    throw new Error("Invalid OAuth state");
  }
  const decoded = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
  if (!decoded.verifier || Date.now() - decoded.issuedAt > 10 * 60 * 1000) throw new Error("Expired OAuth state");
  return decoded.verifier;
}

async function fetchZendeskCollection(path, key) {
  const token = await getZendeskAccessToken();
  const subdomain = process.env.ZENDESK_SUBDOMAIN;
  const items = [];
  let nextUrl = `https://${subdomain}.zendesk.com${path}${path.includes("?") ? "&" : "?"}per_page=100`;

  while (nextUrl) {
    const response = await fetch(nextUrl, { headers: { Authorization: `Bearer ${token}` } });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(`Zendesk ${key} request failed (${response.status})`);
    items.push(...(payload[key] || []));
    nextUrl = payload.next_page || null;
  }
  return items;
}

async function getZendeskData() {
  const locale = process.env.ZENDESK_LOCALE || "en-001";
  const [sourceCategories, sourceSections, sourceArticles] = await Promise.all([
    fetchZendeskCollection(`/api/v2/help_center/${locale}/categories.json`, "categories"),
    fetchZendeskCollection(`/api/v2/help_center/${locale}/sections.json`, "sections"),
    fetchZendeskCollection(`/api/v2/help_center/${locale}/articles.json`, "articles"),
  ]);

  const categoryIds = new Map();
  const categories = sourceCategories
    .sort((left, right) => (left.position || 0) - (right.position || 0))
    .map((category) => {
      const id = slugify(category.name || String(category.id));
      categoryIds.set(String(category.id), id);
      return {
        id,
        name: category.name,
        description: category.description || "",
        eyebrow: "Documentation",
      };
    });

  const sectionIds = new Map();
  const sections = sourceSections
    .filter((section) => categoryIds.has(String(section.category_id)))
    .sort((left, right) => (left.position || 0) - (right.position || 0))
    .map((section) => {
      const categoryId = categoryIds.get(String(section.category_id));
      const id = `${categoryId}-${slugify(section.name || String(section.id))}`;
      sectionIds.set(String(section.id), id);
      return {
        id,
        categoryId,
        name: section.name,
        description: section.description || "",
        articlesCount: 0,
      };
    });

  const articles = sourceArticles
    .filter((article) => sectionIds.has(String(article.section_id)) && !article.draft)
    .sort((left, right) => String(left.position || "").localeCompare(String(right.position || "")))
    .map((article) => {
      const sectionId = sectionIds.get(String(article.section_id));
      const section = sections.find((item) => item.id === sectionId);
      const normalized = normalizeArticleBody(article.body || "");
      const summary = extractArticleSummary(article.body || "");
      if (section) section.articlesCount += 1;
      return {
        id: slugify(article.title || String(article.id)),
        sourceId: String(article.id),
        sectionId,
        categoryId: section?.categoryId,
        title: article.title,
        htmlUrl: article.html_url || "",
        summary: summary || `Documentation for ${article.title}.`,
        headings: normalized.headings,
        body: removeSummaryParagraph(normalized.body || "", summary) || `<p>${summary}</p>`,
        commentsDisabled: Boolean(article.comments_disabled),
        updated: article.updated_at || "",
      };
    });

  return { categories, sections, articles };
}

async function getZendeskArticleComments(articleId) {
  const comments = await fetchZendeskCollection(`/api/v2/help_center/articles/${encodeURIComponent(articleId)}/comments.json`, "comments");
  return comments.map((comment) => ({
    id: String(comment.id),
    author: comment.author?.name || "Giotto user",
    body: stripHtml(comment.body || ""),
    createdAt: comment.created_at || "",
  }));
}

const server = createServer(async (request, response) => {
  const requestUrl = new URL(request.url || "/", `http://127.0.0.1:${port}`);
  const pathname = requestUrl.pathname;

  if (pathname === "/oauth/start") {
    try {
      const { subdomain, clientId, scope } = getZendeskConfig();
      const verifier = randomBytes(32).toString("base64url");
      const challenge = createHash("sha256").update(verifier).digest("base64url");
      const state = createOAuthState(verifier);
      const authorizationUrl = new URL(`https://${subdomain}.zendesk.com/oauth/authorizations/new`);
      authorizationUrl.search = new URLSearchParams({
        response_type: "code",
        redirect_uri: redirectUri(),
        client_id: clientId,
        scope,
        state,
        code_challenge_method: "S256",
        code_challenge: challenge,
      });
      response.writeHead(302, { Location: authorizationUrl.toString(), "Cache-Control": "no-store, no-cache, must-revalidate", Pragma: "no-cache" });
      response.end();
    } catch (error) {
      response.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
      response.end(error.message);
    }
    return;
  }

  if (pathname === "/oauth/callback") {
    try {
      if (requestUrl.searchParams.get("error")) throw new Error("Zendesk authorization was denied");
      const state = requestUrl.searchParams.get("state");
      const verifier = readOAuthState(state);
      await exchangeZendeskToken({
        grant_type: "authorization_code",
        code: requestUrl.searchParams.get("code") || "",
        redirect_uri: redirectUri(),
        scope: process.env.ZENDESK_OAUTH_SCOPE || "hc:read",
        ...(verifier ? { code_verifier: verifier } : {}),
      });
      response.writeHead(302, { Location: "/" });
      response.end();
    } catch (error) {
      response.writeHead(502, { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store, no-cache, must-revalidate", Pragma: "no-cache" });
      response.end(`Zendesk authorization failed: ${error.message}\n\nOpen http://127.0.0.1:${port}/oauth/start to begin a new authorization request.`);
    }
    return;
  }

  if (pathname === "/api/zendesk-data") {
    try {
      const data = await getZendeskData();
      response.writeHead(200, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" });
      response.end(JSON.stringify(data));
    } catch (error) {
      const authRequired = error.message.includes("authorization required");
      console.error(`[mock] Zendesk data unavailable: ${error.message}`);
      response.writeHead(authRequired ? 401 : 502, { "Content-Type": "application/json; charset=utf-8" });
      response.end(JSON.stringify({ error: authRequired ? "zendesk_auth_required" : "Zendesk data unavailable" }));
    }
    return;
  }

  if (pathname.startsWith("/api/zendesk-comments/")) {
    try {
      const articleId = pathname.slice("/api/zendesk-comments/".length);
      const comments = await getZendeskArticleComments(articleId);
      response.writeHead(200, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" });
      response.end(JSON.stringify({ comments }));
    } catch (error) {
      const authRequired = error.message.includes("authorization required");
      console.error(`[mock] Zendesk comments unavailable: ${error.message}`);
      response.writeHead(authRequired ? 401 : 502, { "Content-Type": "application/json; charset=utf-8" });
      response.end(JSON.stringify({ error: authRequired ? "zendesk_auth_required" : "Zendesk comments unavailable" }));
    }
    return;
  }


  const relativePath = pathname === "/" ? "index.html" : pathname.replace(/^\//, "");
  const filePath = normalize(join(root, relativePath));

  if (!filePath.startsWith(root)) {
    response.writeHead(403);
    response.end("Forbidden");
    return;
  }

  try {
    const body = await readFile(filePath);
    response.writeHead(200, { "Content-Type": mimeTypes[extname(filePath)] || "application/octet-stream" });
    response.end(body);
  } catch {
    response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Not found");
  }
});

server.listen(port, "127.0.0.1", () => {
  console.log(`Giotto local mock: http://127.0.0.1:${port}`);
});
