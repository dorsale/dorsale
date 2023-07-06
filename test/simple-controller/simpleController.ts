import { Controller, Get, Query } from "../../src/decorators";

@Controller()
export class SimpleController {
  @Get("/test/:n")
  test(@Query m: string, @Query p: string, n: string) {
    return { res: 3 + parseInt(n) + parseInt(m) - parseInt(p) };
  }
}
