const db = require("../config/database");

async function listConversations(req, res) {
  try {
    const [rows] = await db.query(`
      SELECT
        c.id,
        c.brand_id,
        b.name AS brand_name,
        c.customer_id,
        cu.name AS customer_name,
        c.order_id,
        o.order_number,
        o.product_name,
        o.status AS order_status,
        o.delivery_date,
        c.status,
        c.updated_at
      FROM conversations c
      JOIN brands b ON b.id = c.brand_id
      JOIN customers cu ON cu.id = c.customer_id
      LEFT JOIN orders o ON o.id = c.order_id
      ORDER BY c.updated_at DESC
    `);

    res.json({ success: true, data: rows });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to fetch conversations" });
  }
}

async function getConversation(req, res) {
  try {
    const id = Number(req.params.id);

    const [rows] = await db.query(`
      SELECT
        c.id,
        c.brand_id,
        b.name AS brand_name,
        c.customer_id,
        cu.name AS customer_name,
        cu.email AS customer_email,
        c.order_id,
        o.order_number,
        o.product_name,
        o.status AS order_status,
        o.delivery_date,
        c.status
      FROM conversations c
      JOIN brands b ON b.id = c.brand_id
      JOIN customers cu ON cu.id = c.customer_id
      LEFT JOIN orders o ON o.id = c.order_id
      WHERE c.id = ?
    `, [id]);

    if (!rows.length) {
      return res.status(404).json({ success: false, message: "Conversation not found" });
    }

    const [messages] = await db.query(`
      SELECT id, sender_type, content, created_at
      FROM messages
      WHERE conversation_id = ?
      ORDER BY created_at ASC, id ASC
    `, [id]);

    res.json({
      success: true,
      data: {
        conversation: rows[0],
        messages
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to fetch conversation" });
  }
}

async function addMessage(req, res) {
  try {
    const conversationId = Number(req.params.id);
    const { sender_type, content } = req.body;

    if (!["customer","agent"].includes(sender_type) || !content?.trim()) {
      return res.status(400).json({
        success: false,
        message: "sender_type must be customer or agent and content is required"
      });
    }

    const [conversation] = await db.query(
      "SELECT id FROM conversations WHERE id = ?",
      [conversationId]
    );

    if (!conversation.length) {
      return res.status(404).json({ success: false, message: "Conversation not found" });
    }

    const [result] = await db.query(
      `INSERT INTO messages (conversation_id,sender_type,content)
       VALUES (?,?,?)`,
      [conversationId, sender_type, content.trim()]
    );

    await db.query(
      "UPDATE conversations SET updated_at = CURRENT_TIMESTAMP WHERE id = ?",
      [conversationId]
    );

    const [rows] = await db.query(
      "SELECT id, sender_type, content, created_at FROM messages WHERE id = ?",
      [result.insertId]
    );

    res.status(201).json({ success: true, data: rows[0] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to add message" });
  }
}

module.exports = { listConversations, getConversation, addMessage };
