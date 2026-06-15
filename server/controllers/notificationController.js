const { Notification } = require("../models");
const getNotifications = async (req, res) => {
  try {
    const [notifications, unreadCount] = await Promise.all([
      Notification.findAll({ where: { UserId: req.user.id }, order: [["createdAt", "DESC"]], limit: 50 }),
      Notification.count({ where: { UserId: req.user.id, readAt: null } }),
    ]);
    res.json({ notifications, unreadCount });
  } catch (error) { res.status(500).json({ message: "Could not load notifications", error: error.message }); }
};
const markRead = async (req, res) => {
  try {
    const notification = await Notification.findOne({ where: { id: req.params.id, UserId: req.user.id } });
    if (!notification) return res.status(404).json({ message: "Notification not found" });
    if (!notification.readAt) await notification.update({ readAt: new Date() });
    res.json(notification);
  } catch (error) { res.status(500).json({ message: "Could not update notification", error: error.message }); }
};
const markAllRead = async (req, res) => {
  try {
    await Notification.update({ readAt: new Date() }, { where: { UserId: req.user.id, readAt: null } });
    res.json({ message: "All notifications marked as read" });
  } catch (error) { res.status(500).json({ message: "Could not update notifications", error: error.message }); }
};
module.exports = { getNotifications, markRead, markAllRead };