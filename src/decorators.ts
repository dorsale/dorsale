export function Controller(target: Function) {
  target.prototype.id = 1234;
  console.log("hi from controller decorator");
}

function getFnParamNames(fn) {
  const functionString = fn.toString();
  return functionString
    .match(/\(.*?\)/)[0]
    .replace(/[()]/gi, "")
    .replace(/\s/gi, "")
    .split(",");
}

export function Get(url: string) {
  return function(
    target: Object,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const params = getFnParamNames(descriptor.value);
    global["$$fastify"].get(
      url,
      (request) => {
        const args = params.map((param) => request.params[param]);
        return { res: descriptor.value.call(target, ...args) };
      }
    );
  };
}
