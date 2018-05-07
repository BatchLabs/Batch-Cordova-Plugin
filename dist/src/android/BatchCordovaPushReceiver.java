package com.batch.cordova.android;

import android.app.Activity;
import android.content.BroadcastReceiver;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;

/**
 * Custom receiver built to handle foreground notifications
 */
public class BatchCordovaPushReceiver extends BroadcastReceiver
{

    @Override
    public void onReceive(Context context, Intent intent)
    {
        BatchCordovaPushService.enqueueWork(context, intent);
    }

}
