import { Controller, Get } from "./decorators";

@Controller
export class TestController {
  id: number = 0;

  @Get("/test/:n")
  test(n: string) {
    return 3 + parseInt(n);
  }
}
