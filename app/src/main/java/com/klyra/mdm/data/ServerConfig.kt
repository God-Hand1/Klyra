package com.klyra.mdm.data

import android.content.Context
import android.content.SharedPreferences
import com.google.gson.Gson
import com.google.gson.reflect.TypeToken
import java.util.UUID

class ServerConfig(context: Context) {

    private val prefs: SharedPreferences =
        context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
    private val gson = Gson()
    private val appNamesType = object : TypeToken<Map<String, String>>() {}.type

    fun getServerUrl(): String = prefs.getString(KEY_SERVER_URL, "ws://10.0.2.2:3000") ?: "ws://10.0.2.2:3000"

    fun setServerUrl(url: String) {
        prefs.edit().putString(KEY_SERVER_URL, url.trimEnd('/')).apply()
    }

    fun getHttpBaseUrl(): String {
        val url = getServerUrl().trim().trimEnd('/')
        return when {
            url.startsWith("ws://") -> "http://" + url.removePrefix("ws://")
            url.startsWith("wss://") -> "https://" + url.removePrefix("wss://")
            !url.startsWith("http://") && !url.startsWith("https://") -> "http://$url"
            else -> url
        }
    }

    fun getWsBaseUrl(): String {
        val url = getServerUrl().trim().trimEnd('/')
        return when {
            url.startsWith("http://") -> "ws://" + url.removePrefix("http://")
            url.startsWith("https://") -> "wss://" + url.removePrefix("https://")
            !url.startsWith("ws://") && !url.startsWith("wss://") -> "ws://$url"
            else -> url
        }
    }

    fun getDeviceId(): String {
        var id = prefs.getString(KEY_DEVICE_ID, null)
        if (id == null) {
            id = UUID.randomUUID().toString()
            prefs.edit().putString(KEY_DEVICE_ID, id).apply()
        }
        return id
    }

    fun getInstalledPackages(): Set<String> {
        return prefs.getStringSet(KEY_INSTALLED_PACKAGES, emptySet()) ?: emptySet()
    }

    fun addInstalledPackage(packageName: String) {
        val current = getInstalledPackages().toMutableSet()
        current.add(packageName)
        prefs.edit().putStringSet(KEY_INSTALLED_PACKAGES, current).apply()
    }

    fun removeInstalledPackage(packageName: String) {
        val current = getInstalledPackages().toMutableSet()
        current.remove(packageName)
        prefs.edit().putStringSet(KEY_INSTALLED_PACKAGES, current).apply()
    }

    fun getInstalledAppNames(): Map<String, String> {
        val raw = prefs.getString(KEY_INSTALLED_APP_NAMES, null) ?: return emptyMap()
        return try {
            gson.fromJson(raw, appNamesType) ?: emptyMap()
        } catch (_: Exception) {
            // Backward-compatibility fallback for legacy "pkg1=name1,pkg2=name2" format
            try {
                val map = mutableMapOf<String, String>()
                raw.split(",").forEach { entry ->
                    val parts = entry.split("=", limit = 2)
                    if (parts.size == 2) map[parts[0]] = parts[1]
                }
                map
            } catch (_: Exception) {
                emptyMap()
            }
        }
    }

    fun setInstalledAppName(packageName: String, appName: String) {
        val current = getInstalledAppNames().toMutableMap()
        current[packageName] = appName
        prefs.edit().putString(KEY_INSTALLED_APP_NAMES, gson.toJson(current)).apply()
    }

    fun removeInstalledAppName(packageName: String) {
        val current = getInstalledAppNames().toMutableMap()
        current.remove(packageName)
        prefs.edit().putString(KEY_INSTALLED_APP_NAMES, gson.toJson(current)).apply()
    }

    companion object {
        private const val PREFS_NAME = "klyra_mdm_prefs"
        private const val KEY_SERVER_URL = "server_url"
        private const val KEY_DEVICE_ID = "device_id"
        private const val KEY_INSTALLED_PACKAGES = "installed_packages"
        private const val KEY_INSTALLED_APP_NAMES = "installed_app_names"
    }
}
