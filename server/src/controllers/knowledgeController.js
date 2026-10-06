const db = require("../config/database");
const { getBrandKnowledge } = require("../services/knowledgeService");

const allowedTypes = new Set(["return","refund","shipping","cancellation","other"]);

async function listByBrand(req, res) {
  try {
    const brandId = Number(req.params.brandId);
    const rows = await getBrandKnowledge(brandId);
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to fetch knowledge" });
  }
}

async function create(req, res) {
  try {
    const brandId = Number(req.params.brandId);
    const { type, title, content } = req.body;

    if (!allowedTypes.has(type) || !title?.trim() || !content?.trim()) {
      return res.status(400).json({ success: false, message: "type, title and content are required" });
    }

    const [result] = await db.query(
      `INSERT INTO knowledge_base_entries (brand_id,type,title,content)
       VALUES (?,?,?,?)`,
      [brandId, type, title.trim(), content.trim()]
    );

    const [rows] = await db.query(
      "SELECT * FROM knowledge_base_entries WHERE id = ? AND brand_id = ?",
      [result.insertId, brandId]
    );

    res.status(201).json({ success: true, data: rows[0] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to create knowledge entry" });
  }
}

async function update(req, res) {
  try {
    const id = Number(req.params.id);
    const { type, title, content } = req.body;

    if (!allowedTypes.has(type) || !title?.trim() || !content?.trim()) {
      return res.status(400).json({ success: false, message: "type, title and content are required" });
    }

    const [result] = await db.query(
      `UPDATE knowledge_base_entries
       SET type = ?, title = ?, content = ?
       WHERE id = ?`,
      [type, title.trim(), content.trim(), id]
    );

    if (!result.affectedRows) {
      return res.status(404).json({ success: false, message: "Knowledge entry not found" });
    }

    const [rows] = await db.query(
      "SELECT * FROM knowledge_base_entries WHERE id = ?",
      [id]
    );

    res.json({ success: true, data: rows[0] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to update knowledge entry" });
  }
}

async function remove(req, res) {
  try {
    const id = Number(req.params.id);

    const [result] = await db.query(
      "DELETE FROM knowledge_base_entries WHERE id = ?",
      [id]
    );

    if (!result.affectedRows) {
      return res.status(404).json({ success: false, message: "Knowledge entry not found" });
    }

    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to delete knowledge entry" });
  }
}

module.exports = { listByBrand, create, update, remove };
