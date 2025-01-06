import { KeyAction } from "@elgato/streamdeck";
import actionManager from "@managers/action";
import vAtisManager from "@managers/vatis";
import { handleAsyncException } from "@utils/handleAsyncException";

/**
 * Called when a vATIS status action has a long press. Refreshes all
 * ATIS actions.
 * @param actionId The ID of the action that had the long press
 */
export const handlevAtisStatusLongPress = (action: KeyAction) => {
  actionManager.getAtisLetterControllers().forEach((entry) => {
    entry.reset();
  });

  // Refresh all the stations.
  vAtisManager.refreshAtis();

  action.showOk().catch((error: unknown) => {
    handleAsyncException("Unable to show OK on ATIS button:", error);
  });
};
