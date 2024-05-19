const express = require("express");
const { check, validationResult } = require("express-validator");
const router = express.Router();

const {
  registerUser_cntrl,
  login_cntrl,
  getUserByEmail_cntrl,
} = require("./auth_controller");
const { authorizeToken } = require("../../utils/auth_util");

router.get("/test", (req, res) => {
  res.send("auth route okay");
});
router.post(
  "/register",
  [
    check("email")
      .trim()
      .isEmail()
      .withMessage("Provide a valid email adress")
      .notEmpty(),
    check("fullname")
      .trim()
      .isString()
      .withMessage("Provide a valid full name"),
    check("password")
      .isString()
      .withMessage("Please provide a valid password")
      .not()
      .isEmpty()
      .withMessage("Please provide valid password")
      .matches(/^[A-Za-z0-9 .,'!&+$!@#%^*()]/),
  ],
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
    const response = await registerUser_cntrl(reqObj);
    return res.status(response.statusCode).send(response);
  }
);

router.post(
  "/login",
  [
    check("email")
      .trim()
      .isEmail()
      .withMessage("Provide a valid email adress")
      .notEmpty(),
    check("password")
      .isString()
      .withMessage("Please provide a valid password")
      .not()
      .isEmpty()
      .withMessage("Please provide valid password"),
  ],
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
    const response = await login_cntrl(reqObj);
    return res.status(response.statusCode).send(response);
  }
);

router.get("/getUserByAuth", authorizeToken, async (req, res) => {
  const user = req.decoded.data;
  const response = await getUserByEmail_cntrl(user.email);
  try {
    return res.status(response.statusCode).send(response);
  } catch (error) {
    return res.status(400).send({
      status: false,
      statusCode: 400,
      message: "Failed to verify user",
    });
  }
});

module.exports = router;
