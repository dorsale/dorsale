import {mountApp} from "../src/app";
import {expect} from "chai";

describe("Two tier app", () => {
  let app;

  before(async () => {
    app = await mountApp({
      rootDir: process.cwd() + "/test/two-tier-app",
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
