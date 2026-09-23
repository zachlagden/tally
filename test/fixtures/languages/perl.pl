# Greeter package
package Greeter;

sub greet {
    my $name = shift;
    if ($name) { return "hi $name"; }
    return "hi";
}
1;
