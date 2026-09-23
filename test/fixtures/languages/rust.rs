// Counter type

struct Counter {
    n: u32,
}

impl Counter {
    fn bump(&mut self) {
        if self.n < 10 {
            self.n += 1;
        }
    }
}

fn main() {
    let c = Counter { n: 0 };
}
