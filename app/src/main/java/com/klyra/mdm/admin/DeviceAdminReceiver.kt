package com.klyra.mdm.admin

import android.app.admin.DeviceAdminReceiver as AndroidDeviceAdminReceiver
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.util.Log
import com.klyra.mdm.data.ServerConfig

class DeviceAdminReceiver : AndroidDeviceAdminReceiver() {

    companion object {
        private const val TAG = "KlyraDeviceAdmin"

        fun getComponentName(context: Context): ComponentName {
            return ComponentName(context, DeviceAdminReceiver::class.java)
        }
    }

    override fun onEnabled(context: Context, intent: Intent) {
        super.onEnabled(context, intent)
        Log.i(TAG, "Device admin enabled")
    }

    override fun onDisabled(context: Context, intent: Intent) {
        super.onDisabled(context, intent)
        Log.i(TAG, "Device admin disabled — cleaning up installed packages")
        cleanupInstalledPackages(context)
    }

    override fun onProfileProvisioningComplete(context: Context, intent: Intent) {
        super.onProfileProvisioningComplete(context, intent)
        Log.i(TAG, "Profile provisioning complete")
    }

    /**
     * When device admin is disabled, uninstall all packages that were
     * installed via Klyra MDM.
     */
    private fun cleanupInstalledPackages(context: Context) {
        val config = ServerConfig(context)
        val packages = config.getInstalledPackages()

        for (pkg in packages) {
            try {
                val packageInstaller = context.packageManager.packageInstaller
                packageInstaller.uninstall(pkg, null)
                Log.i(TAG, "Uninstalled cleanup package: $pkg")
            } catch (e: Exception) {
                Log.e(TAG, "Failed to uninstall $pkg during cleanup", e)
            }
        }
    }
}
