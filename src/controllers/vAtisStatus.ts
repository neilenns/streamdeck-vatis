import { vAtisStatusSettings } from "@actions/vAtisStatus";
import { KeyAction } from "@elgato/streamdeck";
import { Controller } from "@interfaces/controller";
import vatisManager from "@managers/vatis";
import { VATIS_STATUS_CONTROLLER_TYPE } from "@utils/controllerTypes";
import TitleBuilder from "@utils/titleBuilder";
import { stringOrUndefined } from "@utils/utils";
import debounce from "debounce";
import { BaseController } from "./baseController";

const defaultTemplatePath = "images/actions/vAtisStatus/template.svg";

export class vAtisStatusController extends BaseController {
  type = VATIS_STATUS_CONTROLLER_TYPE;

  private _settings: vAtisStatusSettings | null = null;

  private _notConnectedImagePath?: string;
  private _connectedImagePath?: string;

  /**
   * Creates a new vAtisStatusController.
   * @param action The Stream Deck action object
   */
  constructor(action: KeyAction, settings: vAtisStatusSettings) {
    super(action);
    this.settings = settings;
  }

  /**
   * Refreshes the title and image on the action.
   */
  public override refreshDisplay = debounce(() => {
    this.refreshTitle();
    this.refreshImage();
  }, 100);

  /**
   * Resets the state to default.
   */
  public reset() {
    this.refreshDisplay();
  }

  //#region Getters and setters
  /**
   * Gets the showTitle setting.
   * @returns {boolean} The setting, or false if undefined.
   */
  get showTitle(): boolean {
    return this.settings.showTitle ?? false;
  }

  /**
   * Gets the title setting.
   * @returns {string | undefined} The title, or undefined if none specified.
   */
  get title(): string | undefined {
    return this.settings.title;
  }

  /**
   * Returns the notConnectedImagePath setting.
   * @returns { string } The path, or defaultTemplatePath if undefined.
   */
  get notConnectedImagePath(): string {
    return this._notConnectedImagePath ?? defaultTemplatePath;
  }

  /**
   * Sets the notConnectedImagePath and re-compiles the SVG template if necessary.
   */
  set notConnectedImagePath(newValue: string | undefined) {
    this._notConnectedImagePath = stringOrUndefined(newValue);
  }

  /**
   * Returns the connectedImagePath setting.
   * @returns { string } The path, or defaultTemplatePath if undefined.
   */
  get connectedImagePath(): string {
    return this._connectedImagePath ?? defaultTemplatePath;
  }

  /**
   * Sets the notConnectedImagePath and re-compiles the SVG template if necessary.
   */
  set connectedImagePath(newValue: string | undefined) {
    this._connectedImagePath = stringOrUndefined(newValue);
  }

  /**
   * Gets the settings.
   * @returns { vAtisStatusSettings } The settings.
   */
  get settings(): vAtisStatusSettings {
    if (this._settings === null) {
      throw new Error("Settings not initialized. This should never happen.");
    }

    return this._settings;
  }

  /**
   * Sets the settings.
   */
  set settings(newValue: vAtisStatusSettings) {
    this._settings = newValue;
    this.connectedImagePath = stringOrUndefined(newValue.connectedImagePath);
    this.notConnectedImagePath = stringOrUndefined(
      newValue.notConnectedImagePath
    );

    this.refreshDisplay();
  }
  //#endregion

  /**
   * Sets the title on the action.
   */
  private refreshTitle() {
    const title = new TitleBuilder();

    title.push(this.title, this.showTitle);

    this.setTitle(title.join("\n"));
  }

  /**
   * Sets the action image based on the isConnected state.
   */
  private refreshImage() {
    const replacements = {
      isConnected: vatisManager.isConnected,
      title: this.title,
    };

    if (vatisManager.isConnected) {
      this.setImage(this.connectedImagePath, replacements);
      return;
    }

    this.setImage(this.notConnectedImagePath, replacements);
  }
}

/**
 * Typeguard for vAtisStatusController.
 * @param action The action
 * @returns True if the action is a vAtisStatusController
 */
export function isvAtisStatusController(
  action: Controller
): action is vAtisStatusController {
  return action.type === VATIS_STATUS_CONTROLLER_TYPE;
}
