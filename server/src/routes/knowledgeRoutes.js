const router = require("express").Router();
const controller = require("../controllers/knowledgeController");

router.get("/brands/:brandId/knowledge", controller.listByBrand);
router.post("/brands/:brandId/knowledge", controller.create);
router.put("/knowledge/:id", controller.update);
router.delete("/knowledge/:id", controller.remove);

module.exports = router;
