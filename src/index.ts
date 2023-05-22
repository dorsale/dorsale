import Fastify, { FastifyInstance } from "fastify";
import fg from "fast-glob";
import { fileToAst, isController } from "./util";

const fastify: FastifyInstance = Fastify({ logger: true });
global["$$fastify"] = fastify;
(async () => {
  const currentDir = process.cwd() + "/src";
  const files = fg.sync(["**/*.ts"], { cwd: currentDir });
  for (const file of files) {
    const ast = fileToAst(currentDir + "/" + file);
    if (isController(ast)) {
      await import(currentDir + "/" + file);
    }
  }
})().then(() => {
  fastify.listen({ port: 3000 }, (err, address) => {
    if (err) {
      console.error(err);
      process.exit(1);
    }
    console.log(`Server listening at ${address}`);
  });
});
