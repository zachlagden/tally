# Deploy helpers

greet() {
  if [ -n "$1" ]; then
    echo "hi $1"
  fi
}

name="world"
