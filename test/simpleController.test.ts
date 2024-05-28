import { DorsaleApp, mountApp } from "../src/app";
import { afterAll, beforeAll, describe, expect, it } from "bun:test";

describe("Simple controller", () => {
  let app: DorsaleApp;

  beforeAll(async () => {
    app = await mountApp({
      rootDir: process.cwd() + "/test/simple-controller",
    });
  });

  afterAll(async () => {
    await app.server.stop();
  });

  it("should respond to GET request", async () => {
    const response = await app.server.fetch(
      "http://localhost:3000/test/3?m=2&p=1",
    );
    expect(response.status).toEqual(200);
    expect(response.json()).resolves.toEqual({ res: 3 + 3 + 2 - 1 });
  });
});
