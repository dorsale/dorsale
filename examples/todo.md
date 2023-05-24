```ts
export interface Todo {
  title: string
  content: string
  deadline?: Date
}

export interface TodoParser {
  parsePlainText(text: string): Todo

  parseYaml(yaml: string): Todo
}

export interface CalendarAdapter {
  addEvent(todo: Todo): Promise<void>

  removeEvent(todo: Todo): Promise<void>

  updateEvent(todo: Todo): Promise<void>
}

// @ts-ignore
@Component
export class TodoManager implements TodoParser, CalendarAdapter {
  addEvent(todo: Todo): Promise<void> {
    return Promise.resolve(undefined);
  }

  parsePlainText(text: string): Todo {
    const index = text.indexOf('\n');
    const title = text.substring(0, index);
    const content = text.substring(index + 1);
    return {
      title,
      content,
    }
  }

  parseYaml(yaml: string): Todo {
    // Todo
    return {
      title: '',
      content: '',
    }
  }

  removeEvent(todo: Todo): Promise<void> {
    return Promise.resolve(undefined);
  }

  updateEvent(todo: Todo): Promise<void> {
    return Promise.resolve(undefined);
  }
}

// @ts-ignore
@Controller
export class TodoController {
  // @ts-ignore
  constructor(private todoManager: TodoManager) {
  }

  // @ts-ignore
  @Get('/todo')
  async getTodo(): Promise<Todo> {
    return {
      title: '',
      content: '',
    }
  }

  // @ts-ignore
  @Post('/todo')
  async addTodo(
    // @ts-ignore
    @Body() body: string,
  ): Promise<Todo> {
    const todo = this.todoManager.parsePlainText(body);
    await this.todoManager.addEvent(todo);
    return todo;
  }

  // @ts-ignore
  @Put('/todo')
  async updateTodo(
    // @ts-ignore
    @Body() body: string,
  ): Promise<Todo> {
    const todo = this.todoManager.parsePlainText(body);
    await this.todoManager.updateEvent(todo);
    return todo;
  }

  // @ts-ignore
  @Delete('/todo')
  async deleteTodo(
    // @ts-ignore
    @Body() body: string,
  ): Promise<Todo> {
    const todo = this.todoManager.parsePlainText(body);
    await this.todoManager.removeEvent(todo);
    return todo;
  }
}
```
