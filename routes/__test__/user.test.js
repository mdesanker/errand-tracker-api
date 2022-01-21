const app = require("./app");
const request = require("supertest");
const mongoose = require("mongoose");
const initializeMongoServer = require("../../config/mongoConfigTesting");
const seedDB = require("./seed");

let gregToken;
let grettaToken;
const gregUserId = "61e71828c9cb2005247017c7";
const grettaUserId = "61e7ec186394874272d11e67";
const gregFriendUserId = "61e71828d0db200524701a24";
const invalidUserId = "0000000000cb200524701123";

////////////////////////////////////////
/* PREPARATION */
////////////////////////////////////////
beforeAll(async () => {
  await initializeMongoServer();
  await seedDB();

  // Generate token
  const gregLogin = await request(app).post("/api/user/login").send({
    email: "greg@example.com",
    password: "password",
  });
  gregToken = gregLogin.body.token;

  // Generate second token
  const grettaLogin = await request(app).post("/api/user/login").send({
    email: "gretta@example.net",
    password: "password",
  });
  grettaToken = grettaLogin.body.token;
});

afterAll(() => {
  // Close db connection so jest exits
  mongoose.connection.close();
});

// Test routes
describe("test user post route", () => {
  it("returns status 201 if username passed", async () => {
    const res = await request(app)
      .post("/api/user/test")
      .send({ username: "Michael" });

    expect(res.statusCode).toEqual(201);
  });

  it("returns status 400 if username missing", async () => {
    const res = await request(app).post("/api/user/test").send({});

    expect(res.statusCode).toEqual(400);
    expect(res.body).toEqual({ errors: [{ msg: "Username is required" }] });
  });
});

////////////////////////////////////////
/* USER REGISTRATION */
////////////////////////////////////////
describe("POST /api/user/register", () => {
  it("successful user creation", async () => {
    const user = {
      username: "JDoe",
      email: "jdoe@gmail.com",
      password: "password",
    };

    const res = await request(app).post("/api/user/register").send(user);

    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty("token");
    expect(res.body.token).toEqual(expect.anything());
  });

  it("missing input in user registration", async () => {
    const user = {
      email: "jdoe@gmail.com",
      password: "password",
    };

    const res = await request(app).post("/api/user/register").send(user);

    expect(res.statusCode).toEqual(400);
    expect(res.body).toHaveProperty("errors");
    expect(res.body.errors[0].msg).toEqual("Username is required");
  });

  it("user already exists with email", async () => {
    const user = {
      username: "Greg",
      email: "greg@example.com",
      password: "password",
    };

    const res = await request(app).post("/api/user/register").send(user);

    expect(res.statusCode).toEqual(400);
    expect(res.body).toHaveProperty("errors");
    expect(res.body.errors[0].msg).toEqual(
      "Email already associated with account"
    );
  });
});

////////////////////////////////////////
/* USER LOGIN */
////////////////////////////////////////
describe("POST /api/user/login", () => {
  it("successful login", async () => {
    const user = {
      email: "greg@example.com",
      password: "password",
    };

    const res = await request(app).post("/api/user/login").send(user);

    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty("token");
    expect(res.body.token).toEqual(expect.anything());
  });

  it("failed login - invalid credentials", async () => {
    const user = {
      email: "greg@example.com",
      password: "password1",
    };

    const res = await request(app).post("/api/user/login").send(user);

    expect(res.statusCode).toEqual(400);
    expect(res.body).toHaveProperty("errors");
    expect(res.body.errors[0].msg).toEqual("Invalid credentials");
  });

  it("failed login - email missing", async () => {
    const user = {
      password: "password1",
    };

    const res = await request(app).post("/api/user/login").send(user);

    expect(res.statusCode).toEqual(400);
    expect(res.body).toHaveProperty("errors");
    expect(res.body.errors[0].msg).toEqual("Email is required");
  });
});

////////////////////////////////////////
/* USER DETAIL ROUTE */
////////////////////////////////////////
describe("GET /api/user/detail", () => {
  it("return current user details", async () => {
    const res = await request(app)
      .get("/api/user/detail")
      .set("x-auth-token", gregToken);

    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty("username");
    expect(res.body.username).toEqual("Greg");
    expect(res.body).toHaveProperty("email");
    expect(res.body).not.toHaveProperty("password");
  });
});

describe("GET /api/user/:id", () => {
  it("return details for user id", async () => {
    const res = await request(app)
      .get(`/api/user/${grettaUserId}`)
      .set("x-auth-token", gregToken);

    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty("username");
    expect(res.body).toHaveProperty("email");
  });

  it("error for invalid user id", async () => {
    const res = await request(app)
      .get(`/api/user/${invalidUserId}`)
      .set("x-auth-token", gregToken);

    expect(res.statusCode).toEqual(400);
    expect(res.body).toHaveProperty("errors");
    expect(res.body.errors[0].msg).toEqual("Invalid user id");
  });
});

