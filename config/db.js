const keys = require("./keys");
// const mongoose = require("mongoose");
const { dbName, mongoDbUri } = keys;

const { MongoClient, ServerApiVersion } = require("mongodb");

const client = new MongoClient(mongoDbUri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server (optional starting in v4.7)
    await client.connect();
    // Send a ping to confirm a successful connection
    await client.db(dbName).command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    await client.close();
  }
}
run().catch(console.dir);

module.exports = client;
