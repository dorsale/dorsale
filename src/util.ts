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

export enum DorsaleElementType {
  CONTROLLER = "Controller",
  COMPONENT = "Component",
  REPOSITORY = "Repository",
  DAO = "Dao",
  CUSTOM = "Custom",
}

export type DorsaleOptions = {
  rootDir?: string;
  port?: number;
  plugins?: DorsalePlugin[];
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

export interface DorsaleElement {
  name: string;
  type: DorsaleElementType;
  constructor: Function;
  dependencies: string[]
}

export type DorsaleDependency = {
  name: string;
  resolved: boolean;
};

export type ParseResult = {
  name: string;
  type: DorsaleElementType;
  dependsOn: string[];
  implemented: string[];
};

export type DorsalePlugin = {
  name: string;
  customElements?: string[];
  onMount: (target: Function, instance: object, pluginData: any) => void;
}

export const QUERY_PARAM_INDEXES = "queryParamIndexes";
export const BODY_PARAM_INDEX = "bodyParamIndex";
export const ENDPOINT_PARAMS = "endpointParams";
export const CONTROLLER_ROUTES = "controllerRoutes";
export const CONTROLLER_PREFIX = "controllerPrefix";

