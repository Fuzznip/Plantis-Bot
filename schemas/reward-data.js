const mongoose = require('mongoose');

const reqString = {
  type: String,
  required: true,
};

const reqNumber = {
  type: Number,
  required: true,
};

const rewardDataSchema = mongoose.Schema({
  name: reqString,
  price: reqNumber,
  description: reqString,
  textRequired: Boolean,
  osuRequired: Boolean
});

module.exports = mongoose.model('reward-data', rewardDataSchema);
