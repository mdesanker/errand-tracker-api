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
describe("POST /api/project/test", () => {
  it("errand test route", async () => {
    const res = await request(app)
      .post("/api/project/test")
      .send({ username: "Michael" });

    expect(res.statusCode).toEqual(201);
  });
});

// Project GET routes
describe("GET /api/project/all", () => {
  it("return all projects", async () => {
    const res = await request(app)
      .get("/api/project/all")
      .set("x-auth-token", token);

    expect(res.statusCode).toEqual(200);
    expect(res.body[0]).toHaveProperty("title");
    expect(res.body[0]).toHaveProperty("author");
  });
});

describe("GET /api/project/user/:userid", () => {
  it("return all projects for specific user", async () => {
    const res = await request(app)
      .get(`/api/project/user/${userid}`)
      .set("x-auth-token", token);

    expect(res.statusCode).toEqual(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it("return error for invalid user id", async () => {
    const res = await request(app)
      .get(`/api/project/user/${invalidUserid}`)
      .set("x-auth-token", token);

    expect(res.statusCode).toEqual(400);
    expect(res.body).toHaveProperty("errors");
    expect(res.body.errors[0].msg).toEqual("Invalid userid");
  });
});

describe("GET /api/project/:id", () => {
  it("return project by id", async () => {
    const res = await request(app)
      .get(`/api/project/${projectid}`)
      .set("x-auth-token", token);

    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty("title");
    expect(res.body.title).toEqual("Shopping List");
    expect(res.body).toHaveProperty("description");
  });

  it("return error if incorrect project id", async () => {
    const res = await request(app)
      .get(`/api/project/${invalidProjectid}`)
      .set("x-auth-token", token);

    expect(res.statusCode).toEqual(400);
    expect(res.body).toHaveProperty("errors");
    expect(res.body.errors[0].msg).toEqual("Invalid projectid");
  });
});

// Project POST routes
describe("POST /api/project/create", () => {
  it("return created project", async () => {
    const res = await request(app)
      .post("/api/project/create")
      .set("x-auth-token", token)
      .send({ title: "Project title" });

    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty("title");
    expect(res.body.title).toEqual("Project title");
    expect(res.body).toHaveProperty("author");
  });

  it("return error if no title", async () => {
    const res = await request(app)
      .post("/api/project/create")
      .set("x-auth-token", token)
      .send({});

    expect(res.statusCode).toEqual(400);
    expect(res.body).toHaveProperty("errors");
    expect(res.body.errors[0].msg).toEqual("Title is required");
  });
});

// Project PUT routes
describe("PUT /api/project/:id/update", () => {
  it("return updated project", async () => {
    const res = await request(app)
      .put(`/api/project/${projectid}/update`)
      .set("x-auth-token", token)
      .send({
        title: "Updated project title",
        description: "This project has a description",
      });

    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty("title");
    expect(res.body.title).toEqual("Updated project title");
    expect(res.body).toHaveProperty("description");
    expect(res.body.description).toEqual("This project has a description");
  });

  it("return error for invalid project id", async () => {
    const res = await request(app)
      .put(`/api/project/${invalidProjectid}/update`)
      .set("x-auth-token", token)
      .send({
        title: "Updated project title",
        description: "This project has a description",
      });

    expect(res.statusCode).toEqual(400);
    expect(res.body).toHaveProperty("errors");
    expect(res.body.errors[0].msg).toEqual("Invalid project id");
  });

  it("return error for user not author", async () => {
    const res = await request(app)
      .put(`/api/project/${projectid}/update`)
      .set("x-auth-token", secondToken)
      .send({
        title: "Updated project title",
        description: "This project has a description",
      });

    expect(res.statusCode).toEqual(401);
    expect(res.body).toHaveProperty("errors");
    expect(res.body.errors[0].msg).toEqual("Invalid credentials");
  });

  it("return error for no title", async () => {
    const res = await request(app)
      .put(`/api/project/${projectid}/update`)
      .set("x-auth-token", token)
      .send({
        description: "This project has a description",
      });

    expect(res.statusCode).toEqual(400);
    expect(res.body).toHaveProperty("errors");
    expect(res.body.errors[0].msg).toEqual("Title is required");
  });
});

describe("PUT /api/project/:id/addmember", () => {
  it("add member to project by id", async () => {
    const res = await request(app)
      .put(`/api/project/${projectid}/addmember`)
      .set("x-auth-token", token)
      .send({ userid: "61e7ec186394874272d11e67" });

    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty("members");
    expect(res.body.members).toEqual(
      expect.arrayContaining(["61e7ec186394874272d11e67"])
    );
  });

  it("return error for invalid project id", async () => {
    const res = await request(app)
      .put(`/api/project/${invalidProjectid}/addmember`)
      .set("x-auth-token", token)
      .send({ userid: "61e7ec186394874272d11e67" });

    expect(res.statusCode).toEqual(400);
    expect(res.body).toHaveProperty("errors");
    expect(res.body.errors[0].msg).toEqual("Invalid project id");
  });

  it("return error if invited user already a member", async () => {
    const res = await request(app)
      .put(`/api/project/${projectid}/addmember`)
      .set("x-auth-token", token)
      .send({ userid: "61e7ec186394874272d11e67" });

    expect(res.statusCode).toEqual(400);
    expect(res.body).toHaveProperty("errors");
    expect(res.body.errors[0].msg).toEqual("User already a member");
  });

  it("return error for if not project owner", async () => {
    const res = await request(app)
      .put(`/api/project/${projectid}/addmember`)
      .set("x-auth-token", secondToken)
      .send({ userid: "61e7ec186394874272d11e67" });

    expect(res.statusCode).toEqual(401);
    expect(res.body).toHaveProperty("errors");
    expect(res.body.errors[0].msg).toEqual("Invalid credentials");
  });
});

describe("PUT /api/project/:id/removemember", () => {
  it("remove member from project by id", async () => {
    const res = await request(app)
      .put(`/api/project/${projectid}/removemember`)
      .set("x-auth-token", token)
      .send({ userid: "61e7ec186394874272d11e67" });

    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty("members");
    expect(res.body.members).toEqual(
      expect.not.arrayContaining(["61e7ec186394874272d11e67"])
    );
  });

  it("return error for invalid project id", async () => {
    const res = await request(app)
      .put(`/api/project/${invalidProjectid}/removemember`)
      .set("x-auth-token", token)
      .send({ userid: "61e7ec186394874272d11e67" });

    expect(res.statusCode).toEqual(400);
    expect(res.body).toHaveProperty("errors");
    expect(res.body.errors[0].msg).toEqual("Invalid project id");
  });

  it("return error if userid not a member", async () => {
    const res = await request(app)
      .put(`/api/project/${projectid}/removemember`)
      .set("x-auth-token", token)
      .send({ userid: "61e7ec186394874272d11e67" });

    expect(res.statusCode).toEqual(400);
    expect(res.body).toHaveProperty("errors");
    expect(res.body.errors[0].msg).toEqual("Invalid user id");
  });

  it("return error for if not project owner", async () => {
    const res = await request(app)
      .put(`/api/project/${projectid}/removemember`)
      .set("x-auth-token", secondToken)
      .send({ userid: "61e7ec186394874272d11e67" });

    expect(res.statusCode).toEqual(401);
    expect(res.body).toHaveProperty("errors");
    expect(res.body.errors[0].msg).toEqual("Invalid credentials");
  });
});

describe("DELETE /api/project/:id/delete", () => {
  it("delete project by id", async () => {
    const res = await request(app)
      .delete(`/api/project/${projectid}/delete`)
      .set("x-auth-token", token);

    // Check for deleted project
    const findProject = await request(app)
      .get(`/app/project/${projectid}`)
      .set("x-auth-token", token);

    expect(res.statusCode).toEqual(200);
    expect(findProject.statusCode).toEqual(400);
    expect(findProject.body).toHaveProperty("errors");
    expect(findProject.body.errors[0].msg).toEqual("Invalid project id");
  });

  it("return error for invalid project id", async () => {
    const res = await request(app)
      .delete(`/api/project/${invalidProjectid}/delete`)
      .set("x-auth-token", token);

    expect(res.statusCode).toEqual(400);
    expect(res.body).toHaveProperty("errors");
    expect(res.body.errors[0].msg).toEqual("Invalid project id");
  });

  it("return error for invalid credentials", async () => {
    const res = await request(app)
      .delete(`/api/project/${projectid}/delete`)
      .set("x-auth-token", secondToken);

    // Check for deleted project
    const findProject = await request(app)
      .get(`/app/project/${projectid}`)
      .set("x-auth-token", secondToken);

    expect(res.statusCode).toEqual(400);
    expect(res.body).toHaveProperty("errors");
    expect(res.body.errors[0].msg).toEqual("Invalid credentials");
    expect(findProject.statusCode).toEqual(200);
  });
});
