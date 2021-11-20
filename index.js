import { withStyles } from '@material-ui/core';
import clsx from 'clsx';
import React from 'react';
import lodashThrottle from 'lodash/throttle';

const styles = () => ({
  root: ({ radius }) => ({
    position: 'relative',
    width: radius * 2,
    height: radius * 2,
    borderRadius: '50%',
    border: 'solid 0.25em #0e0e0e',
    background:
      '#181818 -webkit-gradient(linear, left bottom, left top, color-stop(0, #1d1d1d), color-stop(1, #131313))',
    boxShadow:
      '0 0.2em 0.1em 0.05em rgba(255, 255, 255, 0.1) inset, 0 -0.2em 0.1em 0.05em rgba(0, 0, 0, 0.5) inset, 0 0.5em 0.65em 0 rgba(0, 0, 0, 0.3)',
    transition: 'opacity 125ms ease-in-out',
  }),
  rootDisabled: {
    opacity: 0.6,
  },
  knob: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: '50%',
    outline: 'none',
    border: 'none',
    background: 'transparent',
    zIndex: 10,
    cursor: 'pointer',
    '&:disabled': {
      cursor: 'unset',
    },
  },
  indicator: ({ radius }) => ({
    position: 'absolute',
    backgroundColor: '#a8d8f8',
    boxShadow: '0 0 0.4em 0 #79c3f4',
    borderRadius: '50%',
    width: Math.max(Math.min(radius * 0.1, 8), 4),
    height: Math.max(Math.min(radius * 0.1, 8), 4),
    bottom: Math.max(Math.min(radius * 0.2, 12), 8),
    left: '50%',
    transform: 'translateX(-50%)',
  }),
  tick: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    top: 0,
    left: 0,
    zIndex: 5,
    overflow: 'visible',

    '&::after': {
      content: "''",
      position: 'absolute',
      width: '0.07rem',
      height: '0.35em',
      backgroundColor: 'rgba(255,255,255,0.2)',
      top: '-1em',
      left: '50%',
      transition: 'all 180ms ease-out',
    },
  },
  tickActive: {
    '&::after': {
      backgroundColor: '#a8d8f8',
      boxShadow: '0 0 0.3em 0.08em #79c3f4',
      transition: 'all 180ms ease-out',
    },
  },
  valueLabel: ({ radius }) => ({
    fontSize: radius * 0.33,
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    color: 'rgba(255,255,255,0.2)',
  }),
  label: {
    position: 'absolute',
    textTransform: 'uppercase',
    display: 'block',
    fontSize: '70%',
    bottom: '50%',
    left: '50%',
  },
});

function Knob({
  startAngle,
  endAngle,
  tickCount,
  stepAngle,
  onChange = () => {},
  value,
  valueFormatter,
  disableTicks,
  showValue,
  classes,
  showLabels,
  maxLabel,
  minLabel,
  radius,
  disabled,
}) {
  const knobRef = React.useRef();
  const controlled = value !== undefined;
  const [actualValue, setActualValue] = React.useState(value || 0);
  const prevValueRef = React.useRef(actualValue);
  const mountedRef = React.useRef();

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

  const handleMouseEvent = (e, canUpdateValue) => {
    const rect = e.target.getBoundingClientRect();
    const clickPoint = { x: e.pageX - rect.left, y: e.pageY - rect.top };
    const angle = computeAngle(rect, clickPoint, false);
    const newValue = computeValueFromAngle(angle, startAngle, endAngle);

    if (canUpdateValue(newValue, prevValueRef.current)) {
      updateValueOrNotify(newValue);
    }
  };

  const updateValueOrNotify = (value) => {
    const resolvedValue = Math.max(0, Math.min(value, 1));
    if (!disabled) {
      if (controlled) {
        onChange(resolvedValue);
      } else {
        setActualValue(resolvedValue);
        onChange(resolvedValue);
      }
      prevValueRef.current = resolvedValue;
    }
  };

  const handleKnobClick = (e) => {
    const canUpdate = (newValue) => newValue > -0.04 && newValue < 1.04;
    handleMouseEvent(e, canUpdate);
  };

  const handleKnobMouseWheel = (e) => {
    let value;
    if (e.deltaY > 0) {
      value = actualValue + valueIncrement;
    } else {
      value = actualValue - valueIncrement;
    }

    updateValueOrNotify(value);
  };

  const handleKnobMouseMove = lodashThrottle((e) => {
    const canUpdate = (newVal, prevVal) => {
      return Math.abs(prevVal - newVal) < 0.5;
    };
    handleMouseEvent(e, canUpdate);
  }, 200);

  const handleKnobMouseDown = () => {
    document.addEventListener('mousemove', handleKnobMouseMove);
    document.addEventListener('mouseup', handleKnobMouseUp);
  };

  function handleKnobMouseUp() {
    document.removeEventListener('mousemove', handleKnobMouseMove);
    document.removeEventListener('mouseup', handleKnobMouseUp);
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
            ></div>
          );
        })}
      {showLabels && (
        <>
          <span
            className={classes.label}
            style={{
              transform: getLabelCSSTranslate(
                startAngle - 90,
                radius,
                minLabel.length || 0
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
                maxLabel.length || 0
              ),
            }}
          >
            {maxLabel}
          </span>
        </>
      )}
    </div>
  );
}

Knob.defaultProps = {
  startAngle: 45,
  endAngle: 315,
  radius: 30,
  tickCount: 28,
  value: 0,
  stepAngle: 2,
  minLabel: 'Min',
  maxLabel: 'Max',
};

const getLabelCSSTranslate = (angle, radius, textLength) => {
  const point = computePointFromCenter(angle, radius);

  if (point.x < 0) {
    point.x -= textLength * 7;
  }

  return `translate(${point.x}px, ${point.y}px)`;
};

const computePointFromCenter = (angle, radius) => {
  const x = angle <= 180 ? -radius : radius;
  const y = x * Math.tan((angle * Math.PI) / 180);
  return { x, y };
};

const computeAngle = (rect, refPoint) => {
  const center = { x: rect.width / 2, y: rect.height / 2 };
  const x = refPoint.x - center.x;
  const y = refPoint.y - center.y;
  let angleX = Math.atan2(y, x) * (180 / Math.PI);

  if (x <= 0 && y >= 0) {
    angleX -= 90;
  } else if (x <= 0 && y <= 0) {
    angleX += 270;
  } else if (x >= 0 && y <= 0) {
    angleX += 270;
  } else {
    angleX += 270;
  }

  return angleX;
};

const computeValueFromAngle = (angle, startAngle, endAngle) => {
  return (angle - startAngle) / (endAngle - startAngle);
};

export default withStyles(styles)(Knob);
