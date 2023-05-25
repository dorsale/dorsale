import { Node } from "estree";
import { walk } from "estree-walker";
import fs from "fs";
import { parse } from "@typescript-eslint/typescript-estree";

export function fileToAst(filename: string) {
  const code = fs.readFileSync(filename, "utf8");
  return parse(code, {
    loc: true,
    range: true
  }) as Node;
}

export function isController(fileAst: Node) {
  let res = false;
  walk(fileAst, {
    enter(node) {
      if (node.type === "ClassDeclaration") {
        // @ts-ignore
        node.decorators?.forEach((d) => {
          if (d.expression.callee.name === "Controller") {
            res = true;
            this.skip();
          }
        });
      }
    }
  });
  return res;
}

export type DorsalOptions = {
  currentDir?: string;
  port?: number;
};
