// Simple vault

contract Vault {
    uint256 public total;

    function deposit(uint256 amount) public {
        uint256 next = total + amount;
        if (next > total) {
            total = next;
        }
    }
}
