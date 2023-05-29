import Fastify, { FastifyInstance, RouteOptions } from "fastify";
import fg from "fast-glob";
import {
  BODY_PARAM_INDEX,
  CONTROLLER_ROUTES,
  DorsalOptions,
  ENDPOINT_PARAMS,
  fileToAst,
  isController,
  QUERY_PARAM_INDEXES,
  RouteEntry
} from "./util";
import path from "path";

/**
 * Mounts the dorsal application
 * @param options the dorsal options
 */
export async function mountApp(options: DorsalOptions) {
  const currentDir = options.currentDir || process.cwd() + "/src";
  const fastify: FastifyInstance = Fastify({ logger: true });
  global["$$fastify"] = fastify;

  const files = fg.sync(["**/*.ts"], { cwd: currentDir });
  const controllers = new Map<string, object>();
  for (const file of files) {
    const filename = path.join(currentDir, file);
    const ast = fileToAst(filename);
    const controllerName = isController(ast);
    if (controllerName) {
      const { plugin, instance } = await addController(
        filename,
        controllerName
      );
      controllers.set(controllerName, instance);
      fastify.register(plugin, { prefix: instance.prefix ?? "" });
    }
  }
  return { server: fastify, controllers };
}

/**
 * Adds a controller to the dorsal application
 * @param filename the path to the controller file
 * @param controllerName the name of the controller class
 */
async function addController(filename: string, controllerName: string) {
  const imported = await import(filename);
  const controller = imported[controllerName];
  // @ts-ignore
  const instance = new controller();
  const routes: RouteEntry[] = Reflect.getOwnMetadata(
    CONTROLLER_ROUTES,
    controller.prototype
  );
  const plugin = async function (fastify: FastifyInstance) {
    for (const route of routes) {
      const routeOptions = addRoute(route, controller, instance);
      fastify.route(routeOptions);
    }
  };
  return { plugin, instance };
}

/**
 * Adds a route to the dorsal application
 * @param route the route entry to add
 * @param controller the controller class
 * @param instance the controller instance
 */
function addRoute(route: RouteEntry, controller: Function, instance: object) {
  const params = Reflect.getOwnMetadata(
    ENDPOINT_PARAMS,
    controller.prototype,
    route.mapTo.method
  );
  const queryParamIndexes =
    Reflect.getOwnMetadata(
      QUERY_PARAM_INDEXES,
      controller.prototype,
      route.mapTo.method
    ) || [];
  const bodyParamIndex = Reflect.getOwnMetadata(
    BODY_PARAM_INDEX,
    controller.prototype,
    route.mapTo.method
  );
  return {
    method: route.method,
    url: route.url,
    handler: async (request) => {
      const args = params.map((param, index) => {
        if (queryParamIndexes.includes(index)) {
          // @ts-ignore
          return request.query[param];
        } else if (bodyParamIndex === index) {
          return request.body;
        } else {
          // @ts-ignore
          return request.params[param];
        }
      });
      return controller.prototype[route.mapTo.method].call(instance, ...args);
    },
  } as RouteOptions;
}
