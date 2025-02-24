class DorsaleError extends Error {}

export class ParsingError extends DorsaleError {
  constructor(rootDir: string) {
    super(`Cannot access directory "${rootDir}".`);
  }
}

export class DependencyResolutionError extends DorsaleError {}
