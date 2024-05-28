import { Controller, Get } from "../../src/decorators";
import type { UserFinder } from "./userFinder";

@Controller()
export class UserController {
  constructor(private readonly userFinder: UserFinder) {}

  @Get("/")
  getAll() {
    return this.userFinder.findAllUsers();
  }

  @Get("/:id")
  getById(id: string) {
    return this.userFinder.findUserById(id);
  }
}
