"use strict";

// import the needed node_modules.
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
let port = process.env.PORT || 8001;

const {
  test,
  createComment,
  createPost,
  createGroup,
  friendRequest,
  getGroups,
  getPosts,
  getPublicPosts,
  getSharedPosts,
  getSharedAndPublic,
  getUserPosts,
  getAllUsers,
  getAuthUser,
  joinGroup,
  login,
  updateFriendRequest,
} = require("./handlers");

express()
  // Below are methods that are included in express(). We chain them for convenience.
  // --------------------------------------------------------------------------------
  .use(cors())
  .use(function (req, res, next) {
    res.header(
      "Access-Control-Allow-Methods",
      "OPTIONS, HEAD, GET, PUT, POST, DELETE",
      "Access-Control-Allow-Headers",
      "Origin, X-Requested-With, Content-Type, Accept"
    );
    next();
  })
  // This will give us will log more info to the console. see https://www.npmjs.com/package/morgan
  .use(morgan("tiny"))
  .use(express.json())

  // Any requests for static files will go into the public folder
  .use(express.static("public"))
  .use(express.json())
  .use(express.urlencoded({ extended: false }))
  .use("/", express.static(__dirname + "/"))

  .get("/", test)
  .get("/groups", getGroups)
  .get("/posts", getPosts)
  .get("/posts/:userId", getUserPosts)
  .get("/publicposts/", getPublicPosts)
  .get("/sharedposts/:userId", getSharedPosts)
  .get("/sharedpublicposts/:userId", getSharedAndPublic)
  .get("/users", getAllUsers)
  .get("/user/:id", getAuthUser)

  .post("/login/", login)
  .post("/friendrequest", friendRequest)
  .post("/updatefriend", updateFriendRequest)
  .post("/newcomment", createComment)
  .post("/newpost", createPost)
  .post("/newgroup", createGroup)

  .put("/joingroup", joinGroup)

  // this is our catch all endpoint.
  .get("*", (req, res) => {
    res.status(404).json({
      status: 404,
      message: "This is obviously not what you are looking for.",
    });
  })

  .listen(port, () => console.log(`Listening on port ${port}`));
