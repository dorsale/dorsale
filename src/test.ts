import { Controller, Get, Query } from "./decorators";

@Controller
export class TestController {
  id: number = 0;

  @Get("/test/:n")
  test(@Query m: string, @Query p: string, n: string) {
    return 3 + parseInt(n) + parseInt(m) - parseInt(p);
  }
}
