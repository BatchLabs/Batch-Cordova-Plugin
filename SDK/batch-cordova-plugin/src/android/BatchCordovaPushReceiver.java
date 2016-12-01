package com.batch.cordova.android;

import android.app.Activity;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.support.v4.content.WakefulBroadcastReceiver;

/**
 * Custom receiver built to handle foreground notifications
 */
public class BatchCordovaPushReceiver extends WakefulBroadcastReceiver
{

    @Override
    public void onReceive(Context context, Intent intent)
    {
        ComponentName comp = new ComponentName(context.getPackageName(), BatchCordovaPushService.class.getName());
        startWakefulService(context, intent.setComponent(comp));
        setResultCode(Activity.RESULT_OK);
    }

}
