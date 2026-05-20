import { render, Box, Text } from "ink";
import Gradient from "ink-gradient";
import BigText from "ink-big-text";
import React from "react";

function App() {
  return (
    <Box flexDirection="column" paddingX={1}>
      <Gradient name="atlas">
        <BigText text="tally" font="tiny" />
      </Gradient>
      <Text dimColor>scaffolding works — ready to build</Text>
    </Box>
  );
}

render(<App />);
