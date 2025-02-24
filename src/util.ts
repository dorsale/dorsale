import * as Bun from "bun";

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
  method: HttpMethod;
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
  dependencies: string[];
  implemented: string[];
}

export type ParseResult = {
  name: string;
  type: DorsaleElementType;
  dependsOn: string[];
  implemented: string[];
};

export type DorsalePlugin = {
  name: string;
  customElements?: string[];
  register: ({
    pluginData,
    server,
  }: {
    pluginData: any;
    server: Bun.Server;
  }) => void;
  onMount: {
    [element: string]: (
      target: Function,
      instance: object,
      pluginData: any,
    ) => void;
  };
};
