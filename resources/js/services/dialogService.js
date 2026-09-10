let dialogHandler = null;

export function registerDialogHandler(handler) {
  dialogHandler = handler;
}

export function confirmDialog(options) {
  const opts = typeof options === 'string' ? { message: options } : options;
  if (dialogHandler) {
    return dialogHandler.confirm(opts);
  }
  return Promise.resolve(window.confirm(opts.message));
}

export function alertDialog(options) {
  const opts = typeof options === 'string' ? { message: options } : options;
  if (dialogHandler) {
    return dialogHandler.alert(opts);
  }
  window.alert(opts.message);
  return Promise.resolve();
}

export function promptDialog(options) {
  const opts = typeof options === 'string' ? { message: options } : options;
  if (dialogHandler) {
    return dialogHandler.prompt(opts);
  }
  return Promise.resolve(window.prompt(opts.message, opts.defaultValue));
}
