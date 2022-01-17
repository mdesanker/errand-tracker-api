const app = require("./app");
const request = require("supertest");

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
