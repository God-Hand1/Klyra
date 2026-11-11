package com.klyra.mdm.service

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.util.Log
import com.klyra.mdm.data.ServerConfig

class BootReceiver : BroadcastReceiver() {

    override fun onReceive(context: Context, intent: Intent) {
        val action = intent.action
        if (Intent.ACTION_BOOT_COMPLETED == action || "android.intent.action.QUICKBOOT_POWERON" == action) {
            Log.i(TAG, "Device booted, starting KlyraService")
            val config = ServerConfig(context)
            if (config.getServerUrl().isNotBlank()) {
                KlyraService.start(context)
            }
        }
    }

    companion object {
        private const val TAG = "KlyraBootReceiver"
    }
}
