const { MongoClient } = require("mongodb");
const ObjectId = require("mongodb").ObjectId;
require("dotenv").config();

const { MONGO_URI } = process.env;
const options = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
};

const test = async (req, res) => {
  const client = new MongoClient(MONGO_URI, options);
  try {
    await client.connect();
    const db = client.db("catchup");
    console.log("connected");

    res.status(200).json({ status: 200, message: "You have arrived" });
  } catch (err) {
    res.status(500).json({ status: 500, error: err });
  } finally {
    client.close();
    console.log("disconnected");
  }
};

const getPosts = async (req, res) => {
  const client = new MongoClient(MONGO_URI, options);
  try {
    await client.connect();
    const db = client.db("catchup");
    console.log("connected");

    const response = await db.collection("posts").find().toArray();

    res.status(200).json({ status: 200, data: response });
  } catch (err) {
    res.status(500).json({ status: 500, error: err });
  } finally {
    client.close();
    console.log("disconnected");
  }
};

const getAuthUser = async (req, res) => {
  const client = new MongoClient(MONGO_URI, options);
  try {
    const { authid } = req.params;

    await client.connect();
    const db = client.db("catchup");
    console.log("connected");

    const query = { _id: ObjectId(authid) };

    const response = await db.collection("users").findOne(query);

    res.status(200).json({ status: 200, data: response });
  } catch (err) {
    res.status(500).json({ status: 500, error: err });
  } finally {
    client.close();
    console.log("disconnected");
  }
};

module.exports = {
  test,
  getAuthUser,
  getPosts,
};
