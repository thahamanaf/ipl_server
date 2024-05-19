const express = require("express");
const { Server } = require("socket.io");
const { createServer } = require("node:http");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const dotenv = require("dotenv");
dotenv.config();
const corsOptions = require("./config/corsOptions");
const { check, validationResult } = require("express-validator");
const { authorizeToken, checkRoles } = require("./utils/auth_util");
const userRoles = require("./config/userRoles");
const authenticationRoutes = require("./src/authentication/auth_route");
const teamRoutes = require("./src/team/team_routes");
const {
  updateTeamDetails_cntrl,
  insertPendingNotification_cntrl,
} = require("./src/team/team_controller");
const { ObjectId } = require("mongodb");
// to use change stream it required replica set and intializing it in local machine was failed
// tried using multiple containers in docker also but it went some err while connecting getaddr err
// const teamChangeStream = require("./services/team_channge_stream")

const app = express();
const port = process.env.PORT;
app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser());

app.use("/api/auth", authenticationRoutes);
app.use("/api/team", teamRoutes);
const whitelist = process.env.ALLOWED_HOSTS
  ? process.env.ALLOWED_HOSTS.split(",")
  : [];

const ioOptions = {
  cors: {
    origin: whitelist,
  },
};
const appServer = createServer(app);
// teamChangeStream().catch(console.dir);
const io = new Server(appServer, ioOptions);
const connectedUsers = {};
io.on("connection", (socket) => {
  console.log("user is connected");

  socket.on("setUserId", (userId) => {
    connectedUsers[userId] = socket.id;
  });
  socket.on("disconnect", (userId) => {
    const disconnectedUserId = Object.keys(connectedUsers).find(
      (key) => connectedUsers[key] === socket.id
    );
    if (disconnectedUserId) {
      delete connectedUsers[disconnectedUserId];
    }
  });
});

app.patch(
  "/api/team/updateTeamDetails/:teamId",
  [
    check("team_name")
      .trim()
      .isString()
      .withMessage("Provide a valid team name")
      .optional(),
    check("team_logo")
      .trim()
      .isString()
      .withMessage("Provide a valid team logo path")
      .optional(),
    check("upper_card_color")
      .trim()
      .isString()
      .withMessage("Provide a valid card color")
      .optional(),
    check("lower_card_color")
      .trim()
      .isString()
      .withMessage("Provide a valid card color")
      .optional(),
    check("team_members")
      .isArray()
      .withMessage("Team members list should be an array of values")
      .optional(),
  ],
  authorizeToken,
  checkRoles([userRoles.admin]),
  async (req, res) => {
    const validationRes = validationResult(req);
    if (!validationRes.isEmpty()) {
      return res.status(400).send({
        status: false,
        statusCode: 400,
        message: "Field validation errors",
        validationRes,
      });
    }
    const reqObj = { ...req.body, teamId: req.params.teamId };
    const response = await updateTeamDetails_cntrl(reqObj);
    try {
      const updatedItemKeys = Object.keys(response?.updatedItems || {});
      const notificationUserList = [];
      const offlineUsers = [];

      updatedItemKeys.forEach((item) => {
        const subscibedUser = response?.subscribedUsers || [];

        subscibedUser.forEach((user) => {

          const isNotificationEnabled =
            user?.notification_preferences.find(
              (i) => i.teamId.toString() === req.params.teamId
            ) || null;
          if (isNotificationEnabled?.[item]) {
            notificationUserList.push({
              userId: user._id,
              type: item,
              teamId: isNotificationEnabled?.teamId,
            });
            const userSocketId = connectedUsers[user._id.toString()];
            let message = `${response?.updatedItems?.teamName || ""}`;
            if (item === "scoreUpdate") {
              message += `Score has updated, new score: ${
                response?.updatedItems?.value || ""
              }`;
            }
            if (item === "teamMemberUpdate") {
              message += ` players updated: ${
                response?.updatedTeamMembers || ""
              }`;
            }
            if (userSocketId) {
              io.to(userSocketId).emit("notification", message);
            } else {
              console.log(`User ${user._id.toString()} is not connected`);
              const userId = new ObjectId(user._id.toString());
              offlineUsers.push({
                team_name: response?.updatedItems?.teamName,
                type: item,
                value: message,
                user_id: userId,
              });
            }
          }
        });
      });

      if (offlineUsers.length) {
        await insertPendingNotification_cntrl(offlineUsers);
      }
    } catch (err) {
      console.log(err);
    } finally {
      // client.close()
    }

    return res.status(response.statusCode).send(response);
  }
);

appServer.listen(port, () => {
  console.log(`App is listening on port: ${port}`);
});
