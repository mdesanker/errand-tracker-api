const app = require("./app");
const request = require("supertest");
const mongoose = require("mongoose");
const initializeMongoServer = require("../../config/mongoConfigTesting");
const seedDB = require("./seed");

// Global variables
let token;
let secondToken;
let userid = "61e71828c9cb2005247017c7";
let invalidUserid = "0000000000cb200524701123";
let projectid = "61e7dd93ecec03286743e04e";
let invalidProjectid = "00000093ecec03286743e04e";
let errandid = "61e71a80f0f8833ac7d5201d";
let invalidErrandid = "00000080f0f8833ac7d5201d";

// Test preparations
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

// Test
describe.skip("POST /api/errand/test", () => {
  it("errand test route", async () => {
    const res = await request(app)
      .post("/api/errand/test")
      .send({ username: "Michael" });

    expect(res.statusCode).toEqual(201);
  });
});

// Errand POST routes
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

// Errand GET routes
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
    expect(res.body.errors[0].msg).toEqual("Invalid errandid");
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

// Errand PUT routes
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

describe("PUT /api/errand/:id/toggle", () => {
  it("set isComplete to true on specific errand", async () => {
    const res = await request(app)
      .put(`/api/errand/${errandid}/toggle`)
      .set("x-auth-token", token);

    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty("isComplete");
    expect(res.body.isComplete).toBe(true);
  });

  it("return error if not errand author", async () => {
    const res = await request(app)
      .put(`/api/errand/${errandid}/toggle`)
      .set("x-auth-token", secondToken);

    expect(res.statusCode).toEqual(401);
    expect(res.body).toHaveProperty("errors");
    expect(res.body.errors[0].msg).toEqual("Invalid credentials");
  });

  it("return error if invalid errand id", async () => {
    const res = await request(app)
      .put(`/api/errand/${invalidErrandid}/toggle`)
      .set("x-auth-token", token);

    expect(res.statusCode).toEqual(400);
    expect(res.body).toHaveProperty("errors");
    expect(res.body.errors[0].msg).toEqual("Invalid errandid");
  });
});

// Errand DELETE routes
describe("DELETE /api/errand/:id/delete", () => {
  it("error if not errand author", async () => {
    const res = await request(app)
      .delete(`/api/errand/${errandid}/delete`)
      .set("x-auth-token", secondToken);

    expect(res.statusCode).toEqual(401);
    expect(res.body).toHaveProperty("errors");
    expect(res.body.errors[0].msg).toEqual("Invalid credentials");
  });

  it("delete errand by id", async () => {
    const res = await request(app)
      .delete(`/api/errand/${errandid}/delete`)
      .set("x-auth-token", token);

    // Find deleted errand should return error
    const findErrand = await request(app)
      .get(`/api/errand/${errandid}`)
      .set("x-auth-token", token);

    expect(res.statusCode).toEqual(200);
    expect(res.body.msg).toEqual("Errand deleted");
    expect(findErrand.statusCode).toEqual(400);
    expect(findErrand.body.errors[0].msg).toEqual("Invalid errandid");
  });

  it("error if invalid errand id", async () => {
    const res = await request(app)
      .delete(`/api/errand/${invalidErrandid}/delete`)
      .set("x-auth-token", token);

    expect(res.statusCode).toEqual(400);
    expect(res.body).toHaveProperty("errors");
    expect(res.body.errors[0].msg).toEqual("Invalid errandid");
  });
});
