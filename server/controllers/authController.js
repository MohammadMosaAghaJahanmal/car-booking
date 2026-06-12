const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const { Op } = require("sequelize");
const sequelize = require("../config/db");
const { User, PasswordResetToken } = require("../models");
const { sendPasswordReset } = require("../services/emailService");

const register = async (req, res) => {
  try {
    const { name, email, password } = req.validated.body;
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) return res.status(409).json({ message: "An account with this email already exists." });

    const user = await User.create({ name, email, password: await bcrypt.hash(password, 10) });
    res.status(201).json({
      message: "Your account was created successfully.",
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    });
  } catch (error) {
    console.error("Register error:", error.message);
    res.status(500).json({ message: "We could not create your account. Please try again." });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.validated.body;
    const user = await User.findOne({ where: { email } });
    const valid = user ? await bcrypt.compare(password, user.password) : false;
    if (!valid) return res.status(401).json({ message: "The email or password is incorrect." });

    const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: "7d" });
    res.json({
      message: "Login successful.",
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    });
  } catch (error) {
    console.error("Login error:", error.message);
    res.status(500).json({ message: "We could not sign you in. Please try again." });
  }
};

const forgotPassword = async (req, res) => {
  const response = { message: "If an account exists for that email, a reset link has been sent." };
  try {
    const user = await User.findOne({ where: { email: req.validated.body.email } });
    if (!user) return res.json(response);

    await PasswordResetToken.destroy({ where: { UserId: user.id, usedAt: null } });
    const rawToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
    const resetRecord = await PasswordResetToken.create({
      UserId: user.id,
      tokenHash,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000),
    });

    const resetUrl = (process.env.WEB_URL || "http://localhost:3000") + "/reset-password?token=" + rawToken;
    try {
      const delivery = await sendPasswordReset({ to: user.email, resetUrl });
      if (delivery.previewUrl && process.env.NODE_ENV !== "production") response.developmentResetUrl = delivery.previewUrl;
    } catch (error) {
      await resetRecord.destroy();
      console.error("Password reset email error:", error.message);
    }

    res.json(response);
  } catch (error) {
    console.error("Forgot password error:", error.message);
    res.json(response);
  }
};

const resetPassword = async (req, res) => {
  try {
    const { token, password } = req.validated.body;
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
    const resetRecord = await PasswordResetToken.findOne({
      where: { tokenHash, usedAt: null, expiresAt: { [Op.gt]: new Date() } },
      include: [User],
    });

    if (!resetRecord?.User) {
      return res.status(400).json({ message: "This reset link is invalid or has expired. Request a new one." });
    }
    if (await bcrypt.compare(password, resetRecord.User.password)) {
      return res.status(400).json({ message: "Choose a password you have not used for this account." });
    }

    await sequelize.transaction(async (transaction) => {
      await resetRecord.User.update({ password: await bcrypt.hash(password, 10) }, { transaction });
      await PasswordResetToken.update(
        { usedAt: new Date() },
        { where: { UserId: resetRecord.User.id, usedAt: null }, transaction }
      );
    });

    res.json({ message: "Your password has been reset successfully. You can now sign in." });
  } catch (error) {
    console.error("Reset password error:", error.message);
    res.status(500).json({ message: "We could not reset your password. Please request a new link." });
  }
};


const getProfile = async (req, res) => {
  res.json({ user: { id: req.user.id, name: req.user.name, email: req.user.email, role: req.user.role } });
};

const updateProfile = async (req, res) => {
  try {
    await req.user.update({ name: req.validated.body.name });
    res.json({
      message: "Your profile name was updated.",
      user: { id: req.user.id, name: req.user.name, email: req.user.email, role: req.user.role },
    });
  } catch (error) {
    console.error("Update profile error:", error.message);
    res.status(500).json({ message: "We could not update your profile. Please try again." });
  }
};

const changePassword = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    const { currentPassword, newPassword } = req.validated.body;
    if (!await bcrypt.compare(currentPassword, user.password)) {
      return res.status(400).json({ message: "Your current password is incorrect.", fieldErrors: { currentPassword: "Your current password is incorrect." } });
    }
    if (await bcrypt.compare(newPassword, user.password)) {
      return res.status(400).json({ message: "Choose a new password that is different from your current password.", fieldErrors: { newPassword: "Choose a different password." } });
    }

    await sequelize.transaction(async (transaction) => {
      await user.update({ password: await bcrypt.hash(newPassword, 10) }, { transaction });
      await PasswordResetToken.update(
        { usedAt: new Date() },
        { where: { UserId: user.id, usedAt: null }, transaction }
      );
    });

    res.json({ message: "Your password was changed successfully." });
  } catch (error) {
    console.error("Change password error:", error.message);
    res.status(500).json({ message: "We could not change your password. Please try again." });
  }
};

module.exports = { register, login, forgotPassword, resetPassword, getProfile, updateProfile, changePassword };