////////////////////////////////////////
/* USER FRIEND REQUEST ROUTES */
////////////////////////////////////////
describe("PUT /api/user/sendrequest/:id", () => {
  it("send friend request from user to id", async () => {
    const res = await request(app)
      .put(`/api/user/sendrequest/${grettaUserId}`)
      .set("x-auth-token", gregToken);

    // Check gretta friend requests
    const grettaRes = await request(app)
      .get(`/api/user/${grettaUserId}`)
      .set("x-auth-token", gregToken);

    expect(res.statusCode).toEqual(200);
    expect(grettaRes.statusCode).toEqual(200);
    expect(grettaRes.body).toHaveProperty("friendRequests");
    expect(grettaRes.body.friendRequests).toEqual(
      expect.arrayContaining([gregUserId])
    );
  });

  it("error for friend request already pending", async () => {
    const res = await request(app)
      .put(`/api/user/sendrequest/${grettaUserId}`)
      .set("x-auth-token", gregToken);

    // Check gretta friend requests
    const grettaRes = await request(app)
      .get(`/api/user/${grettaUserId}`)
      .set("x-auth-token", gregToken);

    expect(res.statusCode).toEqual(400);
    expect(res.body).toHaveProperty("errors");
    expect(res.body.errors[0].msg).toEqual("Friend request pending");
    expect(grettaRes.statusCode).toEqual(200);
    expect(grettaRes.body).toHaveProperty("friendRequests");
    expect(grettaRes.body.friendRequests).toEqual(
      expect.arrayContaining([gregUserId])
    );
  });

  it("error for already friended", async () => {
    const res = await request(app)
      .put(`/api/user/sendrequest/${gregFriendUserId}`)
      .set("x-auth-token", gregToken);

    // Check george friend list
    const gregFriendRes = await request(app)
      .get(`/api/user/${gregFriendUserId}`)
      .set("x-auth-token", gregToken);

    expect(res.statusCode).toEqual(400);
    expect(res.body).toHaveProperty("errors");
    expect(res.body.errors[0].msg).toEqual("User already friended");
    expect(gregFriendRes.statusCode).toEqual(200);
    expect(gregFriendRes.body).toHaveProperty("friends");
    expect(gregFriendRes.body.friends).toEqual(
      expect.arrayContaining([gregUserId])
    );
  });

  it("error for invalid user id", async () => {
    const res = await request(app)
      .put(`/api/user/sendrequest/${invalidUserId}`)
      .set("x-auth-token", gregToken);

    expect(res.statusCode).toEqual(400);
    expect(res.body).toHaveProperty("errors");
    expect(res.body.errors[0].msg).toEqual("Invalid user id");
  });
});

describe("PUT /api/user/acceptrequest/:id", () => {
  it("accept friend request for user id", async () => {
    // Gretta accepting friend request from greg
    const res = await request(app)
      .put(`/api/user/acceptrequest/${gregUserId}`)
      .set("x-auth-token", grettaToken);

    // Check greg friend list for gretta
    const gregRes = await request(app)
      .get(`/api/user/${gregUserId}`)
      .set("x-auth-token", gregToken);

    expect(res.statusCode).toEqual(200);
    expect(res.body.friends).toEqual(expect.arrayContaining([gregUserId]));
    expect(res.body.friendRequests).toEqual(
      expect.not.arrayContaining([gregUserId])
    );
    expect(gregRes.statusCode).toEqual(200);
    expect(gregRes.body.friends).toEqual(
      expect.arrayContaining([grettaUserId])
    );
  });

  it("return error if no friend request", async () => {
    // Gretta accepting friend request from greg
    const res = await request(app)
      .put(`/api/user/acceptrequest/${gregUserId}`)
      .set("x-auth-token", grettaToken);

    expect(res.statusCode).toEqual(400);
    expect(res.body).toHaveProperty("errors");
    expect(res.body.errors[0].msg).toEqual("Invalid friend request");
  });

  it("return error for incorrect user id", async () => {
    // Gretta accepting friend request from greg
    const res = await request(app)
      .put(`/api/user/acceptrequest/${invalidUserId}`)
      .set("x-auth-token", grettaToken);

    expect(res.statusCode).toEqual(400);
    expect(res.body).toHaveProperty("errors");
    expect(res.body.errors[0].msg).toEqual("Invalid user id");
  });
});

describe("PUT /api/user/unfriend/:id", () => {
  it("unfriend for both if one user triggers", async () => {
    // Gretta calls for unfriend
    const res = await request(app)
      .put(`/api/user/unfriend/${gregUserId}`)
      .set("x-auth-token", grettaToken);

    // Check gretta removed from greg friends
    const gregRes = await request(app)
      .get(`/api/user/${gregUserId}`)
      .set("x-auth-token", gregToken);

    expect(res.statusCode).toEqual(200);
    expect(res.body.friends).toEqual(expect.not.arrayContaining([gregUserId]));
    expect(gregRes.statusCode).toEqual(200);
    expect(gregRes.body.friends).toEqual(
      expect.not.arrayContaining([grettaUserId])
    );
  });

  it("no change for user id not friended", async () => {
    // Gretta calls for unfriend
    const res = await request(app)
      .put(`/api/user/unfriend/${gregUserId}`)
      .set("x-auth-token", grettaToken);

    // Check gretta removed from greg friends
    const gregRes = await request(app)
      .get(`/api/user/${gregUserId}`)
      .set("x-auth-token", gregToken);

    expect(res.statusCode).toEqual(200);
    expect(res.body.friends).toEqual(expect.not.arrayContaining([gregUserId]));
    expect(gregRes.statusCode).toEqual(200);
    expect(gregRes.body.friends).toEqual(
      expect.not.arrayContaining([grettaUserId])
    );
  });

  it("return error for invalid user id", async () => {
    const res = await request(app)
      .put(`/api/user/unfriend/${invalidUserId}`)
      .set("x-auth-token", grettaToken);

    expect(res.statusCode).toEqual(400);
    expect(res.body).toHaveProperty("errors");
    expect(res.body.errors[0].msg).toEqual("Invalid user id");
  });
});
