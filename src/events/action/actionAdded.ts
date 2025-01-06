import actionManager from "@managers/action";
import vAtisManager from "@managers/vatis";

export const handleActionAdded = () => {
  // If this is the first button added then connect to vATIS. That will
  // also cause a dump of the current state of all stations in vATIS.
  if (actionManager.getActions().length === 1 && !vAtisManager.isConnected) {
    vAtisManager.connect();
  }
};
