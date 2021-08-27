package com.batch.cordova.android.interop;

import java.util.ArrayDeque;

/**
 * A simple Promise-like implementation that can only be resolved and is not thread-safe.
 * then() can't mutate the value
 * catch() does not exist
 */

public class SimplePromise<T>
{
    private boolean resolved = false;
    private T resolvedValue = null;

    private ArrayDeque<ThenRunnable<T>> thenQueue = new ArrayDeque<>(1);

    public SimplePromise()
    {
    }

    public SimplePromise(ExecutorRunnable<T> executor)
    {
        resolve(executor.run());
    }

    public SimplePromise(DeferredResultExecutorRunnable<T> executor)
    {
        executor.run(this);
    }

    public static <T> SimplePromise<T> resolved(T value)
    {
        final SimplePromise<T> promise = new SimplePromise<>();
        promise.resolve(value);
        return promise;
    }

    public synchronized void resolve(T value)
    {
        if (resolved) {
            return;
        }

        resolved = true;
        resolvedValue = value;

        ThenRunnable<T> thenRunnable;
        while (!thenQueue.isEmpty()) {
            thenRunnable = thenQueue.removeLast();
            thenRunnable.run(value);
        }
    }

    public synchronized SimplePromise<T> then(ThenRunnable<T> thenRunnable)
    {
        if (resolved) {
            thenRunnable.run(resolvedValue);
        } else {
            thenQueue.push(thenRunnable);
        }

        return this;
    }

    /**
     * Executor that automatically resolves the promise with the returned value once done, even
     * if null
     */
    public interface ExecutorRunnable<T>
    {
        T run();
    }

    /**
     * Executor that does not automatically resolve the promise once done
     */
    public interface DeferredResultExecutorRunnable<T>
    {
        void run(SimplePromise<T> promise);
    }

    public interface ThenRunnable<T>
    {
        void run(T value);
    }
}