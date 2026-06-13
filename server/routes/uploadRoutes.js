const router = require("express").Router();
const { protect, adminOnly } = require("../middleware/authMiddleware");
const upload = require("../middleware/imageUpload");
const { uploadImage } = require("../controllers/uploadController");

router.post("/image", protect, adminOnly, upload.single("image"), uploadImage);

module.exports = router;
