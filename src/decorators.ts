import * as acorn from "acorn";
import "reflect-metadata";
import { RouteOptions } from "fastify";

export function Controller(prefix?: string) {
  return (target: Function) => {
    const routes: RouteEntry[] =
      Reflect.getOwnMetadata("routes", target.prototype) || [];

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const plugin = async function(fastify, opts) {
      for (const route of routes) {
        fastify.route({
          method: route.method,
          url: prefix ?? "" + route.url,
          handler: route.handler
        } as RouteOptions);
      }
    };
    global["$$fastify"].register(plugin);
  };
}

export function Query(target: object, propertyKey: string, index: number) {
  const queryParamNames =
    Reflect.getOwnMetadata("queryParamNames", target, propertyKey) || [];
  queryParamNames.push(index);
  Reflect.defineMetadata(
    "queryParamNames",
    queryParamNames,
    target,
    propertyKey
  );
}

type RouteEntry = {
  url: string;
  method: string;
  handler: Function;
};

export function Get(url: string) {
  return function(
    target: object,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const routes: RouteEntry[] = Reflect.getOwnMetadata("routes", target) || [];
    const methodAst = acorn.parseExpressionAt(descriptor.value.toString(), 0, {
      ecmaVersion: 2020
    });
    // @ts-ignore
    const params = methodAst.arguments.map((param) => param.name);
    const queryParamIndexes =
      Reflect.getOwnMetadata("queryParamNames", target, propertyKey) || [];
    routes.push({
      url,
      method: "GET",
      handler: (request) => {
        const args = params.map((param, index) => {
          if (queryParamIndexes.includes(index)) {
            return request.query[param];
          } else {
            return request.params[param];
          }
        });
        return descriptor.value.call(target, ...args);
      }
    });
    Reflect.defineMetadata("routes", routes, target);
  };
}
