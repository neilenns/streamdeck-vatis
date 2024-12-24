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

@action({ UUID: "com.neil-enns.vatis.vatisstatus" })
/**
 * Represents the status of the websocket connection to vATIS.
 */
export class vAtisAudioStatus extends SingletonAction<vAtisStatusSettings> {
  private _keyDownStart = 0;

  // When the action is added to a profile it gets saved in the ActionManager
  // instance for use elsewhere in the code.
  override onWillAppear(
    ev: WillAppearEvent<vAtisStatusSettings>
  ): void | Promise<void> {
    // This should never happen. Typeguard to ensure the rest of the code can just use
    // KeyAction.
    if (!ev.action.isKey()) {
      return;
    }

    actionManager.addvAtis(ev.action, ev.payload.settings);
  }

  // When the action is removed from a profile it also gets removed from the ActionManager.
  override onWillDisappear(
    ev: WillDisappearEvent<vAtisStatusSettings>
  ): void | Promise<void> {
    actionManager.remove(ev.action);
  }

  override onDidReceiveSettings(
    ev: DidReceiveSettingsEvent<vAtisStatusSettings>
  ): Promise<void> | void {
    // This should never happen. Typeguard to ensure the rest of the code can just use
    // KeyAction.
    if (!ev.action.isKey()) {
      return;
    }

    actionManager.updatevAtisStatus(ev.action, ev.payload.settings);
  }

  override onKeyDown(): Promise<void> | void {
    this._keyDownStart = Date.now();
  }

  override onKeyUp(ev: KeyUpEvent<vAtisStatusSettings>): Promise<void> | void {
    const pressLength = Date.now() - this._keyDownStart;

    if (pressLength > LONG_PRESS_THRESHOLD) {
      actionManager.vAtisStatusLongPress(ev.action);
    }
  }
}

// Currently no settings are needed for this action
export interface vAtisStatusSettings {
  title?: string;
  notConnectedImagePath?: string;
  connectedImagePath?: string;
  showTitle?: boolean;
  [key: string]: JsonValue;
}
