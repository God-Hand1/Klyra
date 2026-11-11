package com.klyra.mdm.command

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.pm.PackageInstaller
import android.util.Log
import com.klyra.mdm.data.DeviceStateReporter
import com.klyra.mdm.data.ServerConfig
import com.klyra.mdm.service.WebSocketClient

class InstallResultReceiver : BroadcastReceiver() {

    override fun onReceive(context: Context, intent: Intent) {
        if (ACTION_INSTALL_RESULT != intent.action) return

        val status = intent.getIntExtra(PackageInstaller.EXTRA_STATUS, PackageInstaller.STATUS_FAILURE)
        val message = intent.getStringExtra(PackageInstaller.EXTRA_STATUS_MESSAGE) ?: ""
        val packageName = intent.getStringExtra(EXTRA_PACKAGE_NAME) ?: ""
        val appName = intent.getStringExtra(EXTRA_APP_NAME) ?: packageName
        val commandId = intent.getStringExtra(EXTRA_COMMAND_ID) ?: ""
        val isUninstall = intent.getBooleanExtra(EXTRA_IS_UNINSTALL, false)

        val config = ServerConfig(context)
        val reporter = DeviceStateReporter(context)

        when (status) {
            PackageInstaller.STATUS_PENDING_USER_ACTION -> {
                Log.d(TAG, "Install/Uninstall pending user action (should not happen for Device Owner)")
            }
            PackageInstaller.STATUS_SUCCESS -> {
                val actionVerb = if (isUninstall) "uninstalled" else "installed"
                Log.i(TAG, "Package $packageName $actionVerb successfully")
                if (packageName.isNotEmpty()) {
                    if (isUninstall) {
                        config.removeInstalledPackage(packageName)
                        config.removeInstalledAppName(packageName)
                    } else {
                        config.addInstalledPackage(packageName)
                        config.setInstalledAppName(packageName, appName)
                    }
                }

                if (commandId.isNotEmpty()) {
                    val resultJson = reporter.buildCommandResult(
                        commandId,
                        true,
                        "Successfully $actionVerb $packageName"
                    )
                    WebSocketClient.getInstance(context).send(resultJson)
                }

                // Send fresh status report to update server state
                val statusReport = reporter.buildStatusReport()
                WebSocketClient.getInstance(context).send(statusReport)
            }
            else -> {
                val actionVerb = if (isUninstall) "Uninstall" else "Install"
                Log.e(TAG, "$actionVerb failed for $packageName: $status ($message)")
                if (commandId.isNotEmpty()) {
                    val resultJson = reporter.buildCommandResult(
                        commandId,
                        false,
                        "$actionVerb failed ($status): $message"
                    )
                    WebSocketClient.getInstance(context).send(resultJson)
                }
            }
        }
    }

    companion object {
        const val ACTION_INSTALL_RESULT = "com.klyra.mdm.INSTALL_RESULT"
        const val EXTRA_PACKAGE_NAME = "com.klyra.mdm.extra.PACKAGE_NAME"
        const val EXTRA_APP_NAME = "com.klyra.mdm.extra.APP_NAME"
        const val EXTRA_COMMAND_ID = "com.klyra.mdm.extra.COMMAND_ID"
        const val EXTRA_IS_UNINSTALL = "com.klyra.mdm.extra.IS_UNINSTALL"
        private const val TAG = "KlyraInstallReceiver"
    }
}
