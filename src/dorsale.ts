import { mountApp } from "./app";
import { DorsalOptions } from "./util";

/**
 * Creates a new dorsale application and mounts it on the given port
 * @param options The options to use when creating the application
 */
export async function dorsale(options: DorsalOptions) {
  const all = await mountApp(options);
  all.server.listen({ port: options.port ?? 3000 }, (err, address) => {
    if (err) {
      console.error(err);
      process.exit(1);
    }
    console.log(`Server listening at ${address}`);
  });
  return all;
}
