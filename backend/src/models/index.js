const sequelize = require('../config/db');

const User = require('./user');
const Content = require('./content');
const Rating = require('./rating');
const Review = require('./review');
const Activity = require('./activity');
const List = require('./list');
const ListItem = require('./listItem');
const Follow = require('./follow');
const Like = require('./like');
const Comment = require('./comment');
const Genre = require('./genre');

// Sadece geçerli modelleri ilişkilendir
const isValidModel = (model) => {
  return model && typeof model === 'function' && model.prototype;
};

// İlişkiler - her model için kontrol yap
if (isValidModel(User) && isValidModel(Rating)) {
  User.hasMany(Rating, { foreignKey: 'user_id' });
  Rating.belongsTo(User, { foreignKey: 'user_id' });
}

if (isValidModel(Content) && isValidModel(Rating)) {
  Content.hasMany(Rating, { foreignKey: 'content_id' });
  Rating.belongsTo(Content, { foreignKey: 'content_id' });
}

if (isValidModel(User) && isValidModel(Review)) {
  User.hasMany(Review, { foreignKey: 'user_id' });
  Review.belongsTo(User, { foreignKey: 'user_id' });
}

if (isValidModel(Content) && isValidModel(Review)) {
  Content.hasMany(Review, { foreignKey: 'content_id' });
  Review.belongsTo(Content, { foreignKey: 'content_id' });
}

if (isValidModel(User) && isValidModel(Activity)) {
  User.hasMany(Activity, { foreignKey: 'user_id' });
  Activity.belongsTo(User, { foreignKey: 'user_id' });
}

if (isValidModel(User) && isValidModel(List)) {
  User.hasMany(List, { foreignKey: 'user_id' });
  List.belongsTo(User, { foreignKey: 'user_id' });
}

if (isValidModel(List) && isValidModel(ListItem)) {
  List.hasMany(ListItem, { foreignKey: 'list_id' });
  ListItem.belongsTo(List, { foreignKey: 'list_id' });
}

if (isValidModel(Content) && isValidModel(ListItem)) {
  Content.hasMany(ListItem, { foreignKey: 'content_id' });
  ListItem.belongsTo(Content, { foreignKey: 'content_id' });
}

if (isValidModel(User) && isValidModel(Follow)) {
  User.belongsToMany(User, { 
    through: Follow, 
    as: 'Followers', 
    foreignKey: 'following_id',
    otherKey: 'follower_id'
  });

  User.belongsToMany(User, { 
    through: Follow, 
    as: 'Following', 
    foreignKey: 'follower_id',
    otherKey: 'following_id'
  });
}

if (isValidModel(Activity) && isValidModel(Like)) {
  Activity.hasMany(Like, { foreignKey: 'activity_id' });
  Like.belongsTo(Activity, { foreignKey: 'activity_id' });
}

if (isValidModel(User) && isValidModel(Like)) {
  User.hasMany(Like, { foreignKey: 'user_id' });
  Like.belongsTo(User, { foreignKey: 'user_id' });
}

if (isValidModel(Activity) && isValidModel(Comment)) {
  Activity.hasMany(Comment, { foreignKey: 'activity_id' });
  Comment.belongsTo(Activity, { foreignKey: 'activity_id' });
}

if (isValidModel(User) && isValidModel(Comment)) {
  User.hasMany(Comment, { foreignKey: 'user_id' });
  Comment.belongsTo(User, { foreignKey: 'user_id' });
}

module.exports = {
  sequelize,
  User,
  Content,
  Rating,
  Review,
  Activity,
  List,
  ListItem,
  Follow,
  Like,
  Comment,
  Genre
};