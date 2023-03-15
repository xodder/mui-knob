import { withStyles } from "@material-ui/core";
import clsx from "clsx";
import React from "react";
import _throttle from "lodash/throttle";

const styles = () => ({
  root: ({ radius }) => ({
    position: "relative",
    width: radius * 2,
    height: radius * 2,
    borderRadius: "50%",
    border: "solid 0.25em #0e0e0e",
    background:
      "#181818 -webkit-gradient(linear, left bottom, left top, color-stop(0, #1d1d1d), color-stop(1, #131313))",
    boxShadow:
      "0 0.2em 0.1em 0.05em rgba(255, 255, 255, 0.1) inset, 0 -0.2em 0.1em 0.05em rgba(0, 0, 0, 0.5) inset, 0 0.5em 0.65em 0 rgba(0, 0, 0, 0.3)",
    transition: "opacity 125ms ease-in-out",
  }),
  rootDisabled: {
    opacity: 0.6,
  },
  knob: {
    position: "absolute",
    width: "100%",
    height: "100%",
    borderRadius: "50%",
    outline: "none",
    border: "none",
    background: "transparent",
    zIndex: 10,
    cursor: "pointer",
    "&:disabled": {
      cursor: "unset",
    },
  },
  indicator: ({ radius }) => ({
    position: "absolute",
    backgroundColor: "#a8d8f8",
    boxShadow: "0 0 0.4em 0 #79c3f4",
    borderRadius: "50%",
    width: Math.max(Math.min(radius * 0.1, 8), 4),
    height: Math.max(Math.min(radius * 0.1, 8), 4),
    bottom: Math.max(Math.min(radius * 0.2, 12), 8),
    left: "50%",
    transform: "translateX(-50%)",
  }),
  tick: {
    position: "absolute",
    width: "100%",
    height: "100%",
    top: 0,
    left: 0,
    zIndex: 5,
    overflow: "visible",

    "&::after": {
      content: "''",
      position: "absolute",
      width: "0.07rem",
      height: "0.35em",
      backgroundColor: "rgba(255,255,255,0.2)",
      top: "-1em",
      left: "50%",
      transition: "all 180ms ease-out",
    },
  },
  tickActive: {
    "&::after": {
      backgroundColor: "#a8d8f8",
      boxShadow: "0 0 0.3em 0.08em #79c3f4",
      transition: "all 180ms ease-out",
    },
  },
  valueLabel: ({ radius }) => ({
    fontSize: radius * 0.33,
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    color: "rgba(255,255,255,0.2)",
  }),
  label: {
    position: "absolute",
    textTransform: "uppercase",
    display: "block",
    fontSize: "70%",
    bottom: "50%",
    left: "50%",
  },
});

type KnobProps = {
  startAngle?: number;
  endAngle?: number;
  tickCount?: number;
  stepAngle?: number;
  value: number;
  onChange: (value: number) => void;
  valueFormatter?: (value: number) => number;
  disableTicks?: boolean;
  showValue?: boolean;
  showLabels?: boolean;
  maxLabel?: string;
  minLabel?: string;
  radius?: number;
  disabled?: boolean;
  classes: Record<keyof ReturnType<typeof styles>, string>;
};

