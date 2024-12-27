import { AtisLetterSettings } from "@actions/atisLetter";
import { vAtisStatusSettings } from "@actions/vAtisStatus";
import {
  AtisLetterController,
  isAtisLetterController,
} from "@controllers/atisLetter";
import {
  isvAtisStatusController,
  vAtisStatusController,
} from "@controllers/vAtisStatus";
import { ActionContext, KeyAction } from "@elgato/streamdeck";
import { Controller } from "@interfaces/controller";
import { Atis } from "@interfaces/messages";
import vAtisManager from "@managers/vatis";
import { handleAsyncException } from "@utils/handleAsyncException";
import mainLogger from "@utils/logger";
import debounce from "debounce";
import { EventEmitter } from "events";

const logger = mainLogger.child({ service: "action" });

class ActionManager extends EventEmitter {
  private static instance: ActionManager | null = null;
  private actions: Controller[] = [];

  private constructor() {
    super();

    // Debounce the update methods to avoid rapid pinging of vATIS or
    // title redraws while typing
    this.updateAtisLetterSettings = debounce(
      this.updateAtisLetterSettings.bind(this),
      500
    );
  }

  /**
   * Provides access to the ActionManager instance.
   * @returns The instance of ActionManager
   */
  public static getInstance(): ActionManager {
    if (!ActionManager.instance) {
      ActionManager.instance = new ActionManager();
    }
    return ActionManager.instance;
  }

  /**
   * Returns an array of all the actions tracked by the action manager.
   * @returns An array of the currently tracked actions
   */
  public getActions(): Controller[] {
    return this.actions;
  }

  /**
   * Removes an action from the list.
   * @param action The action to remove
   */
  public remove(action: ActionContext): void {
    this.actions = this.actions.filter(
      (entry) => entry.action.id !== action.id
    );

    this.emit("actionRemoved", this.actions.length);
  }

  /**
   * Adds a vATIS status action to the action list. Emits a vAtisStatusAdded event
   * after the action is added.
   * @param action The action to add
   */
  public addvAtis(action: KeyAction, settings: vAtisStatusSettings) {
    const controller = new vAtisStatusController(action, settings);

    this.actions.push(controller);
    this.emit("vAtisStatusAdded", controller);
    this.emit("actionAdded", controller);
  }

  /**
   * Updates the settings associated with a vATIS status action.
   * @param action The action to update
   * @param settings The new settings to use
   */
  public updatevAtisStatus(action: KeyAction, settings: vAtisStatusSettings) {
    const savedAction = this.getvAtisStatusControllers().find(
      (entry) => entry.action.id === action.id
    );

    if (!savedAction) {
      return;
    }

    savedAction.settings = settings;
  }

  /**
   * Updates the connection state on all vATIS status buttons to the current connected states
   * and updates the background image to the appropriate state image.
   */
  public updatevAtisConnectionState() {
    this.getvAtisStatusControllers().forEach((entry) => {
      entry.isConnected = vAtisManager.isConnected;
    });
  }

  /**
   * Adds an atis letter action to the action list. Emits an atisLetterAdded
   * event after the action is added.
   * @param action The action
   * @param settings The settings for the action
   */
  public addAtisLetter(action: KeyAction, settings: AtisLetterSettings): void {
    const controller = new AtisLetterController(action, settings);

    this.actions.push(controller);
    this.emit("atisLetterAdded", controller);
    this.emit("actionAdded", controller);
  }

  /**
   * Updates the settings associated with an ATIS letter status action.
   * Emits a atisLetterUpdated event if the settings require
   * the action to refresh.
   * @param action The action to update
   * @param settings The new settings to use
   */
  public updateAtisLetterSettings(
    action: KeyAction,
    settings: AtisLetterSettings
  ) {
    const savedAction = this.getAtisLetterControllers().find(
      (entry) => entry.action.id === action.id
    );

    if (!savedAction) {
      return;
    }

    const requiresRefresh =
      savedAction.settings.station !== settings.station ||
      savedAction.settings.atisType !== settings.atisType;

    savedAction.settings = settings;

    if (requiresRefresh) {
      this.emit("atisLetterUpdated", savedAction);
    }
  }

