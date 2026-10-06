async function request(url, options = {}) {
  const response = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {})
    },
    ...options
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || `Request failed: ${response.status}`);
  }

  return data;
}

export const api = {
  brands: () => request("/api/brands"),
  conversations: () => request("/api/conversations"),
  conversation: (id) => request(`/api/conversations/${id}`),
  sendMessage: (id, body) =>
    request(`/api/conversations/${id}/messages`, {
      method: "POST",
      body: JSON.stringify(body)
    }),
  knowledge: (brandId) => request(`/api/brands/${brandId}/knowledge`),
  createKnowledge: (brandId, body) =>
    request(`/api/brands/${brandId}/knowledge`, {
      method: "POST",
      body: JSON.stringify(body)
    }),
  updateKnowledge: (id, body) =>
    request(`/api/knowledge/${id}`, {
      method: "PUT",
      body: JSON.stringify(body)
    }),
  deleteKnowledge: (id) =>
    request(`/api/knowledge/${id}`, { method: "DELETE" }),
  generate: (conversationId) =>
    request(`/api/conversations/${conversationId}/generate-reply`, {
      method: "POST"
    }),
  regenerate: (generationId) =>
    request(`/api/ai/${generationId}/regenerate`, {
      method: "POST"
    }),
  approve: (generationId, final_response) =>
    request(`/api/ai/${generationId}/approve`, {
      method: "POST",
      body: JSON.stringify({ final_response })
    })
};
