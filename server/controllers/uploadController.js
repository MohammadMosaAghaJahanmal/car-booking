const uploadImage = (req, res) => {
  if (!req.file) return res.status(400).json({ message: "Choose a JPG, PNG, or WebP image" });
  const imageUrl = req.protocol + "://" + req.get("host") + "/uploads/" + req.file.filename;
  res.status(201).json({ message: "Image uploaded successfully", imageUrl });
};

module.exports = { uploadImage };
