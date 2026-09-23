<?php
// Cart

class Cart {
    private $items = [];

    public function add($item) {
        if ($item) {
            $this->items[] = $item;
        }
    }
}
