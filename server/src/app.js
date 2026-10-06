require("dotenv").config({ path: require("path").resolve(__dirname, "../.env") });

const express = require("express");
const cors = require("cors");

const db = require("./config/database");
const brandRoutes = require("./routes/brandRoutes");
const knowledgeRoutes = require("./routes/knowledgeRoutes");
const conversationRoutes = require("./routes/conversationRoutes");
const aiRoutes = require("./routes/aiRoutes");

const app = express();

app.use(cors());
app.use(express.json({ limit: "1mb" }));

app.get("/", (req, res) => {
  res.json({
    name: "CX Reply Assistant API",
    status: "running"
  });
});

app.get("/api/health", async (req, res) => {
  try {
    const [rows] = await db.query("SELECT 1 AS connected");
    res.json({
      success: true,
      database: rows[0].connected === 1
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      database: false,
      message: error.message
    });
  }
});

app.use("/api/brands", brandRoutes);
app.use("/api", knowledgeRoutes);
app.use("/api/conversations", conversationRoutes);
app.use("/api", aiRoutes);

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({
    success: false,
    message: "Internal server error"
  });
});

const PORT = Number(process.env.PORT || 5000);

app.listen(PORT, () => {
  console.log(`CX Reply Assistant API running at port ${PORT}`);
});
