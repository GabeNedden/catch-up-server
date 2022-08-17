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

const createPost = async (req, res) => {
  const client = new MongoClient(MONGO_URI, options);

  try {
    const {
      userId,
      username,
      location,
      sharedWith,
      title,
      body,
      public,
      startTime,
      endTime,
      now,
      category,
    } = req.body;

    await client.connect();
    const db = client.db("catchup");
    console.log("connected");

    const start = now ? new Date() : startTime;

    const doc = {
      owner: userId,
      location: location,
      username: username,
      title: title,
      body: body,
      public: public,
      startTime: start,
      endTime: endTime,
      sharedWith: sharedWith,
      category,
    };

    const newPost = await db.collection("posts").insertOne(doc);

    newPost
      ? res.status(200).json({ status: 200, data: newPost })
      : res
          .status(500)
          .json({ status: 500, message: "An unknown error occured" });
  } catch (err) {
    console.log(err);
  } finally {
    await client.close();
    console.log("disconnected");
  }
};

const createGroup = async (req, res) => {
  const client = new MongoClient(MONGO_URI, options);

  try {
    const { admins, groupName, members, userId, username } = req.body;

    await client.connect();
    const db = client.db("catchup");
    console.log("connected");

    const doc = {
      name: groupName,
      members: [{ id: userId, username: username }, ...members],
      admins: [{ id: userId, username: username }, ...admins],
    };

    const newGroup = await db.collection("groups").insertOne(doc);

    newGroup
      ? res.status(200).json({ status: 200, data: newGroup })
      : res
          .status(500)
          .json({ status: 500, message: "An unknown error occured" });
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
          status: "Pending",
          initiated: true,
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
          status: "Pending",
          initiated: false,
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

const getUserPosts = async (req, res) => {
  const client = new MongoClient(MONGO_URI, options);

  const { userId } = req.params;
  try {
    await client.connect();
    const db = client.db("catchup");
    console.log("connected");

    const query = { owner: userId };

    const response = await db.collection("posts").find(query).toArray();

    res.status(200).json({ status: 200, data: response });
  } catch (err) {
    res.status(500).json({ status: 500, error: err });
  } finally {
    await client.close();
    console.log("disconnected");
  }
};

const getPublicPosts = async (req, res) => {
  const client = new MongoClient(MONGO_URI, options);

  try {
    await client.connect();
    const db = client.db("catchup");
    console.log("connected");

    const response = await db
      .collection("posts")
      .find({ public: true })
      .toArray();

    console.log(response);

    response
      ? res.status(200).json({ status: 200, data: response })
      : res.status(404).json({ status: 404, message: "Posts not found" });
  } catch (err) {
    res.status(500).json({ status: 500, error: err });
  } finally {
    await client.close();
    console.log("disconnected");
  }
};

const getSharedPosts = async (req, res) => {
  const client = new MongoClient(MONGO_URI, options);

  const { userId } = req.params;

  try {
    await client.connect();
    const db = client.db("catchup");
    console.log("connected");

    const query = { sharedWith: userId };

    const response = await db.collection("posts").find(query).toArray();

    console.log(response);

    response
      ? res.status(200).json({ status: 200, data: response })
      : res.status(404).json({ status: 404, message: "Posts not found" });
  } catch (err) {
    res.status(500).json({ status: 500, error: err });
  } finally {
    await client.close();
    console.log("disconnected");
  }
};

const getSharedAndPublic = async (req, res) => {
  const client = new MongoClient(MONGO_URI, options);

  const { userId } = req.params;

  try {
    await client.connect();
    const db = client.db("catchup");
    console.log("connected");

    const query = { $or: [{ sharedWith: userId }, { public: true }] };

    const response = await db.collection("posts").find(query).toArray();

    console.log(response);

    response
      ? res.status(200).json({ status: 200, data: response.reverse() })
      : res.status(404).json({ status: 404, message: "Posts not found" });
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

const joinGroup = async (req, res) => {
  const client = new MongoClient(MONGO_URI, options);
  try {
    const { groupId, userId, username } = req.body;

    await client.connect();
    const db = client.db("catchup");
    console.log("connected");

    const filter = {
      _id: ObjectId(groupId),
    };

    const updateDoc = {
      $push: {
        members: { id: userId, username: username },
      },
    };

    const response = await db.collection("groups").updateOne(filter, updateDoc);

    res.status(200).json({ status: 200, data: response });
  } catch (err) {
    res.status(500).json({ status: 500, error: err });
  } finally {
    await client.close();
    console.log("disconnected");
  }
};

module.exports = {
  test,
  createPost,
  createGroup,
  getAllUsers,
  getAuthUser,
  getGroups,
  getPosts,
  getSharedPosts,
  getPublicPosts,
  getSharedAndPublic,
  getUserPosts,
  joinGroup,
  login,
  friendRequest,
  updateFriendRequest,
};
