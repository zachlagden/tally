// Stack

class Stack {
  val limit = 10

  def push(n: Int): Int = {
    if (n > limit) 0 else n
  }
}
