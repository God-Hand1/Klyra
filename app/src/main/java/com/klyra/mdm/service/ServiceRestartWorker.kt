package com.klyra.mdm.service

import android.content.Context
import android.util.Log
import androidx.work.CoroutineWorker
import androidx.work.WorkerParameters
import com.klyra.mdm.data.ServerConfig

class ServiceRestartWorker(
    appContext: Context,
    workerParams: WorkerParameters
) : CoroutineWorker(appContext, workerParams) {

    override suspend fun doWork(): Result {
        Log.i(TAG, "Keep-alive check: ensuring KlyraService is running")
        val config = ServerConfig(applicationContext)
        if (config.getServerUrl().isNotBlank()) {
            try {
                KlyraService.start(applicationContext)
            } catch (e: Exception) {
                Log.e(TAG, "Failed to start KlyraService from worker", e)
                return Result.retry()
            }
        }
        return Result.success()
    }

    companion object {
        private const val TAG = "ServiceRestartWorker"
    }
}
