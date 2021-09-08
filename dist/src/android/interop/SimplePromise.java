package com.batch.cordova.android.interop;

import java.util.ArrayDeque;
import java.util.concurrent.Executor;

/**
 * A simple Promise-like implementation that is not thread-safe.
 * then() can't mutate the value.
 * <p>
 * Be careful: catch only works for an explicit rejection, NOT automatically for exceptions thrown in
 * ThenRunnables
 */
public class SimplePromise<T> {
    private Status status = Status.PENDING;
    private T resolvedValue = null;
    private Exception rejectException = null;
    private Executor executor = new CurrentThreadExecutor();

    private final ArrayDeque<ThenRunnable<T>> thenQueue = new ArrayDeque<>(1);
    private final ArrayDeque<CatchRunnable> catchQueue = new ArrayDeque<>(1);

    public SimplePromise() {
    }

    public SimplePromise(ExecutorRunnable<T> executor) {
        T result;
        try {
            result = executor.run();
        } catch (Exception e) {
            reject(e);
            return;
        }
        // Isolate "resolve()" from the try catch, as we do not want internal exceptions to result in
        // a rejection
        resolve(result);
    }

    public SimplePromise(DeferredResultExecutorRunnable<T> executor) {
        try {
            executor.run(this);
        } catch (Exception e) {
            reject(e);
        }
    }

    public static <T> SimplePromise<T> resolved(T value) {
        final SimplePromise<T> promise = new SimplePromise<>();
        promise.resolve(value);
        return promise;
    }

    public static <T> SimplePromise<T> rejected(Exception exception) {
        final SimplePromise<T> promise = new SimplePromise<>();
        promise.reject(exception);
        return promise;
    }

    public synchronized void resolve(T value) {
        if (status != Status.PENDING) {
            return;
        }

        status = Status.RESOLVED;
        resolvedValue = value;

        ThenRunnable<T> thenRunnable;
        while (!thenQueue.isEmpty()) {
            thenRunnable = thenQueue.removeFirst();
            postThenRunnable(thenRunnable, value);
        }
    }

    public synchronized void reject(Exception exception) {
        if (status != Status.PENDING) {
            return;
        }

        status = Status.REJECTED;
        rejectException = exception;

        CatchRunnable catchRunnable;
        while (!catchQueue.isEmpty()) {
            catchRunnable = catchQueue.removeFirst();
            postCatchRunnable(catchRunnable, exception);
        }
    }

    public synchronized SimplePromise<T> then(ThenRunnable<T> thenRunnable) {
        switch (status) {
            case PENDING:
                thenQueue.push(thenRunnable);
                break;
            case RESOLVED:
                postThenRunnable(thenRunnable, resolvedValue);
                break;
        }

        return this;
    }

    public synchronized SimplePromise<T> catchException(CatchRunnable catchRunnable) {
        switch (status) {
            case PENDING:
                catchQueue.push(catchRunnable);
                break;
            case REJECTED:
                postCatchRunnable(catchRunnable, rejectException);
                break;
        }

        return this;
    }

    public Status getStatus() {
        return status;
    }

    private void postThenRunnable(ThenRunnable<T> thenRunnable, T value) {
        executor.execute(() -> thenRunnable.run(value));
    }

    private void postCatchRunnable(CatchRunnable catchRunnable, Exception exception) {
        executor.execute(() -> catchRunnable.run(exception));
    }

    /**
     * Set the executor then/catch runnables should be posted on
     */
    public synchronized SimplePromise<T> setExecutor(Executor executor) {
        this.executor = executor;
        return this;
    }

    /**
     * Executor that automatically resolves the promise with the returned value once done, even
     * if null
     */
    public interface ExecutorRunnable<T> {
        T run();
    }

    /**
     * Executor that does not automatically resolve the promise once done
     */
    public interface DeferredResultExecutorRunnable<T> {
        void run(SimplePromise<T> promise);
    }

    public interface ThenRunnable<T> {
        void run(T value);
    }

    public interface CatchRunnable {
        void run(Exception e);
    }

    public enum Status {
        PENDING,
        RESOLVED,
        REJECTED
    }

    private static class CurrentThreadExecutor implements Executor {
        public void execute(Runnable r) {
            r.run();
        }
    }
}