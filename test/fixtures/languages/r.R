# Stats helpers
mean2 <- function(x) {
  if (length(x) == 0) return(NA)
  sum(x) / length(x)
}

total <- 10
