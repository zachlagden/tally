// sample TypeScript fixture for tally tests
export function add(a: number, b: number): number {
  if (a < 0) return b;
  if (b < 0) return a;
  return a + b;
}

export function multiply(a: number, b: number): number {
  return a * b;
}

export class Calculator {
  private value = 0;

  add(n: number): this {
    this.value += n;
    return this;
  }

  reset(): void {
    this.value = 0;
  }
}

const greeting = "hello";
const count = 42;
let mutable = true;
