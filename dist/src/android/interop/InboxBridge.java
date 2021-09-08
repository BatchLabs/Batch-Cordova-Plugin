package com.batch.cordova.android.interop;

import static com.batch.cordova.android.interop.Bridge.getOptionalTypedParameter;
import static com.batch.cordova.android.interop.Bridge.getTypedParameter;

import android.app.Activity;
import android.content.Context;
import android.util.Log;

import androidx.annotation.NonNull;

import com.batch.android.Batch;
import com.batch.android.BatchInboxFetcher;
import com.batch.android.BatchInboxNotificationContent;
import com.batch.android.json.JSONException;
import com.batch.android.json.JSONObject;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

/**
 * The InboxBridge's job is to retain {@link com.batch.android.BatchInboxFetcher} instances
 * based on an ID, so that the bridged plugin can access retained instances of the fetcher to use.
 * It will also handle calls and dispatch them to the appropriate fetcher, handling all inbox
 * related calls.
 *
 * This can lead to memory leaks if the memory isn't freed, as this object will retain instances
 * indefinitely. Make sure to expose a method on the plugin side to tell this class to release a
 * fetcher.
 */
class InboxBridge {
    private static final String TAG = "BatchCordovaPlugin";

    Map<String, BatchInboxFetcher> fetchers = new ConcurrentHashMap<>();

    @NonNull
    SimplePromise<Object> doAction(@NonNull Action action, @NonNull Map<String, Object> parameters, @NonNull Activity activity) throws BridgeException, BatchBridgeNotImplementedException {
        switch (action) {
            case INBOX_CREATE_INSTALLATION_FETCHER:
                return SimplePromise.resolved(createInstallationFetcher(activity, parameters));
            case INBOX_CREATE_USER_FETCHER:
                return SimplePromise.resolved(createUserFetcher(activity, parameters));
            case INBOX_RELEASE_FETCHER:
                releaseFetcher(parameters);
                return SimplePromise.resolved(null);
            case INBOX_FETCH_NEW_NOTIFICATIONS:
                return fetchNewNotifications(parameters);
            case INBOX_FETCH_NEXT_PAGE:
                return fetchNextPage(parameters);
            case INBOX_GET_FETCHED_NOTIFICATIONS:
                return getFetchedNotifications(parameters);
            case INBOX_MARK_AS_READ:
                return markAsRead(parameters);
            case INBOX_MARK_ALL_AS_READ:
                return markAllAsRead(parameters);
            case INBOX_MARK_AS_DELETED:
                return markAsDeleted(parameters);
            default:
                throw new BatchBridgeNotImplementedException(action.toString());
        }
    }

    // Translates doAction's Promise to a "legacy" bridge one (for older base bridges)
    // To do this, it serializes Maps (arrays and numbers are not supported) to JSON strings
    // and also wraps errors as the Bridge doesn't support catching and expects the Promise to always
    // be resolved with a JSON message, even if it's an error object.
    @SuppressWarnings({"unchecked", "rawtypes"})
    @NonNull
    SimplePromise<String> compatDoAction(@NonNull Action action, @NonNull Map<String, Object> parameters, @NonNull Activity activity) throws BridgeException, BatchBridgeNotImplementedException {
        SimplePromise<String> resultPromise = new SimplePromise<>();
        SimplePromise<Object> actionPromise = doAction(action, parameters, activity);

        actionPromise.then(value -> {
            Object finalValue = value;
            if (value instanceof Map) {
                try {
                    finalValue = JSONHelper.fromMap((Map)value);
                } catch (JSONException e) {
                    Log.d(TAG, "Could not convert error", e);
                    finalValue = "{'error':'Internal native error (-1100)', 'code': -1100}";
                }
            }
            resultPromise.resolve(finalValue.toString());
        });
        actionPromise.catchException(e -> {
            String finalValue;
            try {
                JSONObject errorObject = new JSONObject();
                errorObject.put("error", e.getMessage());
                errorObject.put("code", -1101); // Error codes are not yet supported on Android
                finalValue = errorObject.toString();
            } catch (JSONException jsonException) {
                finalValue = "{'error':'Internal native error (-1200)', 'code': -1200}";
            }
            resultPromise.resolve(finalValue);
        });

        return resultPromise;
    }

