import { Atis } from "@interfaces/messages";
import actionManager from "@managers/action";

/**
 * Receives the state for a single station from TrackAudio and updates the appropriate
 * Stream Deck action with the new data.
 */
export const handleAtisUpdate = (data: Atis) => {
  actionManager.updateAtisLetter(data);
};
