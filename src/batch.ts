import { Core as CoreActions } from "./actions";
import { EventEmitter } from "./eventEmitter";
import { sendToBridge, writeBatchLog } from "./helpers";
import { InboxModule } from "./modules/inbox";
import { MessagingModule } from "./modules/messaging";
import { PushModule } from "./modules/push";
import { UserModule } from "./modules/user";
import Platform from "./platform";

export default class Batch implements BatchSDK.Batch {
  public push: PushModule;
  public user: UserModule;
  public messaging: MessagingModule;
  public inbox: InboxModule;

  private _config: BatchSDK.Config | null; // tslint:disable-line
  private _eventEmitter: EventEmitter; // tslint:disable-line

  constructor() {
    this.push = new PushModule();
    this.user = new UserModule();
    this.messaging = new MessagingModule();
    this.inbox = new InboxModule();

    this._config = null;
    this._eventEmitter = new EventEmitter();
  }

  public on(event: string, listener: BatchSDK.BatchEventCallback) {
    this._eventEmitter.on(event, listener);
  }

  public off(event?: string) {
    this._eventEmitter.off(event);
  }

  public setConfig(config: BatchSDK.Config) {
    if (typeof config !== "object") {
      writeBatchLog(false, "Config must be an object.");
      return;
    }

    // Use a base config
    const baseConfig: BatchSDK.Config = {
      androidAPIKey: null,
      canUseAdvertisingIdentifier: true,
      iOSAPIKey: null
    };

    for (const key in config) {
      if (baseConfig.hasOwnProperty(key)) {
        (baseConfig as any)[key] = (config as any)[key];
      } else {
        this.log(false, "Unknown key found in the config object : " + key);
      }
    }

    this._config = baseConfig;
  }

  public start() {
    if (this._config === null) {
      writeBatchLog(false, "You must call setConfig before calling start.");
      return this;
    }

    const apiKey = Platform.isCurrent(Platform.Android)
      ? this._config.androidAPIKey
      : this._config.iOSAPIKey;
    if (typeof apiKey !== "string") {
      writeBatchLog(
        false,
        "No API key was specified for the current platform."
      );
      return;
    }

    // Set the config first
    sendToBridge(null, CoreActions.SetConfig, [
      {
        APIKey: apiKey,
        useAndroidID: false,
        useIDFA: this._config.canUseAdvertisingIdentifier === true
      }
    ]);

    sendToBridge(null, CoreActions.Start, null);
    return;
  }

  public optIn() {
    sendToBridge(null, CoreActions.OptIn, null);
  }

  public optOut() {
    sendToBridge(null, CoreActions.OptOut, null);
  }

  public optOutAndWipeData() {
    sendToBridge(null, CoreActions.OptOutWipeData, null);
  }

  private log(debug: boolean, ...args: any[]) {
    writeBatchLog(debug, ...args);
  }
}
