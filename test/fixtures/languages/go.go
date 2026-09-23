// Package shapes has point helpers.

package shapes

type Point struct {
	X int
}

func (p Point) Double() int {
	if p.X < 0 {
		return 0
	}
	return p.X * 2
}

func Zero() int { return 0 }
var origin = Point{}
