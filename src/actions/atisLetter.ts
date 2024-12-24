import {
  action,
  DidReceiveSettingsEvent,
  JsonValue,
  KeyUpEvent,
  SingletonAction,
  WillAppearEvent,
  WillDisappearEvent,
} from "@elgato/streamdeck";
import actionManager from "@managers/action";
import { LONG_PRESS_THRESHOLD } from "@utils/constants";

@action({ UUID: "com.neil-enns.vatis.atisletter" })
/**
 * Represents the status of a TrackAudio station
 */
export class AtisLetter extends SingletonAction<AtisLetterSettings> {
  private _keyDownStart = 0;

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

    actionManager.addAtisLetter(ev.action, ev.payload.settings);
  }

  // When the action is removed from a profile it also gets removed from the ActionManager.
  override onWillDisappear(
    ev: WillDisappearEvent<AtisLetterSettings>
  ): void | Promise<void> {
    actionManager.remove(ev.action);
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

    actionManager.updateAtisLetterSettings(ev.action, ev.payload.settings);
  }

  override onKeyDown(): Promise<void> | void {
    this._keyDownStart = Date.now();
  }

  override onKeyUp(ev: KeyUpEvent<AtisLetterSettings>): Promise<void> | void {
    const pressLength = Date.now() - this._keyDownStart;

    if (pressLength > LONG_PRESS_THRESHOLD) {
      actionManager.atisLetterLongPress(ev.action);
    } else {
      actionManager.atisLetterShortPress(ev.action);
    }
  }
}

export interface AtisLetterSettings {
  showAltimeter?: boolean;
  showWind?: boolean;
  currentImagePath?: string;
  showLetter?: boolean;
  showTitle?: boolean;
  station?: string;
  title?: string;
  unavailableImagePath?: string;
  updatedImagePath?: string;
  [key: string]: JsonValue;
}
