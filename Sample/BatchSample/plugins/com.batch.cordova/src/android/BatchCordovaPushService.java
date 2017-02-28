package com.batch.cordova.android;

import android.app.IntentService;
import android.content.Intent;
import android.content.pm.ApplicationInfo;
import android.content.pm.PackageManager;
import android.util.Log;
import android.support.v4.content.LocalBroadcastManager;

import com.batch.android.Batch;
import com.batch.android.BatchPushPayload;
import com.batch.android.MessagingActivity;

public class BatchCordovaPushService extends IntentService
{
    private static final String TAG = "BatchCordovaPushService";

    /**
     * Name of the meta-data to enable foreground notifications handling
     */
    private static final String METADATA_ENABLE_FOREGROUND_NOTIFICATION_HANDLING = "com.batch.android.push.foreground_push_handling";

    private static final boolean ENABLE_FOREGROUND_NOTIFICATION_HANDLING_DEFAULT = false;

    public BatchCordovaPushService()
    {
        super("BatchCordovaPushService");
    }

    @Override
    protected void onHandleIntent(Intent intent)
    {
        try {
            if (Batch.Push.shouldDisplayPush(this, intent)) {
                if (isAppInForeground()) {
                    BatchPushPayload pushPayload = BatchPushPayload.payloadFromReceiverIntent(intent);
                    boolean pushContainsLanding = pushPayload != null && pushPayload.hasLandingMessage();

                    if (pushContainsLanding) {
                        MessagingActivity.startActivityForMessage(this, pushPayload.getLandingMessage());
                    }

                    if (isForegroundPushHandlingEnabled()) {
                        forwardPushToForegroundActivity(intent);
                        Batch.Push.onNotificationDisplayed(this, intent);
                    } else {
                        // Show the landing even if Batch should do that in displayNotificaiton.
                        // Thanks to cordova, the activity listener is set up way too late, and misses the first resume
                        // making the native SDK incapable of knowing that the cordova app is in the foreground
                        if (!pushContainsLanding) {
                            Batch.Push.displayNotification(this, intent);
                        }
                    }
                } else {
                    Batch.Push.displayNotification(this, intent);
                }

            }
        } catch (Exception e) {
            Log.e(TAG, "An error occurred while handling push", e);
        } finally {
            BatchCordovaPushReceiver.completeWakefulIntent(intent);
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
}
