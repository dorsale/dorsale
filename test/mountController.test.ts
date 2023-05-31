import { expect } from "chai";
import { mountApp } from "../src/app";

describe("simple controller", () => {
  it("should respond to GET request", () =>
    mountApp({
      currentDir: process.cwd() + "/test/simple-controller",
    })
      .then((app) => {
        const server = app.server;
        return server.inject({
          method: "GET",
          url: "/test/3?m=2&p=1",
        });
      })
      .then((response) => {
        expect(response.statusCode).to.equal(200);
        expect(response.body).to.equal(JSON.stringify({ res: 7 }));
      }));
});
