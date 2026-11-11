package com.klyra.mdm.command

import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.content.pm.PackageInstaller
import android.os.Build
import android.util.Log
import com.klyra.mdm.data.ServerConfig

class AppUninstaller(private val context: Context) {

    fun uninstallApp(packageName: String, commandId: String? = null): Boolean {
        return try {
            Log.i(TAG, "Requesting uninstall of $packageName")
            val packageInstaller = context.packageManager.packageInstaller

            val callbackIntent = Intent(context, InstallResultReceiver::class.java).apply {
                action = InstallResultReceiver.ACTION_INSTALL_RESULT
                putExtra(InstallResultReceiver.EXTRA_PACKAGE_NAME, packageName)
                putExtra(InstallResultReceiver.EXTRA_IS_UNINSTALL, true)
                if (commandId != null) {
                    putExtra(InstallResultReceiver.EXTRA_COMMAND_ID, commandId)
                }
            }

            val flags = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_MUTABLE
            } else {
                PendingIntent.FLAG_UPDATE_CURRENT
            }

            val pendingIntent = PendingIntent.getBroadcast(
                context,
                packageName.hashCode(),
                callbackIntent,
                flags
            )

            packageInstaller.uninstall(packageName, pendingIntent.intentSender)

            // Remove from local tracked packages
            val config = ServerConfig(context)
            config.removeInstalledPackage(packageName)
            config.removeInstalledAppName(packageName)

            true
        } catch (e: Exception) {
            Log.e(TAG, "Failed to uninstall $packageName", e)
            false
        }
    }

    companion object {
        private const val TAG = "KlyraAppUninstaller"
    }
}
