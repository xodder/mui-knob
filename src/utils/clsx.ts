function clsx(...args: unknown[]): string {
  const classes: any[] = [];

  args.forEach((arg) => {
    if (!arg) {
      return;
    }

    switch (typeof arg) {
      case 'string':
      case 'number':
        classes.push(arg);
        break;
      case 'object':
        if (Array.isArray(arg)) {
          const inner = clsx(...arg);

          if (inner) {
            classes.push(inner);
          }
        } else {
          if (!arg) throw new Error('expected arg but got nothing');

          Object.entries(arg).forEach(([key, value]) => {
            if (value) {
              classes.push(key);
            }
          });
        }
    }
  });

  return classes.join(' ');
}

export default clsx;
