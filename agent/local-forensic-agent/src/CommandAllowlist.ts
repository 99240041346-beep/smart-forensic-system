const SERIAL_RE = /^[A-Za-z0-9._:-]{1,128}$/;

export class CommandAllowlist {
  public static isAuthorized(args: string[]): boolean {
    if (!Array.isArray(args) || args.length === 0) return false;
    let i = 0;
    if (args[i] === '-s') {
      const serial = args[i + 1];
      if (!serial || !SERIAL_RE.test(serial)) return false;
      i += 2;
    }
    const command = args[i++];
    if (command === 'version') return args.length === i;
    if (command === 'devices') return args.slice(i).every(x => x === '-l');
    if (command !== 'shell' || i >= args.length) return false;
    const shell = args.slice(i);
    const [base, sub, ...rest] = shell;
    if (base === 'getprop') return rest.length === 0 && (!sub || /^[A-Za-z0-9._-]+$/.test(sub));
    if (base === 'dumpsys' && sub === 'battery') return rest.length === 0;
    if (base === 'df' && sub === '-k' && rest.length === 1 && rest[0] === '/data') return true;
    if (base === 'cat' && shell.length === 2 && sub === '/proc/meminfo') return true;
    if (base === 'wm' && shell.length === 2 && (sub === 'size' || sub === 'density')) return true;
    if (base === 'settings' && shell.length === 4 && sub === 'get' && rest[0] === 'global' && rest[1] === 'development_settings_enabled') return true;
    if (base === 'pm' && shell.length === 3 && sub === 'list' && rest[0] === 'packages') return true;
    if (base === 'ps' && shell.length === 1) return true;
    return false;
  }
}
