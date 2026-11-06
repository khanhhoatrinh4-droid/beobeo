/** Shared JSON/FormData transport. Services own endpoints; views own rendering. */
export async function request(url, options = {}) {
  const { errorMessage, ...fetchOptions } = options;
  const headers = new Headers(fetchOptions.headers);
  headers.set("Accept", "application/json");
  const method = (fetchOptions.method || "GET").toUpperCase();
  const token = document.querySelector('meta[name="_csrf"]')?.content;
  if (token && !["GET", "HEAD", "OPTIONS"].includes(method))
    headers.set("X-XSRF-TOKEN", token);
  const response = await fetch(url, { ...fetchOptions, headers });
  if (response.status === 204) return null;
  const body = await response.json().catch(() => null);
  if (!response.ok) {
    const error = new Error(
      body?.message || errorMessage || "Lỗi " + response.status,
    );
    error.status = response.status;
    error.code = body?.code;
    throw error;
  }
  return body;
}

export function sendJson(url, method, data, errorMessage) {
  return request(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
    errorMessage,
  });
}
