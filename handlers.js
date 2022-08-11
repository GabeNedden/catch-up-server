const { MongoClient } = require("mongodb");

require("dotenv").config();
const MONGO_URI = process.env.MONGO_URI;

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

    res.send("You have arrived");
  } catch (err) {
    res.send(err);
  }
};

module.exports = {
  test,
};

// const test = async (req, res) => {
//     const client = new MongoClient(MONGO_URI, options);

//     try {
//       await client.connect();
//       const db = client.db("catchup");
//       console.log("connected");

//       res.send("You have arrived");
//     } catch (err) {
//       res.send(err);
//     } finally {
//       client.close();
//       console.log("disconnected");
//     }
//   };
