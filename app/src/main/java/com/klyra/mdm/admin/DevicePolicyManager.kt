package com.klyra.mdm.admin

import android.app.admin.DevicePolicyManager as AndroidDPM
import android.content.ComponentName
import android.content.Context
import android.util.Log

class DevicePolicyManager(private val context: Context) {

    private val dpm: AndroidDPM =
        context.getSystemService(Context.DEVICE_POLICY_SERVICE) as AndroidDPM
    private val adminComponent: ComponentName =
        DeviceAdminReceiver.getComponentName(context)

    fun isDeviceOwner(): Boolean {
        return dpm.isDeviceOwnerApp(context.packageName)
    }

    fun isProfileOwner(): Boolean {
        return dpm.isProfileOwnerApp(context.packageName)
    }

    fun isAdminActive(): Boolean {
        return dpm.isAdminActive(adminComponent)
    }

    /**
     * Disable (hide) an application silently.
     */
    fun disableApp(packageName: String): Boolean {
        return try {
            if (isDeviceOwner() || isProfileOwner()) {
                dpm.setApplicationHidden(adminComponent, packageName, true)
            } else {
                Log.w(TAG, "Not device owner / profile owner, cannot hide application")
                false
            }
        } catch (e: Exception) {
            Log.e(TAG, "Failed to disable app $packageName", e)
            false
        }
    }

    /**
     * Enable (unhide) an application silently.
     */
    fun enableApp(packageName: String): Boolean {
        return try {
            if (isDeviceOwner() || isProfileOwner()) {
                dpm.setApplicationHidden(adminComponent, packageName, false)
            } else {
                Log.w(TAG, "Not device owner / profile owner, cannot unhide application")
                false
            }
        } catch (e: Exception) {
            Log.e(TAG, "Failed to enable app $packageName", e)
            false
        }
    }

    /**
     * Checks whether an application is currently hidden/disabled via DPM.
     */
    fun isAppHidden(packageName: String): Boolean {
        return try {
            if (isDeviceOwner() || isProfileOwner()) {
                dpm.isApplicationHidden(adminComponent, packageName)
            } else {
                false
            }
        } catch (e: Exception) {
            Log.e(TAG, "Failed to check if app $packageName is hidden", e)
            false
        }
    }

    companion object {
        private const val TAG = "KlyraDPM"
    }
}
