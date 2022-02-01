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
const gregFriendUserId = "61e71828d0db200524701a24";
const invalidUserId = "0000000000cb200524701123";
const gregProjectId = "61e7dd93ecec03286743e04e";
const gregGrettaProjectId = "61e7dd93ecec03286743e04a";
const invalidProjectId = "00000093ecec03286743e04e";
const errandId = "61e71a80f0f8833ac7d5201d";

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
describe("POST /api/project/test", () => {
  it("errand test route", async () => {
    const res = await request(app)
      .post("/api/project/test")
      .send({ username: "Michael" });

    expect(res.statusCode).toEqual(201);
  });
});

////////////////////////////////////////
/* PROJECT GET ROUTES */
////////////////////////////////////////
describe("GET /api/project/all", () => {
  it("return all projects", async () => {
    const res = await request(app)
      .get("/api/project/all")
      .set("x-auth-token", gregToken);

    expect(res.statusCode).toEqual(200);
    expect(res.body[0]).toHaveProperty("title");
    expect(res.body[0]).toHaveProperty("author");
  });
});

describe("GET /api/project/author/:userid", () => {
  it("return all projects for specific user", async () => {
    const res = await request(app)
      .get(`/api/project/author/${gregUserId}`)
      .set("x-auth-token", gregToken);

    expect(res.statusCode).toEqual(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it("return error for invalid user id", async () => {
    const res = await request(app)
      .get(`/api/project/author/${invalidUserId}`)
      .set("x-auth-token", gregToken);

    expect(res.statusCode).toEqual(400);
    expect(res.body).toHaveProperty("errors");
    expect(res.body.errors[0].msg).toEqual("Invalid user id");
  });
});

describe("GET /api/project/member/:id", () => {
  it("return all projects user is a member of", async () => {
    const res = await request(app)
      .get(`/api/project/member/${grettaUserId}`)
      .set("x-auth-token", grettaToken);

    expect(res.statusCode).toEqual(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body[0]._id).toEqual("61e7dd93ecec03286743e04a");
  });

  it("return error for invalid user id", async () => {
    const res = await request(app)
      .get(`/api/project/member/${invalidUserId}`)
      .set("x-auth-token", grettaToken);

    expect(res.statusCode).toEqual(400);
    expect(res.body).toHaveProperty("errors");
    expect(res.body.errors[0].msg).toEqual("Invalid user id");
  });
});

describe("GET /api/project/:id", () => {
  it("return project by id", async () => {
    const res = await request(app)
      .get(`/api/project/${gregProjectId}`)
      .set("x-auth-token", gregToken);

    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty("title");
    expect(res.body.title).toEqual("Solo project");
  });

  it("return error if incorrect project id", async () => {
    const res = await request(app)
      .get(`/api/project/${invalidProjectId}`)
      .set("x-auth-token", gregToken);

    expect(res.statusCode).toEqual(400);
    expect(res.body).toHaveProperty("errors");
    expect(res.body.errors[0].msg).toEqual("Invalid project id");
  });
});

////////////////////////////////////////
/* PROJECT POST ROUTES */
////////////////////////////////////////
describe("POST /api/project/create", () => {
  it("return created project", async () => {
    const res = await request(app)
      .post("/api/project/create")
      .set("x-auth-token", gregToken)
      .send({ title: "Project title" });

    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty("title");
    expect(res.body.title).toEqual("Project title");
    expect(res.body).toHaveProperty("author");
    expect(res.body).toHaveProperty("members");
  });

  it("create project with members", async () => {
    const res = await request(app)
      .post("/api/project/create")
      .set("x-auth-token", gregToken)
      .send({ title: "Project title", members: [grettaUserId] });

    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty("title");
    expect(res.body.title).toEqual("Project title");
    expect(res.body).toHaveProperty("author");
    expect(res.body).toHaveProperty("members");
    expect(res.body.members[0]._id).toEqual(grettaUserId);
  });

  it("return error for invalid member id", async () => {
    const res = await request(app)
      .post("/api/project/create")
      .set("x-auth-token", gregToken)
      .send({ title: "Project title", members: [invalidUserId] });

    expect(res.statusCode).toEqual(400);
    expect(res.body).toHaveProperty("errors");
    expect(res.body.errors[0].msg).toEqual("One or more member ids invalid");
  });

  it("return error if no title", async () => {
    const res = await request(app)
      .post("/api/project/create")
      .set("x-auth-token", gregToken)
      .send({});

    expect(res.statusCode).toEqual(400);
    expect(res.body).toHaveProperty("errors");
    expect(res.body.errors[0].msg).toEqual("Title is required");
  });
});

////////////////////////////////////////
/* PROJECT PUT ROUTES */
////////////////////////////////////////
describe("PUT /api/project/:id/update", () => {
  it("return updated project", async () => {
    const res = await request(app)
      .put(`/api/project/${gregProjectId}/update`)
      .set("x-auth-token", gregToken)
      .send({
        title: "Updated project title",
        members: [],
      });

    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty("title");
    expect(res.body.title).toEqual("Updated project title");
  });

  it("add member to project", async () => {
    const res = await request(app)
      .put(`/api/project/${gregProjectId}/update`)
      .set("x-auth-token", gregToken)
      .send({
        title: "Updated project title",
        members: [grettaUserId],
      });

    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty("title");
    expect(res.body.title).toEqual("Updated project title");
    expect(res.body).toHaveProperty("members");
    expect(res.body.members[0]._id).toEqual(grettaUserId);
  });

  it("error if invalid member id", async () => {
    const res = await request(app)
      .put(`/api/project/${gregProjectId}/update`)
      .set("x-auth-token", gregToken)
      .send({
        title: "Updated project title",
        members: [invalidUserId],
      });

    expect(res.statusCode).toEqual(400);
    expect(res.body).toHaveProperty("errors");
    expect(res.body.errors[0].msg).toEqual("One or more member ids invalid");
  });

  it("return error for invalid project id", async () => {
    const res = await request(app)
      .put(`/api/project/${invalidProjectId}/update`)
      .set("x-auth-token", gregToken)
      .send({
        title: "Updated project title",
        members: [],
      });

    expect(res.statusCode).toEqual(400);
    expect(res.body).toHaveProperty("errors");
    expect(res.body.errors[0].msg).toEqual("Invalid project id");
  });

  it("return error for user not author", async () => {
    const res = await request(app)
      .put(`/api/project/${gregProjectId}/update`)
      .set("x-auth-token", grettaToken)
      .send({
        title: "Updated project title",
        members: [],
      });

    expect(res.statusCode).toEqual(401);
    expect(res.body).toHaveProperty("errors");
    expect(res.body.errors[0].msg).toEqual("Invalid credentials");
  });

  it("return error for no title", async () => {
    const res = await request(app)
      .put(`/api/project/${gregProjectId}/update`)
      .set("x-auth-token", gregToken)
      .send({
        members: [],
      });

    expect(res.statusCode).toEqual(400);
    expect(res.body).toHaveProperty("errors");
    expect(res.body.errors[0].msg).toEqual("Title is required");
  });
});

describe("PUT /api/project/:id/removeself", () => {
  it("user remove themselves as member from project", async () => {
    const res = await request(app)
      .put(`/api/project/${gregGrettaProjectId}/removeself`)
      .set("x-auth-token", grettaToken);

    // Check gretta no longer project member
    const projectRes = await request(app)
      .get(`/api/project/${gregGrettaProjectId}`)
      .set("x-auth-token", gregToken);

    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty("msg");
    expect(res.body.msg).toEqual("Removed from project");

    expect(projectRes.statusCode).toEqual(200);
    expect(projectRes.body).toHaveProperty("members");
    expect(projectRes.body.members).toEqual(
      expect.not.arrayContaining([grettaUserId])
    );
  });

  it("return error if not project member", async () => {
    const res = await request(app)
      .put(`/api/project/${gregGrettaProjectId}/removeself`)
      .set("x-auth-token", grettaToken);

    expect(res.statusCode).toEqual(401);
    expect(res.body).toHaveProperty("errors");
    expect(res.body.errors[0].msg).toEqual("User not project member");
  });

  it("return error if invalid project id", async () => {
    const res = await request(app)
      .put(`/api/project/${invalidProjectId}/removeself`)
      .set("x-auth-token", grettaToken);

    expect(res.statusCode).toEqual(400);
    expect(res.body).toHaveProperty("errors");
    expect(res.body.errors[0].msg).toEqual("Invalid project id");
  });
});

describe.skip("PUT /api/project/:id/addmember", () => {
  it("add member to project by id", async () => {
    const res = await request(app)
      .put(`/api/project/${gregProjectId}/addmember`)
      .set("x-auth-token", gregToken)
      .send({ userid: "61e7ec186394874272d11e67" });

    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty("members");
    expect(res.body.members).toEqual(
      expect.arrayContaining(["61e7ec186394874272d11e67"])
    );
  });

  it("return error for invalid project id", async () => {
    const res = await request(app)
      .put(`/api/project/${invalidProjectId}/addmember`)
      .set("x-auth-token", gregToken)
      .send({ userid: "61e7ec186394874272d11e67" });

    expect(res.statusCode).toEqual(400);
    expect(res.body).toHaveProperty("errors");
    expect(res.body.errors[0].msg).toEqual("Invalid project id");
  });

  it("return error if invited user already a member", async () => {
    const res = await request(app)
      .put(`/api/project/${gregProjectId}/addmember`)
      .set("x-auth-token", gregToken)
      .send({ userid: "61e7ec186394874272d11e67" });

    expect(res.statusCode).toEqual(400);
    expect(res.body).toHaveProperty("errors");
    expect(res.body.errors[0].msg).toEqual("User already a member");
  });

  it("return error for if not project owner", async () => {
    const res = await request(app)
      .put(`/api/project/${gregProjectId}/addmember`)
      .set("x-auth-token", grettaToken)
      .send({ userid: "61e7ec186394874272d11e67" });

    expect(res.statusCode).toEqual(401);
    expect(res.body).toHaveProperty("errors");
    expect(res.body.errors[0].msg).toEqual("Invalid credentials");
  });
});

describe.skip("PUT /api/project/:id/removemember", () => {
  it("remove member from project by id", async () => {
    const res = await request(app)
      .put(`/api/project/${gregProjectId}/removemember`)
      .set("x-auth-token", gregToken)
      .send({ userid: "61e7ec186394874272d11e67" });

    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty("members");
    expect(res.body.members).toEqual(
      expect.not.arrayContaining(["61e7ec186394874272d11e67"])
    );
  });

  it("return error for invalid project id", async () => {
    const res = await request(app)
      .put(`/api/project/${invalidProjectId}/removemember`)
      .set("x-auth-token", gregToken)
      .send({ userid: "61e7ec186394874272d11e67" });

    expect(res.statusCode).toEqual(400);
    expect(res.body).toHaveProperty("errors");
    expect(res.body.errors[0].msg).toEqual("Invalid project id");
  });

  it("return error if userid not a member", async () => {
    const res = await request(app)
      .put(`/api/project/${gregProjectId}/removemember`)
      .set("x-auth-token", gregToken)
      .send({ userid: "61e7ec186394874272d11e67" });

    expect(res.statusCode).toEqual(400);
    expect(res.body).toHaveProperty("errors");
    expect(res.body.errors[0].msg).toEqual("Invalid user id");
  });

  it("return error for if not project owner", async () => {
    const res = await request(app)
      .put(`/api/project/${gregProjectId}/removemember`)
      .set("x-auth-token", grettaToken)
      .send({ userid: "61e7ec186394874272d11e67" });

    expect(res.statusCode).toEqual(401);
    expect(res.body).toHaveProperty("errors");
    expect(res.body.errors[0].msg).toEqual("Invalid credentials");
  });
});

describe("DELETE /api/project/:id/delete", () => {
  it("return error for invalid credentials", async () => {
    const res = await request(app)
      .delete(`/api/project/${gregProjectId}/delete`)
      .set("x-auth-token", grettaToken);

    // Check for deleted project
    const findProject = await request(app)
      .get(`/api/project/${gregProjectId}`)
      .set("x-auth-token", grettaToken);

    expect(res.statusCode).toEqual(401);
    expect(res.body).toHaveProperty("errors");
    expect(res.body.errors[0].msg).toEqual("Invalid credentials");
    expect(findProject.statusCode).toEqual(200);
  });

  it("return error for invalid project id", async () => {
    const res = await request(app)
      .delete(`/api/project/${invalidProjectId}/delete`)
      .set("x-auth-token", gregToken);

    expect(res.statusCode).toEqual(400);
    expect(res.body).toHaveProperty("errors");
    expect(res.body.errors[0].msg).toEqual("Invalid project id");
  });

  it("delete project by id", async () => {
    const res = await request(app)
      .delete(`/api/project/${gregProjectId}/delete`)
      .set("x-auth-token", gregToken);

    // Check for deleted project
    const findProject = await request(app)
      .get(`/api/project/${gregProjectId}`)
      .set("x-auth-token", gregToken);

    // Check project errands deleted
    const findErrands = await request(app)
      .get(`/api/errand/${errandId}`)
      .set("x-auth-token", gregToken);

    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty("msg");
    expect(res.body.msg).toEqual("Project deleted");
    expect(findProject.statusCode).toEqual(400);
    expect(findProject.body).toHaveProperty("errors");
    expect(findProject.body.errors[0].msg).toEqual("Invalid project id");
    expect(findErrands.statusCode).toEqual(400);
    expect(findErrands.body).toHaveProperty("errors");
    expect(findErrands.body.errors[0].msg).toEqual("Invalid errand id");
  });
});
