package com.batch.cordova.android.interop;

import com.batch.android.json.JSONArray;
import com.batch.android.json.JSONException;
import com.batch.android.json.JSONObject;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.Iterator;
import java.util.List;
import java.util.Map;

/**
 * Helper for common JSON operations
 */
public class JSONHelper
{
	public static Map<String, Object> toMap(String jsonString) throws JSONException
	{
		final JSONObject json = new JSONObject(jsonString);
		return jsonObjectToMap(json);
	}

	public static List<Object> toList(String jsonString) throws JSONException
	{
		final JSONArray json = new JSONArray(jsonString);
		return jsonArrayToArray(json);
	}

	public static JSONObject fromMap(Map<String, Object> map) throws JSONException
	{
		final JSONObject json = new JSONObject();
		for (String key : map.keySet())
		{
			json.put(key, fromObject(map.get(key)));
		}
		return json;
	}

	/**
	 * Transforms {@link org.json.JSONObject} and {@link org.json.JSONArray} to {@link java.util.Map} and {@link java.lang.Iterable}
	 * If transformation is not needed, returns the original object. Useful for JSON deserialization
	 * @param object Object to transform
	 * @return Transformed object, if necessary
	 * @throws JSONException
	 */
	private static Object jsonObjectToObject(Object object) throws JSONException
	{
		if (object == JSONObject.NULL)
		{
			return null;
		}
		else if (object instanceof JSONObject)
		{
			return jsonObjectToMap((JSONObject) object);
		}
		else if (object instanceof JSONArray)
		{
			return jsonArrayToArray((JSONArray) object);
		}
		else
		{
			return object;
		}
	}

	private static Map<String, Object> jsonObjectToMap(JSONObject object) throws JSONException
	{
		final Map<String, Object> map = new HashMap<>();
		final Iterator keys = object.keys();
		while (keys.hasNext())
		{
			String key = (String) keys.next();
			map.put(key, jsonObjectToObject(object.get(key)));
		}
		return map;
	}

	private static List<Object> jsonArrayToArray(JSONArray array) throws JSONException
	{
		final List<Object> list = new ArrayList<>();
		for (int i = 0; i < array.length(); i++)
		{
			list.add(jsonObjectToObject(array.get(i)));
		}
		return list;
	}

	private static JSONArray fromIterable(Iterable iterable) throws JSONException
	{
		final JSONArray json = new JSONArray();
		for (Object object : iterable)
		{
			json.put(fromObject(object));
		}
		return json;
	}

	/**
	 * Transforms {@link java.util.Map} and {@link java.lang.Iterable} to {@link org.json.JSONObject} and {@link org.json.JSONArray}
	 * If transformation is not needed, returns the original object. Useful for {@link org.json.JSONObject}.put
	 * @param object Object to transform
	 * @return Transformed object, if necessary
	 * @throws JSONException
	 */
	private static Object fromObject(Object object) throws JSONException
	{
		if (object instanceof Map)
		{
			return fromMap((Map) object);
		}
		else if (object instanceof Iterable)
		{
			return fromIterable((Iterable) object);
		}
		else
		{
			return object;
		}
	}
}