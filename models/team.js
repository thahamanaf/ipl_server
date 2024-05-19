const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const teamSchema = new Schema({
  team_name: {
    type: String,
    required: true,
    unique: true,
  },
  team_members: [{
    type: String
  }],
  team_score: {
    type: Number,
    default: 0
  },
  team_logo: {
    type: String
  },
  upper_card_color: {
    type: String
  },
  lower_card_color: {
    type: String
  }
});

module.exports = mongoose.model('Team', teamSchema);