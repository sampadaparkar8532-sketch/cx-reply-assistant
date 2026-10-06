const router = require("express").Router();
const controller = require("../controllers/conversationController");

router.get("/", controller.listConversations);
router.get("/:id", controller.getConversation);
router.post("/:id/messages", controller.addMessage);

module.exports = router;
