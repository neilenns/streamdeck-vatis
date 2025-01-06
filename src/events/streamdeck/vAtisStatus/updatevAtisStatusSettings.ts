import { vAtisStatusSettings } from "@actions/vAtisStatus";
import { KeyAction } from "@elgato/streamdeck";
import actionManager from "@managers/action";

/**
 * Updates the settings associated with a vATIS status action.
 * @param action The action to update
 * @param settings The new settings to use
 */
export const handleUpdatevAtisStatusSettings = (
  action: KeyAction,
  settings: vAtisStatusSettings
) => {
  const savedAction = actionManager
    .getvAtisStatusControllers()
    .find((entry) => entry.action.id === action.id);

  if (!savedAction) {
    return;
  }

  savedAction.settings = settings;
};
