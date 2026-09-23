# Math helpers

defmodule MathHelpers do
  def double(n) do
    if n > 0 do
      n * 2
    end
  end

  defp secret, do: 42
end
