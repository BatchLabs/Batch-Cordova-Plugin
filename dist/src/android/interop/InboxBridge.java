package com.batch.cordova.interop;

import android.app.Activity;
import android.util.Log;

import com.batch.android.Batch;
import com.batch.android.BatchInboxFetcher;
import com.batch.android.BatchInboxNotificationContent;
import com.batch.android.json.JSONArray;
import com.batch.android.json.JSONException;
import com.batch.android.json.JSONObject;

import java.util.List;
import java.util.Map;

public class InboxBridge
{
    private static final String TAG = "BatchCordovaPluginInbox";

    // Number of notifications to fetch
    private static final int NOTIFICATIONS_COUNT = 100;

    public static SimplePromise<String> fetchNotifications(Activity activity)
    {
        BatchInboxFetcher fetcher = Batch.Inbox.getFetcher(activity);
        fetcher.setFetchLimit(NOTIFICATIONS_COUNT);
        fetcher.setMaxPageSize(NOTIFICATIONS_COUNT);

        return new SimplePromise<>(new SimplePromise.DeferredResultExecutorRunnable<String>()
        {
            @Override
            public void run(SimplePromise<String> promise)
            {
                fetcher.fetchNewNotifications(new BatchInboxFetcher.OnNewNotificationsFetchedListener()
                {
                    @Override
                    public void onFetchSuccess(List<BatchInboxNotificationContent> notifications,
                                               boolean foundNewNotifications,
                                               boolean endReached)
                    {
                        promise.resolve(getSuccessResponse(notifications));
                    }

                    @Override
                    public void onFetchFailure(String error)
                    {
                        promise.resolve(getErrorResponse(error));
                    }
                });
            }
        });
    }

    public static SimplePromise<String> fetchNotifications(Activity activity,
                                                           String userID,
                                                           String auth)
    {
        BatchInboxFetcher fetcher = Batch.Inbox.getFetcher(activity, userID, auth);
        fetcher.setFetchLimit(NOTIFICATIONS_COUNT);
        fetcher.setMaxPageSize(NOTIFICATIONS_COUNT);

        return new SimplePromise<>(new SimplePromise.DeferredResultExecutorRunnable<String>()
        {
            @Override
            public void run(SimplePromise<String> promise)
            {
                fetcher.fetchNewNotifications(new BatchInboxFetcher.OnNewNotificationsFetchedListener()
                {
                    @Override
                    public void onFetchSuccess(List<BatchInboxNotificationContent> notifications,
                                               boolean foundNewNotifications,
                                               boolean endReached)
                    {
                        promise.resolve(getSuccessResponse(notifications));
                    }

                    @Override
                    public void onFetchFailure(String error)
                    {
                        promise.resolve(getErrorResponse(error));
                    }
                });
            }
        });

    }

    private static String getSuccessResponse(List<BatchInboxNotificationContent> notifications)
    {
        try {
            final JSONArray jsonNotifications = new JSONArray();
            for (BatchInboxNotificationContent notification : notifications) {
                try {
                    jsonNotifications.put(getJSONNotification(notification));
                } catch (JSONException e1) {
                    Log.d(TAG, "Could not convert notification", e1);
                }
            }

            final JSONObject json = new JSONObject();

            json.put("notifications", jsonNotifications);

            return json.toString();
        } catch (JSONException e) {
            Log.d(TAG, "Could not convert notifications", e);
            return getErrorResponse("Internal native error (-201)");
        }
    }

    private static String getErrorResponse(String reason)
    {
        try {
            final JSONObject json = new JSONObject();
            json.put("error", reason);
            return json.toString();
        } catch (JSONException e) {
            Log.d(TAG, "Could not convert error", e);
            return ( "{'error':'Internal native error (-200)'" );
        }
    }

    private static JSONObject getJSONNotification(BatchInboxNotificationContent notification) throws JSONException
    {
        final JSONObject json = new JSONObject();

        json.put("identifier", notification.getNotificationIdentifier());
        json.put("body", notification.getBody());
        json.put("is_unread", notification.isUnread());
        json.put("date", notification.getDate().getTime());

        int source = 0; // UNKNOWN
        switch (notification.getSource()) {
            case CAMPAIGN:
                source = 1;
                break;
            case TRANSACTIONAL:
                source = 2;
                break;
        }
        json.put("source", source);

        final String title = notification.getTitle();
        if (title != null) {
            json.put("title", title);
        }

        json.put("payload", pushPayloadToJSON(notification.getRawPayload()));

        return json;
    }

    private static JSONObject pushPayloadToJSON(Map<String, String> payload)
    {
        try {
            final JSONObject jsonPayload = new JSONObject();

            for (String key : payload.keySet()) {
                Object value = payload.get(key);
                if (value == null) {
                    continue;
                }

                jsonPayload.put(key, value);
            }

            return jsonPayload;
        } catch (JSONException e) {
            return new JSONObject();
        }
    }
}
