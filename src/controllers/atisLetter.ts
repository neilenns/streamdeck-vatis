import { AtisLetterSettings, FlightRuleDisplay } from "@actions/atisLetter";
import { KeyAction } from "@elgato/streamdeck";
import { Controller } from "@interfaces/controller";
import {
  Atis,
  AtisType,
  NetworkConnectionStatus,
  Unit,
  Value,
} from "@interfaces/messages";
import TitleBuilder from "@root/utils/titleBuilder";
import { stringOrUndefined } from "@root/utils/utils";
import { ATIS_LETTER_CONTROLLER_TYPE } from "@utils/controllerTypes";
import debounce from "debounce";
import { BaseController } from "./baseController";

const defaultTemplatePath = "images/actions/atisLetter/template.svg";
const defaultUnavailableTemplatePath = "images/actions/atisLetter/template.svg";

/**
 * Default cloud level in feet. Used as a fallback when no ceiling data is available.
 */
const DEFAULT_CEILING_LEVEL_FEET = 9999;

/**
 * Default visibility in meters. Used as a fallback when no visibility data is available.
 */
const DEFAULT_VISIBILITY_METERS = 9999;

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
 * Flight rules categories according to ICAO standards
 */
enum IcaoFlightRules {
  IMC = "IMC", // Instrument flight conditions
  VMC = "VMC", // Visual flight conditions
  UNKNOWN = "UNKNOWN", // Flight rules couldn't be calculated
}

/**
 * A StationStatus action, for use with ActionManager. Tracks the settings,
 * state and Stream Deck action for an individual action in a profile.
 */
export class AtisLetterController extends BaseController {
  type = ATIS_LETTER_CONTROLLER_TYPE;

  private _connectionStatus: NetworkConnectionStatus | undefined = undefined;
  private _isNewAtis = false;
  private _letter?: string;
  private _wind?: string;
  private _altimeter?: string;
  private _pressure?: Value;
  private _faaFlightRules: FaaFlightRules = FaaFlightRules.UNKNOWN;
  private _icaoFlightRules: IcaoFlightRules = IcaoFlightRules.UNKNOWN;

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
    this._icaoFlightRules = IcaoFlightRules.UNKNOWN;

