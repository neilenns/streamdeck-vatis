import { AtisLetterController } from "@controllers/atisLetter";
import vAtisManager from "@managers/vatis";

/**
 * Handles when an ATIS letter is added.
 */
export const handleAtisLetterAdded = (controller: AtisLetterController) => {
  vAtisManager.refreshAtis(controller.station);
};
