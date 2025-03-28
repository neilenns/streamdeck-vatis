import { ApplicationDidTerminateEvent } from "@elgato/streamdeck";
import mainLogger from "@utils/logger";
import vAtisManager from "@managers/vatis";

const logger = mainLogger.child({ service: "handleOnApplicationDidTerminate" });

export const handleOnApplicationDidTerminate = (
  ev: ApplicationDidTerminateEvent
) => {
  logger.info("Received applicationDidTerminate event", ev.application);
  vAtisManager.isAppRunning = false;
  vAtisManager.disconnect();
};
