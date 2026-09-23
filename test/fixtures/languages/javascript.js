// Queue helpers

class Queue {
  push(item) {
    for (const x of [item]) { this.last = x; }
  }
}

function first(list) {
  while (list.length > 5) { list.pop(); }
  return list[0];
}

const add = (a, b) => a + b;
