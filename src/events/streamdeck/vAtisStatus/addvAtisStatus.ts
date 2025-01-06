import { vAtisStatusSettings } from "@actions/vAtisStatus";
import { vAtisStatusController } from "@controllers/vAtisStatus";
import { KeyAction } from "@elgato/streamdeck";
import actionManager from "@managers/action";

/**
 * Adds a vATIS status action to the action list. Emits a vAtisStatusAdded event
 * after the action is added.
 * @param action The action to add
 */
export const handleAddvAtisStatus = (
  action: KeyAction,
  settings: vAtisStatusSettings
) => {
  const controller = new vAtisStatusController(action, settings);

  actionManager.add(controller);
  actionManager.emit("vAtisStatusAdded", controller);
  actionManager.emit("actionAdded", controller);
};
