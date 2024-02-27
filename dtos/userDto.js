module.exports = class userDto {
  image;
  email;
  username;
  id;
  isActivated;

  constructor(model) {
    this.image = model.image;
    this.email = model.email;
    this.username = model.username;
    this.id = model._id;
    this.isActivated = model.isActivated;
  }
};
