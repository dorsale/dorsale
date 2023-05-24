import { dorsal } from "./server";

dorsal()
  .then((app) => {
    app.listen({ port: 3000 }, (err, address) => {
      if (err) {
        console.error(err);
        process.exit(1);
      }
      console.log(`Server listening at ${address}`);
    });
  });
