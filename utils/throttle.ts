function throttle(fn: (...args: any[]) => void, wait: number = 0) {
  let waiting = false;

  return function (...args: any[]) {
    if (!waiting) {
      fn.apply(this, args);

      waiting = true;

      setTimeout(() => {
        waiting = false;
      }, wait);
    }
  };
}

export default throttle;
