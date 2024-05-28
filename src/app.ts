import {
  BODY_PARAM_INDEX,
  CONTROLLER_PREFIX,
  CONTROLLER_ROUTES,
  DorsaleElement,
  DorsaleElementType,
  DorsaleOptions,
  DorsalePlugin,
  ENDPOINT_PARAMS,
  fileToAst,
  ParseResult,
  QUERY_PARAM_INDEXES,
  RouteEntry,
} from "./util";
import { Node } from "estree";
import { walk } from "estree-walker";
import { t } from "wint-js";
import type { Server } from "bun";
import qs from "fast-querystring";

export type DorsaleApp = {
  server: Server;
  runtimes: Map<string, object>;
  router: any;
};

export class Dorsale {
  server: Server | undefined;
  rootDir: string;
  elements = new Map<string, DorsaleElement>();
  implementations = new Map<string, string>();
  runtimes: Map<string, object>;
  plugins: DorsalePlugin[];
  pluginData: any;
  customElements: string[];
  router: any;
  ok = new Set<string>();
  interfaces = new Set<string>();

  constructor(options: DorsaleOptions) {
    this.rootDir = options.rootDir || process.cwd() + "/src";
    this.runtimes = new Map<string, object>();
    this.plugins = options.plugins ?? [];
    this.pluginData = {};
    this.customElements = this.plugins
      .map((p) => p.customElements ?? [])
      .reduce((acc, val) => acc.concat(val), []);
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    this.router = new t.FastWint();
  }

  /**
   * Mounts the dorsale application
   */
  async mountApp(): Promise<DorsaleApp> {
    // TODO: handle plugins
    // this.plugins.forEach((plugin) => {
    //   plugin.register({ pluginData: this.pluginData, server: this.fastify });
    // })

    let start = performance.now();
    await this.buildGraph();
    const buildGraphTime = Math.round(performance.now() - start);
    console.log("Graph built in", buildGraphTime, "ms");
    start = performance.now();
    this.resolveDependencies();
    this.server = Bun.serve({
      fetch: this.router.build().query as any,
    });
    const resolveDependenciesTime = Math.round(performance.now() - start);
    console.log("Dependencies resolved in", resolveDependenciesTime, "ms");

    return {
      server: this.server,
      runtimes: this.runtimes,
      router: this.router,
    };
  }

  async buildGraph() {
    const files = await this.getAllTsFiles();
    for (const file of files) {
      await this.addElementToGraph(file);
    }
  }

  async getAllTsFiles() {
    const glob = new Bun.Glob("**.ts");
    const res: string[] = [];

    for await (const file of glob.scan({ cwd: this.rootDir })) {
      res.push(this.rootDir + "/" + file);
    }
    return res;
  }

  resolveDependencies() {
    while (this.elements.size > 0) {
      const it = this.elements.keys();
      const elementName = this.getFirstElementWithNoDependency(
        it.next().value,
        it,
      );
      this.mountElement(elementName);
      this.removeElement(elementName, this.ok);
    }
  }

  removeElement(elementName: string, ok: Set<string>) {
    this.elements.delete(elementName);
    ok.add(elementName);
  }

  getFirstElementWithNoDependency = (
    start: string,
    iterator: IterableIterator<string>,
  ) => {
    const dependencies = this.elements.get(start)?.dependencies ?? [];
    if (
      dependencies.length === 0 ||
      dependencies.every((dep) => this.ok.has(dep))
    ) {
      if (this.interfaces.has(start) && !this.runtimes.has(this.implementations.get(start)!)) {
        const value = iterator.next().value;
        if (!value) return value;
        return this.getFirstElementWithNoDependency(
          iterator.next().value,
          iterator,
        );
      }
      return start;
    } else {
      for (const dep of dependencies) {
        if (!this.ok.has(dep)) {
          const value = this.getFirstElementWithNoDependency(dep, iterator);
          if (value) return value;
        }
      }
    }
  };

