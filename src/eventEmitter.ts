import { BatchSDK } from "../types";
import { writeBatchLog } from "./helpers";

export class EventEmitter {
  /**
   * Registered event listeners
   */
  private _eventListeners: { [key: string]: BatchSDK.BatchEventCallback[] }; // tslint:disable-line

  constructor() {
    this._eventListeners = {};
  }

  /**
   * Registers a listener for a given event. Multiple listeners can be set on an event.
   *
   * @param event The event name to listen to.
   * @param listener Function with two arguments : event name and parameters.
   */
  public on(event: string, listener: BatchSDK.BatchEventCallback): this {
    if (typeof event !== "string") {
      writeBatchLog(false, "Event name must be a string if supplied");
      return this;
    }

    // Make sure this exists
    this._eventListeners[event] = this._eventListeners[event] || [];

    this._eventListeners[event].push(listener);

    return this;
  }

  /**
   * Unregisters all listeners for a given event.
   *
   * @param event The event name you wish to remove the listener for. If nothing is provided, all events are removed.
   */
  public off(event?: string): this {
    if (typeof event === "undefined") {
      this._eventListeners = {};
      return this;
    }
    if (typeof event !== "string") {
      writeBatchLog(false, "Event name must be a string if supplied");
      return this;
    }
    this._eventListeners[event] = [];
    return this;
  }

  /**
   * Emit an event
   */
  public emit(event: string, parameters: { [key: string]: unknown }): void {
    writeBatchLog(
      true,
      "Calling back developer implementation - " + event,
      parameters
    );
    const listeners = this._eventListeners[event] || [];
    listeners.forEach((listener) => {
      listener(event, parameters);
    });
  }
}
