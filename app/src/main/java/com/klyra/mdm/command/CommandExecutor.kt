package com.klyra.mdm.command

import android.content.Context
import android.util.Log
import com.google.gson.Gson
import com.google.gson.JsonObject
import com.klyra.mdm.admin.DevicePolicyManager
import com.klyra.mdm.data.DeviceStateReporter
import com.klyra.mdm.data.ServerConfig
import com.klyra.mdm.service.WebSocketClient
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch

class CommandExecutor(private val context: Context) {

    private val gson = Gson()
    private val scope = CoroutineScope(Dispatchers.Default)
    private val dpm = DevicePolicyManager(context)
    private val appInstaller = AppInstaller(context)
    private val appUninstaller = AppUninstaller(context)
    private val shellExecutor = ShellExecutor()
    private val reporter = DeviceStateReporter(context)
    private val config = ServerConfig(context)

    fun handleMessage(jsonString: String) {
        scope.launch {
            try {
                val json = gson.fromJson(jsonString, JsonObject::class.java) ?: return@launch
                val type = json.get("type")?.asString ?: return@launch
                val commandId = json.get("commandId")?.asString ?: ""

                Log.d(TAG, "Executing command: type=$type, commandId=$commandId")

                when (type) {
                    "install_app" -> handleInstall(json, commandId)
                    "uninstall_app" -> handleUninstall(json, commandId)
                    "disable_app" -> handleDisable(json, commandId)
                    "enable_app" -> handleEnable(json, commandId)
                    "run_command" -> handleRunCommand(json, commandId)
                    "run_script" -> handleRunScript(json, commandId)
                    else -> {
                        Log.w(TAG, "Unknown command type: $type")
                        if (commandId.isNotEmpty()) {
                            sendResult(commandId, false, "Unknown command type: $type")
                        }
                    }
                }
            } catch (e: Exception) {
                Log.e(TAG, "Error handling message", e)
            }
        }
    }

    private suspend fun handleInstall(json: JsonObject, commandId: String) {
        val packageName = json.get("packageName")?.asString ?: ""
        val appName = json.get("appName")?.asString ?: packageName
        val apkUrl = json.get("apkUrl")?.asString ?: ""

        if (packageName.isEmpty() || apkUrl.isEmpty()) {
            sendResult(commandId, false, "Missing packageName or apkUrl")
            return
        }

        val result = appInstaller.installApp(commandId, packageName, appName, apkUrl)
        result.onFailure { error ->
            sendResult(commandId, false, error.message ?: "Installation failed")
        }
        // Success callback is handled by InstallResultReceiver
    }

    private fun handleUninstall(json: JsonObject, commandId: String) {
        val packageName = json.get("packageName")?.asString ?: ""
        if (packageName.isEmpty()) {
            sendResult(commandId, false, "Missing packageName")
            return
        }

        val success = appUninstaller.uninstallApp(packageName, commandId)
        if (!success) {
            sendResult(commandId, false, "Failed to initiate uninstall for $packageName")
        }
    }

    private fun handleDisable(json: JsonObject, commandId: String) {
        val packageName = json.get("packageName")?.asString ?: ""
        if (packageName.isEmpty()) {
            sendResult(commandId, false, "Missing packageName")
            return
        }

        val success = dpm.disableApp(packageName)
        sendResult(
            commandId,
            success,
            if (success) "Disabled $packageName" else "Failed to disable $packageName (requires Device Owner)"
        )
        reportStatus()
    }

    private fun handleEnable(json: JsonObject, commandId: String) {
        val packageName = json.get("packageName")?.asString ?: ""
        if (packageName.isEmpty()) {
            sendResult(commandId, false, "Missing packageName")
            return
        }

        val success = dpm.enableApp(packageName)
        sendResult(
            commandId,
            success,
            if (success) "Enabled $packageName" else "Failed to enable $packageName (requires Device Owner)"
        )
        reportStatus()
    }

    private suspend fun handleRunCommand(json: JsonObject, commandId: String) {
        val command = json.get("command")?.asString ?: ""
        if (command.isEmpty()) {
            sendResult(commandId, false, "Command string is empty")
            return
        }

        val result = shellExecutor.execute(command)
        val message = if (result.isSuccess) {
            result.output.ifEmpty { "Command succeeded with no output" }
        } else {
            "Command failed (code ${result.exitCode}): ${result.error.ifEmpty { result.output }}"
        }
        sendResult(commandId, result.isSuccess, message)
    }

    private suspend fun handleRunScript(json: JsonObject, commandId: String) {
        val script = json.get("script")?.asString ?: ""
        if (script.isEmpty()) {
            sendResult(commandId, false, "Script content is empty")
            return
        }

        val result = shellExecutor.execute(script)
        val message = if (result.isSuccess) {
            result.output.ifEmpty { "Script succeeded with no output" }
        } else {
            "Script failed (code ${result.exitCode}): ${result.error.ifEmpty { result.output }}"
        }
        sendResult(commandId, result.isSuccess, message)
    }

    private fun sendResult(commandId: String, success: Boolean, message: String) {
        val resultJson = reporter.buildCommandResult(commandId, success, message)
        WebSocketClient.getInstance(context).send(resultJson)
    }

    private fun reportStatus() {
        val statusReport = reporter.buildStatusReport()
        WebSocketClient.getInstance(context).send(statusReport)
    }

    companion object {
        private const val TAG = "KlyraCmdExecutor"
    }
}
