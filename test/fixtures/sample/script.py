"""Sample Python fixture for tally tests."""


def greet(name: str) -> str:
    if not name:
        return "world"
    return f"hello {name}"


class Greeter:
    def __init__(self, prefix: str = "hi") -> None:
        self.prefix = prefix

    def say(self, name: str) -> str:
        return f"{self.prefix} {name}"


PI = 3.14159
RADIUS = 7