    @NonNull
    private String createInstallationFetcher(@NonNull Context context, @NonNull Map<String, Object> parameters) {
        String id = makeFetcherID();
        BatchInboxFetcher fetcher = Batch.Inbox.getFetcher(context.getApplicationContext());
        configureSharedFetcherParameters(fetcher, parameters);
        fetchers.put(id, fetcher);
        return id;
    }

    @NonNull
    private String createUserFetcher(@NonNull Context context, @NonNull Map<String, Object> parameters) throws BridgeException {
        String id = makeFetcherID();
        String user = getTypedParameter(parameters, "user", String.class);
        String authKey = getTypedParameter(parameters, "authKey", String.class);
        BatchInboxFetcher fetcher = Batch.Inbox.getFetcher(context.getApplicationContext(), user, authKey);
        configureSharedFetcherParameters(fetcher, parameters);
        fetchers.put(id, fetcher);
        return id;
    }

    private void configureSharedFetcherParameters(@NonNull BatchInboxFetcher fetcher, @NonNull Map<String, Object> parameters) {
        Number maxPageSize = getOptionalTypedParameter(parameters, "maxPageSize", Number.class, null);
        Number limit = getOptionalTypedParameter(parameters, "limit", Number.class, null);

        if (maxPageSize != null) {
            int maxPageSizeInt = maxPageSize.intValue();
            if (maxPageSizeInt > 0) {
                fetcher.setMaxPageSize(maxPageSizeInt);
            }
        }

        if (limit != null) {
            int limitInt = limit.intValue();
            if (limitInt > 0) {
                fetcher.setFetchLimit(limitInt);
            }
        }
    }

    private void releaseFetcher(@NonNull Map<String, Object> parameters) throws BridgeException {
        fetchers.remove(getTypedParameter(parameters, "fetcherID", String.class));
    }

    @NonNull
    private String makeFetcherID() {
        return UUID.randomUUID().toString();
    }

    @NonNull
    private BatchInboxFetcher getFetcherInstance(@NonNull Map<String, Object> parameters) throws BridgeException {
        BatchInboxFetcher fetcher = fetchers.get(getTypedParameter(parameters, "fetcherID", String.class));

        if (fetcher == null) {
            throw new BridgeException("The native inbox fetcher backing this object could not be found." +
                            "Did you call 'dispose()' on this BatchInboxFetcher and attempted to use it afterwards?",
                    null);
        }

        return fetcher;
    }

    private SimplePromise<Object> fetchNewNotifications(@NonNull Map<String, Object> parameters) throws BridgeException {
        final BatchInboxFetcher fetcher = getFetcherInstance(parameters);

        return new SimplePromise<>(promise -> fetcher.fetchNewNotifications(new BatchInboxFetcher.OnNewNotificationsFetchedListener() {
            @Override
            public void onFetchSuccess(@NonNull List<BatchInboxNotificationContent> list, boolean foundNewNotifications, boolean endReached) {
                Map<String, Object> response = new HashMap<>();
                response.put("foundNew", foundNewNotifications);
                response.put("endReached", endReached);
                response.put("notifications", serializeNotificationsForBridge(list));
                promise.resolve(response);
            }

            @Override
            public void onFetchFailure(@NonNull String s) {
                promise.reject(new BridgeException("Inbox fetchNewNotifications failed with error: " + s));
            }
        }));
    }

    private SimplePromise<Object> fetchNextPage(@NonNull Map<String, Object> parameters) throws BridgeException {
        final BatchInboxFetcher fetcher = getFetcherInstance(parameters);

        return new SimplePromise<>(promise -> fetcher.fetchNextPage(new BatchInboxFetcher.OnNextPageFetchedListener() {
            @Override
            public void onFetchSuccess(@NonNull List<BatchInboxNotificationContent> list, boolean endReached) {
                Map<String, Object> response = new HashMap<>();
                response.put("endReached", endReached);
                response.put("notifications", serializeNotificationsForBridge(list));
                promise.resolve(response);
            }

            @Override
            public void onFetchFailure(@NonNull String s) {
                promise.reject(new BridgeException("Inbox fetchNextPage failed with error: " + s));
            }
        }));
    }

