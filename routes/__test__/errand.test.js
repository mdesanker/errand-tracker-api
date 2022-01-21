const app = require("./app");
const request = require("supertest");
const mongoose = require("mongoose");
const initializeMongoServer = require("../../config/mongoConfigTesting");
const seedDB = require("./seed");

// Global variables
let gregToken;
let grettaToken;
const gregUserId = "61e71828c9cb2005247017c7";
const grettaUserId = "61e7ec186394874272d11e67";
const invalidUserId = "0000000000cb200524701123";
const gregProjectId = "61e7dd93ecec03286743e04e";
const gregAndGrettaProjectId = "61e7dd93ecec03286743e04a";
const invalidProjectId = "00000093ecec03286743e04e";
const errandId = "61e71a80f0f8833ac7d52011";
const gregErrandId = "61e71a80f0f8833ac7d5201d";
const gregAndGrettaErrandId = "61e71a80f0f8833ac7d5201e";
const invalidErrandId = "00000080f0f8833ac7d5201d";

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

// Test
describe("POST /api/errand/test", () => {
  it("errand test route", async () => {
    const res = await request(app)
      .post("/api/errand/test")
      .send({ username: "Michael" });

    expect(res.statusCode).toEqual(201);
  });
});

////////////////////////////////////////
/* ERRAND POST ROUTES */
////////////////////////////////////////
describe("POST /api/errand/create", () => {
  it("create errand", async () => {
    const res = await request(app)
      .post("/api/errand/create")
      .set("x-auth-token", gregToken)
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
      .set("x-auth-token", gregToken)
      .send({});

    expect(res.statusCode).toEqual(400);
    expect(res.body).toHaveProperty("errors");
    expect(res.body.errors[0].msg).toEqual("Title is required");
  });
});

////////////////////////////////////////
/* ERRAND GET ROUTES */
////////////////////////////////////////
describe("GET /api/errand/all", () => {
  it("return all errands in db", async () => {
    const res = await request(app)
      .get("/api/errand/all")
      .set("x-auth-token", gregToken);

    expect(res.statusCode).toEqual(200);
    expect(res.body[0]).toHaveProperty("title");
    expect(res.body[0]).toHaveProperty("author");
  });
});

describe("GET /api/errand/:id", () => {
  it("return errand by id", async () => {
    const res = await request(app)
      .get(`/api/errand/${errandId}`)
      .set("x-auth-token", gregToken);

    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty("title");
    expect(res.body).toHaveProperty("author");
  });

  it("error finding errand id", async () => {
    const res = await request(app)
      .get(`/api/errand/${invalidErrandId}`)
      .set("x-auth-token", gregToken);

    expect(res.statusCode).toEqual(400);
    expect(res.body).toHaveProperty("errors");
    expect(res.body.errors[0].msg).toEqual("Invalid errand id");
  });
});

describe("GET /api/errand/user/:userid", () => {
  it("return errands for specific user", async () => {
    const res = await request(app)
      .get(`/api/errand/user/${gregUserId}`)
      .set("x-auth-token", gregToken);

    expect(res.statusCode).toEqual(200);
    expect(res.body[0]).toHaveProperty("title");
    expect(res.body[0]).toHaveProperty("author");
  });

  it("return error for invalid userid", async () => {
    const res = await request(app)
      .get(`/api/errand/user/${invalidUserId}`)
      .set("x-auth-token", gregToken);

    expect(res.statusCode).toEqual(400);
    expect(res.body).toHaveProperty("errors");
    expect(res.body.errors[0].msg).toEqual("Invalid user id");
  });
});

describe("GET /api/errand/project/:projectid", () => {
  it("return errands for specific project", async () => {
    const res = await request(app)
      .get(`/api/errand/project/${gregProjectId}`)
      .set("x-auth-token", gregToken);

    expect(res.statusCode).toEqual(200);
    expect(res.body[0]).toHaveProperty("title");
    expect(res.body[0]).toHaveProperty("author");
  });

  it("return error for invalid id", async () => {
    const res = await request(app)
      .get(`/api/errand/project/${invalidProjectId}`)
      .set("x-auth-token", gregToken);

    expect(res.statusCode).toEqual(400);
    expect(res.body).toHaveProperty("errors");
    expect(res.body.errors[0].msg).toEqual("Invalid project id");
  });
});

