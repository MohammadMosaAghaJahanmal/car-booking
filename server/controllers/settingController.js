const { SiteSetting } = require("../models");

const getHomeSettings = async (_req, res) => {
  try {
    const setting = await SiteSetting.findByPk("heroImageUrl");
    res.set("Cache-Control", "no-store");
    res.json({ heroImageUrl: setting?.value || null });
  } catch (error) {
    res.status(500).json({ message: "Could not load homepage settings", error: error.message });
  }
};

const updateHomeSettings = async (req, res) => {
  try {
    const [setting] = await SiteSetting.upsert({ key: "heroImageUrl", value: req.validated.body.heroImageUrl });
    res.json({ message: "Homepage hero updated", heroImageUrl: setting.value });
  } catch (error) {
    res.status(500).json({ message: "Could not update homepage settings", error: error.message });
  }
};

module.exports = { getHomeSettings, updateHomeSettings };
