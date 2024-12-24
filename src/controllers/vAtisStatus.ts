import { Controller } from "@interfaces/controller";
import { BaseController } from "./baseController";
import { vAtisStatusSettings } from "@actions/vAtisStatus";
import { KeyAction } from "@elgato/streamdeck";
import { stringOrUndefined } from "@utils/utils";
import TitleBuilder from "@utils/titleBuilder";

const StateColor = {
  NOT_CONNECTED: "black",
  CONNECTED: "#5fcdfa",
};

const defaultTemplatePath = "images/actions/vAtisStatus/template.svg";

export class vAtisStatusController extends BaseController {
  type = "vAtisStatusController";

  private _isConnected = false;
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

  public reset() {
    this.isConnected = false;
  }

  //#region Getters and setters
  /**
   * Returns the showTitle setting, or false if undefined.
   */
  get showTitle() {
    return this.settings.showTitle ?? false;
  }

  /**
   * Convenience method to return the action's title from settings.
   */
  get title() {
    return this.settings.title;
  }

  /**
   * Returns the notConnectedImagePath or the default template path if the
   * user didn't specify a custom icon.
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
   * Returns the connectedImagePath or the default template path if the
   * user didn't specify a custom icon.
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
   */
  get settings() {
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

    this.refreshTitle();
    this.refreshImage();
  }

  /**
   * Returns true when the connected state is displayed.
   */
  get isConnected() {
    return this._isConnected;
  }

  /**
   * Sets the isConnected state
   */
  set isConnected(newValue: boolean) {
    // Don't do anything if the state is the same
    if (this._isConnected === newValue) {
      return;
    }

    this._isConnected = newValue;
    this.refreshImage();
  }

  //#endregion

  /**
   * Sets the title on the action.
   */
  public refreshTitle() {
    const title = new TitleBuilder();

    title.push(this.title, this.showTitle);

    this.setTitle(title.join("\n"));
  }

  /**
   * Sets the action image based on the isConnected state
   */
  public refreshImage() {
    const replacements = {
      title: this.title,
    };

    if (this.isConnected) {
      this.setImage(this.connectedImagePath, {
        ...replacements,
        stateColor: StateColor.CONNECTED,
        state: "connected",
      });
      return;
    }

    this.setImage(this.notConnectedImagePath, {
      stateColor: StateColor.NOT_CONNECTED,
      state: "notConnected",
    });
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
  return action.type === "vAtisStatusController";
}