////////////////////////////////////////
/* ERRAND PUT ROUTES */
////////////////////////////////////////
describe("PUT /api/errand/:id/update", () => {
  it("author update specific errand", async () => {
    const newErrand = {
      title: "New title",
      description: "This is an updated description",
    };

    const res = await request(app)
      .put(`/api/errand/${gregErrandId}/update`)
      .set("x-auth-token", gregToken)
      .send(newErrand);

    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty("title");
    expect(res.body.title).toEqual("New title");
    expect(res.body).toHaveProperty("author");
    expect(res.body.description).toEqual("This is an updated description");
  });

  it("project member update errand", async () => {
    const newErrand = {
      title: "New title",
      description: "This is an updated description",
    };

    const res = await request(app)
      .put(`/api/errand/${gregAndGrettaErrandId}/update`)
      .set("x-auth-token", grettaToken)
      .send(newErrand);

    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty("title");
    expect(res.body.title).toEqual("New title");
    expect(res.body).toHaveProperty("author");
    expect(res.body.description).toEqual("This is an updated description");
  });

  it("error if user not author or project member", async () => {
    const newErrand = {
      title: "New title",
      description: "This is an updated description",
    };

    const res = await request(app)
      .put(`/api/errand/${errandId}/update`)
      .set("x-auth-token", grettaToken)
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
      .put(`/api/errand/${invalidErrandId}/update`)
      .set("x-auth-token", gregToken)
      .send(newErrand);

    expect(res.statusCode).toEqual(400);
    expect(res.body).toHaveProperty("errors");
    expect(res.body.errors[0].msg).toEqual("Invalid errand id");
  });
});

describe("PUT /api/errand/:id/toggle", () => {
  it("toggle isComplete to true if false", async () => {
    const res = await request(app)
      .put(`/api/errand/${gregErrandId}/toggle`)
      .set("x-auth-token", gregToken);

    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty("isComplete");
    expect(res.body.isComplete).toBe(true);
  });

  it("toggle isComplete to false if true", async () => {
    const res = await request(app)
      .put(`/api/errand/${gregErrandId}/toggle`)
      .set("x-auth-token", gregToken);

    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty("isComplete");
    expect(res.body.isComplete).toBe(false);
  });

  it("allow project member to toggle isComplete", async () => {
    const res = await request(app)
      .put(`/api/errand/${gregAndGrettaErrandId}/toggle`)
      .set("x-auth-token", grettaToken);

    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty("isComplete");
    expect(res.body.isComplete).toBe(true);
  });

  it("return error if not errand author", async () => {
    const res = await request(app)
      .put(`/api/errand/${errandId}/toggle`)
      .set("x-auth-token", grettaToken);

    expect(res.statusCode).toEqual(401);
    expect(res.body).toHaveProperty("errors");
    expect(res.body.errors[0].msg).toEqual("Invalid credentials");
  });

  it("return error if invalid errand id", async () => {
    const res = await request(app)
      .put(`/api/errand/${invalidErrandId}/toggle`)
      .set("x-auth-token", gregToken);

    expect(res.statusCode).toEqual(400);
    expect(res.body).toHaveProperty("errors");
    expect(res.body.errors[0].msg).toEqual("Invalid errand id");
  });
});

////////////////////////////////////////
/* ERRAND DELETE ROUTES */
////////////////////////////////////////
describe("DELETE /api/errand/:id/delete", () => {
  it("error if not errand author", async () => {
    const res = await request(app)
      .delete(`/api/errand/${gregErrandId}/delete`)
      .set("x-auth-token", grettaToken);

    expect(res.statusCode).toEqual(401);
    expect(res.body).toHaveProperty("errors");
    expect(res.body.errors[0].msg).toEqual("Invalid credentials");
  });

  it("delete errand by id", async () => {
    const res = await request(app)
      .delete(`/api/errand/${gregErrandId}/delete`)
      .set("x-auth-token", gregToken);

    // Find deleted errand should return error
    const findErrand = await request(app)
      .get(`/api/errand/${gregErrandId}`)
      .set("x-auth-token", gregToken);

    expect(res.statusCode).toEqual(200);
    expect(res.body.msg).toEqual("Errand deleted");
    expect(findErrand.statusCode).toEqual(400);
    expect(findErrand.body.errors[0].msg).toEqual("Invalid errand id");
  });

  it("allow project members to delete errand", async () => {
    const res = await request(app)
      .delete(`/api/errand/${gregAndGrettaErrandId}/delete`)
      .set("x-auth-token", grettaToken);

    // Find deleted errand should return error
    const findErrand = await request(app)
      .get(`/api/errand/${gregAndGrettaErrandId}`)
      .set("x-auth-token", grettaToken);

    expect(res.statusCode).toEqual(200);
    expect(res.body.msg).toEqual("Errand deleted");
    expect(findErrand.statusCode).toEqual(400);
    expect(findErrand.body.errors[0].msg).toEqual("Invalid errand id");
  });

  it("error if invalid errand id", async () => {
    const res = await request(app)
      .delete(`/api/errand/${invalidErrandId}/delete`)
      .set("x-auth-token", gregToken);

    expect(res.statusCode).toEqual(400);
    expect(res.body).toHaveProperty("errors");
    expect(res.body.errors[0].msg).toEqual("Invalid errand id");
  });
});
