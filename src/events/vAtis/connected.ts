import actionManager from "@managers/action";
import vatisManager from "@managers/vatis";

export const handleConnected = () => {
  actionManager.updatevAtisConnectionState();
  vatisManager.refreshAll();
};
