// Button component

export function Button({ label }: { label: string }) {
  return label ? <button>{label}</button> : null;
}

export class Panel {
  render() {
    if (this) { return 1; }
    return 0;
  }
}

const size = 3;
