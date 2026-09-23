# Geometry helpers

class Circle:
    """A circle."""
    def __init__(self, r):
        self.r = r

def area(c):
    if c.r < 0:
        return 0
    return 3.14 * c.r * c.r

PI = 3.14
