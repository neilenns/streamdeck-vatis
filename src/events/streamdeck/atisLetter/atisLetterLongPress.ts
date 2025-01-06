import vAtisManager from "@managers/vatis";

/**
 * Called when an ATIS letter action has a long press. Clears the new
 * ATIS state on all stations.
 * @param actionId The ID of the action that had the long press
 */
export const handleAtisLetterLongPress = () => {
  vAtisManager.sendMessage({ type: "acknowledgeAtisUpdate" });
};
