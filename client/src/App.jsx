import { useEffect, useMemo, useState } from "react";
import { api } from "./api";

const emptyForm = {
  type: "return",
  title: "",
  content: ""
};

function App() {
  const [brands, setBrands] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [selectedConversationId, setSelectedConversationId] = useState(null);
  const [conversation, setConversation] = useState(null);
  const [side, setSide] = useState("customer");
  const [message, setMessage] = useState("");
  const [reply, setReply] = useState("");
  const [generation, setGeneration] = useState(null);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState("");
  const [tab, setTab] = useState("conversation");

  const [kbBrandId, setKbBrandId] = useState("");
  const [knowledge, setKnowledge] = useState([]);
  const [kbForm, setKbForm] = useState(emptyForm);
  const [editingKbId, setEditingKbId] = useState(null);

  const selectedBrandId = conversation?.conversation?.brand_id;

  const selectedBrand = useMemo(
    () => brands.find(b => b.id === selectedBrandId),
    [brands, selectedBrandId]
  );

  async function loadInitial() {
    try {
      const [brandResult, conversationResult] = await Promise.all([
        api.brands(),
        api.conversations()
      ]);

      setBrands(brandResult.data);
      setConversations(conversationResult.data);

      if (conversationResult.data.length) {
        setSelectedConversationId(conversationResult.data[0].id);
      }

      if (brandResult.data.length) {
        setKbBrandId(String(brandResult.data[0].id));
      }
    } catch (error) {
      setNotice(error.message);
    }
  }

  async function loadConversation(id) {
    if (!id) return;

    try {
      const result = await api.conversation(id);
      setConversation(result.data);
      setGeneration(null);
      setReply("");
      setNotice("");
    } catch (error) {
      setNotice(error.message);
    }
  }

  async function loadKnowledge(brandId) {
    if (!brandId) return;
    try {
      const result = await api.knowledge(brandId);
      setKnowledge(result.data);
    } catch (error) {
      setNotice(error.message);
    }
  }

  useEffect(() => {
    loadInitial();
  }, []);

  useEffect(() => {
    if (selectedConversationId) loadConversation(selectedConversationId);
  }, [selectedConversationId]);

  useEffect(() => {
    if (kbBrandId) loadKnowledge(kbBrandId);
  }, [kbBrandId]);

  async function sendMessage() {
    if (!message.trim() || !selectedConversationId) return;

    setLoading(true);
    try {
      await api.sendMessage(selectedConversationId, {
        sender_type: side,
        content: message
      });

      setMessage("");
      await loadConversation(selectedConversationId);

      const result = await api.conversations();
      setConversations(result.data);
    } catch (error) {
      setNotice(error.message);
    } finally {
      setLoading(false);
    }
  }

  async function generateReply(regenerate = false) {
    if (!selectedConversationId) return;

    setLoading(true);
    setNotice("");

    try {
      const result = regenerate
        ? await api.regenerate(generation.generationId)
        : await api.generate(selectedConversationId);

      setGeneration(result.data);
      setReply(result.data.response);
    } catch (error) {
      setNotice(error.message);
    } finally {
      setLoading(false);
    }
  }

  async function approveReply() {
    if (!generation || !reply.trim()) return;

    setLoading(true);

    try {
      await api.approve(generation.generationId, reply);
      setNotice("Reply approved and sent.");
      setGeneration(null);
      setReply("");
      await loadConversation(selectedConversationId);

      const result = await api.conversations();
      setConversations(result.data);
    } catch (error) {
      setNotice(error.message);
    } finally {
      setLoading(false);
    }
  }

  async function saveKnowledge(event) {
    event.preventDefault();

    if (!kbForm.title.trim() || !kbForm.content.trim()) return;

    setLoading(true);

    try {
      if (editingKbId) {
        await api.updateKnowledge(editingKbId, kbForm);
        setNotice("Knowledge entry updated.");
      } else {
        await api.createKnowledge(Number(kbBrandId), kbForm);
        setNotice("Knowledge entry created.");
      }

      setKbForm(emptyForm);
      setEditingKbId(null);
      await loadKnowledge(kbBrandId);
    } catch (error) {
      setNotice(error.message);
    } finally {
      setLoading(false);
    }
  }

  function editKnowledge(item) {
    setEditingKbId(item.id);
    setKbForm({
      type: item.type,
      title: item.title,
      content: item.content
    });
  }

  async function deleteKnowledge(id) {
    if (!window.confirm("Delete this knowledge entry?")) return;

    try {
      await api.deleteKnowledge(id);
      setNotice("Knowledge entry deleted.");
      await loadKnowledge(kbBrandId);
    } catch (error) {
      setNotice(error.message);
    }
  }

  const messages = conversation?.messages || [];
  const info = conversation?.conversation;

  return (
    <div className="app">
      <header className="topbar">
        <div>
          <h1>CX Reply Assistant</h1>
          <p>AI-powered customer support workspace</p>
        </div>

        <div className="top-actions">
          <button
            className={tab === "conversation" ? "active" : ""}
            onClick={() => setTab("conversation")}
          >
            Conversation
          </button>
          <button
            className={tab === "knowledge" ? "active" : ""}
            onClick={() => setTab("knowledge")}
          >
            Knowledge Base
          </button>
        </div>
      </header>

      {notice && <div className="notice">{notice}</div>}

      {tab === "conversation" ? (
        <main className="layout">
          <aside className="sidebar">
            <h2>Conversations</h2>

            {conversations.map(item => (
              <button
                key={item.id}
                className={`conversation-item ${
                  item.id === selectedConversationId ? "selected" : ""
                }`}
                onClick={() => setSelectedConversationId(item.id)}
              >
                <strong>{item.customer_name}</strong>
                <span>{item.brand_name}</span>
                <small>{item.order_number || "No order"}</small>
              </button>
            ))}
          </aside>

          <section className="conversation-panel">
            {info && (
              <>
                <div className="customer-header">
                  <div>
                    <span className="eyebrow">Customer</span>
                    <h2>{info.customer_name}</h2>
                    <span>{info.customer_email}</span>
                  </div>

                  <div className="brand-pill">
                    {info.brand_name}
                  </div>
                </div>

                <div className="order-card">
                  <div>
                    <span>Order</span>
                    <strong>{info.order_number || "-"}</strong>
                  </div>
                  <div>
                    <span>Product</span>
                    <strong>{info.product_name || "-"}</strong>
                  </div>
                  <div>
                    <span>Status</span>
                    <strong>{info.order_status || "-"}</strong>
                  </div>
                  <div>
                    <span>Delivered</span>
                    <strong>{info.delivery_date || "-"}</strong>
                  </div>
                </div>

                <div className="messages">
                  {messages.map(item => (
                    <div
                      key={item.id}
                      className={`message ${item.sender_type}`}
                    >
                      <div className="message-label">
                        {item.sender_type === "customer"
                          ? "Customer"
                          : item.sender_type === "agent"
                          ? "Agent"
                          : "AI"}
                      </div>
                      <div className="bubble">{item.content}</div>
                    </div>
                  ))}
                </div>

                <div className="composer">
                  <div className="toggle">
                    <button
                      className={side === "customer" ? "selected" : ""}
                      onClick={() => setSide("customer")}
                    >
                      Customer
                    </button>
                    <button
                      className={side === "agent" ? "selected" : ""}
                      onClick={() => setSide("agent")}
                    >
                      Agent
                    </button>
                  </div>

                  <textarea
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                    placeholder={`Write a ${side} message...`}
                  />

                  <button
                    className="primary"
                    onClick={sendMessage}
                    disabled={loading || !message.trim()}
                  >
                    Send as {side}
                  </button>
                </div>
              </>
            )}
          </section>

          <aside className="assistant-panel">
            <div className="panel-title">
              <div>
                <span className="eyebrow">AI</span>
                <h2>Reply Assistant</h2>
              </div>
              <span className="status-dot">Ready</span>
            </div>

            <button
              className="generate"
              onClick={() => generateReply(false)}
              disabled={loading || !selectedConversationId}
            >
              {loading ? "Working..." : "Generate Reply"}
            </button>

            {generation && (
              <>
                {generation.needsReview && (
                  <div className="warning">
                    <strong>Manual Review Recommended</strong>
                    <p>
                      The available knowledge does not fully support a
                      confident answer.
                    </p>
                  </div>
                )}

                {generation.aiError && (
                  <div className="warning">
                    AI provider unavailable. Safe demo fallback was used.
                  </div>
                )}

                <label>Suggested Response</label>

                <textarea
                  className="reply-editor"
                  value={reply}
                  onChange={e => setReply(e.target.value)}
                />

                <div className="button-row">
                  <button
                    onClick={() => generateReply(true)}
                    disabled={loading}
                  >
                    Regenerate
                  </button>
                  <button
                    className="primary"
                    onClick={approveReply}
                    disabled={loading || !reply.trim()}
                  >
                    Approve & Send
                  </button>
                </div>

                <div className="context-box">
                  <h3>Retrieved Knowledge</h3>

                  {generation.knowledge?.length ? (
                    generation.knowledge.map(item => (
                      <div className="context-item" key={item.id}>
                        <strong>{item.title}</strong>
                        <p>{item.content}</p>
                      </div>
                    ))
                  ) : (
                    <p>No relevant knowledge found.</p>
                  )}
                </div>

                <small className="model">
                  Model: {generation.model}
                </small>
              </>
            )}
          </aside>
        </main>
      ) : (
        <main className="kb-page">
          <div className="kb-header">
            <div>
              <span className="eyebrow">Manage Policies</span>
              <h2>Knowledge Base</h2>
              <p>
                Policies are stored in MySQL and retrieved only for the
                selected brand.
              </p>
            </div>

            <select
              value={kbBrandId}
              onChange={e => {
                setKbBrandId(e.target.value);
                setEditingKbId(null);
                setKbForm(emptyForm);
              }}
            >
              {brands.map(brand => (
                <option key={brand.id} value={brand.id}>
                  {brand.name}
                </option>
              ))}
            </select>
          </div>

          <div className="kb-grid">
            <form className="kb-form" onSubmit={saveKnowledge}>
              <h3>{editingKbId ? "Edit Policy" : "Add Policy"}</h3>

              <label>Policy Type</label>
              <select
                value={kbForm.type}
                onChange={e =>
                  setKbForm({ ...kbForm, type: e.target.value })
                }
              >
                <option value="return">Return</option>
                <option value="refund">Refund</option>
                <option value="shipping">Shipping</option>
                <option value="cancellation">Cancellation</option>
                <option value="other">Other</option>
              </select>

              <label>Title</label>
              <input
                value={kbForm.title}
                onChange={e =>
                  setKbForm({ ...kbForm, title: e.target.value })
                }
                placeholder="Return Policy"
              />

              <label>Content</label>
              <textarea
                rows="8"
                value={kbForm.content}
                onChange={e =>
                  setKbForm({ ...kbForm, content: e.target.value })
                }
                placeholder="Write the policy..."
              />

              <div className="button-row">
                <button className="primary" type="submit">
                  {editingKbId ? "Update" : "Create"}
                </button>

                {editingKbId && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingKbId(null);
                      setKbForm(emptyForm);
                    }}
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>

            <section className="kb-list">
              {knowledge.map(item => (
                <article className="policy-card" key={item.id}>
                  <div>
                    <span className="policy-type">{item.type}</span>
                    <h3>{item.title}</h3>
                  </div>
                  <p>{item.content}</p>

                  <div className="button-row">
                    <button onClick={() => editKnowledge(item)}>
                      Edit
                    </button>
                    <button onClick={() => deleteKnowledge(item.id)}>
                      Delete
                    </button>
                  </div>
                </article>
              ))}
            </section>
          </div>
        </main>
      )}

      <footer>
        {selectedBrand ? `Active brand: ${selectedBrand.name}` : "CX Reply Assistant"}
      </footer>
    </div>
  );
}

export default App;
