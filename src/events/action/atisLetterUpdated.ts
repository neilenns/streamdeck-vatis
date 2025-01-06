import { AtisLetterController } from "@controllers/atisLetter";
import vAtisManager from "@managers/vatis";

/**
 * Handles refreshing the ATIS letter action and VATSIM data when the action's
 * settings changed.
 */
export const handleAtisLetterUpdated = (controller: AtisLetterController) => {
  controller.letter = undefined;
  vAtisManager.refreshAtis(controller.station, controller.atisType);
};
