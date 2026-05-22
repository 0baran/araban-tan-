package com.procarscanner

import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.Context
import android.content.SharedPreferences
import android.widget.RemoteViews

class WidgetProvider : AppWidgetProvider() {

    override fun onUpdate(
        context: Context,
        appWidgetManager: AppWidgetManager,
        appWidgetIds: IntArray
    ) {
        val prefs: SharedPreferences =
            context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)

        val rpm = prefs.getString(KEY_RPM, "0") ?: "0"
        val speed = prefs.getString(KEY_SPEED, "0") ?: "0"
        val coolant = prefs.getString(KEY_COOLANT, "--") ?: "--"

        for (widgetId in appWidgetIds) {
            val views = RemoteViews(context.packageName, R.layout.widget_layout)
            views.setTextViewText(R.id.widget_rpm_value, rpm)
            views.setTextViewText(R.id.widget_speed_value, speed)
            views.setTextViewText(R.id.widget_coolant_value, coolant)
            appWidgetManager.updateAppWidget(widgetId, views)
        }
    }

    companion object {
        const val PREFS_NAME = "com.procarscanner.widget"
        const val KEY_RPM = "widget_rpm"
        const val KEY_SPEED = "widget_speed"
        const val KEY_COOLANT = "widget_coolant"
        const val KEY_CONNECTED = "widget_connected"

        fun updateWidgetData(
            context: Context,
            rpm: String,
            speed: String,
            coolant: String,
            connected: Boolean
        ) {
            val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            prefs.edit()
                .putString(KEY_RPM, rpm)
                .putString(KEY_SPEED, speed)
                .putString(KEY_COOLANT, coolant)
                .putBoolean(KEY_CONNECTED, connected)
                .apply()

            val appWidgetManager = AppWidgetManager.getInstance(context)
            val widgetIds = appWidgetManager.getAppWidgetIds(
                android.content.ComponentName(context, WidgetProvider::class.java)
            )
            if (widgetIds.isNotEmpty()) {
                val instance = WidgetProvider()
                instance.onUpdate(context, appWidgetManager, widgetIds)
            }
        }
    }
}