    private SimplePromise<Object> markAsRead(@NonNull Map<String, Object> parameters) throws BridgeException {
        final BatchInboxFetcher fetcher = getFetcherInstance(parameters);

        final String notificationID = getTypedParameter(parameters, "notifID", String.class);

        return new SimplePromise<>(promise -> {
            List<BatchInboxNotificationContent> nativeNotifications = fetcher.getFetchedNotifications();
            BatchInboxNotificationContent notificationToMark = null;
            for (BatchInboxNotificationContent nativeNotification : nativeNotifications) {
                if (nativeNotification.getNotificationIdentifier().equals(notificationID)) {
                    notificationToMark = nativeNotification;
                    break;
                }
            }

            if (notificationToMark != null) {
                fetcher.markAsRead(notificationToMark);
            } else {
                Log.e(TAG, "Could not mark notification as read: No matching native notification. This can happen if you kept a JavaScript instance of a notification but are trying to use it with another fetcher, or if the fetcher has been reset inbetween.");
            }

            promise.resolve(null);
        });
    }

    private SimplePromise<Object> markAllAsRead(@NonNull Map<String, Object> parameters) throws BridgeException {
        final BatchInboxFetcher fetcher = getFetcherInstance(parameters);

        fetcher.markAllAsRead();

        return SimplePromise.resolved(null);
    }

    private SimplePromise<Object> markAsDeleted(@NonNull Map<String, Object> parameters) throws BridgeException {
        final BatchInboxFetcher fetcher = getFetcherInstance(parameters);

        final String notificationID = getTypedParameter(parameters, "notifID", String.class);

        return new SimplePromise<>(promise -> {
            List<BatchInboxNotificationContent> nativeNotifications = fetcher.getFetchedNotifications();
            BatchInboxNotificationContent notificationToMark = null;
            for (BatchInboxNotificationContent nativeNotification : nativeNotifications) {
                if (nativeNotification.getNotificationIdentifier().equals(notificationID)) {
                    notificationToMark = nativeNotification;
                    break;
                }
            }

            if (notificationToMark != null) {
                fetcher.markAsDeleted(notificationToMark);
            } else {
                Log.e(TAG, "Could not mark notification as deleted: No matching native notification. This can happen if you kept a JavaScript instance of a notification but are trying to use it with another fetcher, or if the fetcher has been reset inbetween.");
            }

            promise.resolve(null);
        });
    }

    private SimplePromise<Object> getFetchedNotifications(@NonNull Map<String, Object> parameters) throws BridgeException {
        final BatchInboxFetcher fetcher = getFetcherInstance(parameters);

        Map<String, Object> response = new HashMap<>();
        response.put("notifications", serializeNotificationsForBridge(fetcher.getFetchedNotifications()));
        return SimplePromise.resolved(response);
    }

    @NonNull
    private List<Map<String, Object>> serializeNotificationsForBridge(@NonNull List<BatchInboxNotificationContent> nativeNotifications) {
        List<Map<String, Object>> serializedNotifications = new ArrayList<>(nativeNotifications.size());

        for (BatchInboxNotificationContent nativeNotification : nativeNotifications) {
            Map<String, Object> serializedNotification = new HashMap<>();
            serializedNotification.put("id", nativeNotification.getNotificationIdentifier());

            serializedNotification.put("body", nativeNotification.getBody());
            final String title = nativeNotification.getTitle();
            if (title != null) {
                serializedNotification.put("title", title);
            }

            serializedNotification.put("isUnread", nativeNotification.isUnread());
            serializedNotification.put("isDeleted", nativeNotification.isDeleted());
            serializedNotification.put("date", nativeNotification.getDate().getTime());
            int source = 0; // UNKNOWN
            switch (nativeNotification.getSource()) {
                case CAMPAIGN:
                    source = 1;
                    break;
                case TRANSACTIONAL:
                    source = 2;
                    break;
                case TRIGGER:
                    source = 3;
                    break;
            }
            serializedNotification.put("source", source);
            serializedNotification.put("payload", nativeNotification.getRawPayload());
            serializedNotifications.add(serializedNotification);
        }

        return serializedNotifications;
    }
}
