const app = require("./app");
const request = require("supertest");
const mongoose = require("mongoose");
const initializeMongoServer = require("../../config/mongoConfigTesting");
const seedDB = require("./seed");

let token;
let secondToken;
let userid = "61e71828c9cb2005247017c7";
let invalidUserid = "0000000000cb200524701123";
let projectid = "61e7dd93ecec03286743e04e";
let invalidProjectid = "00000093ecec03286743e04e";
let errandid = "61e71a80f0f8833ac7d5201d";
let invalidErrandid = "00000080f0f8833ac7d5201d";

beforeAll(async () => {
  await initializeMongoServer();
  await seedDB();

  // Generate token
  const login = await request(app).post("/api/user/login").send({
    email: "greg@example.com",
    password: "password",
  });
  token = login.body.token;

  // Generate second token
  const secondLogin = await request(app).post("/api/user/login").send({
    email: "gretta@example.net",
    password: "password",
  });
  secondToken = secondLogin.body.token;
});

afterAll(() => {
  // Close db connection so jest exits
  mongoose.connection.close();
});

// Errand test route
describe.skip("POST /api/errand/test", () => {
  it("errand test route", async () => {
    const res = await request(app)
      .post("/api/errand/test")
      .send({ username: "Michael" });

    expect(res.statusCode).toEqual(201);
  });
});

// Errand create
describe("POST /api/errand/create", () => {
  it("create errand", async () => {
    const res = await request(app)
      .post("/api/errand/create")
      .set("x-auth-token", token)
      .send({
        title: "Sample title",
      });

    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty("title");
    expect(res.body).toHaveProperty("author");
  });

  it("error creating errand missing required title", async () => {
    const res = await request(app)
      .post("/api/errand/create")
      .set("x-auth-token", token)
      .send({});

    expect(res.statusCode).toEqual(400);
    expect(res.body).toHaveProperty("errors");
    expect(res.body.errors[0].msg).toEqual("Title is required");
  });
});

// Errand reading
describe("GET /api/errand/all", () => {
  it("return all errands in db", async () => {
    const res = await request(app)
      .get("/api/errand/all")
      .set("x-auth-token", token);

    expect(res.statusCode).toEqual(200);
    expect(res.body[0]).toHaveProperty("title");
    expect(res.body[0]).toHaveProperty("author");
  });
});

describe("GET /api/errand/:id", () => {
  it("return errand by id", async () => {
    const res = await request(app)
      .get(`/api/errand/${errandid}`)
      .set("x-auth-token", token);

    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty("title");
    expect(res.body).toHaveProperty("author");
  });

  it("return errand by id", async () => {
    const res = await request(app)
      .get(`/api/errand/${invalidErrandid}`)
      .set("x-auth-token", token);

    expect(res.statusCode).toEqual(400);
    expect(res.body).toHaveProperty("errors");
    expect(res.body.errors[0].msg).toHaveProperty("Invalid errandid");
  });
});

describe("GET /api/errand/user/:userid", () => {
  it("return errands for specific user", async () => {
    const res = await request(app)
      .get(`/api/errand/user/${userid}`)
      .set("x-auth-token", token);

    expect(res.statusCode).toEqual(200);
    expect(res.body[0]).toHaveProperty("title");
    expect(res.body[0]).toHaveProperty("author");
  });

  it("return error for invalid userid", async () => {
    const res = await request(app)
      .get(`/api/errand/user/${invalidUserid}`)
      .set("x-auth-token", token);

    expect(res.statusCode).toEqual(400);
    expect(res.body).toHaveProperty("errors");
    expect(res.body.errors[0].msg).toEqual("Invalid userid");
  });
});

describe("GET /api/errand/project/:projectid", () => {
  it("return errands for specific project", async () => {
    const res = await request(app)
      .get(`/api/errand/project/${projectid}`)
      .set("x-auth-token", token);

    expect(res.statusCode).toEqual(200);
    expect(res.body[0]).toHaveProperty("title");
    expect(res.body[0]).toHaveProperty("author");
  });

  it("return error for invalid id", async () => {
    const res = await request(app)
      .get(`/api/errand/project/${invalidProjectid}`)
      .set("x-auth-token", token);

    expect(res.statusCode).toEqual(400);
    expect(res.body).toHaveProperty("errors");
    expect(res.body.errors[0].msg).toEqual("Invalid projectid");
  });
});

describe("PUT /api/errand/:id/update", () => {
  it("update title and description for specific errand", async () => {
    const newErrand = {
      title: "New title",
      description: "This is an updated description",
    };

    const res = await request(app)
      .put(`/api/errand/${errandid}/update`)
      .set("x-auth-token", token)
      .send(newErrand);

    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty("title");
    expect(res.body.title).toEqual("New title");
    expect(res.body).toHaveProperty("author");
    expect(res.body.description).toEqual("This is an updated description");
  });

  it("error if user not author of errand", async () => {
    const newErrand = {
      title: "New title",
      description: "This is an updated description",
    };

    const res = await request(app)
      .put(`/api/errand/${errandid}/update`)
      .set("x-auth-token", secondToken)
      .send(newErrand);

    expect(res.statusCode).toEqual(401);
    expect(res.body).toHaveProperty("errors");
    expect(res.body.errors[0].msg).toEqual("Invalid credentials");
  });

  it("error if errand not found", async () => {
    const newErrand = {
      title: "New title",
      description: "This is an updated description",
    };

    const res = await request(app)
      .put(`/api/errand/${invalidErrandid}/update`)
      .set("x-auth-token", token)
      .send(newErrand);

    expect(res.statusCode).toEqual(400);
    expect(res.body).toHaveProperty("errors");
    expect(res.body.errors[0].msg).toEqual("Invalid errandid");
  });
});
