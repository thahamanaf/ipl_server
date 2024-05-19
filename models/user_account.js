const mongoose = require("mongoose");

const { Schema } = mongoose;
const ObjectId = Schema.ObjectId;

const userSchema = new Schema({
  email: {
    type: String,
    unique: true,
    required: true,
  },
  created_date: {
    type: Date,
    default: Date.now,
  },
  password: {
    type: String,
    required: true,
  },
  fullname: {
    type: String,
    required: true,
  },
  subscribed_team: [
    {
      type: ObjectId,
      ref: "Team",
    },
  ],
  notification_preferences: [
    {
      teamId: {
        type: ObjectId,
        ref: "Team",
        required: true,
      },
      teamMemberUpdate: {
        type: Boolean,
        default: false,
      },
      scoreUpdate: {
        type: Boolean,
        default: false,
      },
    },
  ],
  role: {
    type: String,
    required: true,
    default: "user",
  },
});

module.exports = mongoose.model("UserAccount", userSchema);
