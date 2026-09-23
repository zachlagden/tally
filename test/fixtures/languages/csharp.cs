// Inventory

public class Inventory
{
    private int count = 0;

    public void Add(int n)
    {
        var next = count + n;
        if (next > 0) { count = next; }
    }
}
