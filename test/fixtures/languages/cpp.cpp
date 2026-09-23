// Shape hierarchy

class Shape {
public:
    virtual int area() { return 0; }
};

int twice(int x) {
    int y = x * 2;
    return y > 10 ? 10 : y;
}
