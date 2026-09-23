// Point type

const Point = struct {
    x: i32,
};

fn clamp(v: i32) i32 {
    if (v < 0) {
        return 0;
    }
    return v;
}
