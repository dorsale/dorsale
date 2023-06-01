import { Node } from "estree";
import fs from "fs";
import { parse } from "@typescript-eslint/typescript-estree";

export function fileToAst(filename: string) {
  const code = fs.readFileSync(filename, "utf8");
  return parse(code, {
    loc: true,
    range: true,
  }) as Node;
}

export enum DorsaleElement {
  CONTROLLER = "Controller",
  COMPONENT = "Component",
}

export type DorsalOptions = {
  rootDir?: string;
  port?: number;
};

export type RouteEntry = {
  url: string;
  method: string;
  mapTo: {
    controller: string;
    method: string;
  };
};

export enum HttpMethod {
  GET = "GET",
  POST = "POST",
  PUT = "PUT",
  PATCH = "PATCH",
  DELETE = "DELETE",
}

export type DorsaleSymbol = {
  type: DorsaleElement;
  constructor: Function;
};

export type DorsaleDependency = {
  name: string;
  resolved: boolean;
};

export type ParseResult = {
  name: string;
  type: DorsaleElement;
  dependsOn: string[];
  implemented: string[];
};

export const QUERY_PARAM_INDEXES = "queryParamIndexes";
export const BODY_PARAM_INDEX = "bodyParamIndex";
export const ENDPOINT_PARAMS = "endpointParams";
export const CONTROLLER_ROUTES = "controllerRoutes";
export const CONTROLLER_PREFIX = "controllerPrefix";

