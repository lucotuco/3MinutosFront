export type PoliticalBiasRisk = "low" | "medium" | "high" | "unknown";

export type UserPreferences = {
  id?: string;
  name: string;
  topics: [string, string, string];
  deliveryTime: string;
  isActive: boolean;
};

export type CreatePreferencesResponse = {
  user: UserPreferences & {
    id: string;
  };
  authToken: string;
};

export type DigestItem = {
  articleId?: string | null;
  title: string | null;
  neutralTitle?: string | null;
  lead?: string | null;
  neutralLead?: string | null;
  summary: string | null;
  neutralSummary?: string | null;
  originalTitle?: string | null;
  topic: string;
  category?: string | null;
  region?: string | null;
  section?: string | null;
  url?: string | null;
  imageUrl?: string | null;  
  tags?: string[];
  cached?: boolean;
  fallback?: boolean;
  curationFallback?: boolean;
  usedFallback?: boolean;
  fallbackCategory?: string | null;
  neutralityScore?: number | null;
  politicalBiasRisk?: PoliticalBiasRisk;
  score?: number | null;
  finalScore?: number | null;
};

export type DigestResponse = {
  user: {
    id: string;
    name: string;
    deliveryTime: string;
    topics: string[];
  };
  digest: {
    items: DigestItem[];
    audioUrl?: string | null;
    audioStorageKey?: string | null;
    audioGeneratedAt?: string | null;
  };
};

export type ShownArticle = {
  articleId?: string;
  title?: string;
  summary?: string;
  topic: string;
  region?: string;
  section?: string;
  articleUrl?: string;
  shownDate?: string;
  shownAt: string;
};

type ApiError = Error & {
  status?: number;
  code?: string;
  shouldClearLocalSession?: boolean;
};

let authToken: string | null = null;

function setAuthToken(token: string | null) {
  authToken = token;
}

const rawApiBaseUrl = process.env.EXPO_PUBLIC_API_URL?.trim();

if (!rawApiBaseUrl) {
  throw new Error("Missing EXPO_PUBLIC_API_URL");
}

const API_BASE_URL = rawApiBaseUrl.replace(/\/+$/, "");

function normalizeTopics(value: unknown): [string, string, string] {
  const topics = Array.isArray(value)
    ? value.map((topic) => String(topic ?? "").trim()).slice(0, 3)
    : [];

  while (topics.length < 3) topics.push("");

  return [topics[0], topics[1], topics[2]];
}

function normalizePoliticalBiasRisk(value: unknown): PoliticalBiasRisk {
  if (value === "low" || value === "medium" || value === "high") {
    return value;
  }

  return "unknown";
}

async function request<T = unknown>(
  path: string,
  init?: RequestInit
): Promise<T> {
  let response: Response;

  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        ...(init?.headers ?? {}),
      },
    });
  } catch {
    throw new Error("No se pudo conectar al backend.");
  }

  const text = await response.text();
  let data: any = null;

  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = { error: text };
    }
  }

  if (!response.ok) {
    const message =
      data?.error || data?.message || `Error HTTP ${response.status}`;

    const error = new Error(message) as ApiError;
    error.status = response.status;
    error.code = data?.code;
    error.shouldClearLocalSession = 
      Boolean(data?.shouldClearLocalSession) || 
      response.status === 404;
    throw error;
  }

  return data as T;
}

function mapPreferences(raw: any): UserPreferences {
  const source = raw?.user ?? raw ?? {};

  return {
    id: String(source._id ?? source.id ?? ""),
    name: String(source.name ?? ""),
    topics: normalizeTopics(source.topics),
    deliveryTime: String(source.deliveryTime ?? "08:00"),
    isActive: Boolean(source.isActive ?? true),
  };
}

function toNullableNumber(value: unknown): number | null {
  const numeric = Number(value);

  if (!Number.isFinite(numeric)) {
    return null;
  }

  return numeric;
}

type RawDigest = {
  user?: {
    id?: string;
    name?: string;
    deliveryTime?: unknown;
    topics?: unknown;
  };
  digest?: {
    items?: Array<{
      articleId?: string | null;
      title?: string | null;
      neutralTitle?: string | null;
      lead?: string | null;
      neutralLead?: string | null;
      summary?: string | null;
      neutralSummary?: string | null;
      originalTitle?: string | null;
      topic?: unknown;
      category?: string | null;
      region?: string | null;
      section?: string | null;
      url?: string | null;
      tags?: unknown;
      cached?: unknown;
      fallback?: unknown;
      curationFallback?: unknown;
      usedFallback?: unknown;
      fallbackCategory?: unknown;
      neutralityScore?: unknown;
      politicalBiasRisk?: unknown;
      score?: unknown;
      finalScore?: unknown;
    }>;
    audioUrl?: unknown;
    audioStorageKey?: unknown;
    audioGeneratedAt?: unknown;
  };
};

