import { mountApp } from "../src/app";
import { afterAll, beforeAll, describe, expect, it } from "bun:test";

describe("Two tier app", () => {
  let app;

  beforeAll(async () => {
    app = await mountApp({
      rootDir: process.cwd() + "/test/two-tier-app",
    });
  });

  afterAll(async () => {
    await app.server.stop();
  });

  it("should return all users", async () => {
    const request = new Request("http://localhost:3000/", {
      method: "GET",
    });
    const response = await app.server.fetch(request);

    expect(response.status).toEqual(200);
    expect(response.json()).resolves.toEqual([
      {
        id: "1",
        name: "John Doe",
        email: "john@doe.com",
        password: "123456",
      },
      {
        id: "2",
        name: "Jake Johnson",
        email: "jake@johnson.com",
        password: "543321",
      },
    ]);
  });
});
