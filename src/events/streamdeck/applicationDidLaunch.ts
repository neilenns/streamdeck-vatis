import { ApplicationDidLaunchEvent } from "@elgato/streamdeck";
import mainLogger from "@utils/logger";
import vAtisManager from "@managers/vatis";

const logger = mainLogger.child({ service: "plugin" });

export const handleOnApplicationDidLaunch = (ev: ApplicationDidLaunchEvent) => {
  logger.info("Received applicationDidLaunch event", ev.application);
  vAtisManager.connect();
};
