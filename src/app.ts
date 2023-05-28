import Fastify, { FastifyInstance, RouteOptions } from "fastify";
import fg from "fast-glob";
import {
  BODY_PARAM_INDEX,
  DorsalOptions,
  fileToAst,
  isController,
  QUERY_PARAM_INDEXES,
} from "./util";
import path from "path";
import { RouteEntry } from "./decorators";

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
      const imported = await import(filename);
      const controller = imported[controllerName];
      // @ts-ignore
      const instance = new controller();
      // await fastify.register(instance.plugin)
      controllers.set(controllerName, instance);
      const routes: RouteEntry[] = Reflect.getOwnMetadata(
        "routes",
        controller.prototype
      );
      const plugin = async function (fastify, opts) {
        for (const route of routes) {
          const params = Reflect.getOwnMetadata(
            "params",
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
          fastify.route({
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
              return controller.prototype[route.mapTo.method].call(
                instance,
                ...args
              );
            },
          } as RouteOptions);
        }
      };
      fastify.register(plugin);
    }
  }

  return { server: fastify, controllers };
}
