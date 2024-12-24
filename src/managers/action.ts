import { EventEmitter } from "events";
import mainLogger from "@utils/logger";
import { Controller } from "@interfaces/controller";
import { ActionContext, KeyAction } from "@elgato/streamdeck";
import { vAtisStatusSettings } from "@actions/vAtisStatus";
import {
  isvAtisStatusController,
  vAtisStatusController,
} from "@controllers/vAtisStatus";
import { handleAsyncException } from "@utils/handleAsyncException";
import vAtisManager from "@managers/vatis";

const logger = mainLogger.child({ service: "action" });

class ActionManager extends EventEmitter {
  private static instance: ActionManager | null = null;
  private actions: Controller[] = [];

  private constructor() {
    super();
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
   * Retrieves the list of all tracked vAtisStatusControllers.
   * @returns An array of vAtisStatusControllers
   */
  public getvAtisStatusControllers(): vAtisStatusController[] {
    return this.getControllers(isvAtisStatusController);
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
   * Forces a refresh of the vAtis status.
   * @param action The action
   */
  public vAtisStatusLongPress(action: KeyAction) {
    this.resetAll();

    action.showOk().catch((error: unknown) => {
      handleAsyncException("Unable to show OK status on vATIS action: ", error);
    });
  }
}

const actionManagerInstance = ActionManager.getInstance();
export default actionManagerInstance;