    this.refreshDisplay();
  }

  //#region Getters and setters
  /**
   * Gets the connectionStatus.
   * @returns {NetworkConnectionStatus | undefined } The network connection status or undefined if no status is available.
   */
  get connectionStatus(): NetworkConnectionStatus | undefined {
    return this._connectionStatus;
  }

  /*
   * Sets the connectionStatus and updates the action display.
   */
  set connectionStatus(newValue: NetworkConnectionStatus | undefined) {
    if (this._connectionStatus === newValue) {
      return;
    }

    this._connectionStatus = newValue;

    this.refreshDisplay();
  }

  /**
   * Gets the show flight rules setting.
   * @returns {FlightRuleDisplay} The type of flight rules indicator to show. Defaults to FAA if no setting is provided.
   */
  get showFlightRules(): FlightRuleDisplay {
    return this.settings.showFlightRules ?? FlightRuleDisplay.FAA;
  }

  /**
   * Gets the FAA flight rules for the current ATIS.
   * @returns {FaaFlightRules} The current FAA flight rules.
   */
  get faaFlightRules(): FaaFlightRules {
    return this._faaFlightRules;
  }

  /**
   * Sets the FAA flight rules for the current ATIS and updates the action display.
   */
  set faaFlightRules(newValue: FaaFlightRules) {
    if (this._faaFlightRules === newValue) {
      return;
    }

    this._faaFlightRules = newValue;

    this.refreshDisplay();
  }

  /**
   * Gets the ICAO flight rules for the current ATIS.
   * @returns {IcaoFlightRules} The current ICAO flight rules.
   */
  get icaoFlightRules(): IcaoFlightRules {
    return this._icaoFlightRules;
  }

  /**
   * Sets the ICAO flight rules for the current ATIS and updates the action display.
   */
  set icaoFlightRules(newValue: IcaoFlightRules) {
    if (this._icaoFlightRules === newValue) {
      return;
    }

    this._icaoFlightRules = newValue;

    this.refreshDisplay();
  }

  /**
   * Gets the name for the ATIS action.
   * @returns {string | undefined} The station name.
   */
  get station(): string | undefined {
    return this.settings.station;
  }

  /**
   * Gets the path to the current image asset.
   * @returns {string} The current image path or the default template path if the user didn't specify a custom image.
   */
  get currentImagePath(): string {
    return this._currentImagePath ?? defaultTemplatePath;
  }

  /**
   * Sets the current image path and re-compiles the SVG template if necessary.
   */
  set currentImagePath(newValue: string | undefined) {
    this._currentImagePath = stringOrUndefined(newValue);
  }

  /**
   * Gets the path to the observer image asset.
   * @returns {string} The observer image path or the default template path if the user didn't specify a custom image.
   */
  get observerImagePath(): string {
    return this._observerImagePath ?? defaultTemplatePath;
  }

  /**
   * Sets the observer image path and re-compiles the SVG template if necessary.
   */
  set observerImagePath(newValue: string | undefined) {
    this._observerImagePath = stringOrUndefined(newValue);
  }

  /**
   * Gets the path to the updated image asset.
   * @returns {string} The updated image path or the default template path if the user didn't specify a custom image.
   */
  get updatedImagePath(): string {
    return this._updatedImagePath ?? defaultTemplatePath;
  }

  /**
   * Sets the updated image path and re-compiles the SVG template if necessary.
   */
  set updatedImagePath(newValue: string | undefined) {
    this._updatedImagePath = stringOrUndefined(newValue);
  }

  /**
   * Gets the path to the unavailable image asset.
   * @returns {string} The unavailable image path or the default template path if the user didn't specify a custom image.
   */
  get unavailableImagePath(): string {
    return this._unavailableImagePath ?? defaultUnavailableTemplatePath;
  }

  /**
   * Sets the unavailable image path and re-compiles the SVG template if necessary.
   */
  set unavailableImagePath(newValue: string | undefined) {
    this._unavailableImagePath = stringOrUndefined(newValue);
  }

  /**
   * Gets the atisType setting.
   * @returns {AtisType} The atisType for the station, or Combined if undefined.
   */
  get atisType(): AtisType {
    return this.settings.atisType ?? AtisType.Combined;
  }

  /**
   * Gets the showTitle setting.
   * @returns {boolean} The setting, or false if undefined.
   */
  get showTitle(): boolean {
    return this.settings.showTitle ?? false;
  }

  /**
   * Gets the showLetter setting.
   * @returns {boolean} The setting, or false if undefined.
   */
  get showLetter(): boolean {
    return this.settings.showLetter ?? false;
  }

  /**
   * Gets the showAltimeter setting
   * @returns {boolean} The setting, or false if undefined.
   */
  get showAltimeter(): boolean {
    return this.settings.showAltimeter ?? false;
  }

  /**
   * Gets the showWind setting.
   * @returns {boolean} The setting, or false if undefined.
   */
  get showWind(): boolean {
    return this.settings.showWind ?? false;
  }

  /**
   * Gets the settings.
   * @returns {AtisLetterSettings} The settings.
   */
  get settings(): AtisLetterSettings {
    if (this._settings === null) {
      throw new Error("Settings not initialized. This should never happen.");
    }

    return this._settings;
  }

  /**
   * Sets the settings. Updates the image paths and refreshes the action display.
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
   * Gets the isNewAtis state on the action.
   * @returns {boolean} True if the ATIS is new.
   */
  public get isNewAtis(): boolean {
    return this._isNewAtis;
  }

  /**
   * Sets the isNewAtis state and refreshes the action display.
   */
  public set isNewAtis(newValue: boolean) {
    this._isNewAtis = newValue;

    this.refreshDisplay();
  }

  /**
   * Gets the current ATIS letter.
   * @returns {string | undefined} The current ATIS letter or undefined if none is available.
   */
  get letter(): string | undefined {
    return this._letter;
  }

  /**
   * Sets the current ATIS letter and refreshes the action display.
   */
  set letter(newLetter: string | undefined) {
    this._letter = newLetter;

    this.refreshDisplay();
  }

  /**
   * Gets the current wind.
   * @returns {string | undefined} The current wind or undefined if none is available.
   */
  get wind(): string | undefined {
    return this._wind;
  }

  /**
   * Sets the current wind and refreshes the action display.
   */
  set wind(newWind: string | undefined) {
    this._wind = newWind;

    this.refreshDisplay();
  }

  /**
   * Gets the current altimeter.
   * @returns {string | undefined} The current altimeter or undefined if none is available.
   */
  get altimeter(): string | undefined {
    return this._altimeter;
  }

  /**
   * Sets the current altimeter and refreshes the action display.
   */
  set altimeter(newAltimeter: string | undefined) {
    this._altimeter = newAltimeter;

    this.refreshDisplay();
  }

  /**
   * Gets the current pressure.
   * @returns {Value} The current pressure or undefined if none is available.
   */
  get pressure(): Value | undefined {
    return this._pressure;
  }

  /**
   * Sets the current pressure and refreshes the action display.
   */
  set pressure(newValue: Value | undefined) {
    this._pressure = newValue;

    this.refreshDisplay();
  }

  /**
   * Gets the action's title from settings.
   * @returns {string | undefined} The title or undefined if no title is specified.
   */
  get title(): string | undefined {
    return this.settings.title;
  }
  //#endregion

  /**
   * Updates the controller with new ATIS data and refreshes the action display.
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
    this.calculateIcaoFlightRules(value.ceiling, value.prevailingVisibility);
    this.enableUpdates();

    this.refreshDisplay();
  }

  /**
   * Calculates ICAO flight rules based on ceiling and visibility values.
   * @param {Value | undefined} ceiling - The ceiling height in hundreds of feet.
   * @param {Value | undefined} prevailingVisibility - The visibility in meters.
   * @private
   */
  private calculateIcaoFlightRules(
    ceiling?: Value,
    prevailingVisibility?: Value
  ) {
    // No visibility data might mean CAVOK so assume unlimited visibility.
    if (!prevailingVisibility) {
      prevailingVisibility = {
        actualValue: DEFAULT_VISIBILITY_METERS,
        actualUnit: Unit.Meter,
      };
    }

    // If the ceiling is null then set it to the default.
    if (!ceiling) {
      ceiling = {
        actualValue: DEFAULT_CEILING_LEVEL_FEET,
        actualUnit: Unit.Feet,
      };
    }

    // Rules are only applicable to meters and feet.
    if (
      prevailingVisibility.actualUnit !== Unit.Meter ||
      ceiling.actualUnit !== Unit.Feet
    ) {
      this.icaoFlightRules = IcaoFlightRules.UNKNOWN;
      return;
    }

    const cloudLevel = ceiling.actualValue;
    const visibility = prevailingVisibility.actualValue;

    if (visibility < 0 || cloudLevel < 0) {
      this.icaoFlightRules = IcaoFlightRules.UNKNOWN;
      return;
    }

    // The checks are in this order to ensure the most restrictive, rather than least restrictive,
    // is applied.
    // Visibility is in meters.
    // Cloud levels are in 100s of feet.
    if (visibility < 5000 || cloudLevel < 15) {
      this.icaoFlightRules = IcaoFlightRules.IMC;
    } else {
      this.icaoFlightRules = IcaoFlightRules.VMC;
    }
  }

  /**
   * Calculates FAA flight rules based on ceiling and visibility values.
   * @param {Value | undefined} ceiling - The ceiling height in hundreds of feet.
   * @param {Value | undefined} prevailingVisibility - The visibility in statute miles.
   * @private
   */
  private calculateFaaFlightRules(
    ceiling?: Value,
    prevailingVisibility?: Value
  ) {
    // No visibility data means the flight rules can't be calculated.
    if (!prevailingVisibility) {
      this.faaFlightRules = FaaFlightRules.UNKNOWN;
      return;
    }

    // If the ceiling is null then set it to the default.
    if (!ceiling) {
      ceiling = {
        actualValue: DEFAULT_CEILING_LEVEL_FEET,
        actualUnit: Unit.Feet,
      };
    }

    // FAA rules are only applicable to statute miles and feet
    if (
      prevailingVisibility.actualUnit !== Unit.StatuteMile ||
      ceiling.actualUnit !== Unit.Feet
    ) {
      this.faaFlightRules = FaaFlightRules.UNKNOWN;
      return;
    }

    const cloudLevel = ceiling.actualValue;
    const visibility = prevailingVisibility.actualValue;

    if (visibility < 0 || cloudLevel < 0) {
      this.faaFlightRules = FaaFlightRules.UNKNOWN;
      return;
    }

    // The checks are in this order to ensure the most restrictive, rather than least restrictive,
    // is applied. Values from https://www.faasafety.gov/files/gslac/courses/content/38/472/6.2%20Personal%20Minimums%20Worksheet.pdf
    // Cloud levels are in 100s of feet.
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
        this.connectionStatus === NetworkConnectionStatus.Observer,
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
      icaoFlightRules: this.icaoFlightRules,
      showFlightRules: this.showFlightRules,
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
 * Typeguard for AtisLetterController.
 * @param action The action.
 * @returns True if the action is a AtisLetterController.
 */
export function isAtisLetterController(
  action: Controller
): action is AtisLetterController {
  return action.type === ATIS_LETTER_CONTROLLER_TYPE;
}
