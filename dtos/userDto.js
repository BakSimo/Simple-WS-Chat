module.exports = class userDto {
  image;
  email;
  username;
  id;
  isActivated;
  isOnline;

  constructor(model, defaultImageId) {
    this.image = model.image || defaultImageId;
    this.email = model.email;
    this.username = model.username;
    this.id = model._id;
    this.isActivated = model.isActivated;
    this.isOnline = model.isOnline;
  }
};
