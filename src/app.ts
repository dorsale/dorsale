import Fastify, { FastifyInstance, FastifyRequest, RouteOptions } from "fastify";
import fg from "fast-glob";
import {
  BODY_PARAM_INDEX,
  CONTROLLER_ROUTES,
  DorsaleElement,
  DorsaleElementType,
  DorsaleOptions,
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
export async function mountApp(options: DorsaleOptions) {
  const fastify: FastifyInstance = Fastify({ logger: true });
  const rootDir = options.rootDir || process.cwd() + "/src";
  const runtimes = new Map<string, object>();
  let start = performance.now();
  const { elements, implementations } = await buildGraph(rootDir);
  const buildGraphTime = Math.round(performance.now() - start);
  console.log("Graph built in", buildGraphTime, "ms");
  start = performance.now();
  resolveDependencies(elements, runtimes, implementations, fastify);
  const resolveDependenciesTime = Math.round(performance.now() - start);
  console.log("Dependencies resolved in", resolveDependenciesTime, "ms");

  return { server: fastify, runtimes };
}

async function buildGraph(rootDir: string) {
  // global["$$fastify"] = fastify;
  const files = fg.sync(["**/*.ts"], { cwd: rootDir });
  const elements = new Map<string, DorsaleElement>();
  const implementations = new Map<string, string>();
  for (const file of files) {
    const filename = path.join(rootDir, file);
    const ast = fileToAst(filename);
    const res = parseDorsaleElement(ast);
    if (res) {
      const { name, constructor } = await importElement(filename, res.name);
      elements.set(name, {
        name,
        type: res.type,
        constructor,
        dependencies: res.dependsOn,
      });
      res.implemented.forEach((implemented) => {
        implementations.set(implemented, name);
      });
    }
  }
  return { elements, implementations };
}

function resolveDependencies(
  elements: Map<string, DorsaleElement>,
  runtimes: Map<string, object>,
  implementations: Map<string, string>,
  server: FastifyInstance,
) {
  const ok = new Set<string>();
  while (elements.size > 0) {
    const elementName = getFirstElementWithNoDependency(
      elements.keys().next().value,
    );
    mountElement(elementName, elements, runtimes, implementations, server);
    removeElement(elementName);
  }

  function getFirstElementWithNoDependency(start: string) {
    const dependencies = elements.get(start)?.dependencies ?? [];
    if (dependencies.length === 0 || dependencies.every((dep) => ok.has(dep))) {
      return start;
    } else {
      return getFirstElementWithNoDependency(dependencies[0]);
    }
  }

  function removeElement(elementName: string) {
    elements.delete(elementName);
    ok.add(elementName);
  }
}

function mountElement(
  elementName: string,
  elements: Map<string, DorsaleElement>,
  runtimes: Map<string, object>,
  implementations: Map<string, string>,
  server: FastifyInstance,
) {
  const element =
    elements.get(elementName) ??
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    elements.get(implementations.get(elementName)!)!;
  switch (element.type) {
    case DorsaleElementType.CONTROLLER: {
      const instance = new (element.constructor as any)(
        ...element.dependencies.map((dep) => runtimes.get(dep)),
      );
      const routes: RouteEntry[] = Reflect.getOwnMetadata(
        CONTROLLER_ROUTES,
        element.constructor.prototype,
      );
      const plugin = async function (fastify: FastifyInstance) {
        for (const route of routes) {
          const routeOptions = addRoute(route, element.constructor, instance);
          fastify.route(routeOptions);
        }
      };
      server.register(plugin, { prefix: instance.prefix ?? "" });
      runtimes.set(elementName, instance);
      break;
    }
    case DorsaleElementType.COMPONENT:
    case DorsaleElementType.REPOSITORY: {
      const instance = new (element.constructor as any)(
        ...element.dependencies.map((dep) => runtimes.get(dep)),
      );
      runtimes.set(elementName, instance);
      break;
    }
    case DorsaleElementType.DAO:
      break;
  }
}

export function parseDorsaleElement(fileAst: Node): ParseResult | undefined {
  const res: any = { dependsOn: [], implemented: [] };
  let isInsideClassDeclaration = false;
  walk(fileAst, {
    enter(node) {
      if (node.type === "ClassDeclaration") {
        // @ts-ignore
        node.decorators?.forEach((d) => {
          for (const e in DorsaleElementType) {
            if (
              (d.expression.name ?? d.expression.callee.name) ===
              DorsaleElementType[e]
            ) {
              res.name = node?.id?.name;
              res.type = DorsaleElementType[e];
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
              res.dependsOn.push(
                // @ts-ignore
                param.parameter.typeAnnotation.typeAnnotation.typeName.name,
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
    route.mapTo.method,
  );
  const queryParamIndexes =
    Reflect.getOwnMetadata(
      QUERY_PARAM_INDEXES,
      constructor.prototype,
      route.mapTo.method,
    ) || [];
  const bodyParamIndex = Reflect.getOwnMetadata(
    BODY_PARAM_INDEX,
    constructor.prototype,
    route.mapTo.method,
  );
  const requestParamHandler = (param: string) =>
    function (request: FastifyRequest) {
      // @ts-ignore
      return request.params[param];
    };
  const queryParamHandler = (param: string) =>
    function (request: FastifyRequest) {
      // @ts-ignore
      return request.query[param];
    };
  const bodyParamHandler = () =>
    function (request: FastifyRequest) {
      return request.body;
    };
  const paramHandlers: ((request: FastifyRequest) => any)[] = params.map((param: string, index: number) => {
    if (queryParamIndexes.includes(index)) {
      return queryParamHandler(param);
    } else if (bodyParamIndex === index) {
      return bodyParamHandler();
    } else {
      return requestParamHandler(param);
    }
  });
  const parameterMatching: (request: FastifyRequest) => any[] = function (request: FastifyRequest) {
    return paramHandlers.map((f: (request: FastifyRequest) => any) => f(request));
  };
  return {
    method: route.method,
    url: route.url,
    handler: async (request) => {
      return constructor.prototype[route.mapTo.method].call(instance, ...parameterMatching(request));
    },
  } as RouteOptions;
}

async function importElement(filename: string, name: string) {
  const imported = await import(filename);
  const constructor = imported[name];
  return { name, constructor };
}
