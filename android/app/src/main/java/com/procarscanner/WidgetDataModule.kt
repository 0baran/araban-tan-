package com.procarscanner

import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.ReadableMap

class WidgetDataModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String = "WidgetDataModule"

    @ReactMethod
    fun updateWidget(data: ReadableMap) {
        val rpm = if (data.hasKey("rpm")) data.getString("rpm") else "0"
        val speed = if (data.hasKey("speed")) data.getString("speed") else "0"
        val coolant = if (data.hasKey("coolant")) data.getString("coolant") else "--"
        val connected = if (data.hasKey("connected")) data.getBoolean("connected") else false

        WidgetProvider.updateWidgetData(
            reactApplicationContext,
            rpm ?: "0",
            speed ?: "0",
            coolant ?: "--",
            connected
        )
    }
}
