import Fastify, { FastifyInstance } from "fastify";
import fg from "fast-glob";
import { DorsalOptions, fileToAst, isController } from "./util";
import path from "path";

export async function server(options: DorsalOptions) {
  const currentDir = options.currentDir || process.cwd() + "/src";
  const fastify: FastifyInstance = Fastify({ logger: true });
  global["$$fastify"] = fastify;

  const files = fg.sync(["**/*.ts"], { cwd: currentDir });
  for (const file of files) {
    const filename = path.join(currentDir, file);
    const ast = fileToAst(filename);
    if (isController(ast)) {
      await import(filename);
    }
  }

  return fastify;
}
