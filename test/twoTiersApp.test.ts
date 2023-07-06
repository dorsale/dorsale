import { mountApp } from "../src/app";
import { expect } from "chai";

describe("Two tiers app", () => {
  let app;

  before(() => {
    return mountApp({
      rootDir: process.cwd() + "/test/two-tiers-app",
    }).then((_app) => {
      app = _app;
    });
  });

  it("should return all users", async () => {
    const response = await app.server.inject({
      method: "GET",
      url: "/",
    });

    expect(response.statusCode).to.equal(200);
    expect(JSON.parse(response.body)).to.deep.equal([
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
