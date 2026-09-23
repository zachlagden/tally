module Main exposing (double)

-- Doubles positive numbers
double : Int -> Int
double n =
    if n > 0 then n * 2 else 0
