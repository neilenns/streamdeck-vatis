import { Atis, AtisType, OutgoingMessage } from "@interfaces/messages";
import mainLogger from "@utils/logger";
import EventEmitter from "events";
import WebSocket from "ws";

const logger = mainLogger.child({ service: "vatis" });

class VatisManager extends EventEmitter {
  private static instance: VatisManager | null = null;
  private socket: WebSocket | null = null;
  private reconnectInterval = 1000 * 5; // 5 seconds
  private url = "ws://127.0.0.1:49082/";
  private reconnectTimer: NodeJS.Timeout | null = null;
  private _isAppRunning = false;

  private constructor() {
    super();
  }

  /**
   * Provides access to the VatisManager instance.
   * @returns The instance of VatisManager
   */
  public static getInstance(): VatisManager {
    if (!VatisManager.instance) {
      VatisManager.instance = new VatisManager();
    }
    return VatisManager.instance;
  }

  /**
   * Gets whether the vATIS application was detected as running by Stream Deck.
   * @returns {boolean} True if running.
   */
  public get isAppRunning(): boolean {
    return this._isAppRunning;
  }

  /**
   * Sets whether the vATIS application is running.
   * @param {boolean} newValue True if running.
   */
  public set isAppRunning(newValue: boolean) {
    this._isAppRunning = newValue;
  }

  /**
   * Sets the connection URL for vATIS.
   * @param {string} url The URL for the vATIS instance
   */
  public setUrl(url: string) {
    this.url = url;
  }

  /**
   * Provides the current state of the connection to vATIS.
   * @returns True if there is an open connection to vATIS, false otherwise.
   */
  get isConnected() {
    return this.socket !== null && this.socket.readyState === WebSocket.OPEN;
  }

  /**
   * Connects to a vATIS instance and registers event handlers for various socket events.
   */
  public connect(): void {
    if (this.socket && this.socket.readyState !== WebSocket.CLOSED) {
      logger.warn("WebSocket is already connected or connecting.");
      return;
    }

    // Cancel any pending reconnect timer just in case there is one
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    this.socket = new WebSocket(this.url);

    this.socket.on("open", () => {
      logger.debug("WebSocket connection established.");
      this.emit("connected");
    });

    this.socket.on("close", () => {
      logger.debug("WebSocket connection closed");

      this.emit("disconnected");
      this.reconnect();
    });

    this.socket.on("error", (err: Error & { code: string }) => {
      if (err.code === "ECONNREFUSED") {
        logger.debug(
          "Unable to connect to vATIS, connection refused. vATIS probably isn't running or open to a profile."
        );
      } else {
        logger.error("WebSocket error:", err.message);
      }

      this.reconnect();
    });

    this.socket.on("message", (message: string) => {
      this.processMessage(message);
    });
  }

  /**
   * Disconnects from a vATIS instance.
   */
  public disconnect(): void {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  /**
   * Takes an incoming websocket message from vAtis, determines the type, and then
   * fires the appropriate event.
   * @param message The message to process
   */
  private processMessage(message: string): void {
    logger.debug(`Received: ${message}`);

    const data = JSON.parse(message) as Atis;

    this.emit("atisUpdate", data);
  }

  /**
   * Sets up a timer to attempt to reconnect to the websocket.
   */
  private reconnect(): void {
    // Check to see if a reconnect attempt is already in progress. If so
    // skip starting another one.
    if (this.reconnectTimer) {
      return;
    }

    this.reconnectTimer = setTimeout(() => {
      logger.debug(`Attempting to reconnect...`);
      this.connect();
    }, this.reconnectInterval);
  }

  /**
   * Sends a message to vATIS to get all the ATIS states.
   */
  public refreshAll() {
    if (!this.isConnected) {
      return;
    }

    this.sendMessage({ type: "getAtis" });
  }

  /**
   * Sends a message to vATIS to get the ATIS for a specific station.
   * If the station is omitted refreshes all stations regardless of type.
   * @param station Station to refresh
   * @param atisType Station type to refresh
   */
  public refreshAtis(station?: string, atisType?: AtisType) {
    if (!this.isConnected) {
      return;
    }

    if (!station) {
      this.sendMessage({ type: "getAtis" });
      return;
    }

    this.sendMessage({ type: "getAtis", value: { station, atisType } });
  }

  /**
   * Sends a message to vATIS.
   * @param message The message to send
   */
  public sendMessage(message: OutgoingMessage) {
    if (!this.isConnected) {
      return;
    }

    this.socket?.send(JSON.stringify(message));
  }
}

const vatisManagerInstance = VatisManager.getInstance();
export default vatisManagerInstance;
