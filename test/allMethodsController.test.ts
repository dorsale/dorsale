import { before } from "mocha";
import { mountApp } from "../src/app";
import { AllMethodsController } from "./all-methods-controller/allMethodsController";
import { expect } from "chai";

describe("All methods controller", () => {
  let server, controller: AllMethodsController;

  before(async () => {
    const app = await mountApp({
      rootDir: process.cwd() + "/test/all-methods-controller",
    });
    server = app.server;
    controller = app.runtimes.get(
      "AllMethodsController"
    ) as unknown as AllMethodsController;
  });

  it("should return all users", async () => {
    const response = await server.inject({
      method: "GET",
      url: "/",
    });
    expect(response.statusCode).to.equal(200);
    expect(JSON.parse(response.body)).to.deep.equal(controller.users);
  });

  it("should add a new user", async () => {
    const response = await server.inject({
      method: "POST",
      url: "/",
      payload: { id: "3", name: "Henry", age: 25, country: "UK" },
    });
    expect(response.statusCode).to.equal(200);
    expect(controller.users.map((u) => u.name)).to.include("Henry");
  });

  it("should update a user", async () => {
    const newAlfred = {
      id: "1",
      name: "Alfredo",
      age: 32,
      country: "Portugal",
    };
    const response = await server.inject({
      method: "PUT",
      url: "/1",
      payload: newAlfred,
    });
    expect(response.statusCode).to.equal(200);
    expect(controller.users).to.deep.include(newAlfred);
  });

  it("should patch a user", async () => {
    const response = await server.inject({
      method: "PATCH",
      url: "/2",
      payload: { age: 39 },
    });
    expect(response.statusCode).to.equal(200);
    expect(controller.users).to.deep.include({
      id: "2",
      name: "Bernard",
      age: 39,
      country: "France",
    });
  });

  it("should delete a user", async () => {
    const response = await server.inject({
      method: "DELETE",
      url: "/2",
    });
    expect(response.statusCode).to.equal(200);
    expect(controller.users.map((u) => u.id)).to.not.include("2");
  });
});
