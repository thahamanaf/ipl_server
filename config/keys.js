module.exports = {
  mongoDbUri: process.env.MONGO_DB_URI,
  dbName: process.env.DB_NAME,
  jwtTokenExpiry: "1d",
  jwtSecret: process.env.JWT_SECRET
};
