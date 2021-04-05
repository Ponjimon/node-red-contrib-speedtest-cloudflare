export const flat = <T extends [][]>(arr: T) =>
  arr.reduce((flat, next) => flat.concat(next), []);
