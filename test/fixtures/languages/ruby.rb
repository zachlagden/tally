# Greeter

class Greeter
  def initialize(name)
    @name = name
  end

  def greet
    if @name
      "hi #{@name}"
    end
  end
end
