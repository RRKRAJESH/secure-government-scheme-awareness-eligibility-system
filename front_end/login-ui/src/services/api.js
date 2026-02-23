export const apiRequest = async (url, method, body) => {
  const token = localStorage.getItem("access_token");

  const response = await fetch(url, {
    method: method,
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: JSON.stringify(body),
  });

  const data = await response.json();

  if (!response.ok) {
    console.log("API Error:", data);
    throw new Error(data.detail || "Something went wrong");
  }

  return data;
};
