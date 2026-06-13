const multer = require("multer");
const path = require("path");
const fs = require("fs");

const uploadDirectory = path.join(__dirname, "..", "uploads");
fs.mkdirSync(uploadDirectory, { recursive: true });

const extensionByType = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
};

const storage = multer.diskStorage({
  destination: (_req, _file, done) => done(null, uploadDirectory),
  filename: (_req, file, done) => {
    const extension = extensionByType[file.mimetype];
    done(null, Date.now() + "-" + Math.round(Math.random() * 1e9) + extension);
  },
});

module.exports = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, done) => {
    if (!extensionByType[file.mimetype]) return done(new multer.MulterError("LIMIT_UNEXPECTED_FILE", "image"));
    done(null, true);
  },
});
