// Wallet

class Wallet {
    val coins = 3

    fun spend(n: Int): Int {
        if (n > coins) {
            return 0
        }
        return coins - n
    }
}