  /**
   * Updates ATIS controllers with the new data from vATIS.
   * @param data The new ATIS data from vATIS
   */
  public updateAtisLetter(data: Atis) {
    this.getAtisLetterControllers()
      .filter(
        (action) =>
          action.station === data.value.station &&
          action.atisType === data.value.atisType
      )
      .forEach((action) => {
        action.connectionStatus = data.value.networkConnectionStatus;
        action.letter = data.value.atisLetter;
        action.isNewAtis = data.value.isNewAtis ?? false;
        action.wind = data.value.wind;
        action.altimeter = data.value.altimeter;
      });
  }

  /**
   * Called when an ATIS letter action has a short press. Clears the state.
   * @param actionId The ID of the action that had the short press
   */
  public atisLetterShortPress(action: KeyAction) {
    const savedAction = this.getAtisLetterControllers().find(
      (entry) => entry.action.id === action.id
    );

    if (!savedAction?.station) {
      return;
    }

    // Send a clear request to vATIS
    vAtisManager.sendMessage({
      type: "acknowledgeAtisUpdate",
      value: {
        station: savedAction.station,
        atisType: savedAction.atisType,
      },
    });
  }

  /**
   * Called when an ATIS letter action has a long press. Refreshses the ATIS.
   * @param actionId The ID of the action that had the long press
   */
  public atisLetterLongPress(action: KeyAction) {
    const savedAction = this.getAtisLetterControllers().find(
      (entry) => entry.action.id === action.id
    );

    if (!savedAction) {
      return;
    }

    savedAction.reset();
    vAtisManager.refreshAtis(savedAction.station, savedAction.atisType);

    action.showOk().catch((error: unknown) => {
      handleAsyncException("Unable to show OK on ATIS button:", error);
    });
  }

  /**
   * Resets the ATIS letter on all ATIS letter actions to undefined.
   */
  public resetAtisLetterOnAll() {
    this.getAtisLetterControllers().forEach((action) => {
      action.letter = undefined;
    });
  }

  /**
   * Retrieves the list of all tracked vAtisStatusControllers.
   * @returns An array of vAtisStatusControllers
   */
  public getvAtisStatusControllers(): vAtisStatusController[] {
    return this.getControllers(isvAtisStatusController);
  }

  /**
   * Retrieves the list of all tracked AtisLetterControllers.
   * @returns An array of AtisLetterControllers
   */
  public getAtisLetterControllers(): AtisLetterController[] {
    return this.getControllers(isAtisLetterController);
  }

  /**
   * Returns a list of controllers that match the type guard.
   * @param typeGuard Function that returns true if the Controller is the correct type
   * @returns A list of controllers matching the type guard
   */
  public getControllers<T extends Controller>(
    typeGuard: (action: Controller) => action is T
  ): T[] {
    return this.actions.filter(typeGuard);
  }

  /**
   * Temporarily shows an alert warning on all tracked actions.
   */
  public showAlertOnAll() {
    this.actions.forEach((entry) => {
      entry.action.showAlert().catch((error: unknown) => {
        logger.error(error);
      });
    });
  }

  /**
   * Resets all tracked actions to their initial state.
   */
  public resetAll() {
    this.actions.forEach((entry) => {
      entry.reset();
    });
  }

  /**
   * Called when a vAtis status action keydown event is triggered.
   * Clears the new ATIS state on all ATIS stations.
   * @param _ The action
   */
  public vAtisStatusLongPress(_: KeyAction) {
    vAtisManager.sendMessage({ type: "acknowledgeAtisUpdate" });
  }
}

const actionManagerInstance = ActionManager.getInstance();
export default actionManagerInstance;
