import React from "react";
import { Box, Text } from "ink";
import Spinner from "ink-spinner";
import { truncateMiddle } from "../util/format.js";

interface Props {
  root: string;
  current: number;
  total: number;
  currentFile?: string;
}

export function ScanProgress({ root, current, total, currentFile }: Props) {
  const pct = total > 0 ? Math.floor((current / total) * 100) : 0;
  return (
    <Box flexDirection="column" paddingX={1} paddingY={0}>
      <Box marginBottom={1}>
        <Text>
          <Text color="magentaBright" bold>{"▌ "}</Text>
          <Text bold color="whiteBright">tally  </Text>
          <Text dimColor>{truncateMiddle(root, 60)}</Text>
        </Text>
      </Box>
      <Box>
        <Text color="cyanBright"><Spinner type="dots" /></Text>
        <Text>{"  scanning  "}</Text>
        <Text bold>{current}</Text>
        <Text dimColor> / </Text>
        <Text bold>{total}</Text>
        <Text dimColor> files  ·  </Text>
        <Text color="greenBright">{pct}%</Text>
      </Box>
      {currentFile && (
        <Box marginTop={1}>
          <Text dimColor>{truncateMiddle(currentFile, 72)}</Text>
        </Box>
      )}
    </Box>
  );
}
