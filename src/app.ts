import Fastify, { FastifyInstance, RouteOptions } from "fastify";
import fg from "fast-glob";
import {
  BODY_PARAM_INDEX,
  CONTROLLER_ROUTES,
  DorsaleDependency,
  DorsaleElement,
  DorsaleSymbol,
  DorsalOptions,
  ENDPOINT_PARAMS,
  fileToAst,
  ParseResult,
  QUERY_PARAM_INDEXES,
  RouteEntry
} from "./util";
import path from "path";
import { Node } from "estree";
import { walk } from "estree-walker";

/**
 * Mounts the dorsale application
 * @param options the dorsale options
 */
export async function mountApp(options: DorsalOptions) {
  const fastify: FastifyInstance = Fastify({ logger: true });
  const rootDir = options.rootDir || process.cwd() + "/src";
  const runtimes = new Map<string, object>();
  const { symbols, dependencies, implementations } = await buildGraph(rootDir);
  const dependenciesNames = Array.from(dependencies.keys()).sort(
    (a, b) => dependencies.get(a)!.length - dependencies.get(b)!.length
  );
  for (const name of dependenciesNames) {
    const deps = dependencies.get(name)!;
    while (deps.filter((d) => !d.resolved).length > 0) {
      const dep = deps.find((d) => !d.resolved)!;
      if (
        !runtimes.has(dep.name) &&
        !(
          implementations.has(dep.name) &&
          runtimes.has(implementations.get(dep.name)!)
        )
      ) {
        throw new Error(`Missing dependency ${dep.name} for ${name}`);
      }
      dep.resolved = true;
    }
    const args =
      deps.map(
        (dep) =>
          runtimes.get(dep.name) ??
          runtimes.get(implementations.get(dep.name)!)!
      ) || [];
    const instance = new (symbols.get(name)!.constructor as any)(...args);
    runtimes.set(name, instance);
  }

  for (let [name, element] of symbols.entries()) {
    if (element.type === DorsaleElement.CONTROLLER) {
      const instance = runtimes.get(name)! as any;
      const { plugin } = addController(element.constructor, instance);
      fastify.register(plugin, { prefix: instance.prefix ?? "" });
    }
  }
  return { server: fastify, runtimes };
}

async function buildGraph(rootDir) {
  // global["$$fastify"] = fastify;
  const files = fg.sync(["**/*.ts"], { cwd: rootDir });
  const symbols = new Map<string, DorsaleSymbol>();
  const dependencies = new Map<string, DorsaleDependency[]>();
  const implementations = new Map<string, string>();
  for (const file of files) {
    const filename = path.join(rootDir, file);
    const ast = fileToAst(filename);
    const res = parseDorsaleElement(ast);
    if (res) {
      const { name, constructor } = await extractElement(filename, res.name);
      symbols.set(name, { type: res.type, constructor });
      dependencies.set(
        name,
        res.dependsOn.map((dep) => ({ name: dep, resolved: false }))
      );
      res.implemented.forEach((implemented) => {
        implementations.set(implemented, name);
      });
    }
  }
  return { symbols, dependencies, implementations };
}

export function parseDorsaleElement(fileAst: Node): ParseResult | undefined {
  let res: any = { dependsOn: [], implemented: [] };
  let isInsideClassDeclaration = false;
  walk(fileAst, {
    enter(node) {
      if (node.type === "ClassDeclaration") {
        // @ts-ignore
        node.decorators?.forEach((d) => {
          for (let e in DorsaleElement) {
            if (
              (d.expression.name ?? d.expression.callee.name) ===
              DorsaleElement[e]
            ) {
              res.name = node!.id!.name;
              res.type = DorsaleElement[e];
            }
          }
        });
        isInsideClassDeclaration = true;
      }
      // @ts-ignore
      if (isInsideClassDeclaration && node.type === "TSClassImplements") {
        // @ts-ignore
        res.implemented.push(node.expression.name);
      }
      if (isInsideClassDeclaration && node.type === "MethodDefinition") {
        // @ts-ignore
        if (node.key.name === "constructor") {
          node.value.params.forEach((param) => {
            if (param.type === "Identifier") {
              // @ts-ignore
              res.dependsOn.push(param.name);
              // @ts-ignore
            } else if (param.type === "TSParameterProperty") {
              // @ts-ignore
              res.dependsOn.push(
                param.parameter.typeAnnotation.typeAnnotation.typeName.name
              );
            }
          });
        }
      }
    },
    leave(node) {
      if (node.type === "ClassDeclaration") {
        isInsideClassDeclaration = false;
      }
    },
  });
  if (res.name && res.type) {
    return res;
  }
  return undefined;
}

function addController(controllerConstructor: Function, instance: object) {
  const routes: RouteEntry[] = Reflect.getOwnMetadata(
    CONTROLLER_ROUTES,
    controllerConstructor.prototype
  );
  const plugin = async function (fastify: FastifyInstance) {
    for (const route of routes) {
      const routeOptions = addRoute(route, controllerConstructor, instance);
      fastify.route(routeOptions);
    }
  };
  return { plugin, instance };
}

/**
 * Adds a route to the dorsale application
 * @param route the route entry to add
 * @param constructor the controller class
 * @param instance the controller instance
 */
function addRoute(route: RouteEntry, constructor: Function, instance: object) {
  const params = Reflect.getOwnMetadata(
    ENDPOINT_PARAMS,
    constructor.prototype,
    route.mapTo.method
  );
  const queryParamIndexes =
    Reflect.getOwnMetadata(
      QUERY_PARAM_INDEXES,
      constructor.prototype,
      route.mapTo.method
    ) || [];
  const bodyParamIndex = Reflect.getOwnMetadata(
    BODY_PARAM_INDEX,
    constructor.prototype,
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
      return constructor.prototype[route.mapTo.method].call(instance, ...args);
    },
  } as RouteOptions;
}

async function extractElement(filename: string, name: string) {
  const imported = await import(filename);
  const constructor = imported[name];
  return { name, constructor };
}
