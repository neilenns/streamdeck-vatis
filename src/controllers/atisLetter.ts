import { AtisLetterSettings } from "@actions/atisLetter";
import { KeyAction } from "@elgato/streamdeck";
import { Controller } from "@interfaces/controller";
import TitleBuilder from "@root/utils/titleBuilder";
import { stringOrUndefined } from "@root/utils/utils";
import { BaseController } from "./baseController";
import { AtisType, NetworkConnectionStatus } from "@interfaces/messages";

const StateColor = {
  CURRENT: "black",
  UNAVAILABLE: "black",
  UPDATED: "#f60",
};

const defaultTemplatePath = "images/actions/atisLetter/template.svg";
const defaultUnavailableTemplatePath = "images/actions/atisLetter/template.svg";

/**
 * A StationStatus action, for use with ActionManager. Tracks the settings,
 * state and Stream Deck action for an individual action in a profile.
 */
export class AtisLetterController extends BaseController {
  type = "AtisLetterController";

  private _connectionStatus: NetworkConnectionStatus | null = null;
  private _isNewAtis = false;
  private _letter?: string;
  private _wind?: string;
  private _altimeter?: string;
  private _settings: AtisLetterSettings | null = null;

  private _currentImagePath?: string;
  private _unavailableImagePath?: string;
  private _updatedImagePath?: string;

  /**
   * Creates a new AtisLetterController object.
   * @param action The action
   * @param settings:
   * The options for the action
   */
  constructor(action: KeyAction, settings: AtisLetterSettings) {
    super(action);
    this.settings = settings;
  }

  /**
   * Resets the action to its default, disconnected, state.
   */
  public reset() {
    this._letter = undefined;
    this._isNewAtis = false;
    this._connectionStatus = null;

    this.refreshTitle();
    this.refreshImage();
  }

  //#region Getters and setters
  /**
   * Gets isConnected, which is true if the connection status is Connected.
   */
  get isConnected() {
    return this._connectionStatus === NetworkConnectionStatus.Connected;
  }

  /**
   * Gets the connectionStatus.
   */
  get connectionStatus() {
    return this._connectionStatus;
  }

  /*
   * Sets the connectionStatus and updates the action state.
   */
  set connectionStatus(newValue: NetworkConnectionStatus | null) {
    if (this._connectionStatus === newValue) {
      return;
    }

    this._connectionStatus = newValue;
    this.refreshImage();
  }

  /**
   * Returns the callsign for the ATIS action.
   */
  get station() {
    return this.settings.station;
  }

  /**
   * Returns the currentImagePath or the default template path if the
   * user didn't specify a custom icon.
   */
  get currentImagePath(): string {
    return this._currentImagePath ?? defaultTemplatePath;
  }

  /**
   * Sets the currentImagePath and re-compiles the SVG template if necessary.
   */
  set currentImagePath(newValue: string | undefined) {
    this._currentImagePath = stringOrUndefined(newValue);
  }

  /**
   * Returns the updatedImagePath or the default template path if the user
   * didn't specify a custom icon.
   */
  get updatedImagePath(): string {
    return this._updatedImagePath ?? defaultTemplatePath;
  }

  /**
   * Sets the updatedImagePath and re-compiles the SVG template if necessary.
   */
  set updatedImagePath(newValue: string | undefined) {
    this._updatedImagePath = stringOrUndefined(newValue);
  }

  /**
   * Returns the unavailableImagePath or the default unavailable template path
   * if the user didn't specify a custom icon.
   */
  get unavailableImagePath(): string {
    return this._unavailableImagePath ?? defaultUnavailableTemplatePath;
  }

  /**
   * Sets the unavailableImagePath and re-compiles the SVG template if necessary.
   */
  set unavailableImagePath(newValue: string | undefined) {
    this._unavailableImagePath = stringOrUndefined(newValue);
  }

  /**
   * Returns the atisType setting, or Combined if undefined.
   */
  get atisType() {
    return this.settings.atisType ?? AtisType.Combined;
  }

