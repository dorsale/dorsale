import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { mountApp } from "../src/app";
import { AllMethodsController } from "./all-methods-controller/allMethodsController";

describe("All methods controller", () => {
  let server, controller: AllMethodsController;

  beforeAll(async () => {
    const app = await mountApp({
      rootDir: process.cwd() + "/test/all-methods-controller",
    });
    server = app.server;
    controller = app.runtimes.get(
      "AllMethodsController",
    ) as unknown as AllMethodsController;
  });

  afterAll(async () => {
    await server.stop();
  });

  it("should return all users", async () => {
    const request = new Request("http://localhost:3000/", {
      method: "GET",
    });
    const response = await server.fetch(request);
    expect(response.status).toEqual(200);
    expect(response.json()).resolves.toEqual(controller.users);
  });

  it("should add a new user", async () => {
    const request = new Request("http://localhost:3000/", {
      method: "POST",
      body: JSON.stringify({ id: "3", name: "Henry", age: 25, country: "UK" }),
      headers: {
        "Content-Type": "application/json",
      },
    });
    const response = await server.fetch(request);
    expect(response.status).toEqual(200);
    expect(controller.users.map((u) => u.name)).toContain("Henry");
  });

  it("should update a user", async () => {
    const newAlfred = {
      id: "1",
      name: "Alfredo",
      age: 32,
      country: "Portugal",
    };
    const request = new Request("http://localhost:3000/1", {
      method: "PUT",
      body: JSON.stringify(newAlfred),
      headers: {
        "Content-Type": "application/json",
      },
    });
    const response = await server.fetch(request);
    expect(response.status).toEqual(200);
    expect(controller.users).toContainEqual(newAlfred);
  });

  it("should patch a user", async () => {
    const request = new Request("http://localhost:3000/2", {
      method: "PATCH",
      body: JSON.stringify({ age: 39 }),
      headers: {
        "Content-Type": "application/json",
      },
    });
    const response = await server.fetch(request);
    expect(response.status).toEqual(200);
    expect(controller.users).toContainEqual({
      id: "2",
      name: "Bernard",
      age: 39,
      country: "France",
    });
  });

  it("should delete a user", async () => {
    const request = new Request("http://localhost:3000/2", {
      method: "DELETE",
    });
    const response = await server.fetch(request);
    expect(response.status).toEqual(200);
    expect(controller.users.map((u) => u.id)).not.toInclude("2");
  });
});
