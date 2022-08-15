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
    console.log(err);
  } finally {
    await client.close();
    console.log("disconnected");
  }
};

const friendRequest = async (req, res) => {
  const client = new MongoClient(MONGO_URI, options);
  try {
    const { userId, username, targetUserId, targetUsername } = req.body;

    await client.connect();
    const db = client.db("catchup");
    console.log("connected");

    const userFilter = { _id: ObjectId(userId) };
    const userUpdate = {
      $push: {
        friends: {
          friendUsername: targetUsername,
          friendId: targetUserId,
          status: "pending",
          initiated: "true",
        },
      },
    };
    const userResponse = await db
      .collection("myusers")
      .updateOne(userFilter, userUpdate);

    const targetFilter = { _id: ObjectId(targetUserId) };
    const targetUpdate = {
      $push: {
        friends: {
          friendUsername: username,
          friendId: userId,
          status: "pending",
          initiated: "false",
        },
      },
    };
    const targetResponse = await db
      .collection("myusers")
      .updateOne(targetFilter, targetUpdate);

    userResponse.modifiedCount && targetResponse.modifiedCount
      ? res.status(200).json({
          status: 200,
          data: userResponse,
          message: "Friend request pending",
        })
      : res.status(500).json({ status: 500, message: "Something went wrong" });
  } catch (err) {
    console.log(err);
  } finally {
    await client.close();
    console.log("disconnected");
  }
};

const updateFriendRequest = async (req, res) => {
  const client = new MongoClient(MONGO_URI, options);
  try {
    const { userId, targetUserId, statusUpdate } = req.body;

    await client.connect();
    const db = client.db("catchup");
    console.log("connected");

    //update primary user
    const userFilter = {
      _id: ObjectId(userId),
      "friends.friendId": targetUserId,
    };
    const userUpdate = {
      $set: { "friends.$.status": statusUpdate },
    };
    const userResponse = await db
      .collection("myusers")
      .updateOne(userFilter, userUpdate);

    //update target user
    const targetFilter = {
      _id: ObjectId(targetUserId),
      "friends.friendId": userId,
    };
    const targetUpdate = {
      $set: { "friends.$.status": statusUpdate },
    };
    const targetResponse = await db
      .collection("myusers")
      .updateOne(targetFilter, targetUpdate);

    //return results

    userResponse.modifiedCount && targetResponse.modifiedCount
      ? res.status(200).json({
          status: 200,
          data: userResponse,
          message: `Friend request ${statusUpdate}`,
        })
      : res.status(500).json({ status: 500, message: "Something went wrong" });
  } catch (err) {
    console.log(err);
  } finally {
    await client.close();
    console.log("disconnected");
  }
};

const getAllUsers = async (req, res) => {
  const client = new MongoClient(MONGO_URI, options);
  try {
    await client.connect();
    const db = client.db("catchup");
    console.log("connected");

    const data = await db.collection("myusers").find().toArray();

    res.status(200).json({ status: 200, data: data });
  } catch (err) {
    console.log(err);
  } finally {
    await client.close();
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
    await client.close();
    console.log("disconnected");
  }
};

const getGroups = async (req, res) => {
  const client = new MongoClient(MONGO_URI, options);
  try {
    await client.connect();
    const db = client.db("catchup");
    console.log("connected");

    const response = await db.collection("groups").find().toArray();

    res.status(200).json({ status: 200, data: response });
  } catch (err) {
    res.status(500).json({ status: 500, error: err });
  } finally {
    await client.close();
    console.log("disconnected");
  }
};

const getAuthUser = async (req, res) => {
  const client = new MongoClient(MONGO_URI, options);
  try {
    const { id } = req.params;

    await client.connect();
    const db = client.db("catchup");
    console.log("connected");

    const query = { _id: ObjectId(id) };

    const response = await db.collection("myusers").findOne(query);

    res.status(200).json({ status: 200, data: response });
  } catch (err) {
    res.status(500).json({ status: 500, error: err });
  } finally {
    await client.close();
    console.log("disconnected");
  }
};

const login = async (req, res) => {
  const client = new MongoClient(MONGO_URI, options);
  try {
    await client.connect();
    const db = client.db("catchup");
    console.log("connected");

    const { user, isAuthenticated } = req.body;

    //stop if user is not authenticated
    if (!isAuthenticated) {
      res
        .status(505)
        .json({ status: 505, message: "You are not authenticated" });
    }

    //does the user doc exist in myusers collection?
    const userQuery = {
      authId: user.sub,
    };
    const myuser = await db.collection("myusers").findOne(userQuery);

    //if not, we create it
    if (myuser) {
      res
        .status(200)
        .json({ status: 200, data: myuser, message: "user information" });
    } else {
      //find username from auth doc
      const authQuery = {
        _id: ObjectId(user.sub.substring(6)),
      };
      const authUserDoc = await db.collection("users").findOne(authQuery);

      //prepare doc to be inserted
      const doc = {
        authId: user.sub,
        username: authUserDoc.username,
        circles: [],
      };

      //insert doc to myusercollection
      const insertedUser = await db.collection("myusers").insertOne(doc);

      //if successful, return new document.
      if (insertedUser) {
        const foundUser = await db.collection("myusers").findOne(userQuery);
        res.status(200).json({
          status: 200,
          message: "new document created",
          data: foundUser,
        });
      } else {
        res
          .status(505)
          .json({ status: 505, message: "failed to create user document" });
      }
    }
  } catch (err) {
    res.status(505).json({ status: 505, error: err });
  } finally {
    await client.close();
    console.log("disconnected");
  }
};

module.exports = {
  test,
  getAllUsers,
  getAuthUser,
  getGroups,
  getPosts,
  login,
  friendRequest,
  updateFriendRequest,
};
