const router = require("express").Router();
const { protect } = require("../middleware/authMiddleware");
const controller = require("../controllers/notificationController");
router.get("/", protect, controller.getNotifications);
router.put("/read-all", protect, controller.markAllRead);
router.put("/:id/read", protect, controller.markRead);
module.exports = router;