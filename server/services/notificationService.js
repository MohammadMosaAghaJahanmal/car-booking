const { Notification, User } = require("../models");
const notifyUser = async ({ userId, type = "info", title, message, link = null, metadata = null, io }) => {
  if (!userId) return null;
  const notification = await Notification.create({ UserId: userId, type, title, message, link, metadata });
  if (io) io.to("user:" + userId).emit("notification", notification.toJSON());
  return notification;
};
const notifyRole = async ({ role, ...payload }) => {
  const users = await User.findAll({ where: { role }, attributes: ["id"] });
  return Promise.all(users.map((user) => notifyUser({ ...payload, userId: user.id })));
};
module.exports = { notifyUser, notifyRole };