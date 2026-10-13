// docs:start example
type Point = {
  x: number;
  y: number;
};

function horizontal(point: Point) {
  return point.x;
}
const point: Point = { x: 3, y: 4 };
console.log(horizontal(point));
// docs:end example

export {};
