# Deploy helpers

greet() {
  if [ -n "$1" ]; then
    echo "hi $1"
  fi
}

name="world"

case "$name" in
  world) greet "$name" ;;
esac

cat <<EOF
hello $name
EOF
