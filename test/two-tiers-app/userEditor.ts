import { User } from "./user";

export interface UserEditor {
  createUser(name: string, email: string, password: string): Promise<string>;

  updateUser(id: string, updateInstructions: Partial<User>): Promise<void>;

  deleteUser(id: string): Promise<void>;
}
