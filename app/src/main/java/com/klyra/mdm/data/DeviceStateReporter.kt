package com.klyra.mdm.data

import android.content.Context
import android.os.Build
import com.google.gson.Gson
import com.google.gson.JsonObject
import com.klyra.mdm.admin.DevicePolicyManager

class DeviceStateReporter(private val context: Context) {

    private val config = ServerConfig(context)
    private val dpm = DevicePolicyManager(context)
    private val gson = Gson()

    fun buildStatusReport(): String {
        val report = JsonObject().apply {
            addProperty("type", "status_report")
            addProperty("deviceId", config.getDeviceId())
            addProperty("deviceName", Build.MODEL)
            addProperty("model", "${Build.MANUFACTURER} ${Build.MODEL}")
            addProperty("androidVersion", Build.VERSION.RELEASE)

            val installedPackages = config.getInstalledPackages()
            val appNames = config.getInstalledAppNames()
            val appsArray = com.google.gson.JsonArray()

            for (pkg in installedPackages) {
                val appObj = JsonObject().apply {
                    addProperty("packageName", pkg)
                    addProperty("appName", appNames[pkg] ?: pkg)
                    addProperty("enabled", isPackageEnabled(pkg))
                }
                appsArray.add(appObj)
            }
            add("installedApps", appsArray)
        }
        return gson.toJson(report)
    }

    fun buildCommandResult(commandId: String, success: Boolean, message: String): String {
        val result = JsonObject().apply {
            addProperty("type", "command_result")
            addProperty("commandId", commandId)
            addProperty("success", success)
            addProperty("message", message)
        }
        return gson.toJson(result)
    }

    private fun isPackageEnabled(packageName: String): Boolean {
        return try {
            if (dpm.isAppHidden(packageName)) {
                return false
            }
            val pm = context.packageManager
            val appInfo = pm.getApplicationInfo(packageName, 0)
            appInfo.enabled
        } catch (_: Exception) {
            false
        }
    }
}
