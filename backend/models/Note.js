const mongoose = require('mongoose');

const noteSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'A note title is required.'],
      trim: true,
      maxlength: [100, 'Titles must be 100 characters or fewer.'],
    },
    content: {
      type: String,
      default: '',
      maxlength: [10000, 'Note content must be 10,000 characters or fewer.'],
    },
    color: {
      type: String,
      enum: ['paper', 'sage', 'peach', 'sky', 'lilac'],
      default: 'paper',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Note', noteSchema);