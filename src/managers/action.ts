import {
  AtisLetterController,
  isAtisLetterController,
} from "@controllers/atisLetter";
import {
  isvAtisStatusController,
  vAtisStatusController,
} from "@controllers/vAtisStatus";
import { ActionContext } from "@elgato/streamdeck";
import { Controller } from "@interfaces/controller";
import { Atis } from "@interfaces/messages";
import mainLogger from "@utils/logger";
import { EventEmitter } from "events";

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
    ActionManager.instance ??= new ActionManager();
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
   * Adds a controller to the list of tracked actions.
   * @param controller The controller to add
   */
  public add(controller: Controller): void {
    this.actions.push(controller);
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
   * Updates the connection state on all vATIS status buttons to the current connected states
   * and updates the background image to the appropriate state image.
   */
  public updatevAtisConnectionState() {
    this.getvAtisStatusControllers().forEach((entry) => {
      entry.refreshDisplay();
    });
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
        action.updateAtis(data);
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
}

const actionManagerInstance = ActionManager.getInstance();
export default actionManagerInstance;
