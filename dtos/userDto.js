module.exports = class userDto {
  email;
  username;
  id;
  isActivated;

  constructor(model) {
    this.email = model.email;
    this.username = model.username;
    this.id = model._id;
    this.isActivated = model.isActivated;
  }
};
