const mongoose = require('mongoose');

const postSchema = mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user'
  },
  username: String,
  content: String,
  likes: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'user'
    }
  ]
},{timestamps: true})

module.exports = mongoose.model('post', postSchema);