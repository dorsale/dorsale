import { UserEditor } from "./userEditor";
import { UserFinder } from "./userFinder";
import { User } from "./user";
import { Component } from "../../src/decorators";

@Component
export class UserManager implements UserFinder, UserEditor {
  users: User[] = [
    {
      id: "1",
      name: "John Doe",
      email: "john@doe.com",
      password: "123456",
    },
    {
      id: "2",
      name: "Jake Johnson",
      email: "jake@johnson.com",
      password: "543321",
    },
  ];

  createUser(name: string, email: string, password: string): Promise<string> {
    this.users.push({ id: "1", name, email, password });
    return Promise.resolve("1");
  }

  deleteUser(id: string): Promise<void> {
    this.users = this.users.filter((u) => u.id !== id);
    return Promise.resolve(undefined);
  }

  findAllUsers(): Promise<User[]> {
    return Promise.resolve(this.users);
  }

  findUserByEmail(email: string): Promise<User | undefined> {
    const user = this.users.find((u) => u.email === email);
    return Promise.resolve(user);
  }

  findUserById(id: string): Promise<User | undefined> {
    const user = this.users.find((u) => u.id === id);
    return Promise.resolve(user);
  }

  updateUser(id: string, updateInstructions: Partial<User>): Promise<void> {
    const user = this.users.find((u) => u.id === id);
    if (user) {
      Object.assign(user, updateInstructions);
    }
    return Promise.resolve();
  }
}
