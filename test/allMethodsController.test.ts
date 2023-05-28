import { before } from "mocha";
import { mountApp } from "../src/app";
import { AllMethodsController } from "./all-methods-controller/allMethodsController";
import { expect } from "chai";

describe("All methods controller", () => {
  let server, controller: AllMethodsController;

  before(() =>
    mountApp({
      currentDir: process.cwd() + "/test/all-methods-controller",
    }).then((app) => {
      server = app.server;
      controller = app.controllers.get(
        "AllMethodsController"
      ) as unknown as AllMethodsController;
    })
  );

  it("should return all names", () =>
    server
      .inject({
        method: "GET",
        url: "/",
      })
      .then((response) => {
        expect(response.statusCode).to.equal(200);
        expect(JSON.parse(response.body)).to.deep.equal(controller.names);
      }));

  it("should add a new name", () =>
    server
      .inject({
        method: "POST",
        url: "/",
        payload: "Henry",
        headers: { "Content-Type": "text/plain" },
      })
      .then((response) => {
        expect(response.statusCode).to.equal(200);
        expect(controller.names).to.include("Henry");
      }));
});
