module.exports = {
  type: 'name',
  transformer: function(token) {
    return token.name.replace(/[_-]?[Dd]efault$/, '');
  },
};
