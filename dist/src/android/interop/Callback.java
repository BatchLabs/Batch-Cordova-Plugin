package com.batch.cordova.interop;

import java.util.Map;

/**
 * Callback interface used by {@link com.batch.android.interop.Bridge}.
 * Your implementation should forward the result to your wrapper.
 */
public interface Callback
{
    // Used in Unity
    @SuppressWarnings("unused")
    public void callback(String action);

    public void callback(String action, Map<String, Object> result);
}
