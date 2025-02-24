import { DorsaleElement } from "./util";
import { t } from "wint-js";
import { mountElement } from "./mounting";
import { DependencyResolutionError } from "./error";

export function resolveDependencies(
  elements: Map<string, DorsaleElement>,
  implementations: Map<string, string>,
): { runtimes: Map<string, object>; router: any } {
  const runtimes = new Map<string, object>();
  const router = new t.FastWint();
  const ok = new Set<string>();

  while (elements.size > 0) {
    const elementName = getFirstElementWithNoDependency(
      elements,
      implementations,
      ok,
    );
    const element = elements.get(elementName);
    if (element === undefined) {
      throw new DependencyResolutionError(
        `Element with name "${elementName}" was not found.`,
      );
    }
    mountElement(element, runtimes, router);
    elements.delete(elementName);
    ok.add(elementName);
  }
  return { runtimes, router };
}

function getFirstElementWithNoDependency(
  elements: Map<string, DorsaleElement>,
  implementations: Map<string, string>,
  ok: Set<string>,
) {
  const iterator = elements.keys();

  const depthFirstSearch = (start: string): string | null => {
    const dependencies = elements.get(start)?.dependencies ?? [];
    if (dependencies.length === 0 || dependencies.every((dep) => ok.has(dep))) {
      if (implementations.has(start)) {
        const implementation = implementations.get(start)!;
        if (ok.has(implementation)) {
          return null;
        }
        return depthFirstSearch(implementation);
      }
      return start;
    } else {
      for (const dep of dependencies) {
        const res = depthFirstSearch(dep);
        if (res) {
          return res;
        }
      }
      return start;
    }
  };
  let start = iterator.next().value;
  while (start) {
    const res = depthFirstSearch(start);
    if (res) {
      return res;
    } else {
      start = iterator.next().value;
    }
  }
  throw new DependencyResolutionError("No element found with no dependencies");
}
