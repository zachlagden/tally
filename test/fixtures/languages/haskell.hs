-- Numbers
module Numbers where

double :: Int -> Int
double n = if n > 0 then n * 2 else 0

data Shape = Circle | Square
