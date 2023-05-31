import {
  Body,
  Controller,
  Delete,
  Get,
  Patch,
  Post,
  Put,
} from "../../src/decorators";

type User = {
  id: string;
  name: string;
  age: number;
  country: string;
};
@Controller()
export class AllMethodsController {
  users: User[];

  constructor() {
    this.users = [
      { id: "1", name: "Alfred", age: 30, country: "Spain" },
      { id: "2", name: "Bernard", age: 40, country: "France" },
    ];
  }

  @Get("/")
  getAllUsers() {
    return this.users;
  }

  @Post("/")
  addUser(@Body user: User) {
    this.users.push(user);
  }

  @Put("/:id")
  updateUser(id: string, @Body user: User) {
    const index = this.users.findIndex((u) => u.id === id);
    this.users[index] = user;
  }

  @Patch("/:id")
  patchUser(id: string, @Body user: Partial<User>) {
    const index = this.users.findIndex((u) => u.id === id);
    this.users[index] = { ...this.users[index], ...user };
  }

  @Delete("/:id")
  deleteUser(id: string) {
    const index = this.users.findIndex((u) => u.id === id);
    this.users.splice(index, 1);
  }
}
