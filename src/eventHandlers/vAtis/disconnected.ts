import actionManager from "@managers/action";

export const handleDisconnected = () => {
  actionManager.resetAll();
};