function mapDigest(raw: RawDigest): DigestResponse {
  return {
    user: {
      id: String(raw.user?.id ?? ""),
      name: String(raw.user?.name ?? ""),
      deliveryTime: String(raw.user?.deliveryTime ?? "08:00"),
      topics: Array.isArray(raw.user?.topics)
        ? raw.user.topics.map((topic) => String(topic ?? ""))
        : [],
    },
    digest: {
      items: Array.isArray(raw.digest?.items)
        ? raw.digest.items.map((item) => ({
            articleId: item.articleId ?? undefined,
            title: item.title ?? item.neutralTitle ?? "",
            neutralTitle: item.neutralTitle ?? item.title ?? "",
            lead: item.lead ?? item.neutralLead ?? "",
            neutralLead: item.neutralLead ?? item.lead ?? "",
            summary: item.summary ?? item.neutralSummary ?? "",
            neutralSummary: item.neutralSummary ?? item.summary ?? "",
            originalTitle: item.originalTitle ?? undefined,
            topic: String(item.topic ?? ""),
            category: item.category ?? undefined,
            imageUrl: (item as any).imageUrl ?? undefined,
            region: item.region ?? undefined,
            section: item.section ?? undefined,
            url: item.url ?? undefined,
            tags: Array.isArray(item.tags)
              ? item.tags.map((tag) => String(tag ?? "")).filter(Boolean)
              : [],
            cached: Boolean(item.cached),
            fallback: Boolean(item.fallback),
            curationFallback: Boolean(item.curationFallback),
            usedFallback: Boolean(item.usedFallback),
            fallbackCategory: item.fallbackCategory ? String(item.fallbackCategory) : undefined,
            neutralityScore: toNullableNumber(item.neutralityScore),
            politicalBiasRisk: normalizePoliticalBiasRisk(
              item.politicalBiasRisk
            ),
            score: toNullableNumber(item.score),
            finalScore: toNullableNumber(item.finalScore),
          }))
        : [],
      audioUrl: raw.digest?.audioUrl ? String(raw.digest.audioUrl) : null,
      audioStorageKey: raw.digest?.audioStorageKey
        ? String(raw.digest.audioStorageKey)
        : null,
      audioGeneratedAt: raw.digest?.audioGeneratedAt
        ? String(raw.digest.audioGeneratedAt)
        : null,
    },
  };
}

function mapShownArticle(raw: any): ShownArticle {
  return {
    articleId: raw.articleId ? String(raw.articleId) : undefined,
    title: raw.title ? String(raw.title) : undefined,
    summary: raw.summary ? String(raw.summary) : undefined,
    topic: String(raw.topic ?? ""),
    region: raw.region ? String(raw.region) : undefined,
    section: raw.section ? String(raw.section) : undefined,
    articleUrl: raw.articleUrl ? String(raw.articleUrl) : undefined,
    shownDate: raw.shownDate ? String(raw.shownDate) : undefined,
    shownAt: String(raw.shownAt ?? ""),
  };
}

export const api = {
  setAuthToken,

  async createPreferences(
    prefs: Omit<UserPreferences, "id">
  ): Promise<CreatePreferencesResponse> {
    const created = await request<{
      user?: {
        _id?: string;
        id?: string;
        name?: string;
        topics?: unknown;
        deliveryTime?: unknown;
        isActive?: unknown;
      };
      authToken?: string;
    }>("/users/preferences", {
      method: "POST",
      body: JSON.stringify(prefs),
    });

    const mapped = mapPreferences(created);

    if (!mapped.id) {
      throw new Error("El backend no devolvió un id de usuario válido.");
    }

    if (!created.authToken) {
      throw new Error("El backend no devolvió un token de sesión válido.");
    }

    return {
      user: {
        ...mapped,
        id: mapped.id,
      },
      authToken: created.authToken,
    };
  },
  
async getNewsAgentClientSecret(
  userId: string
): Promise<{
  ok: boolean;
  clientSecret: string;
  model: string;
  digestDate: string | null;
  contextSource: string | null;
}> {
  return request(`/users/${userId}/news-agent/client-secret`, {
    method: "GET",
  });
},

  async getPreferences(userId: string): Promise<UserPreferences> {
    const raw = await request(`/users/preferences/${userId}`);
    return mapPreferences(raw);
  },

  async deleteAccount(userId: string): Promise<{ ok: boolean }> {
    return request<{ ok: boolean }>(`/users/${userId}`, {
      method: "DELETE",
    });
  },

  async updatePreferences(
    userId: string,
    next: Omit<UserPreferences, "id">
  ): Promise<UserPreferences> {
    const raw = await request(`/users/preferences/${userId}`, {
      method: "PATCH",
      body: JSON.stringify(next),
    });

    return mapPreferences(raw);
  },

  async getDigest(userId: string): Promise<DigestResponse> {
    const raw = await request<RawDigest>(`/users/${userId}/digest`);
    return mapDigest(raw);
  },

  async refreshDigest(userId: string): Promise<DigestResponse> {
    const raw = await request<RawDigest>(`/users/${userId}/digest/refresh`, {
      method: "POST",
    });

    return mapDigest(raw);
  },

  async markDigestShown(
    userId: string,
    payload: { items: DigestItem[] }
  ): Promise<{ ok: boolean }> {
    return request<{ ok: boolean }>(`/users/${userId}/digest/mark-shown`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  async getShownArticles(userId: string): Promise<ShownArticle[]> {
    const raw = await request<{
      items?: any[];
    }>(`/users/${userId}/shown-articles`);

    const items = Array.isArray(raw?.items) ? raw.items : [];

    return items.map(mapShownArticle);
  },

  async updatePushToken(
    userId: string,
    expoPushToken: string
  ): Promise<{ ok: boolean }> {
    return request<{ ok: boolean }>(
      `/users/preferences/${userId}/push-token`,
      {
        method: "PATCH",
        body: JSON.stringify({ expoPushToken }),
      }
    );
  },

  async playDigest(userId: string): Promise<{ success: boolean; playlist: string[] }> {
    return request<{ success: boolean; playlist: string[] }>(`/users/${userId}/digest/play`, {
      method: "POST",
    });
  }
};