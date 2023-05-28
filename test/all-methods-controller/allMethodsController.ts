import { Controller, Get } from "../../src";
import { Body, Post } from "../../src/decorators";

@Controller()
export class AllMethodsController {
  names: string[];

  constructor() {
    this.names = ["Fred", "Marc", "Alfred"];
  }
  @Get("/")
  getAllNames() {
    return this.names;
  }

  @Post("/")
  addName(@Body name: string) {
    this.names.push(name);
  }
}
