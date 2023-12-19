import { mountApp } from "../src/app";
import { expect } from "chai";

describe("Validators controller", () => {
  let app: Awaited<ReturnType<typeof mountApp>>;

  before(async () => {
    app = await mountApp({
      rootDir: process.cwd() + "/test/controller-with-validators",
    });
  });

  it("should return 200 if body is valid", async () => {
    const response = await app.server.inject({
      method: "POST",
      url: "/test",
      payload: {
        name: "John Doe",
      },
    });

    expect(response.statusCode).to.equal(200);
    expect(JSON.parse(response.body)).to.deep.equal({
      message: "Hello John Doe",
    });
  });

  it("should return 400 if name is an object", async () => {
    const response = await app.server.inject({
      method: "POST",
      url: "/test",
      payload: {
        name: {},
      },
    });

    expect(response.statusCode).to.equal(400);
    expect(JSON.parse(response.body)).to.deep.contain({
      error: "Bad Request",
      message: "body/name must be string",
    });
  });

  it("should return 400 if name is missing", async () => {
    const response = await app.server.inject({
      method: "POST",
      url: "/test",
      payload: { bonjour: "au revoir" },
    });

    expect(response.statusCode).to.equal(400);
    expect(JSON.parse(response.body)).to.deep.contain({
      error: "Bad Request",
      message: "body must have required property 'name'",
    });
  });

  it("should return 400 if body is missing", async () => {
    const response = await app.server.inject({
      method: "POST",
      url: "/test",
    });

    expect(response.statusCode).to.equal(400);
    expect(JSON.parse(response.body)).to.deep.contain({
      error: "Bad Request",
      message: "body must be object",
    });
  });

  it("should return 415 if body is not an object", async () => {
    const response = await app.server.inject({
      method: "POST",
      url: "/test",
      payload: "hello",
    });

    expect(response.statusCode).to.equal(415);
    expect(JSON.parse(response.body)).to.deep.contain({
      error: "Unsupported Media Type",
      message: "Unsupported Media Type: undefined",
    });
  });

  it("should return 400 if name is an array", async () => {
    const response = await app.server.inject({
      method: "POST",
      url: "/test",
      payload: {
        name: ["John", "Doe"],
      },
    });

    expect(response.statusCode).to.equal(400);
    expect(JSON.parse(response.body)).to.deep.contain({
      error: "Bad Request",
      message: "body/name must be string",
    });
  });
});
