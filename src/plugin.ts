import streamDeck from "@elgato/streamdeck";
import { vAtisAudioStatus } from "@actions/vAtisStatus";
import mainLogger from "@utils/logger";
import vAtisManager from "@managers/vatis";
import actionManager from "@managers/action";

import { handleConnected } from "@events/vAtis/connected";
import { handleDisconnected } from "@events/vAtis/disconnected";
import { handleActionAdded } from "@events/action/actionAdded";
import { handleActionRemoved } from "@events/action/actionRemoved";
import { AtisLetter } from "@actions/atisLetter";
import { handleAtisLetterAdded } from "@events/action/atisLetterAdded";
import { handleAtisLetterUpdated } from "@events/action/atisLetterUpdated";
import { handleAtisUpdate } from "@events/vAtis/atisUpdate";
import { handleOnApplicationDidLaunch } from "@events/streamdeck/applicationDidLaunch";
import { handleOnApplicationDidTerminate } from "@events/streamdeck/applicationDidTerminate";

const logger = mainLogger.child({ service: "plugin" });

// Flag to prevent handling repeated disconnect events
let disconnectHandled = false;

// Register for uncaught exceptions
process.on("uncaughtException", (error) => {
  logger.error("Uncaught Exception:", error);
});

// Register actions
streamDeck.actions.registerAction(new vAtisAudioStatus());
streamDeck.actions.registerAction(new AtisLetter());

// Register event handlers
streamDeck.system.onApplicationDidLaunch(handleOnApplicationDidLaunch);
streamDeck.system.onApplicationDidTerminate(handleOnApplicationDidTerminate);

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
vAtisManager.on("atisUpdate", handleAtisUpdate);

actionManager.on("actionAdded", handleActionAdded);
actionManager.on("actionRemoved", handleActionRemoved);
actionManager.on("atisLetterAdded", handleAtisLetterAdded);
actionManager.on("atisLetterUpdated", handleAtisLetterUpdated);

// Finally, connect to the Stream Deck.
await streamDeck.connect();
