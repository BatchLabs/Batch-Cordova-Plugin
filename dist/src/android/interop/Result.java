package com.batch.cordova.android.interop;

/**
 * Enum that wraps the supported result names.
 */
public enum Result
{
	BRIDGE_FAILURE("onBridgeFailure");

    /**
     * Result action name
     */
    private String name;

    /**
     * Init a result with its string representation
     */
    private Result(String name)
    {
        this.name = name;
    }

    /**
     * Get the name associated with this result
     */
    public String getName()
    {
        return name;
    }

    /**
     * Create a Result from its string name.
     *
     * @throws IllegalArgumentException Thrown when the supplied name doesn't match any known result
     * @param resultName Result name
     * @return Result
     */
	@SuppressWarnings("unused")
    public static Result fromName(String resultName) throws IllegalArgumentException
    {
        for (Result parameterValue : values())
        {
            if (parameterValue.getName().equalsIgnoreCase(resultName))
            {
                return parameterValue;
            }
        }

        throw new IllegalArgumentException("Unknown action.");
    }
}
