import { Messaging as MessagingActions } from "../actions";
import { sendToBridge, writeBatchLog } from "../helpers";

export class MessagingModule implements MessagingModule {
  public setDoNotDisturbEnabled(enabled: boolean): void {
    if (typeof enabled !== "boolean") {
      writeBatchLog(
        false,
        "Batch.Messaging - setDoNotDisturbEnabled: parameter must be a boolean"
      );
      return;
    }
    sendToBridge(null, MessagingActions.SetDoNotDisturbEnabled, [{ enabled }]);
  }

  public showPendingMessage(): void {
    sendToBridge(null, MessagingActions.ShowPendingMessage, null);
  }
}
