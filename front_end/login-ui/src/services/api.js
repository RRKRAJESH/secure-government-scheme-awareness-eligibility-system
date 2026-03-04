/**
 * Deprecated: Use useApi() hook instead
 * This function is kept for backward compatibility
 *
 * @deprecated Use the useApi() hook from hooks/useApi.js
 */
export const apiRequest = async (url, method, body) => {
  const token = localStorage.getItem("access_token");

  const response = await fetch(url, {
    method: method,
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await response.json();

  if (!response.ok) {
    console.error("API Error:", data);
    throw new Error(data.detail || data.message || "Something went wrong");
  }

  return data;
};
