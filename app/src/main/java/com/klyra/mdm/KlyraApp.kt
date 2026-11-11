package com.klyra.mdm

import android.app.Application
import android.app.NotificationChannel
import android.app.NotificationManager
import android.os.Build
import androidx.work.Configuration
import androidx.work.ExistingPeriodicWorkPolicy
import androidx.work.PeriodicWorkRequestBuilder
import androidx.work.WorkManager
import com.klyra.mdm.service.ServiceRestartWorker
import java.util.concurrent.TimeUnit

class KlyraApp : Application(), Configuration.Provider {

    override fun onCreate() {
        super.onCreate()
        createNotificationChannel()
        scheduleServiceKeepAlive()
    }

    private fun createNotificationChannel() {
        val channel = NotificationChannel(
            NOTIFICATION_CHANNEL_ID,
            "Klyra MDM Service",
            NotificationManager.IMPORTANCE_LOW
        ).apply {
            description = "Keeps the Klyra MDM service running"
            setShowBadge(false)
        }
        val manager = getSystemService(NotificationManager::class.java)
        manager.createNotificationChannel(channel)
    }

    private fun scheduleServiceKeepAlive() {
        val workRequest = PeriodicWorkRequestBuilder<ServiceRestartWorker>(
            15, TimeUnit.MINUTES
        ).build()

        WorkManager.getInstance(this).enqueueUniquePeriodicWork(
            "klyra_service_keepalive",
            ExistingPeriodicWorkPolicy.KEEP,
            workRequest
        )
    }

    override val workManagerConfiguration: Configuration
        get() = Configuration.Builder()
            .setMinimumLoggingLevel(android.util.Log.INFO)
            .build()

    companion object {
        const val NOTIFICATION_CHANNEL_ID = "klyra_mdm_service"
        const val NOTIFICATION_ID = 1001
    }
}
