import {
  action,
  DidReceiveSettingsEvent,
  JsonValue,
  KeyAction,
  KeyUpEvent,
  SingletonAction,
  WillAppearEvent,
  WillDisappearEvent,
} from "@elgato/streamdeck";
import { handleAddAtisLetter } from "@events/streamdeck/atisLetter/addAtisLetter";
import { handleAtisLetterLongPress } from "@events/streamdeck/atisLetter/atisLetterLongPress";
import { handleAtisLetterShortPress } from "@events/streamdeck/atisLetter/atisLetterShortPress";
import { handleUpdateAtisLetterSettings } from "@events/streamdeck/atisLetter/updateAtisLetterSettings";
import { handleRemove } from "@events/streamdeck/remove";
import { AtisType } from "@interfaces/messages";
import { LONG_PRESS_THRESHOLD } from "@utils/constants";
import debounce from "debounce";

@action({ UUID: "com.neil-enns.vatis.atisletter" })
/**
 * Represents the status of a TrackAudio station
 */
export class AtisLetter extends SingletonAction<AtisLetterSettings> {
  private _keyDownStart = 0;

  debouncedUpdate = debounce(
    (action: KeyAction, settings: AtisLetterSettings) => {
      handleUpdateAtisLetterSettings(action, settings);
    },
    300
  );

  // When the action is added to a profile it gets saved in the ActionManager
  // instance for use elsewhere in the code. The default title is also set
  // to something useful.
  override onWillAppear(
    ev: WillAppearEvent<AtisLetterSettings>
  ): void | Promise<void> {
    // This should never happen. Typeguard to ensure the rest of the code can just use
    // KeyAction.
    if (!ev.action.isKey()) {
      return;
    }

    handleAddAtisLetter(ev.action, ev.payload.settings);
  }

  // When the action is removed from a profile it also gets removed from the ActionManager.
  override onWillDisappear(
    ev: WillDisappearEvent<AtisLetterSettings>
  ): void | Promise<void> {
    handleRemove(ev.action);
  }

  // When settings are received the ActionManager is called to update the existing
  // settings on the saved action.
  override onDidReceiveSettings(
    ev: DidReceiveSettingsEvent<AtisLetterSettings>
  ): void | Promise<void> {
    // This should never happen. Typeguard to ensure the rest of the code can just use
    // KeyAction.
    if (!ev.action.isKey()) {
      return;
    }

    this.debouncedUpdate(ev.action, ev.payload.settings);
  }

  override onKeyDown(): Promise<void> | void {
    this._keyDownStart = Date.now();
  }

  override onKeyUp(ev: KeyUpEvent<AtisLetterSettings>): Promise<void> | void {
    const pressLength = Date.now() - this._keyDownStart;

    if (pressLength > LONG_PRESS_THRESHOLD) {
      handleAtisLetterLongPress();
    } else {
      handleAtisLetterShortPress(ev.action);
    }
  }
}

export enum FlightRuleDisplay {
  NONE = "NONE",
  FAA = "FAA",
  ICAO = "ICAO",
}

export interface AtisLetterSettings {
  atisType?: AtisType;
  showAltimeter?: boolean;
  showWind?: boolean;
  currentImagePath?: string;
  observerImagePath?: string;
  showFlightRules?: FlightRuleDisplay;
  showLetter?: boolean;
  showTitle?: boolean;
  station?: string;
  title?: string;
  unavailableImagePath?: string;
  updatedImagePath?: string;
  [key: string]: JsonValue;
}
