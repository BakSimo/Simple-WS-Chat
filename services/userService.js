const User = require("../models/User");
const UserImage = require("../models/UserImage");
const bcrypt = require("bcryptjs");
const uuid = require("uuid");
const mailService = require("../services/mailService");
const tokenService = require("../services/tokenService");
const imageService = require("../services/imageService");
const UserDto = require("../dtos/userDto");
const { API_URL } = require("../config");
const apiError = require("../exceptions/apiErroe");

class UserService {
  async registration(email, username, password) {
    const emailCandidate = await User.findOne({ email });
    if (emailCandidate) {
      throw apiError.BadRequest(
        `A user with the mailing address ${email} already exists`
      );
    }
    const candidate = await User.findOne({ username });
    if (candidate) {
      throw apiError.BadRequest("User is already registered!");
    }
    const heshPassword = await bcrypt.hash(password, 7);
    const activationLink = uuid.v4();
    const defaultImageId = await imageService.ensureDefaultImageExists();
    const user = await User.create({
      email,
      username,
      password: heshPassword,
      activationLink,
      image: defaultImageId,
    });
    await mailService.sendActivationMail(
      email,
      `${API_URL}/auth/activate/${activationLink}`
    );

    const userDto = new UserDto(user);
    const tokens = tokenService.generateTokens({ ...userDto });
    await tokenService.saveToken(userDto.id, tokens.refreshToken);

    return {
      ...tokens,
      user: userDto,
    };
  }

  async login(username, password) {
    const user = await User.findOne({ username });
    if (!user) {
      throw apiError.BadRequest(`User ${username} was not found`);
    }

    const isPassEquals = await bcrypt.compare(password, user.password);
    if (!isPassEquals) {
      throw apiError.BadRequest("Incorect password");
    }

    const userDto = new UserDto(user);
    const tokens = tokenService.generateTokens({ ...userDto });
    await tokenService.saveToken(userDto.id, tokens.refreshToken);

    return {
      ...tokens,
      user: userDto,
    };
  }

  async activate(activationLink) {
    const user = await User.findOne({ activationLink });
    if (!user) {
      throw apiError.BadRequest("Неккоректная ссылка активации");
    }
    user.isActivated = true;
    await user.save();
  }

  async logout(refreshToken) {
    const token = await tokenService.removeToken(refreshToken);
    return token;
  }

  async refresh(refreshToken) {
    if (!refreshToken) {
      throw apiError.UnauthorizedError();
    }
    const userData = tokenService.validateRefreshToken(refreshToken);
    const tokenFromDataBase = await tokenService.findToken(refreshToken);
    if (!userData || !tokenFromDataBase) {
      throw apiError.UnauthorizedError();
    }

    const user = await User.findById(userData.id);
    const userDto = new UserDto(user);
    const tokens = tokenService.generateTokens({ ...userDto });
    await tokenService.saveToken(userDto.id, tokens.refreshToken);

    return {
      ...tokens,
      user: userDto,
    };
  }

  async getAllUsers() {
    const users = await User.find();
    return users;
  }

  async getOurUser(username) {
    const user = await User.findOne({username});
    return user;
  }

  async setUserImage(data) {
    try {
      console.log(data.formData);
      const newImage = new UserImage({
        filename: data.file.originalname,
        contentType: data.file.mimetype,
        imageBase64: data.file.buffer.toString("base64"),
      });
      await newImage.save();

      const userData = await User.findByIdAndUpdate(data.currentUser, {
        $set: { image: newImage._id },
      });
      console.log(userData);
      return userData
    } catch (error) {
      console.error(error);
    }
  }
}

module.exports = new UserService();
