-- Vector helpers

local Vector = {}

function Vector.length(v)
  if v.x < 0 then
    return 0
  end
  return v.x
end

--[[ helper notes
  end of notes ]]
