import { BatchSDK } from "../types";
import {Core as CoreActions} from "./actions";
import { EventEmitter } from "./eventEmitter";
import {invokeModernBridge, sendToBridge, writeBatchLog} from "./helpers";
import { InboxModule } from "./modules/inbox";
import { MessagingModule } from "./modules/messaging";
import { PushModule } from "./modules/push";
import { UserModule } from "./modules/user";
import Platform from "./platform";
import {ProfileModule} from "./modules/profile";

export class Batch implements BatchSDK.Batch {
  public push: PushModule;
  public profile: ProfileModule;
  public user: UserModule;
  public messaging: MessagingModule;
  public inbox: InboxModule;

  private _config: BatchSDK.Config | null; // tslint:disable-line
  private _eventEmitter: EventEmitter; // tslint:disable-line

  constructor() {
    this.push = new PushModule();
    this.profile = new ProfileModule();
    this.user = new UserModule();
    this.messaging = new MessagingModule();
    this.inbox = new InboxModule();

    this._config = null;
    this._eventEmitter = new EventEmitter();
  }

  public on(event: string, listener: BatchSDK.BatchEventCallback): void {
    this._eventEmitter.on(event, listener);
  }

  public off(event?: string): void {
    this._eventEmitter.off(event);
  }

  public setConfig(config: BatchSDK.Config): void {
    if (typeof config !== "object") {
      writeBatchLog(false, "Config must be an object.");
      return;
    }

    // Use a base config
    const baseConfig: BatchSDK.Config = {
      androidAPIKey: null,
      canUseAdvertisingIdentifier: true,
      iOSAPIKey: null,
    };

    for (const key in config) {
      if (Object.prototype.hasOwnProperty.call(baseConfig, key)) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (baseConfig as any)[key] = (config as any)[key];
      } else {
        this.log(false, "Unknown key found in the config object : " + key);
      }
    }

    this._config = baseConfig;
  }

  public start(): void {
    if (this._config === null) {
      writeBatchLog(false, "You must call setConfig before calling start.");
      return;
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
        useIDFA: this._config.canUseAdvertisingIdentifier === true,
      },
    ]);

    sendToBridge(null, CoreActions.Start, null);
    return;
  }

  public optIn(): void {
    sendToBridge(null, CoreActions.OptIn, null);
  }

  public optOut(): void {
    sendToBridge(null, CoreActions.OptOut, null);
  }

  public optOutAndWipeData(): void {
    sendToBridge(null, CoreActions.OptOutWipeData, null);
  }

  public async isOptedOut(): Promise<boolean> {
     const {isOptedOut} = await invokeModernBridge(CoreActions.IsOptedOut) as { isOptedOut: boolean; };
     return isOptedOut
  }
  public setFindMyInstallationEnabled(enabled: boolean): void {
      sendToBridge(null, CoreActions.SetFindMyInstallationEnabled, [{enabled}]);
  }

  public updateAutomaticDataCollection(dataCollection: BatchSDK.DataCollectionConfig): void {
      sendToBridge(null, CoreActions.UpdateAutomaticDataCollection, [{dataCollection}]);
  }

  private log(debug: boolean, ...args: unknown[]) {
    writeBatchLog(debug, ...args);
  }
}
