export * from "../../../node_modules/tslib/tslib.es6.js";

export function __spreadArray(to, from, pack) {
  if (pack || arguments.length === 2) {
    for (let index = 0, length = from.length; index < length; index += 1) {
      if (!(index in from)) continue;
      to.push(from[index]);
    }
    return to;
  }

  return to.concat(from);
}
