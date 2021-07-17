const mongoose = require('mongoose');

const reqString = {
  type: String,
  required: true,
};

const reqNumber = {
  type: Number,
  required: true,
};

const userDataSchema = mongoose.Schema({
  _id: reqString,
  osu: String,
  osuId: Number,
  shards: reqNumber,
});

module.exports = mongoose.model('user-data', userDataSchema);
