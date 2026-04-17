const API_BASE_URL = (
  import.meta.env.VITE_API_URL || "http://127.0.0.1:8000/api"
).replace(/\/$/, "");

type JsonRequestOptions = Omit<RequestInit, "body" | "headers"> & {
  body?:
    | BodyInit
    | Record<string, unknown>
    | unknown[]
    | null;
  headers?: HeadersInit;
};

type NormalizedRequestOptions = Omit<RequestInit, "headers"> & {
  headers: Record<string, string>;
};

type StoredSessionInput = {
  access?: string | null;
  refresh?: string | null;
  user?: unknown;
};

type AuthTokenResponse = {
  access: string;
  refresh?: string;
  [key: string]: unknown;
};

const STORAGE_KEYS = {
  access: "access_token",
  refresh: "refresh_token",
  user: "user",
};

function buildUrl(endpoint: string) {
  return `${API_BASE_URL}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;
}

function toHeaderRecord(headers: HeadersInit = {}): Record<string, string> {
  return Object.fromEntries(new Headers(headers).entries());
}

function normalizeRequestOptions(
  options: JsonRequestOptions = {},
): NormalizedRequestOptions {
  const { body, headers = {}, ...rest } = options;
  const hasJsonBody =
    body !== undefined &&
    body !== null &&
    !(body instanceof FormData) &&
    typeof body !== "string";
  const normalizedBody: BodyInit | null | undefined =
    body === undefined
      ? undefined
      : hasJsonBody
      ? JSON.stringify(body)
      : (body as BodyInit | null);

  return {
    ...rest,
    ...(normalizedBody === undefined ? {} : { body: normalizedBody }),
    headers: {
      ...(hasJsonBody ? { "Content-Type": "application/json" } : {}),
      ...toHeaderRecord(headers),
    },
  };
}

async function parseResponseBody(response: Response): Promise<any> {
  const text = await response.text();

  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

export function buildApiErrorMessage(payload: any, fallback = "Ocorreu um erro.") {
  if (!payload) {
    return fallback;
  }

  if (typeof payload === "string") {
    return payload;
  }

  if (Array.isArray(payload)) {
    return payload.join(", ");
  }

  const message = Object.entries(payload)
    .map(([field, value]) => {
      if (Array.isArray(value)) {
        return `${field}: ${value.join(", ")}`;
      }

      if (value && typeof value === "object") {
        return `${field}: ${buildApiErrorMessage(value, fallback)}`;
      }

      return `${field}: ${value}`;
    })
    .join(" | ");

  return message || fallback;
}

export function clearSession() {
  localStorage.removeItem(STORAGE_KEYS.access);
  localStorage.removeItem(STORAGE_KEYS.refresh);
  localStorage.removeItem(STORAGE_KEYS.user);
}

export function setStoredSession({
  access,
  refresh,
  user,
}: StoredSessionInput = {}) {
  if (access) {
    localStorage.setItem(STORAGE_KEYS.access, access);
  }

  if (refresh) {
    localStorage.setItem(STORAGE_KEYS.refresh, refresh);
  }

  if (user) {
    localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(user));
  }
}

export function getStoredUser<T = any>(): T | null {
  const rawUser = localStorage.getItem(STORAGE_KEYS.user);

  if (!rawUser) {
    return null;
  }

  try {
    return JSON.parse(rawUser);
  } catch {
    clearSession();
    return null;
  }
}

export function hasStoredSession() {
  return Boolean(localStorage.getItem(STORAGE_KEYS.access));
}

export function extractCollection<T = any>(payload: any): T[] {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (Array.isArray(payload?.results)) {
    return payload.results;
  }

  return [];
}

export async function jsonRequest<T = any>(
  endpoint: string,
  options: JsonRequestOptions = {},
  fallbackMessage?: string,
): Promise<T> {
  const response = await fetch(buildUrl(endpoint), normalizeRequestOptions(options));
  const data = await parseResponseBody(response);

  if (!response.ok) {
    throw new Error(buildApiErrorMessage(data, fallbackMessage));
  }

  return data;
}

export async function loginRequest(
  username: string,
  password: string,
): Promise<AuthTokenResponse> {
  return jsonRequest<AuthTokenResponse>(
    "/token/",
    {
      method: "POST",
      body: { username, password },
    },
    "Erro ao fazer login.",
  );
}

export async function refreshTokenRequest(
  refresh: string,
): Promise<AuthTokenResponse> {
  return jsonRequest<AuthTokenResponse>(
    "/token/refresh/",
    {
      method: "POST",
      body: { refresh },
    },
    "Sessao expirada.",
  );
}

export async function authFetch(
  endpoint: string,
  options: JsonRequestOptions = {},
): Promise<Response> {
  const accessToken = localStorage.getItem(STORAGE_KEYS.access);
  const refreshToken = localStorage.getItem(STORAGE_KEYS.refresh);
  const requestOptions = normalizeRequestOptions(options);

  let response = await fetch(buildUrl(endpoint), {
    ...requestOptions,
    headers: {
      ...requestOptions.headers,
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
  });

  if (response.status === 401 && refreshToken) {
    try {
      const data = await refreshTokenRequest(refreshToken);
      setStoredSession({ access: data.access });

      response = await fetch(buildUrl(endpoint), {
        ...requestOptions,
        headers: {
          ...requestOptions.headers,
          Authorization: `Bearer ${data.access}`,
        },
      });
    } catch (error) {
      clearSession();
      window.location.assign("/login");
      throw error;
    }
  }

  return response;
}

export async function authJsonRequest<T = any>(
  endpoint: string,
  options: JsonRequestOptions = {},
  fallbackMessage = "Ocorreu um erro ao processar a requisicao.",
): Promise<T> {
  const response = await authFetch(endpoint, options);
  const data = await parseResponseBody(response);

  if (!response.ok) {
    throw new Error(buildApiErrorMessage(data, fallbackMessage));
  }

  return data;
}

export async function meRequest<T = any>(
  token = localStorage.getItem(STORAGE_KEYS.access),
): Promise<T> {
  if (!token) {
    throw new Error("Sessao expirada.");
  }

  const response = await fetch(buildUrl("/usuario-logado/"), {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  const data = await parseResponseBody(response);

  if (!response.ok) {
    throw new Error(buildApiErrorMessage(data, "Erro ao buscar usuario logado."));
  }

  return data;
}
