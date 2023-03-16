import { Box, Stack, getLuminance } from '@mui/material';
import Knob from 'knob';

function App() {
  // const [value, setValue] = React.useState(0);
  const color = '#131313';
  const bgcolor = getLuminance(color) >= 0.5 ? 'white' : 'black';

  return (
    <Box position="absolute" bgcolor={bgcolor} sx={{ inset: 0 }}>
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
          color={color}
          tint="#ff2faf"
          showValue
          showLabels
        />
        <Knob color={color} tint="#afaf00" showLabels />
        <Stack gap={8}>
          <Knob color={color} radius={24} startAngle={30} endAngle={240} />
          <Knob
            color={color}
            radius={24}
            startAngle={45}
            endAngle={270}
            maxLabel=""
            showLabels
          />
        </Stack>
        <Knob color={color} radius={18} />
      </Stack>
    </Box>
  );
}

export default App;
