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
import { handleRemove } from "@events/streamdeck/remove";
import { handleAddvAtisStatus } from "@events/streamdeck/vAtisStatus/addvAtisStatus";
import { handleUpdatevAtisStatusSettings } from "@events/streamdeck/vAtisStatus/updatevAtisStatusSettings";
import { handlevAtisStatusLongPress } from "@events/streamdeck/vAtisStatus/vatisStatusLongPress";
import { LONG_PRESS_THRESHOLD } from "@utils/constants";
import debounce from "debounce";

@action({ UUID: "com.neil-enns.vatis.vatisstatus" })
/**
 * Represents the status of the websocket connection to vATIS.
 */
export class vAtisAudioStatus extends SingletonAction<vAtisStatusSettings> {
  private _keyDownStart = 0;

  debouncedUpdate = debounce(
    (action: KeyAction, settings: vAtisStatusSettings) => {
      handleUpdatevAtisStatusSettings(action, settings);
    },
    300
  );

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

    handleAddvAtisStatus(ev.action, ev.payload.settings);
  }

  // When the action is removed from a profile it also gets removed from the ActionManager.
  override onWillDisappear(
    ev: WillDisappearEvent<vAtisStatusSettings>
  ): void | Promise<void> {
    handleRemove(ev.action);
  }

  override onDidReceiveSettings(
    ev: DidReceiveSettingsEvent<vAtisStatusSettings>
  ): Promise<void> | void {
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

  override onKeyUp(ev: KeyUpEvent<vAtisStatusSettings>): Promise<void> | void {
    const pressLength = Date.now() - this._keyDownStart;

    if (pressLength > LONG_PRESS_THRESHOLD) {
      handlevAtisStatusLongPress(ev.action);
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