  mountElement(elementName: string) {
    const element = this.elements.get(elementName);
    if (element === undefined) {
      const implementation = this.implementations.get(elementName);
      if (implementation == undefined) {
        throw new Error(`Element "${elementName}" not found`);
      }
      console.log("runtimes", this.runtimes);
      console.log("implementation", implementation);
      const instance = this.runtimes.get(implementation);
      if (instance === undefined) {
        throw new Error(`No implementation found for element "${elementName}"`);
      }
      this.runtimes.set(elementName, instance);
      return;
    }
    switch (element.type) {
      case DorsaleElementType.CONTROLLER: {
        const instance = new (element.constructor as any)(
          ...element.dependencies.map((dep) => this.runtimes.get(dep)),
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
          this.addRoute(route, prefix, element.constructor, instance);
        }
        this.runtimes.set(elementName, instance);
        break;
      }
      case DorsaleElementType.COMPONENT: {
        const instance = new (element.constructor as any)(
          ...element.dependencies.map((dep) => this.runtimes.get(dep)),
        );
        this.runtimes.set(elementName, instance);
        console.log("runtimes", this.runtimes)
        break;
      }
      case DorsaleElementType.REPOSITORY: {
        const instance = new (element.constructor as any)(
          ...element.dependencies.map((dep) => this.runtimes.get(dep)),
        );
        this.runtimes.set(elementName, instance);
        console.log("runtimes", this.runtimes);
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

  tryParsingElementInfo(fileAst: Node): ParseResult | undefined {
    const res: any = { dependsOn: [], implemented: [] };
    let isInsideClassDeclaration = false;
    const customElements = this.customElements;
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
                break;
              }
            }
            if (
              customElements.includes(
                d.expression.name ?? d.expression.callee.name,
              )
            ) {
              res.name = node?.id?.name;
              res.type = DorsaleElementType.CUSTOM;
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
   * @param prefix the prefix of the controller
   * @param constructor the controller class
   * @param instance the controller instance
   */
  addRoute(
    route: RouteEntry,
    prefix: string = "",
    constructor: Function,
    instance: object,
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
    const paramHandlers: ((request: Request) => any)[] = params.map(
      (param: string, index: number) => {
        if (queryParamIndexes.includes(index)) {
          return this.queryParamHandler(param);
        } else if (bodyParamIndex === index) {
          return this.bodyParamHandler();
        } else {
          return this.requestParamHandler(param);
        }
      },
    );

    // This function returns an array of the computed values after applying the handlers to the request
    const computeParameterValues: (
      request: Request,
    ) => Promise<Awaited<any>[]> = async function (request: Request) {
      // @ts-ignore
      request.query = qs.parse(request.req.url.split("?")[1]);
      return await Promise.all(
        paramHandlers.map(
          async (f: (request: Request) => any) => await f(request),
        ),
      );
    };

    this.router.put(route.method, prefix + route.url, async (req) => {
      const res = await constructor.prototype[route.mapTo.method].call(
        instance,
        ...(await computeParameterValues(req)),
      );

      return Response.json(res);
    });
  }

  async importElement(filename: string, name: string) {
    const imported = await import(filename);
    const constructor = imported[name];
    return { name, constructor };
  }

  private async addElementToGraph(file: string) {
    const ast = fileToAst(file);
    const elementInfo = this.tryParsingElementInfo(ast);
    if (elementInfo) {
      const { name, constructor } = await this.importElement(
        file,
        elementInfo.name,
      );
      this.elements.set(name, {
        name,
        type: elementInfo.type,
        constructor,
        dependencies: elementInfo.dependsOn,
      });
      elementInfo.implemented.forEach((implemented) => {
        this.implementations.set(implemented, name);
        this.interfaces.add(implemented);
      });
    }
  }

  private requestParamHandler(param: string) {
    return function (context: any) {
      // @ts-ignore
      return context.params[param];
    };
  }

  private queryParamHandler(param: string) {
    return function (context: any) {
      // @ts-ignore
      return context.query[param];
    };
  }

  private bodyParamHandler() {
    return async function (context: any) {
      return await context.req.json();
    };
  }
}

export const mountApp = (options: DorsaleOptions) => {
  const dorsale = new Dorsale(options);
  return dorsale.mountApp();
};
