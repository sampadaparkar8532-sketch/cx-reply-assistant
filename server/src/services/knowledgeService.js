const db = require("../config/database");

const STOP_WORDS = new Set([
  "the","and","for","with","what","when","where","this","that","can",
  "you","your","have","has","from","into","how","long","order","product",
  "does","could","would","should","please","about","after","before"
]);

function keywords(text) {
  return [...new Set(
    String(text || "")
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter(w => w.length >= 3 && !STOP_WORDS.has(w))
  )];
}

async function getBrandKnowledge(brandId) {
  const [rows] = await db.query(
    `SELECT id, brand_id, type, title, content, created_at, updated_at
     FROM knowledge_base_entries
     WHERE brand_id = ?
     ORDER BY type, id`,
    [brandId]
  );
  return rows;
}

async function retrieveRelevantKnowledge(brandId, query) {
  const rows = await getBrandKnowledge(brandId);
  const terms = keywords(query);

  const scored = rows.map(row => {
    const haystack = `${row.type} ${row.title} ${row.content}`.toLowerCase();
    let score = 0;

    for (const term of terms) {
      if (haystack.includes(term)) score += 1;
    }

    const typeBoost =
      (terms.some(t => ["return","returns","broken","damaged","replacement"].includes(t)) && row.type === "return") ||
      (terms.some(t => ["refund","money","reimburse"].includes(t)) && row.type === "refund") ||
      (terms.some(t => ["ship","shipping","delivery","delivered"].includes(t)) && row.type === "shipping") ||
      (terms.some(t => ["cancel","cancellation"].includes(t)) && row.type === "cancellation");

    if (typeBoost) score += 3;

    return { ...row, score };
  });

  return scored
    .filter(r => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 4);
}

module.exports = {
  getBrandKnowledge,
  retrieveRelevantKnowledge
};
