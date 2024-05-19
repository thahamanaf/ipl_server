const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const ObjectId = Schema.ObjectId;

const teamSchema = new Schema({
  team_name: {
    type: String,
    required: true,
    unique: true,
  },
  type: [
    {
      type: String,
      required: true,
    },
  ],
  value: {
    type: String,
    require: true,
  },
  user_id: {
    type: ObjectId,
    require: true,
  },
});

module.exports = mongoose.model("PendingNotification", teamSchema);
