# dorsale

Dorsale is an attempt at creating a TS equivalent of Spring for Java. It is a work in progress, and is not ready for
production use.
If you benchmark it, please let me know the results!

## How to use

The setup is intentionally minimalistic. Bootstrapping a Dorsale application is as simple as:

```ts
import { dorsale } from 'dorsale';

dorsale({ port: 8080 });
```

This will start a server on port 8080. You can then add controllers, services, and repositories to your application.

A full example could look like this:

```ts
// index.ts
import { dorsale } from 'dorsale';

dorsace({ port: 8080 });
```

```ts
// user.ts
export interface User {
  id: string;
  email: string;
  password: string;
}
```

```ts
// userFinder.ts
import { User } from "./user";

export interface UserFinder {
  findAllUsers(): Promise<User[]>;

  findUserById(id: string): Promise<User | undefined>;

  findUserByEmail(email: string): Promise<User | undefined>;
}
```

```ts
// userManager.ts
import { UserEditor } from "./userEditor";
import { UserFinder } from "./userFinder";
import { User } from "./user";
import { Component } from "dorsale";

@Component
export class UserManager implements UserFinder {
  users: User[] = [<some users >];

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
}
```

```ts
// userController.ts
import { Controller, Get } from "dorsale";
import { UserFinder } from "./userFinder";

@Controller()
export class UserController {
  constructor(private readonly userFinder: UserFinder) {
  }

  @Get("/")
  getAll() {
    return this.userFinder.findAllUsers();
  }

  @Get("/:id")
  getById(id: string) {
    return this.userFinder.findUserById(id);
  }
}
```

You just have to run the file containing the `dorsale` call, and you're good to go!
The other components will be automatically discovered and injected. This reduces the amount of boilerplate code you have
to write.
By default, Dorsale will look for components in the `src` folder, but you can change this by passing a `rootDir` option
to the `dorsale` call.

```ts
dorsale({ port: 8080, rootDir: "myFolder/relative/to/the/current/file" });
```

## Testing

Coming soon!

## Contributing

Contributions are welcome! Feel free to open an issue or a PR if you have any suggestions or bug reports.
Please follow the GitHub flow when contributing (see [here](https://guides.github.com/introduction/flow/) for more
information).
Thanks for your interest in Dorsale!