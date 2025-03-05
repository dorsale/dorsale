import { DorsaleElement, DorsaleOptions } from "./util";
import type { Server } from "bun";
import { getAllTsFiles, getElementsFromFiles } from "./parsing";
import { resolveDependencies } from "./dependencyResolution";

export type DorsaleApp = {
  server: Server;
  runtimes: Map<string, object>;
  router: any;
};

/**
 * Mounts the dorsale application
 */
export async function mountApp(options: DorsaleOptions): Promise<DorsaleApp> {
  const rootDir = options.rootDir || process.cwd();
  // const plugins = options.plugins ?? [];
  // const pluginData = {};
  // const customElements = plugins
  //   .map((p) => p.customElements ?? [])
  //   .reduce((acc, val) => acc.concat(val), []);

  // TODO: handle plugins
  // this.plugins.forEach((plugin) => {
  //   plugin.register({ pluginData: this.pluginData, server: this.fastify });
  // })
  const implementations = new Map<string, string>();

  let start = performance.now();
  const files = await getAllTsFiles(rootDir);
  const elements = await getElementsFromFiles(files);

  elements.forEach((element: DorsaleElement) => {
    element.implemented.forEach((implemented) => {
      implementations.set(implemented, element.name);
    });
  });
  const buildGraphTime = Math.round(performance.now() - start);
  console.log("Graph built in", buildGraphTime, "ms");
  start = performance.now();
  const { runtimes, router } = resolveDependencies(elements, implementations);
  const server = Bun.serve({
    fetch: router.build().query as any,
    port: options.port,
  });
  const resolveDependenciesTime = Math.round(performance.now() - start);
  console.log("Dependencies resolved in", resolveDependenciesTime, "ms");

  console.log("Dorsale listening on", server.url.href);

  return {
    server,
    runtimes,
    router,
  };
}
