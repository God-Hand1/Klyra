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

        val config = ServerConfig(context)
        val reporter = DeviceStateReporter(context)

        when (status) {
            PackageInstaller.STATUS_PENDING_USER_ACTION -> {
                Log.d(TAG, "Install pending user action (should not happen for Device Owner)")
            }
            PackageInstaller.STATUS_SUCCESS -> {
                Log.i(TAG, "Package $packageName installed successfully")
                if (packageName.isNotEmpty()) {
                    config.addInstalledPackage(packageName)
                    config.setInstalledAppName(packageName, appName)
                }

                if (commandId.isNotEmpty()) {
                    val resultJson = reporter.buildCommandResult(
                        commandId,
                        true,
                        "Successfully installed $packageName"
                    )
                    WebSocketClient.getInstance(context).send(resultJson)
                }

                // Send fresh status report to update server state
                val statusReport = reporter.buildStatusReport()
                WebSocketClient.getInstance(context).send(statusReport)
            }
            else -> {
                Log.e(TAG, "Install failed for $packageName: $status ($message)")
                if (commandId.isNotEmpty()) {
                    val resultJson = reporter.buildCommandResult(
                        commandId,
                        false,
                        "Install failed ($status): $message"
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
        private const val TAG = "KlyraInstallReceiver"
    }
}
