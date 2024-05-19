const express = require("express");
const { authorizeToken, checkRoles } = require("../../utils/auth_util");
const userRoles = require("../../config/userRoles");
const router = express.Router();
const { check, validationResult } = require("express-validator");

const {
  createTeam_cntrl,
  updateTeamDetails_cntrl,
  subscribeTeam_cntrl,
  removeTeamSubscription,
  manageNotificationPreference_cntrl,
  getAllTeamList_cntrl,
  removeTeam_cntrl,
  getAllNotification_cntrl,
} = require("./team_controller");

router.get("/test", (req, res) => {
  res.send("team route okay");
});

router.post(
  "/createTeam",
  [
    check("team_name")
      .trim()
      .isString()
      .withMessage("Provide a valid team name")
      .notEmpty(),
    check("team_logo")
      .trim()
      .isString()
      .withMessage("Provide a valid team logo path")
      .notEmpty(),
    check("upper_card_color")
      .trim()
      .isString()
      .withMessage("Provide a valid card color")
      .notEmpty(),
    check("lower_card_color")
      .trim()
      .isString()
      .withMessage("Provide a valid card color")
      .notEmpty(),
    check("team_members")
      .isArray()
      .withMessage("Team members list should be an array of values")
      .notEmpty(),
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
    const reqObj = req.body;
    const response = await createTeam_cntrl(reqObj);
    return res.status(response.statusCode).send(response);
  }
);

router.get(
  "/subscribeTeam/:teamId",
  [check("teamId").isString().withMessage("Team id is required").notEmpty()],
  authorizeToken,
  checkRoles([userRoles.user, userRoles.admin]),
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
    const user = req.decoded.data;
    const reqObj = { ...req.params, ...user };
    const response = await subscribeTeam_cntrl(reqObj);
    return res.status(response.statusCode).send(response);
  }
);
router.get(
  "/removeTeamSubscription/:teamId",
  [check("teamId").isString().withMessage("Team id is required").notEmpty()],
  authorizeToken,
  checkRoles([userRoles.user, userRoles.admin]),
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
    const user = req.decoded.data;
    const reqObj = { ...req.params, ...user };
    const response = await removeTeamSubscription(reqObj);
    return res.status(response.statusCode).send(response);
  }
);

router.put(
  "/manageNotificationPreference/:teamId",
  [
    check("teamId").isString().withMessage("Team id is required").notEmpty(),
    check("scoreUpdate")
      .isBoolean()
      .withMessage("Score Update should be a boolen value")
      .notEmpty(),
    check("teamMemberUpdate")
      .isBoolean()
      .withMessage("Team member remove should be a boolen value")
      .notEmpty(),
  ],
  authorizeToken,
  checkRoles([userRoles.user, userRoles.admin]),
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
    const user = req.decoded.data;
    const reqObj = { ...req.params, ...user, ...req.body };
    const response = await manageNotificationPreference_cntrl(reqObj);
    return res.status(response.statusCode).send(response);
  }
);
router.get(
  "/getAllTeamList",
  authorizeToken,
  checkRoles([userRoles.admin, userRoles.user]),
  async (req, res) => {
    const response = await getAllTeamList_cntrl();
    return res.status(response.statusCode).send(response);
  }
);
router.delete(
  "/removeTeam/:teamId",
  [check("teamId").isString().withMessage("Team id is required").notEmpty()],
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
    const reqObj = req.params;
    const response = await removeTeam_cntrl(reqObj);
    return res.status(response.statusCode).send(response);
  }
);
router.get("/getAllNotification", authorizeToken, async (req, res) => {
  const user = req.decoded.data;
  const response = await getAllNotification_cntrl(user);
  return res.status(response.statusCode).send(response);
});
module.exports = router;
