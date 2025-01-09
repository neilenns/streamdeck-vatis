import { AtisLetterSettings } from "@actions/atisLetter";
import { KeyAction } from "@elgato/streamdeck";
import { Controller } from "@interfaces/controller";
import {
  Atis,
  AtisType,
  NetworkConnectionStatus,
  Value,
} from "@interfaces/messages";
import TitleBuilder from "@root/utils/titleBuilder";
import { stringOrUndefined } from "@root/utils/utils";
import debounce from "debounce";
import { BaseController } from "./baseController";

const defaultTemplatePath = "images/actions/atisLetter/template.svg";
const defaultUnavailableTemplatePath = "images/actions/atisLetter/template.svg";

const MAX_CLOUD_LEVEL = 9999;

/**
 * Flight rules categories according to FAA standards
 */
enum FaaFlightRules {
  VFR = "VFR", // Visual Flight Rules
  MVFR = "MVFR", // Marginal Visual Flight Rules
  IFR = "IFR", // Instrument Flight Rules
  LIFR = "LIFR", // Low Instrument Flight Rules
  UNKNOWN = "UNKNOWN", // Flight rules couldn't be calculated
}

/**
 * A StationStatus action, for use with ActionManager. Tracks the settings,
 * state and Stream Deck action for an individual action in a profile.
 */
export class AtisLetterController extends BaseController {
  type = "AtisLetterController";

  private _connectionStatus: NetworkConnectionStatus | undefined = undefined;
  private _isNewAtis = false;
  private _letter?: string;
  private _wind?: string;
  private _altimeter?: string;
  private _pressure?: Value;
  private _faaFlightRules: FaaFlightRules = FaaFlightRules.UNKNOWN;

  private _suppressUpdates: boolean;
  private _settings: AtisLetterSettings | null = null;

