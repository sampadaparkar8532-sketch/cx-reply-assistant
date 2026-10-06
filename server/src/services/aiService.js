const { retrieveRelevantKnowledge } = require("./knowledgeService");

function safeDemoReply({ knowledge, customerMessage }) {
  const text = String(customerMessage || "").toLowerCase();

  if (!knowledge.length) {
    return {
      response:
        "I couldn't find a relevant policy in the current brand knowledge base. I don't want to make an unsupported promise, so this case should be reviewed manually.",
      needsReview: true,
      mode: "demo-fallback"
    };
  }

  const combined = knowledge.map(k => `${k.title}: ${k.content}`).join("\n");

  if (/(refund|money back|reimburse)/i.test(text)) {
    const refund = knowledge.find(k => k.type === "refund");
    return {
      response: refund
        ? `Thanks for reaching out. Based on our current policy, ${refund.content} Our support team can review your order and confirm the next step.`
        : "I couldn't find a refund policy for this brand, so this case should be reviewed manually.",
      needsReview: !refund,
      mode: "demo-fallback"
    };
  }

  if (/(return|broken|damaged|replacement|wrong item)/i.test(text)) {
    const ret = knowledge.find(k => k.type === "return");
    return {
      response: ret
        ? `I'm sorry your order arrived with an issue. ${ret.content} Please share any requested order details or photos with the support team so they can review the case.`
        : "I couldn't find a return policy for this brand, so this case should be reviewed manually.",
      needsReview: !ret,
      mode: "demo-fallback"
    };
  }

  if (/(ship|shipping|delivery|deliver)/i.test(text)) {
    const ship = knowledge.find(k => k.type === "shipping");
    return {
      response: ship
        ? `Thanks for checking with us. ${ship.content}`
        : "I couldn't find a shipping policy for this brand, so this case should be reviewed manually.",
      needsReview: !ship,
      mode: "demo-fallback"
    };
  }

  if (/(cancel|cancellation)/i.test(text)) {
    const cancel = knowledge.find(k => k.type === "cancellation");
    return {
      response: cancel
        ? `Regarding cancellation: ${cancel.content}`
        : "I couldn't find a cancellation policy for this brand, so this case should be reviewed manually.",
      needsReview: !cancel,
      mode: "demo-fallback"
    };
  }

  return {
    response:
      "I found some brand knowledge, but it does not clearly answer the customer's question. I recommend manual review rather than making an unsupported promise.",
    needsReview: true,
    mode: "demo-fallback"
  };
}

async function generateReply({ brand, customerMessage, conversation, order }) {
  const knowledge = await retrieveRelevantKnowledge(brand.id, customerMessage);

  const context = knowledge.map(k => ({
    id: k.id,
    type: k.type,
    title: k.title,
    content: k.content
  }));

  const fallback = () => safeDemoReply({ knowledge, customerMessage });

  if (!process.env.OPENROUTER_API_KEY) {
    return {
      ...fallback(),
      knowledge: context,
      model: "demo-safe-fallback"
    };
  }

  const model = process.env.OPENROUTER_MODEL || "openai/gpt-4o-mini";

  const prompt = `
You are a customer support reply assistant.

RULES:
- Answer only from the supplied brand knowledge.
- Never invent return, refund, replacement, shipping, cancellation or compensation policies.
- Never promise something that the supplied knowledge does not support.
- If the knowledge is insufficient, explicitly say the case requires manual review.
- Be concise, polite and useful.
- The brand is authoritative. Never use knowledge from another brand.

BRAND:
${brand.name}

ORDER:
${JSON.stringify(order || {})}

CONVERSATION:
${conversation.map(m => `${m.sender_type}: ${m.content}`).join("\n")}

RETRIEVED BRAND KNOWLEDGE:
${knowledge.map(k => `${k.title}: ${k.content}`).join("\n")}

LATEST CUSTOMER MESSAGE:
${customerMessage}

Return only the suggested customer-facing response.
`;

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      signal: AbortSignal.timeout(20000),
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost:5173",
        "X-Title": "CX Reply Assistant"
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: "system",
            content: "You are a safe customer-support assistant."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.2,
        max_tokens: 300
      })
    });

    if (!response.ok) {
      throw new Error(`OpenRouter HTTP ${response.status}`);
    }

    const data = await response.json();
    const generated = data?.choices?.[0]?.message?.content?.trim();

    if (!generated) throw new Error("Empty AI response");

    return {
      response: generated,
      knowledge: context,
      model,
      needsReview: knowledge.length === 0,
      mode: "openrouter",
      usage: data.usage || {}
    };
  } catch (error) {
    console.error("AI provider failed:", error.message);

    return {
      ...fallback(),
      knowledge: context,
      model: "demo-safe-fallback-after-ai-error",
      aiError: error.message
    };
  }
}

module.exports = { generateReply };
