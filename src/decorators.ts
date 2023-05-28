import * as acorn from "acorn";
import "reflect-metadata";
import { BODY_PARAM_INDEX } from "./util";

export function Controller(prefix?: string) {
  return (target: Function) => {
    if (prefix) {
      Reflect.defineMetadata("prefix", prefix, target);
    }
  };
}

export function Query(target: object, propertyKey: string, index: number) {
  const queryParamIndexes =
    Reflect.getOwnMetadata("queryParamIndexes", target, propertyKey) || [];
  queryParamIndexes.push(index);
  Reflect.defineMetadata(
    "queryParamIndexes",
    queryParamIndexes,
    target,
    propertyKey
  );
}

export type RouteEntry = {
  url: string;
  method: string;
  mapTo: {
    controller: string,
    method: string
  };
};

enum HttpMethod {
  GET="GET",
  POST="POST",
  PUT = "PUT",
  PATCH = "PATCH",
  DELETE = "DELETE",
}

function addEndpoint(
  method: HttpMethod,
  url: string,
  target: object,
  propertyKey: string,
  descriptor: PropertyDescriptor
) {
  const routes: RouteEntry[] = Reflect.getOwnMetadata("routes", target) || [];
  const methodAst = acorn.parseExpressionAt(descriptor.value.toString(), 0, {
    ecmaVersion: 2020,
  });
  // @ts-ignore
  const params = methodAst.arguments.map((param) => param.name);
  Reflect.defineMetadata("params", params, target, propertyKey)
  routes.push({
    url,
    method: method.toString(),
    mapTo: {
      // @ts-ignore
      controller: target.constructor.name,
      method: propertyKey
    }
  });
  Reflect.defineMetadata("routes", routes, target);
}

export function Get(url: string) {
  return function (
    target: object,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    addEndpoint(HttpMethod.GET, url,target, propertyKey, descriptor)
  };
}

export function Post(url: string) {
  return function (
    target: object,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    addEndpoint(HttpMethod.POST, url,target, propertyKey, descriptor)
  };
}

export function Put(url: string) {
  return function (
    target: object,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    addEndpoint(HttpMethod.PUT, url,target, propertyKey, descriptor)
  };
}

export function Patch(url: string) {
  return function (
    target: object,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    addEndpoint(HttpMethod.PATCH, url,target, propertyKey, descriptor)
  };
}

export function Delete(url: string) {
  return function (
    target: object,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    addEndpoint(HttpMethod.DELETE, url,target, propertyKey, descriptor)
  };
}

export function Body(target: object, propertyKey: string, index: number) {
  Reflect.defineMetadata(
    BODY_PARAM_INDEX,
    index,
    target,
    propertyKey
  );
}
