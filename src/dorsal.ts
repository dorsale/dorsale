import { mountApp } from "./app";
import { DorsalOptions } from "./util";

export async function dorsal(options: DorsalOptions) {
  const { server } = await mountApp(options);
  server.listen({ port: options.port ?? 3000 }, (err, address) => {
    if (err) {
      console.error(err);
      process.exit(1);
    }
    console.log(`Server listening at ${address}`);
  });
}