function Knob({
  startAngle = 45,
  endAngle = 315,
  radius = 30,
  tickCount = 28,
  stepAngle = 2,
  onChange = () => {},
  value = 0,
  valueFormatter,
  disableTicks,
  showValue,
  showLabels,
  minLabel = "Min",
  maxLabel = "Max",
  disabled,
  classes,
}: KnobProps) {
  const knobRef = React.useRef<HTMLElement | null>(null);
  const controlled = value !== undefined;
  const [actualValue, setActualValue] = React.useState(value || 0);
  const prevValueRef = React.useRef(actualValue);
  const mountedRef = React.useRef(false);

  const angleRange = endAngle - startAngle;
  const angleIncrement = angleRange / (tickCount - 1);
  const valueIncrement = stepAngle / angleRange;
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

  function handleMouseEvent(
    e: React.MouseEvent<HTMLElement>,
    canUpdateValue: (newValue: number, prevValue: number) => boolean
  ) {
    const rect = e.target.getBoundingClientRect();
    const clickPoint = { x: e.pageX - rect.left, y: e.pageY - rect.top };
    const angle = computeAngle(rect, clickPoint);
    const newValue = computeValueFromAngle(angle, startAngle, endAngle);

    if (canUpdateValue(newValue, prevValueRef.current)) {
      updateValueOrNotify(newValue);
    }
  }

  function updateValueOrNotify(value: number) {
    const resolvedValue = Math.max(0, Math.min(value, 1));

    if (!disabled) {
      if (!controlled) {
        setActualValue(resolvedValue);
      }

      onChange?.(resolvedValue);

      prevValueRef.current = resolvedValue;
    }
  }

  function handleKnobClick(e: React.MouseEvent<HTMLElement>) {
    handleMouseEvent(e, (value) => value > -0.04 && value < 1.04);
  }

  function handleKnobMouseWheel(e: React.WheelEvent<HTMLButtonElement>) {
    const value =
      e.deltaY > 0
        ? actualValue + valueIncrement
        : actualValue - valueIncrement;

    updateValueOrNotify(value);
  }

  const handleKnobMouseMove = _throttle((e: React.MouseEvent<HTMLElement>) => {
    handleMouseEvent(e, (newVal, prevVal) => Math.abs(prevVal - newVal) < 0.5);
  }, 200);

  function handleKnobMouseDown() {
    document.addEventListener("mousemove", handleKnobMouseMove);
    document.addEventListener("mouseup", handleKnobMouseUp);
  }

  function handleKnobMouseUp() {
    document.removeEventListener("mousemove", handleKnobMouseMove);
    document.removeEventListener("mouseup", handleKnobMouseUp);
  }

  return (
    <div className={clsx(classes.root, disabled && classes.rootDisabled)}>
      <button
        ref={knobRef}
        className={classes.knob}
        style={{
          transform: `rotate(${actualValue * angleRange + startAngle}deg)`,
        }}
        onClick={handleKnobClick}
        onMouseDown={handleKnobMouseDown}
        onWheel={handleKnobMouseWheel}
        disabled={disabled}
      >
        <i className={classes.indicator}></i>
      </button>
      {showValue && (
        <span className={classes.valueLabel}>
          {valueFormatter
            ? valueFormatter(actualValue)
            : Math.round(actualValue * 100)}
        </span>
      )}
      {!disableTicks &&
        Array.from({ length: tickCount }, (_, i) => {
          const tickAngle = startAngle - 180 + angleIncrement * i;

          return (
            <div
              key={i}
              className={clsx(
                classes.tick,
                i < maxActiveTickIndex && classes.tickActive
              )}
              style={{ transform: `rotate(${tickAngle}deg)` }}
            />
          );
        })}
      {showLabels && (
        <React.Fragment>
          <span
            className={classes.label}
            style={{
              transform: getLabelCSSTranslate(
                startAngle - 90,
                radius,
                minLabel?.length || 0
              ),
            }}
          >
            {minLabel}
          </span>
          <span
            className={classes.label}
            style={{
              transform: getLabelCSSTranslate(
                endAngle + 90,
                radius,
                maxLabel?.length || 0
              ),
            }}
          >
            {maxLabel}
          </span>
        </React.Fragment>
      )}
    </div>
  );
}

function getLabelCSSTranslate(
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

type Point = {
  x: number;
  y: number;
};

function computePointFromCenter(angle: number, radius: number): Point {
  const x = angle <= 180 ? -radius : radius;
  const y = x * Math.tan((angle * Math.PI) / 180);

  return { x, y };
}

type Rect = {
  width: number;
  height: number;
};

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

export default withStyles(styles)(Knob);
