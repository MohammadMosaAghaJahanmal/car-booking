const router = require("express").Router();
const { protect, adminOnly } = require("../middleware/authMiddleware");
const validate = require("../middleware/validate");
const { heroSettingSchema } = require("../validation/schemas");
const { getHomeSettings, updateHomeSettings } = require("../controllers/settingController");

router.get("/home", getHomeSettings);
router.put("/home", protect, adminOnly, validate(heroSettingSchema), updateHomeSettings);

module.exports = router;
