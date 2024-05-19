const { ObjectId } = require("mongodb");
const collection = require("../../config/collection");
const client = require("../../config/db");
const keys = require("../../config/keys");
const Team = require("../../models/team");
const PendingNotification = require("../../models/pending_notification");

const createTeam_cntrl = async (req) => {
  const response = {
    status: false,
    statusCode: 400,
    message: "Failed to create team",
  };
  try {
    await client.connect();
    const db = client.db(keys.dbName);
    const isTeamWithSameNameExists = await db
      .collection(collection.team)
      .findOne({ team_name: req.team_name });
    if (isTeamWithSameNameExists) {
      response.message = "Team name already exists";
      return response;
    }
    const team = new Team(req);
    await db.collection(collection.team).insertOne(team);
    response.message = "Team created successfully";
    response.status = true;
    response.statusCode = 200;
  } catch (err) {
    response.error = err?.message || "Internal Error";
  } finally {
    client.close();
  }
  return response;
};
const updateTeamDetails_cntrl = async (req) => {
  // io.emit("test", "test")
  const response = {
    status: false,
    statusCode: 400,
    message: "Failed to update team",
  };
  const { teamId } = req;
  const updatedData = req;
  delete updatedData.teamId;

  try {
    await client.connect();
    const db = client.db(keys.dbName);
    const id = new ObjectId(teamId);
    const updatedTeam = await db
      .collection(collection.team)
      .findOneAndUpdate(
        { _id: id },
        { $set: updatedData },
        { returnDocument: "before" }
      );
    if (!updatedTeam) {
      response.message = "Team not found.";
      return response;
    }
    response.status = true;
    response.statusCode = 200;
    response.message = "team updated successfully";
    const dataKey = Object.keys(updatedData);
    const updatedItems = { teamName: updatedTeam.team_name };
    const updatedTeamMembers = [];
    dataKey.forEach((item) => {
      const oldData = updatedTeam[item];
      const newData = updatedData[item];
      if (Array.isArray(oldData) && Array.isArray(newData)) {
        const legnth = Math.max(oldData.length, newData.length);
        for (let i = 0; i < legnth; i++) {
          const dataA = oldData[i];
          const dataB = newData[i];
          if (dataA !== dataB) {
            updatedTeamMembers.push(dataB);
            updatedItems.teamMemberUpdate = true;
          }
        }
      }
      if (item === "team_score") {
        if (newData !== oldData) {
          updatedItems.scoreUpdate = true;
          updatedItems.value = updatedData["team_score"];
        }
      }
    });
    const cursor = db.collection(collection.userAccount).find({
      subscribed_team: id,
    });
    const users = await cursor.toArray();
    response.subscribedUsers = users;
    response.updatedItems = updatedItems;
    response.updatedTeamMembers = updatedTeamMembers;
  } catch (err) {
    response.error = err?.message || "Internal Error";
  } finally {
    client.close();
  }
  return response;
};

