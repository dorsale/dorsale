import { Body, BodySchema, Controller, Post } from "../../src";

@Controller()
export class ValidatorsController {
  @BodySchema({
    type: "object",
    properties: {
      name: { type: "string" },
    },
    required: ["name"],
  })
  @Post("/test")
  test(@Body user: { name: string }) {
    return { message: `Hello ${user.name}` };
  }
}
