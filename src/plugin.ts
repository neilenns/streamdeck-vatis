import streamDeck from "@elgato/streamdeck";
import { vAtisAudioStatus } from "@actions/vAtisStatus";
import mainLogger from "@utils/logger";
import vAtisManager from "@managers/vatis";
import actionManager from "@managers/action";

import { handleConnected } from "@eventHandlers/vAtis/connected";
import { handleDisconnected } from "@eventHandlers/vAtis/disconnected";
import { handleActionAdded } from "@eventHandlers/action/actionAdded";
import { handleActionRemoved } from "@eventHandlers/action/actionRemoved";

const logger = mainLogger.child({ service: "plugin" });

// Flag to prevent handling repeated disconnect events
let disconnectHandled = false;

// Register for uncaught exceptions
process.on("uncaughtException", (error) => {
  logger.error("Uncaught Exception:", error);
});

// Register the increment action.
streamDeck.actions.registerAction(new vAtisAudioStatus());

vAtisManager.on("connected", () => {
  disconnectHandled = false;
  handleConnected();
});

vAtisManager.on("disconnected", () => {
  if (!disconnectHandled) {
    disconnectHandled = true;
    handleDisconnected();
  }
});

actionManager.on("actionAdded", handleActionAdded);
actionManager.on("actionRemoved", handleActionRemoved);

// Finally, connect to the Stream Deck.
await streamDeck.connect();
