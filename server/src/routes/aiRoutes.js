const router = require("express").Router();
const controller = require("../controllers/aiController");

router.post("/conversations/:id/generate-reply", controller.generate);
router.post("/ai/:id/regenerate", controller.regenerate);
router.post("/ai/:id/approve", controller.approve);

module.exports = router;
