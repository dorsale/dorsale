import { server } from "./server";
import { DorsalOptions } from "./util";

export async function dorsal(options: DorsalOptions) {
  const app = await server(options);
  app.listen({ port: options.port ?? 3000 }, (err, address) => {
    if (err) {
      console.error(err);
      process.exit(1);
    }
    console.log(`Server listening at ${address}`);
  });
}
