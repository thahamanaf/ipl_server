const jwt = require("jsonwebtoken");
const User = require("../../models/user_account");
const client = require("../../config/db");
const keys = require("../../config/keys");
const bcrypt = require("bcrypt");
const collection = require("../../config/collection");

const generate_token = (user_data, exp) => {
  const token = jwt.sign(
    {
      data: user_data,
    },
    keys.jwtSecret,
    { expiresIn: exp || keys.jwtTokenExpiry }
  ); // default 15mins
  return token;
};

const hashPassword = async (password) => {
  const saltRounds = 10;
  const salt = await bcrypt.genSalt(saltRounds);
  const encryptedPassword = await bcrypt.hash(password, salt);
  return encryptedPassword;
};

const verifyEncryptedPassword = async (password, encryptedPassword) => {
  const isMatch = await bcrypt.compare(password, encryptedPassword);
  return isMatch;
};

const getUserByEmail_cntrl = async (email) => {
  const response = {
    status: false,
    statusCode: 400,
    message: "No data found",
    data: null,
  };
  try {
    await client.connect();
    const db = client.db(keys.dbName);
    const user = await db
      .collection(collection.userAccount)
      .findOne({ email: email });
    if (user) {
      response.status = true;
      response.statusCode = 200;
      response.message = "User found successfully";
      response.data = user;
    }
  } catch (err) {
    response.error = err?.message || "Internal Error";
  } finally {
    client.close();
  }
  return response;
};

const registerUser_cntrl = async (req) => {
  const response = {
    status: false,
    statusCode: 400,
    message: "Failed to register user",
  };
  try {
    await client.connect();
    const db = client.db(keys.dbName);
    const checkUserExists = await db
      .collection(collection.userAccount)
      .findOne({ email: req.email });
    if (checkUserExists) {
      // user with same email already exists
      response.message = "Email address aleady exists";
      return response;
    }

    const hashedPassword = await hashPassword(req.password);
    const user = new User({
      email: req.email,
      password: hashedPassword,
      fullname: req.fullname,
    });
    await db.collection(collection.userAccount).insertOne(user);
    response.status = true;
    response.statusCode = 200;
    response.message = "User created successfully";
  } catch (err) {
    response.error = err?.message || "Internal Error";
  } finally {
    client.close();
  }
  return response;
};
const login_cntrl = async (req) => {
  const response = {
    status: false,
    statusCode: 400,
    message: "Failed to register user",
  };
  try {
    await client.connect();
    const db = client.db(keys.dbName);
    const user = await db
      .collection(collection.userAccount)
      .findOne({ email: req.email });
    if (!user) {
      response.message = "User not exists";
      return response;
    }
    const verifyPassword = await verifyEncryptedPassword(
      req.password,
      user.password
    );
    if (!verifyPassword) {
      response.message = "Provide a valid password";
    }
    const token = generate_token(user);
    response.status = true;
    response.statusCode = 200;
    response.message = "User successfully logged in";
    response.data = user;
    response.token = token;
  } catch (err) {
    response.error = err?.message || "Internal Error";
  } finally {
    client.close();
  }
  return response;
};
module.exports = {
  registerUser_cntrl,
  login_cntrl,
  getUserByEmail_cntrl,
};
