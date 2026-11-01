import { app } from "electron";
import log from "electron-log/main.js";
import path from "node:path";

export function getLogsDir() {
  return path.join(app.getPath("userData"), "logs");
}

// Resolved lazily so the dev-mode userData override in main.js applies.
log.transports.file.resolvePathFn = () => path.join(getLogsDir(), "main.log");
log.transports.file.level = "info";
log.transports.file.maxSize = 5 * 1024 * 1024;
log.transports.console.level = app.isPackaged ? false : "debug";

log.errorHandler.startCatching({ showDialog: false });

export default log;
