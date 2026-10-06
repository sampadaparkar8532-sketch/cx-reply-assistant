const db = require("../config/database");
const { generateReply } = require("../services/aiService");

async function buildGeneration(conversationId) {
  const [rows] = await db.query(`
    SELECT
      c.id,
      c.brand_id,
      b.name AS brand_name,
      cu.name AS customer_name,
      cu.email AS customer_email,
      o.order_number,
      o.product_name,
      o.status AS order_status,
      o.delivery_date
    FROM conversations c
    JOIN brands b ON b.id = c.brand_id
    JOIN customers cu ON cu.id = c.customer_id
    LEFT JOIN orders o ON o.id = c.order_id
    WHERE c.id = ?
  `, [conversationId]);

  if (!rows.length) throw new Error("Conversation not found");

  const conversation = rows[0];

  const [messages] = await db.query(`
    SELECT id, sender_type, content, created_at
    FROM messages
    WHERE conversation_id = ?
    ORDER BY created_at ASC, id ASC
  `, [conversationId]);

  const customerMessages = messages.filter(m => m.sender_type === "customer");
  const latestCustomer = customerMessages[customerMessages.length - 1];

  if (!latestCustomer) throw new Error("No customer message found");

  const result = await generateReply({
    brand: { id: conversation.brand_id, name: conversation.brand_name },
    customerMessage: latestCustomer.content,
    conversation: messages,
    order: {
      order_number: conversation.order_number,
      product_name: conversation.product_name,
      status: conversation.order_status,
      delivery_date: conversation.delivery_date
    }
  });

  const retrievedContext = result.knowledge
    .map(k => `${k.title}: ${k.content}`)
    .join("\n");

  const [insert] = await db.query(`
    INSERT INTO ai_generations
    (conversation_id,customer_message_id,retrieved_context,ai_response,model,
     input_tokens,output_tokens,status)
    VALUES (?,?,?,?,?,?,?,?)
  `, [
    conversationId,
    latestCustomer.id,
    retrievedContext,
    result.response,
    result.model || null,
    Number(result.usage?.prompt_tokens || 0),
    Number(result.usage?.completion_tokens || 0),
    "generated"
  ]);

  return {
    generationId: insert.insertId,
    response: result.response,
    knowledge: result.knowledge,
    needsReview: Boolean(result.needsReview),
    model: result.model,
    mode: result.mode,
    aiError: result.aiError || null
  };
}

async function generate(req, res) {
  try {
    const data = await buildGeneration(Number(req.params.id));
    res.json({ success: true, data });
  } catch (error) {
    console.error(error);
    res.status(400).json({ success: false, message: error.message });
  }
}

async function regenerate(req, res) {
  try {
    const generationId = Number(req.params.id);
    if (!Number.isInteger(generationId) || generationId < 1) {
      return res.status(400).json({ success: false, message: "Invalid generation ID" });
    }

    const [rows] = await db.query(
      "SELECT conversation_id FROM ai_generations WHERE id = ?",
      [generationId]
    );

    if (!rows.length) {
      return res.status(404).json({ success: false, message: "AI generation not found" });
    }

    const data = await buildGeneration(rows[0].conversation_id);
    res.json({ success: true, data });
  } catch (error) {
    console.error(error);
    res.status(400).json({ success: false, message: error.message });
  }
}

async function approve(req, res) {
  try {
    const generationId = Number(req.params.id);
    const { final_response } = req.body;

    if (!final_response?.trim()) {
      return res.status(400).json({
        success: false,
        message: "final_response is required"
      });
    }

    const [generations] = await db.query(
      "SELECT * FROM ai_generations WHERE id = ?",
      [generationId]
    );

    if (!generations.length) {
      return res.status(404).json({
        success: false,
        message: "AI generation not found"
      });
    }

    const generation = generations[0];

    await db.query(`
      UPDATE ai_generations
      SET edited_response = ?, final_response = ?, status = 'approved'
      WHERE id = ?
    `, [
      final_response.trim(),
      final_response.trim(),
      generationId
    ]);

    const [messageResult] = await db.query(`
      INSERT INTO messages (conversation_id,sender_type,content)
      VALUES (?,?,?)
    `, [
      generation.conversation_id,
      "agent",
      final_response.trim()
    ]);

    await db.query(
      "UPDATE conversations SET updated_at = CURRENT_TIMESTAMP WHERE id = ?",
      [generation.conversation_id]
    );

    const [message] = await db.query(
      "SELECT id,sender_type,content,created_at FROM messages WHERE id = ?",
      [messageResult.insertId]
    );

    res.json({
      success: true,
      data: {
        generationId,
        message: message[0]
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to approve response" });
  }
}

module.exports = { generate, regenerate, approve };
