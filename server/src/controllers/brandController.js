const db = require("../config/database");

async function listBrands(req, res) {
  try {
    const [rows] = await db.query(
      "SELECT id, name, created_at, updated_at FROM brands ORDER BY name"
    );
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to fetch brands" });
  }
}

module.exports = { listBrands };
