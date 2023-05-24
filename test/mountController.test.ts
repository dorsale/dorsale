import { expect } from "chai";
import { dorsal } from "../src/server";

describe("bar", () => {
  it("should be equal to bar", async () => {
    const app = await dorsal(process.cwd() + "/test/example1");
    const response = await app.inject({
      method: "GET",
      url: "/test/3?m=2&p=1"
    });
    expect(response.statusCode).to.equal(200);
    expect(response.body).to.equal(JSON.stringify({ res: 7 }));
  });
});
