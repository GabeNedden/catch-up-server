const { MongoClient } = require("mongodb");

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

    res.send.json({ status: 200, message: "You have arrived" });
  } catch (err) {
    console.log(err);
  } finally {
    client.close();
    console.log("disconnected");
  }
};

module.exports = {
  test,
};
