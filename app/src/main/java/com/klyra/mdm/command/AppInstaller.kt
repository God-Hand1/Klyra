package com.klyra.mdm.command

import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.content.pm.PackageInstaller
import android.os.Build
import android.util.Log
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import okhttp3.OkHttpClient
import okhttp3.Request
import java.io.InputStream
import java.io.OutputStream
import java.util.concurrent.TimeUnit

class AppInstaller(private val context: Context) {

    private val httpClient = OkHttpClient.Builder()
        .connectTimeout(30, TimeUnit.SECONDS)
        .readTimeout(60, TimeUnit.SECONDS)
        .build()

    suspend fun installApp(
        commandId: String,
        packageName: String,
        appName: String,
        apkUrl: String
    ): Result<String> = withContext(Dispatchers.IO) {
        var session: PackageInstaller.Session? = null
        try {
            Log.i(TAG, "Starting download and install of $appName ($packageName) from $apkUrl")

            val request = Request.Builder().url(apkUrl).build()
            val response = httpClient.newCall(request).execute()

            if (!response.isSuccessful || response.body == null) {
                response.close()
                return@withContext Result.failure(
                    Exception("Failed to download APK: HTTP ${response.code}")
                )
            }

            val packageInstaller = context.packageManager.packageInstaller
            val params = PackageInstaller.SessionParams(
                PackageInstaller.SessionParams.MODE_FULL_INSTALL
            ).apply {
                setAppPackageName(packageName)
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                    setRequireUserAction(PackageInstaller.SessionParams.USER_ACTION_NOT_REQUIRED)
                }
            }

            val sessionId = packageInstaller.createSession(params)
            val openSession = packageInstaller.openSession(sessionId)
            session = openSession

            response.use { resp ->
                resp.body!!.byteStream().use { inputStream: InputStream ->
                    openSession.openWrite("package", 0, -1).use { outputStream: OutputStream ->
                        inputStream.copyTo(outputStream)
                        openSession.fsync(outputStream)
                    }
                }
            }

            val callbackIntent = Intent(context, InstallResultReceiver::class.java).apply {
                action = InstallResultReceiver.ACTION_INSTALL_RESULT
                putExtra(InstallResultReceiver.EXTRA_PACKAGE_NAME, packageName)
                putExtra(InstallResultReceiver.EXTRA_APP_NAME, appName)
                putExtra(InstallResultReceiver.EXTRA_COMMAND_ID, commandId)
            }

            val flags = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_MUTABLE
            } else {
                PendingIntent.FLAG_UPDATE_CURRENT
            }

            val pendingIntent = PendingIntent.getBroadcast(
                context,
                sessionId,
                callbackIntent,
                flags
            )

            openSession.commit(pendingIntent.intentSender)
            Log.i(TAG, "Install session committed for $packageName")
            Result.success("Install session created and committed")
        } catch (e: Exception) {
            Log.e(TAG, "Error installing $packageName", e)
            try {
                session?.abandon()
            } catch (_: Exception) {}
            Result.failure(e)
        }
    }

    companion object {
        private const val TAG = "KlyraAppInstaller"
    }
}
