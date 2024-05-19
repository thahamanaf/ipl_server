const collection = require("../config/collection");
const client = require("../config/db");
const { dbName } = require("../config/keys");
const io = require("./socket");

async function setUpChangeStream() {
  try {
    await client.connect();
    const db = client.db(dbName);
    // const changeStream = db.watch();
    // changeStream.on("change", (event) => {
    //   console.log(event)
    // })
  } catch (err) {
    console.log(err, "ERROR FROM STREAM");
  } finally {
    // await client.close();
  }
}

module.exports = setUpChangeStream;
