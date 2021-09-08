package com.batch.cordova.android.interop;

public class BatchBridgeNotImplementedException extends Exception {
    public BatchBridgeNotImplementedException(String method) {
        super("Bridge method '" + method + "' is not implemented");
    }
}
