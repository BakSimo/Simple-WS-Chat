const User = require("../models/User");
const UserImage = require("../models/UserImage");
const Message = require("../models/Message");
const { CLIENT_URL } = require("../config");
const { validationResult } = require("express-validator");
const userService = require("../services/userService");
const apiError = require("../exceptions/apiErroe");

const activeUsers = new Set();

class authController {
  async registration(req, res, next) {
    try {
      const { email, username, password } = req.body;

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const emailCandidate = await User.findOne({ email });
      if (emailCandidate) {
        return res
          .status(421)
          .json(`A user with the mailing address ${email} already exists`);
      }

      const candidate = await User.findOne({ username });
      if (candidate) {
        return res.status(422).json("User is already registered!");
      }
      const userData = await userService.registration(
        email,
        username,
        password
      );

      res.cookie("refreshToken", userData.refreshToken, {
        maxAge: 30 * 24 * 60 * 60 * 1000,
        httpOnly: true,
      });
      res.status(200).json("User is registered!");
    } catch (error) {
      next(error);
    }
  }

  async login(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(405).json({ errors: errors.array() });
      }

      const { username, password } = req.body;
      const userData = await userService.login(username, password);

      const candidate = await User.findOne({ username });
      if (!candidate) {
        return apiError.BadRequest(`User ${username} was not found`);
      }

      if (activeUsers.has(username)) {
        return res.status(405).json({ error: "User already logged in" });
      }

      if (!userData.user.isActivated) {
        return res.status(405).json({ error: "Activate your email" });
      }

      res.cookie("refreshToken", userData.refreshToken, {
        maxAge: 30 * 24 * 60 * 60 * 1000,
        httpOnly: true,
      });
      activeUsers.add(username);
      return res.json({ userData, redirectUrl: "/chat" });
    } catch (error) {
      next(error);
    }
  }

  async logout(req, res, next) {
    try {
      const { refreshToken } = req.cookies;
      const { currentUser } = req.body;
      const token = await userService.logout(refreshToken);
      activeUsers.delete(currentUser);
      res.clearCookie("refreshToken");
      return res.json({ token, redirectUrl: "/login" });
    } catch (error) {
      next(error);
    }
  }

  async getHistory(req, res, next) {
    try {
      const { sender, to } = req.body;
      const messages = await Message.find({
        $or: [
          { $and: [{ sender: sender }, { to: to }] },
          { $and: [{ sender: to }, { to: sender }] },
        ],
      });
      return res.status(200).json(messages);
    } catch (error) {
      next(error);
    }
  }

  async activate(req, res, next) {
    try {
      const activationLink = req.params.link;
      await userService.activate(activationLink);
      return res.redirect(CLIENT_URL);
    } catch (error) {
      next(error);
    }
  }

  async refresh(req, res, next) {
    try {
      const { refreshToken } = req.cookies;
      const userData = await userService.refresh(refreshToken);
      res.cookie("refreshToken", userData.refreshToken, {
        maxAge: 30 * 24 * 60 * 60 * 1000,
        httpOnly: true,
      });

      return res.json(userData);
    } catch (error) {
      next(error);
    }
  }

  async getUsers(req, res, next) {
    try {
      const users = await userService.getAllUsers();
      return res.json(users);
    } catch (error) {
      next(error);
    }
  }

  async getUsersCount(req, res, next) {
    try {
      const count = await userService.getAllUsersCount();
      return res.json(count);
    } catch (error) {
      next(error);
    }
  }

  async getOurUser(req, res, next) {
    try {
      const { username } = req.body;
      const user = await userService.getOurUser(username);
      return res.json(user);
    } catch (error) {
      next(error);
    }
  }

  async getUser(req, res, next) {
    try {
      const { username } = req.body;
      const user = await userService.getOurUser(username);
      return res.json(user);
    } catch (error) {
      next(error);
    }
  }

  async setUserImage(req, res, next) {
    try {
      const currentUser = JSON.parse(req.body.currentUser);

      const fileData = req.file;
      const newImage = new UserImage({
        filename: fileData.originalname,
        contentType: fileData.mimetype,
        imageBase64: fileData.buffer.toString("base64"),
      });
      await newImage.save();

      const user = await User.findOne({ username: currentUser });
      if (!user) {
        throw apiError.BadRequest(`User '${currentUser}' not found`);
      }

      const updatedUser = await User.findOneAndUpdate(
        { username: currentUser },
        { $set: { image: newImage._id } },
        { new: true }
      );

      // res.send(updatedUser);
    } catch (error) {
      console.error(error);
      res.status(500).send(error);
    }
  }

  async getUserImage(req, res, next) {
    try {
      const image = await UserImage.findById(req.params.id);
      if (!image) {
        throw apiError.BadRequest("Image not found");
      }

      res.send({
        image: `data:${image.contentType};base64,${image.imageBase64}`,
      });
    } catch (error) {
      console.error("Error:", error);
      res.status(500).send("Server error");
    }
  }
}

module.exports = new authController();
