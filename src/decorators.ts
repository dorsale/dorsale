import * as acorn from "acorn";
import "reflect-metadata";
import {
  BODY_PARAM_INDEX,
  BODY_SCHEMA,
  CONTROLLER_PREFIX,
  CONTROLLER_ROUTES,
  ENDPOINT_PARAMS,
  HttpMethod,
  QUERY_PARAM_INDEXES,
  RouteEntry
} from "./util";

/**
 * Decorator for controller classes
 * @param prefix - prefix for all endpoints in this controller
 * @constructor
 */
export function Controller(prefix?: string) {
  return function (target: Function) {
    Reflect.defineMetadata(CONTROLLER_PREFIX, prefix, target);
  }
}

/**
 * Decorator for query parameters
 * @param target - target object (the controller)
 * @param propertyKey - name of the method
 * @param index - index of the parameter in the method declaration
 * @constructor
 */
export function Query(target: object, propertyKey: string, index: number) {
  const queryParamIndexes =
    Reflect.getOwnMetadata(QUERY_PARAM_INDEXES, target, propertyKey) || [];
  queryParamIndexes.push(index);
  Reflect.defineMetadata(
    QUERY_PARAM_INDEXES,
    queryParamIndexes,
    target,
    propertyKey
  );
}

/**
 * Adds an endpoint to the controller metadata
 * @param method - HTTP method
 * @param url - url for the endpoint
 * @param target - target object (the controller)
 * @param propertyKey - name of the method
 * @param descriptor - the method descriptor
 */
function addEndpoint(
  method: HttpMethod,
  url: string,
  target: object,
  propertyKey: string,
  descriptor: PropertyDescriptor
) {
  const routes: RouteEntry[] =
    Reflect.getOwnMetadata(CONTROLLER_ROUTES, target) || [];
  const methodAst = acorn.parseExpressionAt(descriptor.value.toString(), 0, {
    ecmaVersion: 2020,
  });
  // @ts-ignore
  const params = methodAst.arguments.map((param) => param.name);
  Reflect.defineMetadata(ENDPOINT_PARAMS, params, target, propertyKey);
  routes.push({
    url,
    // @ts-ignore
    method: method.toString(),
    mapTo: {
      // @ts-ignore
      controller: target.constructor.name,
      method: propertyKey,
    },
  });
  Reflect.defineMetadata(CONTROLLER_ROUTES, routes, target);
}

/**
 * Decorator for GET endpoints
 * @param url - url for the endpoint
 * @constructor
 */
export function Get(url: string) {
  return function (
    target: object,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    addEndpoint(HttpMethod.GET, url, target, propertyKey, descriptor);
  };
}

/**
 * Decorator for POST endpoints
 * @param url - url for the endpoint
 * @constructor
 */
export function Post(url: string) {
  return function (
    target: object,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    addEndpoint(HttpMethod.POST, url, target, propertyKey, descriptor);
  };
}

/**
 * Decorator for PUT endpoints
 * @param url - url for the endpoint
 * @constructor
 */
export function Put(url: string) {
  return function (
    target: object,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    addEndpoint(HttpMethod.PUT, url, target, propertyKey, descriptor);
  };
}

/**
 * Decorator for PATCH endpoints
 * @param url - url for the endpoint
 * @constructor
 */
export function Patch(url: string) {
  return function (
    target: object,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    addEndpoint(HttpMethod.PATCH, url, target, propertyKey, descriptor);
  };
}

/**
 * Decorator for DELETE endpoints
 * @param url - url for the endpoint
 * @constructor
 */
export function Delete(url: string) {
  return function (
    target: object,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    addEndpoint(HttpMethod.DELETE, url, target, propertyKey, descriptor);
  };
}

/**
 * Decorator for body parameters
 * @param target - target object (the controller)
 * @param propertyKey - name of the method
 * @param index - index of the parameter in the method declaration
 * @constructor
 */
export function Body(target: object, propertyKey: string, index: number) {
  Reflect.defineMetadata(BODY_PARAM_INDEX, index, target, propertyKey);
}

/**
 * Decorator for body schema
 * @param schema - schema for the body. The schema must be a valid JSON schema
 * @constructor
 */
export function BodySchema(schema: object) {
  return function (target: object, propertyKey: string) {
    Reflect.defineMetadata(BODY_SCHEMA, schema, target, propertyKey);
  }
}

export function Component(target: Function) {
  Reflect.defineMetadata("component", true, target);
}