  /**
   * Returns the showTitle setting, or false if undefined.
   */
  get showTitle() {
    return this.settings.showTitle ?? false;
  }

  /**
   * Returns the showLetter setting, or false if undefined.
   */
  get showLetter() {
    return this.settings.showLetter ?? false;
  }

  /**
   * Returns the showAltimeter setting, or false if undefined.
   */
  get showAltimeter() {
    return this.settings.showAltimeter ?? false;
  }

  /**
   * Returns the showWind setting, or false if undefined.
   */
  get showWind() {
    return this.settings.showWind ?? false;
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
   * Sets the settings. Also updates the private icon paths and
   * compiled SVGs.
   */
  set settings(newValue: AtisLetterSettings) {
    this._settings = newValue;

    this.currentImagePath = newValue.currentImagePath;
    this.unavailableImagePath = newValue.unavailableImagePath;
    this.updatedImagePath = newValue.updatedImagePath;

    this.refreshTitle();
    this.refreshImage();
  }

  /**
   * Gets the isUpdated state on the action.
   */
  public get isNewAtis() {
    return this._isNewAtis;
  }

  /**
   * Sets the isUpdated state on the action and refreshes the state image to match.
   */
  public set isNewAtis(newValue: boolean) {
    this._isNewAtis = newValue;

    this.refreshImage();
  }

  /**
   * Gets the current ATIS letter.
   */
  get letter(): string | undefined {
    return this._letter;
  }

  /**
   * Sets the current AITS letter.
   */
  set letter(newLetter: string | undefined) {
    this._letter = newLetter;
    this.refreshTitle();
    this.refreshImage(); // For cases where the state is fully responsible for displaying the content
  }

  /**
   * Gets the current wind.
   */
  get wind(): string | undefined {
    return this._wind;
  }

  /**
   * Sets the current wind.
   */
  set wind(newWind: string | undefined) {
    this._wind = newWind;
    this.refreshTitle();
    this.refreshImage(); // For cases where the state is fully responsible for displaying the content
  }

  /**
   * Gets the current altimeter.
   */
  get altimeter(): string | undefined {
    return this._altimeter;
  }

  /**
   * Sets the current altimeter
   */
  set altimeter(newAltimeter: string | undefined) {
    this._altimeter = newAltimeter;
    this.refreshTitle();
    this.refreshImage(); // For cases where the state is fully responsible for displaying the content
  }

  /**
   * Convenience method to return the action's title from settings.
   */
  get title() {
    return this.settings.title;
  }
  //#endregion

  /**
   * Sets the image based on the state of the action.
   */
  public refreshImage() {
    const replacements = {
      station: this.station,
      letter: this.letter,
      title: this.title,
      altimeter: this.altimeter,
      wind: this.wind,
      isConnected: this.isConnected,
    };

    if (!this.isConnected) {
      this.setImage(this.unavailableImagePath, {
        ...replacements,
        stateColor: StateColor.CURRENT,
        state: "current",
      });
      return;
    }

    if (this.isNewAtis) {
      this.setImage(this.updatedImagePath, {
        ...replacements,
        stateColor: StateColor.UPDATED,
        state: "updated",
      });
      return;
    }

    this.setImage(this.currentImagePath, {
      ...replacements,
      stateColor: StateColor.CURRENT,
      state: "current",
    });
  }

  /**
   * Sets the title on the action.
   */
  public refreshTitle() {
    const title = new TitleBuilder();

    title.push(this.title, this.showTitle);
    title.push(this.letter ?? "ATIS", this.showLetter);
    title.push(this.wind, this.showWind);
    title.push(this.altimeter, this.showAltimeter);

    this.setTitle(title.join("\n"));
  }
}

/*
 * Typeguard for HotlineController.
 * @param action The action
 * @returns True if the action is a HotlineController
 */
export function isAtisLetterController(
  action: Controller
): action is AtisLetterController {
  return action.type === "AtisLetterController";
}
