// Greeter utilities

export class Greeter {
  greet(name: string): string {
    return name ? `hi ${name}` : "hi";
  }
}

export function double(n: number): number {
  if (n < 0) {
    return 0;
  }
  return n * 2;
}

const limit = 10;
