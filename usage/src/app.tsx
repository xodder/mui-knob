import { Box, Stack } from '@mui/material';
import Knob from 'knob';

function App() {
  // const [value, setValue] = React.useState(0);

  return (
    <Box position="absolute" bgcolor="black" sx={{ inset: 0 }}>
      <Stack
        gap={16}
        width={1}
        height={1}
        flexDirection="row"
        justifyContent="center"
        alignItems="center"
      >
        <Knob
          startAngle={90}
          minLabel="0%"
          maxLabel="100%"
          showValue
          showLabels
        />
        <Knob showLabels />
        <Stack gap={8}>
          <Knob radius={24} startAngle={30} endAngle={240} />
          <Knob radius={24} startAngle={45} endAngle={270} maxLabel="" showLabels />
        </Stack>
        <Knob radius={18} />
      </Stack>
    </Box>
  );
}

export default App;