  private _currentImagePath?: string;
  private _observerImagePath?: string;
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
    this._suppressUpdates = false;
  }

  /**
   * Refreshes the title and image on the action.
   */
  public override refreshDisplay = debounce(() => {
    if (this._suppressUpdates) {
      return;
    }

    this.refreshTitle();
    this.refreshImage();
  }, 100);

  /**
   * Resets the action to its default, disconnected, state.
   */
  public reset() {
    this._letter = undefined;
    this._isNewAtis = false;
    this._connectionStatus = undefined;
    this._altimeter = undefined;
    this._wind = undefined;
    this._pressure = undefined;
    this._suppressUpdates = false;
    this._faaFlightRules = FaaFlightRules.UNKNOWN;

    this.refreshDisplay();
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
  set connectionStatus(newValue: NetworkConnectionStatus | undefined) {
    if (this._connectionStatus === newValue) {
      return;
    }

    this._connectionStatus = newValue;

    this.refreshDisplay();
  }

  /**
   * Returns the FAA flight rules for the current ATIS.
   */
  get faaFlightRules() {
    return this._faaFlightRules;
  }

  /**
   * Sets the FAA flight rules for the current ATIS.
   */
  set faaFlightRules(newValue: FaaFlightRules) {
    if (this._faaFlightRules === newValue) {
      return;
    }

    this._faaFlightRules = newValue;

    this.refreshDisplay();
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
   * Returns the observerImagePath or the default template path if the
   * user didn't specify a custom icon.
   */
  get observerImagePath(): string {
    return this._observerImagePath ?? defaultTemplatePath;
  }

  /**
   * Sets the observerImagePath and re-compiles the SVG template if necessary.
   */
  set observerImagePath(newValue: string | undefined) {
    this._observerImagePath = stringOrUndefined(newValue);
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
    this.observerImagePath = newValue.observerImagePath;
    this.unavailableImagePath = newValue.unavailableImagePath;
    this.updatedImagePath = newValue.updatedImagePath;

    this.refreshDisplay();
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

    this.refreshDisplay();
  }

  /**
   * Gets the current ATIS letter.
   */
  get letter(): string | undefined {
    return this._letter;
  }

  /**
   * Sets the current ATIS letter.
   */
  set letter(newLetter: string | undefined) {
    this._letter = newLetter;

    this.refreshDisplay();
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

    this.refreshDisplay();
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

    this.refreshDisplay();
  }

  /**
   * Gets the current pressure.
   */
  get pressure(): Value | undefined {
    return this._pressure;
  }

  /**
   * Sets the current pressure unit
   */
  set pressure(newPressureUnit: Value | undefined) {
    this._pressure = newPressureUnit;

    this.refreshDisplay();
  }

  /**
   * Convenience method to return the action's title from settings.
   */
  get title() {
    return this.settings.title;
  }
  //#endregion

  /**
   * Updates the controller with new ATIS data.
   * @param data The new ATIS data
   */
  public updateAtis(data: Atis) {
    const { value } = data;

    this.suppressUpdates();
    this.connectionStatus = value.networkConnectionStatus;
    this.letter = value.atisLetter;
    this.isNewAtis = value.isNewAtis ?? false;
    this.wind = value.wind;
    this.altimeter = value.altimeter;
    this.pressure = value.pressure;
    this.calculateFaaFlightRules(value.ceiling, value.prevailingVisibility);
    this.enableUpdates();

    this.refreshDisplay();
  }

  /**
   * Disables automatic refreshing of the title and background image when
   * properties are updated. Useful when multiple properties will be updated
   * in quick succession to avoid unnecessary re-renders.
   */
  public suppressUpdates() {
    this._suppressUpdates = true;
  }

  /**
   * Enables automatic refreshing of the title and background image when
   * properties are updated.
   */
  public enableUpdates() {
    this._suppressUpdates = false;
  }

  /**
   * Sets the image based on the state of the action.
   */
  private refreshImage() {
    const replacements = {
      connectionStatus: this.connectionStatus,
      isConnected:
        this.connectionStatus === NetworkConnectionStatus.Connected ||
        NetworkConnectionStatus.Observer,
      isNewAtis: this.isNewAtis,
      letter: this.letter,
      pressure: {
        unit: this.pressure?.actualUnit,
        value: this.pressure?.actualValue,
        formattedValue: this.altimeter,
      },
      station: this.station,
      title: this.title,
      wind: this.wind,
      faaFlightRules: this.faaFlightRules,
    };

    if (this.isNewAtis) {
      this.setImage(this.updatedImagePath, replacements);
      return;
    }

    if (this.connectionStatus === NetworkConnectionStatus.Connected) {
      this.setImage(this.currentImagePath, replacements);
      return;
    }

    if (this.connectionStatus === NetworkConnectionStatus.Observer) {
      this.setImage(this.observerImagePath, replacements);
      return;
    }

    this.setImage(this.unavailableImagePath, replacements);
  }

  private calculateFaaFlightRules(
    ceiling?: Value,
    prevailingVisibility?: Value
  ) {
    // No visiblity data means the flight rules can't be calculated.
    if (!prevailingVisibility) {
      this.faaFlightRules = FaaFlightRules.UNKNOWN;
      return;
    }

    const cloudLevel = ceiling?.actualValue ?? MAX_CLOUD_LEVEL; // If no ceiling is provided assume it is really high so the tests work out
    const visibility = prevailingVisibility.actualValue;

    if (visibility < 0 || cloudLevel < 0) {
      this.faaFlightRules = FaaFlightRules.UNKNOWN;
      return;
    }

    // The checks are in this order to ensure the most restrctive, rather than least restrictive,
    // is applied. Values from https://www.faasafety.gov/files/gslac/courses/content/38/472/6.2%20Personal%20Minimums%20Worksheet.pdf
    if (visibility < 1 || cloudLevel < 5) {
      this.faaFlightRules = FaaFlightRules.LIFR;
    } else if (
      (visibility >= 1 && visibility < 3) ||
      (cloudLevel >= 5 && cloudLevel < 10)
    ) {
      this.faaFlightRules = FaaFlightRules.IFR;
    } else if (
      (visibility >= 3 && visibility <= 5) ||
      (cloudLevel >= 10 && cloudLevel <= 30)
    ) {
      this.faaFlightRules = FaaFlightRules.MVFR;
    } else if (visibility > 5 && cloudLevel > 30) {
      this.faaFlightRules = FaaFlightRules.VFR;
    } else {
      this.faaFlightRules = FaaFlightRules.UNKNOWN;
    }
  }

  /**
   * Sets the title on the action.
   */
  private refreshTitle() {
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