const subscribeTeam_cntrl = async (req) => {
  const { _id, teamId: teamIdFromReq, email } = req;
  const response = {
    status: false,
    statusCode: 400,
    message: "Failed to subscribe to the team",
  };
  try {
    const teamid = new ObjectId(teamIdFromReq);
    await client.connect();
    const db = client.db(keys.dbName);
    const checkTeam = await db
      .collection(collection.team)
      .findOne({ _id: teamid });
    if (!checkTeam) {
      response.message = "Team doen't exists";
      return response;
    }
    const getUser = await db
      .collection(collection.userAccount)
      .findOne({ email: email });
    if (!getUser) {
      response.message = "Failed to fetch the user details";
      return response;
    }
    const { subscribed_team } = getUser;
    let isSubscribedToThisTeam = false;
    for (let i = 0; i < subscribed_team.length; i += 1) {
      const id = subscribed_team[i].toString();
      if (id === teamIdFromReq) {
        isSubscribedToThisTeam = true;
        break;
      }
    }
    if (isSubscribedToThisTeam) {
      response.status = true;
      response.statusCode = 200;
      response.message = "Already subscibed to this team";
      return response;
    }

    const userId = new ObjectId(_id);
    const query = { _id: userId };
    const updateData = {
      $push: {
        subscribed_team: teamid,
        notification_preferences: {
          teamId: teamid,
          teamMemberUpdate: true,
          scoreUpdate: true,
        },
      },
    };
    const option = { returnDocument: "after" };

    const updateSubscriptionAndNotificationPreference = await db
      .collection(collection.userAccount)
      .findOneAndUpdate(query, updateData, option);
    if (!updateSubscriptionAndNotificationPreference) {
      return response;
    }
    response.status = true;
    response.statusCode = 200;
    response.message = "Subscribed to the team";
    response.data = updateSubscriptionAndNotificationPreference;
  } catch (err) {
    response.error = err?.message || "Internal Error";
  } finally {
    client.close();
  }
  return response;
};
const removeTeamSubscription = async (req) => {
  const { _id, teamId: teamIdFromReq } = req;
  const teamid = new ObjectId(teamIdFromReq);
  const userId = new ObjectId(_id);
  const response = {
    status: false,
    statusCode: 400,
    message: "Failed to un subscribe team",
  };
  try {
    await client.connect();
    const db = client.db(keys.dbName);
    const query = { _id: userId };

    const updateData = {
      $pull: {
        subscribed_team: teamid,
        notification_preferences: {
          teamId: teamid,
        },
      },
    };
    const option = { returnDocument: "after" };
    const removeSubscriptionAndNotificationPreference = await db
      .collection(collection.userAccount)
      .findOneAndUpdate(query, updateData, option);
    if (!removeSubscriptionAndNotificationPreference) {
      return response;
    }
    response.status = true;
    response.statusCode = 200;
    response.message = "Subscription removed";
    response.data = removeSubscriptionAndNotificationPreference;
  } catch (err) {
    response.error = err?.message || "Internal Error";
  } finally {
  }
  return response;
};
const manageNotificationPreference_cntrl = async (req) => {
  const response = {
    status: false,
    statusCode: 400,
    message: "Failed to manage notification preferences to the team",
  };
  const { _id, teamId: teamIdFromReq, teamMemberUpdate, scoreUpdate } = req;
  try {
    const teamid = new ObjectId(teamIdFromReq);
    const userId = new ObjectId(_id);
    await client.connect();
    const db = client.db(keys.dbName);
    const checkTeam = await db
      .collection(collection.team)
      .findOne({ _id: teamid });
    if (!checkTeam) {
      response.message = "Team doen't exists";
      return response;
    }
    const getUser = await db
      .collection(collection.userAccount)
      .findOne({ _id: userId });
    if (!getUser) {
      response.message = "Failed to fetch the user details";
      return response;
    }
    const { subscribed_team } = getUser;
    const isSubscribedToThisTeam = subscribed_team.find(
      (i) => i.toString() === teamIdFromReq
    );
    if (!isSubscribedToThisTeam) {
      response.message = "User is not subscribed to this team";
      return response;
    }
    const updateNotificationPreference = await db
      .collection(collection.userAccount)
      .findOneAndUpdate(
        { _id: userId, "notification_preferences.teamId": teamid },
        {
          $set: {
            "notification_preferences.$.teamMemberUpdate": teamMemberUpdate,
            "notification_preferences.$.scoreUpdate": scoreUpdate,
          },
        },
        {
          returnDocument: "after",
        }
      );
    if (!updateNotificationPreference) {
      return response;
    }
    response.status = true;
    response.statusCode = 200;
    response.message = "Notification preference updated";
    response.data = updateNotificationPreference;
  } catch (err) {
    response.error = err?.message || "Internal Error";
  } finally {
  }
  return response;
};
const getAllTeamList_cntrl = async () => {
  const response = {
    status: false,
    statusCode: 400,
    message: "No data found",
  };
  try {
    await client.connect();
    const db = client.db(keys.dbName);
    const getTeamList = db.collection(collection.team).find();
    const teamList = await getTeamList.toArray();
    response.status = true;
    response.statusCode = 200;
    response.message = "Team list fetched";
    response.data = teamList;
  } catch (err) {
    response.error = err?.message || "Internal Error";
  } finally {
    client.close();
  }
  return response;
};
const removeTeam_cntrl = async (req) => {
  const response = {
    status: false,
    statusCode: 400,
    message: "Failed to remove team",
  };
  const { teamId: teamIdFromReq } = req;
  const teamId = new ObjectId(teamIdFromReq);
  try {
    await client.connect();
    const db = client.db(keys.dbName);
    const deleteTeam = await db
      .collection(collection.team)
      .deleteOne({ _id: teamId });
    await db
      .collection(collection.userAccount)
      .updateMany(
        { subscribed_team: teamId },
        { $pull: { subscribed_team: teamId } }
      );
    await db
      .collection(collection.userAccount)
      .updateMany(
        { "notification_preferences.teamId": teamId },
        { $pull: { notification_preferences: { teamId } } }
      );
    response.status = true;
    response.statusCode = 200;
    response.message = deleteTeam.deletedCount
      ? "Team removed"
      : "Team not found";
  } catch (err) {
    response.error = err?.message || "Internal Error";
  } finally {
    client.close();
  }
  return response;
};
const insertPendingNotification_cntrl = async (offlineUsers) => {
  const response = {
    status: true,
    statusCode: 200,
    message: "Offline users data added",
  };
  try {
    setTimeout(async () => {
      await client.connect();
      const db = client.db(keys.dbName);
      const data = offlineUsers.map((item) => new PendingNotification(item));
      await db.collection(collection.pendingNotification).insertMany(data);
      client.close();
    }, 5000);
  } catch (err) {
    client.close();
  }
  return response;
};
const getAllNotification_cntrl = async (req) => {
  const response = {
    status: false,
    statusCode: 400,
    message: "Failed to fetch notificaitons",
  };
  const userid = new ObjectId(req._id);
  try {
    await client.connect();
    const db = client.db(keys.dbName);
    const data = db
      .collection(collection.pendingNotification)
      .find({ user_id: userid });
    const notificationList = await data.toArray();
    response.data = notificationList;
    const removeData = await db
      .collection(collection.pendingNotification)
      .deleteMany({ user_id: userid });
    response.deletedCount = removeData?.deletedCount || 0;
    response.status = true;
    response.statusCode = 200;
  } catch (err) {
    response.error = err?.message || "Internal Error";
  } finally {
    client.close();
  }
  return response;
};
module.exports = {
  createTeam_cntrl,
  updateTeamDetails_cntrl,
  subscribeTeam_cntrl,
  removeTeamSubscription,
  manageNotificationPreference_cntrl,
  getAllTeamList_cntrl,
  removeTeam_cntrl,
  insertPendingNotification_cntrl,
  getAllNotification_cntrl,
};
