// Account model

public class Account {
    private int balance = 0;

    public Account() {}

    public void deposit(int amount) {
        int next = balance + amount;
        if (amount > 0) {
            balance = next;
        }
    }
}
