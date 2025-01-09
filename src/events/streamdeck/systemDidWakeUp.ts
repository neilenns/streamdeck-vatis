import vAtisManager from "@managers/vatis";
import mainLogger from "@utils/logger";

export const handleOnSystemDidWakeUp = () => {
  const logger = mainLogger.child({ service: "systemDidWakeUp" });

  logger.info("Received systemDidWakeUp event");

  // This ensures reconnection to vATIS if somehow the websocket connection
  // doesn't automatically start back up after a system wake.
  if (vAtisManager.isAppRunning) {
    vAtisManager.connect();
  }
};
