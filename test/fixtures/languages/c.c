/* Stack helpers */

struct stack {
    int top;
};

int push(struct stack *s, int v) {
    int next = s->top + 1;
    if (next > 100) {
        return -1;
    }
    s->top = next;
    return v;
}
