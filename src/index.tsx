import { Box } from '@mui/material';
import React from 'react';
import _throttle from './utils/throttle';

type KnobProps = {
  value?: number;
  onChange?: (value: number) => void;
  radius?: number;
  startAngle?: number;
  endAngle?: number;
  tickCount?: number;
  stepAngle?: number;
  valueFormatter?: (value: number) => number;
  disableTicks?: boolean;
  showValue?: boolean;
  showLabels?: boolean;
  maxLabel?: string;
  minLabel?: string;
  disabled?: boolean;
};

function Knob({
  startAngle = 45,
  endAngle = 315,
  radius = 30,
  tickCount = 28,
  stepAngle = 2,
  onChange = () => void 0,
  value,
  valueFormatter,
  disableTicks,
  showValue,
  showLabels,
  minLabel = 'Min',
  maxLabel = 'Max',
  disabled,
}: KnobProps) {
  const mountedRef = React.useRef(false);
  const [actualValue, setActualValue] = React.useState(value || 0);

  const controlled = value !== undefined;
  const angleRange = endAngle - startAngle;
  const angleIncrement = angleRange / (tickCount - 1);
  const maxActiveTickIndex =
    Math.round((actualValue * angleRange) / angleIncrement) + 1;

  React.useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  React.useEffect(() => {
    if (mountedRef.current && controlled && actualValue !== value) {
      setActualValue(value);
    }
  }, [actualValue, controlled, value]);

  function handleValueChange(value: number) {
    if (!controlled) {
      setActualValue(value);
    }

    onChange?.(value);
  }

  return (
    <Box
      position="relative"
      width={radius * 2}
      height={radius * 2}
      borderRadius="50%"
      border="solid 0.25em #0e0e0e"
      boxShadow="0 0.2em 0.1em 0.05em rgba(255, 255, 255, 0.1) inset, 0 -0.2em 0.1em 0.05em rgba(0, 0, 0, 0.5) inset, 0 0.5em 0.65em 0 rgba(0, 0, 0, 0.3)"
      sx={{
        transition: 'opacity 125ms ease-in-out',
        background:
          '#181818 -webkit-gradient(linear, left bottom, left top, color-stop(0, #1d1d1d), color-stop(1, #131313))',
        opacity: disabled ? 0.6 : undefined,
      }}
    >
      <KnobActuator
        value={actualValue}
        onChange={handleValueChange}
        radius={radius}
        startAngle={startAngle}
        endAngle={endAngle}
        stepAngle={stepAngle}
        disabled={disabled}
      />
      {showValue && (
        <Box
          component="span"
          position="absolute"
          top="50%"
          left="50%"
          color="rgba(255, 255, 255, 0.2)"
          fontSize={radius * 0.33}
          sx={{ transform: 'translate(-50%, -50%)' }}
        >
          {valueFormatter
            ? valueFormatter(actualValue)
            : Math.round(actualValue * 100)}
        </Box>
      )}
      {!disableTicks &&
        Array.from({ length: tickCount }, (_, i) => {
          const tickAngle = startAngle - 180 + angleIncrement * i;

          return (
            <KnobTick
              key={i}
              active={i < maxActiveTickIndex}
              angle={tickAngle}
            />
          );
        })}
      {showLabels && (
        <React.Fragment>
          <KnobLabel value={minLabel} radius={radius} angle={startAngle - 90} />
          <KnobLabel value={maxLabel} radius={radius} angle={endAngle + 90} />
        </React.Fragment>
      )}
    </Box>
  );
}

type KnobActuatorProps = {
  value: number;
  onChange: (value: number) => void;
  radius: number;
  startAngle: number;
  endAngle: number;
  stepAngle: number;
  disabled?: boolean;
};

