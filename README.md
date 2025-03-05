# dorsale

Dorsale is a Bun-based backend TypeScript framework. It is built on top of the Bun server and [wint](https://github.com/aquapi/wint) for routing.
Dorsale uses decorators to define elements of your application.  
It is a work in progress, and is not ready for
production use.
If you benchmark it, please let me know the results!

## Installation

Quick and easy, just:
```shell
bun add dorsale
```

You also need to enable TypeScript's decorators feature by adding the following options to your `tsconfig.json`:

```json
{
  "compilerOptions": {
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true
  }
}
```

## Getting started

### Your first dorsale app

The setup is intentionally minimalistic. Bootstrapping a Dorsale application is as simple as:

```ts
import { dorsale } from 'dorsale';

dorsale({ port: 8080 });
```

This will start a server on port 8080. You can then add controllers, services, and repositories to your application.

### Full application example
A full example could look like this:

```
src
├── index.ts
├── user.ts
├── userFinder.ts
├── userManager.ts
├── userController.ts
```

```ts
// index.ts
import { dorsale } from 'dorsale';

dorsale({ port: 8080 });
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
  users: User[] // = [... some users];

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
import type { UserFinder } from "./userFinder";

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

You just have to run the file containing the call to the `dorsale` function, and you're good to go!
The other components will be automatically discovered and injected. This reduces the amount of boilerplate code you have
to write.

⚠️ Important: you **must** import interfaces as `type` in the controller file, this is a limitation of Bun. (
see https://github.com/oven-sh/bun/issues/8618)

By default, Dorsale will look for components in the current directory, but you can change this by passing a `rootDir`
option
to the `dorsale` call.

```ts
dorsale({ port: 8080, rootDir: "myFolder/relative/to/the/current/file" });
```

## Controllers

### Controller classes

Controllers are classes that define the routes exposed by your application. They are decorated with `@Controller()`.
```ts
import { Controller } from "dorsale";

@Controller()
export class UserController {
    // ... your routes
}
```

You can also specify a prefix for all the routes defined in a controller by passing it as an argument to the decorator.
```ts
@Controller("/users")
export class UserController {
    // ... your routes
}
```

### Routes

Routes are defined by decorating methods with `@Get`, `@Post`, `@Put`, `@Patch`, or `@Delete`.
```ts
import { Controller, Get } from "dorsale";

@Controller()
export class UserController {
    @Get("/hello")
    getHello() {
        return "Hello world!";
    }
}
```
In the example above, a GET route will be exposed at `/hello`, and will return the string `"Hello world!"`.

### Route parameters

You can define route parameters by adding a colon (`:`) before the parameter name in the route path.
```ts
import { Controller, Get } from "dorsale";

@Controller()
export class UserController {
    @Get("/users/:id")
    getUserById(id: string) {
        // ...
    }
}
```

### Query parameters

Query parameters are defined by adding a `@Query` decorator to the parameter.
```ts
import { Controller, Get, Query } from "dorsale";

@Controller()
export class UserController {
    @Get("/users") // e.g. GET /users?page=1&limit=10
    getUsers(@Query page: number, @Query limit: number) {
        // ...
    }
}
```
If some query parameters are not provided in the request, they will be `undefined`.

### Body

You can access the body of the request by adding a `@Body` decorator to a parameter.
```ts
import { Controller, Post, Body } from "dorsale";

@Controller()
export class UserController {
    @Post("/users")
    createUser(@Body user: User) {
        // ...
    }
}
```

## Testing

Coming soon!

## Contributing

Contributions are welcome! Feel free to open an issue or a PR if you have any suggestions or bug reports.
Please follow the GitHub flow when contributing (see [here](https://guides.github.com/introduction/flow/) for more
information).
Thanks for your interest in Dorsale!
