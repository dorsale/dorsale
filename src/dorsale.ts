import { mountApp } from "./app";
import { DorsaleOptions } from "./util";

/**
 * Creates a new dorsale application and mounts it on the given port
 * @param options The options to use when creating the application
 */
export async function dorsale(options: DorsaleOptions) {
  return await mountApp(options);
}