function KnobActuator({
  value,
  onChange,
  radius,
  startAngle,
  endAngle,
  stepAngle,
  disabled,
}: KnobActuatorProps) {
  const knobRef = React.useRef<HTMLButtonElement | null>(null);
  const prevValueRef = React.useRef(value);

  const angleRange = endAngle - startAngle;
  const valueIncrement = stepAngle / angleRange;

  function handleMouseEvent(
    e: React.MouseEvent<HTMLElement>,
    canUpdateValue: (newValue: number, prevValue: number) => boolean
  ) {
    const el = e.target as HTMLDivElement;
    const rect = el.getBoundingClientRect();
    const clickPoint = { x: e.pageX - rect.left, y: e.pageY - rect.top };
    const angle = computeAngle(rect, clickPoint);
    const newValue = computeValueFromAngle(angle, startAngle, endAngle);

    if (canUpdateValue(newValue, prevValueRef.current)) {
      updateValue(newValue);
    }
  }

  function updateValue(value: number) {
    if (!disabled) {
      const resolvedValue = Math.max(0, Math.min(value, 1));

      onChange?.(resolvedValue);

      prevValueRef.current = resolvedValue;
    }
  }

  function handleKnobClick(e: React.MouseEvent<HTMLElement>) {
    handleMouseEvent(e, (value) => value > -0.04 && value < 1.04);
  }

  function handleKnobMouseWheel(e: React.WheelEvent<HTMLElement>) {
    const newValue =
      e.deltaY > 0 ? value + valueIncrement : value - valueIncrement;

    updateValue(newValue);
  }

  const handleKnobMouseMove = _throttle((e: React.MouseEvent<HTMLElement>) => {
    handleMouseEvent(e, (newVal, prevVal) => Math.abs(prevVal - newVal) < 0.5);
  }, 200);

  function handleKnobMouseDown() {
    document.addEventListener('mousemove', handleKnobMouseMove);
    document.addEventListener('mouseup', handleKnobMouseUp);
  }

  function handleKnobMouseUp() {
    document.removeEventListener('mousemove', handleKnobMouseMove);
    document.removeEventListener('mouseup', handleKnobMouseUp);
  }

  return (
    <Box
      ref={knobRef}
      component="button"
      position="absolute"
      width={1}
      height={1}
      borderRadius="50%"
      bgcolor="transparent"
      border="none"
      zIndex={10}
      onClick={handleKnobClick}
      onMouseDown={handleKnobMouseDown}
      onWheel={handleKnobMouseWheel}
      sx={{
        outline: 'none',
        transform: `rotate(${value * angleRange + startAngle}deg)`,
        cursor: 'pointer',
        '&:disabled': { cursor: 'unset' },
      }}
      disabled={disabled}
    >
      <Box
        position="absolute"
        bgcolor="#a8d8f8"
        boxShadow="0 0 0.4em 0 #79c3f4"
        borderRadius="50%"
        width={Math.max(Math.min(radius * 0.1, 8), 4)}
        height={Math.max(Math.min(radius * 0.1, 8), 4)}
        bottom={Math.max(Math.min(radius * 0.2, 12), 8)}
        left="50%"
        sx={{ transform: 'translateX(-50%)' }}
      />
    </Box>
  );
}

type KnobTickProps = {
  angle: number;
  active?: boolean;
};

function KnobTick({ angle, active }: KnobTickProps) {
  return (
    <Box
      position="absolute"
      width={1}
      height={1}
      top={0}
      left={0}
      zIndex={5}
      sx={{
        transform: `rotate(${angle}deg)`,
        overflow: 'visible',

        '&::after': {
          content: "''",
          position: 'absolute',
          width: '0.07rem',
          height: '0.35em',
          bgcolor: active ? '#a8d8f8' : 'rgba(255,255,255,0.2)',
          top: '-1em',
          left: '50%',
          boxShadow: active ? '0 0 0.3em 0.08em #79c3f4' : undefined,
          transition: 'all 180ms ease-out',
        },
      }}
    />
  );
}

type KnobLabelProps = {
  value: string;
  angle: number;
  radius: number;
};

// TODO: fix label position
function KnobLabel({ value, angle, radius }: KnobLabelProps) {
  return (
    <Box
      component="span"
      display="block"
      position="absolute"
      textTransform="uppercase"
      fontSize={radius * 0.3}
      bottom="calc(50% - 1.25rem)"
      left={`calc(50% - ${Math.round(value.length / 2)}ch)`}
      color="rgba(255, 255, 255, 0.5)"
      sx={{
        transform: computeLabelTransform(angle, radius, value?.length || 0),
      }}
    >
      {value}
    </Box>
  );
}

// eslint-disable-next-line
function computeLabelTransform(
  angle: number,
  radius: number,
  textLength: number
) {
  const point = computePointFromCenter(angle, radius);

  if (point.x < 0) {
    point.x -= textLength * 7;
  }

  return `translate(${point.x}px, ${point.y}px)`;
}

type Point = { x: number; y: number };

function computePointFromCenter(angle: number, radius: number): Point {
  const x = angle <= 180 ? -radius : radius;
  const y = x * Math.tan((angle * Math.PI) / 180);

  return { x, y };
}

type Rect = { width: number; height: number };

function computeAngle(rect: Rect, refPoint: Point) {
  const center = { x: rect.width / 2, y: rect.height / 2 };
  const x = refPoint.x - center.x;
  const y = refPoint.y - center.y;

  let angle = Math.atan2(y, x) * (180 / Math.PI);

  if (x <= 0 && y >= 0) {
    angle -= 90;
  } else if (x <= 0 && y <= 0) {
    angle += 270;
  } else if (x >= 0 && y <= 0) {
    angle += 270;
  } else {
    angle += 270;
  }

  return angle;
}

function computeValueFromAngle(
  angle: number,
  startAngle: number,
  endAngle: number
) {
  return (angle - startAngle) / (endAngle - startAngle);
}

export default Knob;
