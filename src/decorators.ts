import * as acorn from "acorn";
import "reflect-metadata";

export function Controller(target: Function) {
  target.prototype.id = 1234;
  console.log("hi from controller decorator");
}

export function Query(target: Object, propertyKey: string, index: number) {
  const queryParamNames = Reflect.getOwnMetadata("queryParamNames", target, propertyKey) || [];
  queryParamNames.push(index);
  Reflect.defineMetadata("queryParamNames", queryParamNames, target, propertyKey);
  console.log("hi from query decorator");
  console.log(target);
  console.log(propertyKey);
  console.log(index);
}

export function Get(url: string) {
  return function(
    target: Object,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    console.log("hi from get decorator");
    console.log(descriptor.value.toString());
    const methodAst = acorn.parseExpressionAt(descriptor.value.toString(), 0, { ecmaVersion: 2020 });
    console.log(methodAst);
    // @ts-ignore
    const params = methodAst.arguments.map((param) => param.name);
    console.log(params);
    const queryParamIndexes = Reflect.getOwnMetadata("queryParamNames", target, propertyKey) || [];
    console.log(`queryParamIndexes: ${queryParamIndexes}`);
    global["$$fastify"].get(
      url,
      (request) => {
        const args = params.map((param, index) => {
          if (queryParamIndexes.includes(index)) {
            console.log(`${param} is a query param`);
            console.log(`request.query[${param}]: ${request.query[param]}`);
            return request.query[param];
          } else {
            console.log(`${param} is a route param`);
            return request.params[param];
          }
        });
        return { res: descriptor.value.call(target, ...args) };
      }
    );
  };
}
