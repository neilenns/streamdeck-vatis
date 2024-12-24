import actionManager from "@managers/action";

export const handleConnected = () => {
  actionManager.updatevAtisConnectionState();
};
