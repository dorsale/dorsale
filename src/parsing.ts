import { access } from "node:fs/promises";
import { ParsingError } from "./error";
import { DorsaleElement, DorsaleElementType, ParseResult } from "./util";
import { Node, walk } from "estree-walker";
import fs from "fs";
import { parse } from "@typescript-eslint/typescript-estree";

/**
 * Returns all TS file names in the given directory
 * @param rootDir the path to the directory where to search for files
 * @return an array with all file paths
 */
export async function getAllTsFiles(rootDir: string) {
  // ensure we can access the directory
  try {
    await access(rootDir);
  } catch {
    throw new ParsingError(rootDir);
  }

  const glob = new Bun.Glob("**.ts");
  const res: string[] = [];

  for await (const file of glob.scan({ cwd: rootDir })) {
    res.push(rootDir + "/" + file);
  }
  return res;
}

/**
 * Parses all files at the given paths and extracts the Dorsale elements from them
 * @param files the file paths
 * @return the Dorsale elements mapped by their name
 */
export async function getElementsFromFiles(
  files: string[],
): Promise<Map<string, DorsaleElement>> {
  const elements = new Map<string, DorsaleElement>();
  for (const file of files) {
    const element = await getElementFromFile(file);
    if (element) {
      elements.set(element.name, element);
    }
  }
  return elements;
}

/**
 * Extracts a Dorsale element from a file at a given path
 * @param filePath the path to the file
 * @return the Dorsale element found in the file or `null` if no element was found
 */
async function getElementFromFile(
  filePath: string,
): Promise<DorsaleElement | null> {
  const ast = fileToAst(filePath);
  const elementInfo = getElementInfoFromAst(ast);
  if (elementInfo) {
    const constructor = await importElement(filePath, elementInfo.name);
    return {
      name: elementInfo.name,
      type: elementInfo.type,
      constructor,
      dependencies: elementInfo.dependsOn,
      implemented: elementInfo.implemented,
    };
  } else {
    return null;
  }
}

/**
 * Computes the AST corresponding to a file at a given path
 * @param filePath the path to the file
 * @return the AST of the file
 */
function fileToAst(filePath: string): Node {
  const code = fs.readFileSync(filePath, "utf8");
  return parse(code, {
    loc: true,
    range: true,
  }) as Node;
}

/**
 * Get dependencies and implementations of a Dorsale element from its AST
 * @param fileAst
 * @return an object containing dependencies and implementation or `null` if the element could not be parsed
 */
function getElementInfoFromAst(fileAst: Node): ParseResult | null {
  const res: any = { dependsOn: [], implemented: [] };
  let isInsideClassDeclaration = false;
  // const customElements = this.customElements;
  walk(fileAst, {
    enter(node) {
      if (node.type === "ClassDeclaration") {
        // @ts-ignore
        node.decorators?.forEach((d) => {
          for (const e in DorsaleElementType) {
            if (
              (d.expression.name ?? d.expression.callee.name) ===
              // @ts-ignore
              DorsaleElementType[e]
            ) {
              res.name = node?.id?.name;
              // @ts-ignore
              res.type = DorsaleElementType[e];
              break;
            }
          }
          // if (
          //   customElements.includes(
          //     d.expression.name ?? d.expression.callee.name,
          //   )
          // ) {
          //   res.name = node?.id?.name;
          //   res.type = DorsaleElementType.CUSTOM;
          // }
        });
        isInsideClassDeclaration = true;
      }
      // @ts-ignore
      if (isInsideClassDeclaration && node.type === "TSClassImplements") {
        // @ts-ignore
        res.implemented.push(node.expression.name);
      }
      if (isInsideClassDeclaration && node.type === "MethodDefinition") {
        // @ts-ignore
        if (node.key.name === "constructor") {
          node.value.params.forEach((param) => {
            if (param.type === "Identifier") {
              // @ts-ignore
              res.dependsOn.push(param.name);
              // @ts-ignore
            } else if (param.type === "TSParameterProperty") {
              res.dependsOn.push(
                // @ts-ignore
                param.parameter.typeAnnotation.typeAnnotation.typeName.name,
              );
            }
          });
        }
      }
    },
    leave(node) {
      if (node.type === "ClassDeclaration") {
        isInsideClassDeclaration = false;
      }
    },
  });
  if (res.name && res.type) {
    return res;
  }
  return null;
}

/**
 * Actually import the JS file of a Dorsale element into the current runtime. Thus running all decorator code.
 * @param filename the path to the file
 * @param name the name of the element
 * @return the element's constructor
 */
async function importElement(
  filename: string,
  name: string,
): Promise<Function> {
  const imported = await import(filename);
  return imported[name];
}
