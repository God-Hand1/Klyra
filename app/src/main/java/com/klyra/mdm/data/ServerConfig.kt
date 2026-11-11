package com.klyra.mdm.data

import android.content.Context
import android.content.SharedPreferences
import java.util.UUID

class ServerConfig(context: Context) {

    private val prefs: SharedPreferences =
        context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)

    fun getServerUrl(): String = prefs.getString(KEY_SERVER_URL, "") ?: ""

    fun setServerUrl(url: String) {
        prefs.edit().putString(KEY_SERVER_URL, url.trimEnd('/')).apply()
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
        val json = prefs.getString(KEY_INSTALLED_APP_NAMES, null) ?: return emptyMap()
        return try {
            val map = mutableMapOf<String, String>()
            // Simple parse: "pkg1=name1,pkg2=name2"
            json.split(",").forEach { entry ->
                val parts = entry.split("=", limit = 2)
                if (parts.size == 2) map[parts[0]] = parts[1]
            }
            map
        } catch (_: Exception) {
            emptyMap()
        }
    }

    fun setInstalledAppName(packageName: String, appName: String) {
        val current = getInstalledAppNames().toMutableMap()
        current[packageName] = appName
        val serialized = current.entries.joinToString(",") { "${it.key}=${it.value}" }
        prefs.edit().putString(KEY_INSTALLED_APP_NAMES, serialized).apply()
    }

    fun removeInstalledAppName(packageName: String) {
        val current = getInstalledAppNames().toMutableMap()
        current.remove(packageName)
        val serialized = current.entries.joinToString(",") { "${it.key}=${it.value}" }
        prefs.edit().putString(KEY_INSTALLED_APP_NAMES, serialized).apply()
    }

    companion object {
        private const val PREFS_NAME = "klyra_mdm_prefs"
        private const val KEY_SERVER_URL = "server_url"
        private const val KEY_DEVICE_ID = "device_id"
        private const val KEY_INSTALLED_PACKAGES = "installed_packages"
        private const val KEY_INSTALLED_APP_NAMES = "installed_app_names"
    }
}
