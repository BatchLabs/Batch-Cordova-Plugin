package com.batch.cordova.android;

import android.content.Context;
import android.content.Intent;
import android.content.pm.ApplicationInfo;
import android.content.pm.PackageManager;
import android.os.Bundle;
import android.util.Log;
import androidx.core.app.JobIntentService;
import androidx.localbroadcastmanager.content.LocalBroadcastManager;

import com.batch.android.Batch;
import com.batch.android.BatchMessage;
import com.batch.android.BatchPushPayload;
import com.batch.android.MessagingActivity;

public class BatchCordovaPushService extends JobIntentService
{
    private static final String TAG = "BatchCordovaPushService";

    /**
     * Unique job ID for this service.
     */
    static final int JOB_ID = 1212;

    /**
     * Name of the meta-data to enable foreground notifications handling
     */
    private static final String METADATA_ENABLE_FOREGROUND_NOTIFICATION_HANDLING = "com.batch.android.push.foreground_push_handling";

    private static final boolean ENABLE_FOREGROUND_NOTIFICATION_HANDLING_DEFAULT = false;

    /**
     * Convenience method for enqueuing work in to this service.
     */
    static void enqueueWork(Context context, Intent work) {
        enqueueWork(context, BatchCordovaPushService.class, JOB_ID, work);
    }

    @Override
    protected void onHandleWork(Intent intent)
    {
        try {
            if (Batch.Push.shouldDisplayPush(this, intent)) {
                if (isForegroundPushHandlingEnabled() && isAppInForeground()) {
                    BatchPushPayload pushPayload = BatchPushPayload.payloadFromReceiverIntent(intent);
                    boolean pushContainsLanding = pushPayload != null && pushPayload.hasLandingMessage();
                    if (pushContainsLanding) {
                        BatchMessage msg = pushPayload.getLandingMessage();
                        BatchMessage.Format format = msg.getFormat();
                        if (format == BatchMessage.Format.ALERT) {
                            MessagingActivity.startActivityForMessage(this, msg);
                        } else if (format == BatchMessage.Format.BANNER) {
                            Bundle b = new Bundle();
                            msg.writeToBundle(b);
                            forwardBannerToForegroundActivity(b);
                        }
                    }

                    forwardPushToForegroundActivity(intent);
                    Batch.Push.onNotificationDisplayed(this, intent);
                } else {
                    Batch.Push.displayNotification(this, intent);
                }

            }
        } catch (Exception e) {
            Log.e(TAG, "An error occurred while handling push", e);
        }
    }

    // Checks if the foreground push is enabled in the manifest
    private boolean isForegroundPushHandlingEnabled() {
        try
        {
            ApplicationInfo appInfo = getPackageManager().getApplicationInfo(getPackageName(), PackageManager.GET_META_DATA);
            if (appInfo.metaData != null)
            {
                return appInfo.metaData.getBoolean(METADATA_ENABLE_FOREGROUND_NOTIFICATION_HANDLING, ENABLE_FOREGROUND_NOTIFICATION_HANDLING_DEFAULT);
            }
        }
        catch (PackageManager.NameNotFoundException e)
        {
            // if we can’t find it in the manifest, just return the default (false)
        }
        catch(Exception e)
        {
            Log.e(TAG, "Error while parsing manifest meta data", e);
        }

        return ENABLE_FOREGROUND_NOTIFICATION_HANDLING_DEFAULT;
    }

    private boolean isAppInForeground() {
        return BatchCordovaPlugin.isApplicationInForeground();
    }

    private void forwardPushToForegroundActivity(Intent pushIntent) {
        final Intent i = new Intent(BatchCordovaPlugin.ACTION_FOREGROUND_PUSH);
        i.putExtra(Batch.Push.PAYLOAD_KEY, pushIntent.getExtras());
        LocalBroadcastManager.getInstance(this).sendBroadcast(i);
    }

    private void forwardBannerToForegroundActivity(Bundle message) {
        final Intent i = new Intent(BatchCordovaPlugin.ACTION_DISPLAY_LANDING_BANNER);
        i.putExtras(message);
        LocalBroadcastManager.getInstance(this).sendBroadcast(i);
    }
}
