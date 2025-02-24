import { DorsaleElement, DorsaleElementType, RouteEntry } from "./util";
import qs from "fast-querystring";
import {
  BODY_PARAM_INDEX,
  CONTROLLER_PREFIX,
  CONTROLLER_ROUTES,
  ENDPOINT_PARAMS,
  QUERY_PARAM_INDEXES,
} from "./constants";

/**
 * Create the runtime instance of a Dorsale element and mounts it into the Dorsale context
 * @param element
 * @param runtimes
 * @param router
 */
export function mountElement(
  element: DorsaleElement,
  runtimes: Map<string, object>,
  router: any,
) {
  switch (element.type) {
    case DorsaleElementType.CONTROLLER: {
      const instance = new (element.constructor as any)(
        ...element.dependencies.map((dep) => runtimes.get(dep)),
      );
      const routes: RouteEntry[] = Reflect.getOwnMetadata(
        CONTROLLER_ROUTES,
        element.constructor.prototype,
      );
      const prefix = Reflect.getMetadata(
        CONTROLLER_PREFIX,
        element.constructor,
      );
      for (const route of routes) {
        addRoute(route, prefix, element.constructor, instance, router);
      }
      runtimes.set(element.name, instance);
      break;
    }
    case DorsaleElementType.COMPONENT: {
      const instance = new (element.constructor as any)(
        ...element.dependencies.map((dep) => runtimes.get(dep)),
      );
      runtimes.set(element.name, instance);
      element.implemented.forEach((implemented) => {
        runtimes.set(implemented, instance);
      });
      break;
    }
    case DorsaleElementType.REPOSITORY: {
      const instance = new (element.constructor as any)(
        ...element.dependencies.map((dep) => runtimes.get(dep)),
      );
      runtimes.set(element.name, instance);
      break;
    }
    case DorsaleElementType.DAO:
      break;
    // case DorsaleElementType.CUSTOM: {
    //   const instance = new (element.constructor as any)(
    //     ...element.dependencies.map((dep) => this.runtimes.get(dep)),
    //   );
    //   const plugin = Reflect.getOwnMetadata(
    //     PLUGIN_NAME_PROPERTY_KEY,
    //     element.constructor,
    //   );
    //   if (!plugin) {
    //     throw new Error("Custom element must have a plugin name");
    //   }
    //   const pluginInstance = this.plugins.find((p) => p.name === plugin);
    //   if (!pluginInstance) {
    //     throw new Error("Plugin not found");
    //   }
    //   const customElementName = Reflect.getOwnMetadata(
    //     CUSTOM_ELEMENT_NAME_PROPERTY_KEY,
    //     element.constructor,
    //   );
    //   if (!customElementName) {
    //     throw new Error("Custom element must have a name");
    //   }
    //   pluginInstance.onMount[customElementName](
    //     element.constructor,
    //     instance,
    //     this.pluginData,
    //   );
    //   break;
    // }
  }
}

/**
 * Creates an array of request handlers that applies the appropriate treatment for each parameter.
 * This means that for the given endpoint:
 * ```ts
 *  test(@Query name: string, @Body body: string, count: string) {
 *    // endpoint code
 *  }
 * ```
 * This function will receive `["name", "body", "count"]` for the `params` parameter, `bodyParamIndex` is `1` and
 * `queryParamIndexes` is the array `[0]`. This function will then create a handler function for each parameter. These
 * handler functions will be used at runtime to evaluate the parameters value from the incoming request.
 * @param params
 * @param bodyParamIndex
 * @param queryParamIndexes
 */
function getParamHandlers(
  params: string[],
  bodyParamIndex: number | undefined,
  queryParamIndexes: number[],
): ((request: Request) => any)[] {
  return params.map((param: string, index: number) => {
    if (queryParamIndexes.includes(index)) {
      return queryParamHandler(param);
    } else if (bodyParamIndex === index) {
      return bodyParamHandler();
    } else {
      return requestParamHandler(param);
    }
  });
}

/**
 * Returns a request handler function that gets the value of a request parameter with a given name
 * @param param the name of the request parameter
 */
function requestParamHandler(param: string) {
  return function (context: any) {
    return context.params[param];
  };
}

/**
 * Returns a request handler function that gets the value of a query parameter with a given name
 * @param param the name of the query parameter
 */
function queryParamHandler(param: string) {
  return function (context: any) {
    return context.query[param];
  };
}

/**
 * Returns a request handler function that gets the value of the body parameter
 */
function bodyParamHandler() {
  return async function (context: any) {
    return await context.req.json();
  };
}

/**
 * Adds a route to the dorsale application
 * @param route the route entry to add
 * @param prefix the prefix of the controller
 * @param constructor the controller class
 * @param instance the controller instance
 * @param router the Dorsale router
 */
function addRoute(
  route: RouteEntry,
  prefix: string = "",
  constructor: Function,
  instance: object,
  router: any,
) {
  // List of names of the parameters of the controller method
  const params: string[] = Reflect.getOwnMetadata(
    ENDPOINT_PARAMS,
    constructor.prototype,
    route.mapTo.method,
  );
  // const bodyValidationSchema = Reflect.getOwnMetadata(
  //   BODY_SCHEMA,
  //   constructor.prototype,
  //   route.mapTo.method,
  // );

  // List of the indexes of the parameters which are also query parameters as per their order in the method signature
  const queryParamIndexes: number[] =
    Reflect.getOwnMetadata(
      QUERY_PARAM_INDEXES,
      constructor.prototype,
      route.mapTo.method,
    ) || [];

  // Index of the parameter used to get the body of the request if any
  const bodyParamIndex: number | undefined = Reflect.getOwnMetadata(
    BODY_PARAM_INDEX,
    constructor.prototype,
    route.mapTo.method,
  );

  // List of handlers functions to get the parameters values from the request.
  // This list contains lambdas that associate values to parameter names based on the request.
  const paramHandlers = getParamHandlers(
    params,
    bodyParamIndex,
    queryParamIndexes,
  );

  // This function returns an array of the computed parameter values after applying the handlers to the request
  const computeParameterValues: (request: Request) => Promise<Awaited<any>[]> =
    async function (request: Request) {
      // @ts-ignore
      request.query = qs.parse(request.req.url.split("?")[1]);
      return await Promise.all(
        paramHandlers.map(
          async (f: (request: Request) => any) => await f(request),
        ),
      );
    };

  router.put(route.method, prefix + route.url, async (req: any) => {
    const res = await constructor.prototype[route.mapTo.method].call(
      instance,
      ...(await computeParameterValues(req)),
    );

    return Response.json(res);
  });
}
