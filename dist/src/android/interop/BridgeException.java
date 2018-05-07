package com.batch.cordova.interop;

/**
 * Exception representing internal bridge errors
 */
public class BridgeException extends Exception
{
	public BridgeException(String cause)
	{
		super(cause);
	}

	public BridgeException(String cause, Throwable source)
	{
		super(cause, source);
	}
}
