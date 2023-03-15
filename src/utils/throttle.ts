function throttle(fn: (...args: any[]) => void, wait = 0) {
  let waiting = false;

  return function (this: any, ...args: any[]) {
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
