import Fastify, { FastifyInstance } from "fastify";
import fg from "fast-glob";
import { fileToAst, isController } from "./util";
import path from "path";

export async function dorsal(currentDir: string = process.cwd() + "/src") {
  const fastify: FastifyInstance = Fastify({ logger: true });
  global["$$fastify"] = fastify;

  const files = fg.sync(["**/*.ts"], { cwd: currentDir });
  for (const file of files) {
    const ast = fileToAst(currentDir + "/" + file);
    if (isController(ast)) {
      await import(path.join(currentDir, file));
    }
  }

  return fastify;
}
