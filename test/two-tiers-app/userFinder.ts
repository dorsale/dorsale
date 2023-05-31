import { User } from "./user";

export interface UserFinder {
  findAllUsers(): Promise<User[]>;

  findUserById(id: string): Promise<User | undefined>;

  findUserByEmail(email: string): Promise<User | undefined>;
}
