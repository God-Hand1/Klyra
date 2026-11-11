package com.klyra.mdm.service

import android.content.Context
import android.os.Handler
import android.os.Looper
import android.util.Log
import com.klyra.mdm.command.CommandExecutor
import com.klyra.mdm.data.DeviceStateReporter
import com.klyra.mdm.data.ServerConfig
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.Response
import okhttp3.WebSocket
import okhttp3.WebSocketListener
import java.util.concurrent.TimeUnit
import kotlin.math.min

class WebSocketClient private constructor(private val context: Context) {

    private val client = OkHttpClient.Builder()
        .pingInterval(20, TimeUnit.SECONDS)
        .connectTimeout(10, TimeUnit.SECONDS)
        .readTimeout(0, TimeUnit.MILLISECONDS)
        .build()

    private var webSocket: WebSocket? = null
    private val handler = Handler(Looper.getMainLooper())
    private var reconnectAttempts = 0
    private var isIntentionalClose = false
    private val commandExecutor = CommandExecutor(context)
    private val reporter = DeviceStateReporter(context)

    private val _isConnected = MutableStateFlow(false)
    val isConnected: StateFlow<Boolean> = _isConnected.asStateFlow()

    fun connect() {
        isIntentionalClose = false
        handler.removeCallbacksAndMessages(null)
        val config = ServerConfig(context)
        val serverUrl = config.getServerUrl()

        if (serverUrl.isBlank()) {
            Log.w(TAG, "Server URL is not configured")
            return
        }

        val deviceId = config.getDeviceId()
        val wsUrl = "${config.getWsBaseUrl()}/ws/device?deviceId=$deviceId"

        Log.i(TAG, "Connecting to WebSocket: $wsUrl")

        try {
            val request = Request.Builder().url(wsUrl).build()
            webSocket?.cancel()
            webSocket = client.newWebSocket(request, createListener())
        } catch (e: Exception) {
            Log.e(TAG, "Failed to initiate WebSocket connection", e)
            scheduleReconnect()
        }
    }

    fun disconnect() {
        isIntentionalClose = true
        handler.removeCallbacksAndMessages(null)
        webSocket?.close(1000, "App requested disconnect")
        webSocket = null
        _isConnected.value = false
    }

    fun send(message: String): Boolean {
        val ws = webSocket
        if (ws != null && _isConnected.value) {
            return ws.send(message)
        }
        Log.w(TAG, "Cannot send message: WebSocket not connected")
        return false
    }

    private fun createListener(): WebSocketListener {
        return object : WebSocketListener() {
            override fun onOpen(webSocket: WebSocket, response: Response) {
                Log.i(TAG, "WebSocket connected successfully")
                _isConnected.value = true
                reconnectAttempts = 0

                // Immediately send status report on connect
                val report = reporter.buildStatusReport()
                webSocket.send(report)
                Log.d(TAG, "Sent initial status report: $report")
            }

            override fun onMessage(webSocket: WebSocket, text: String) {
                Log.d(TAG, "Received message: $text")
                commandExecutor.handleMessage(text)
            }

            override fun onClosing(webSocket: WebSocket, code: Int, reason: String) {
                Log.i(TAG, "WebSocket closing: $code / $reason")
                webSocket.close(1000, null)
                _isConnected.value = false
            }

            override fun onClosed(webSocket: WebSocket, code: Int, reason: String) {
                Log.i(TAG, "WebSocket closed: $code / $reason")
                _isConnected.value = false
                if (!isIntentionalClose) {
                    scheduleReconnect()
                }
            }

            override fun onFailure(webSocket: WebSocket, t: Throwable, response: Response?) {
                Log.e(TAG, "WebSocket error: ${t.message}")
                _isConnected.value = false
                if (!isIntentionalClose) {
                    scheduleReconnect()
                }
            }
        }
    }

    private fun scheduleReconnect() {
        reconnectAttempts++
        // Exponential backoff: 1s, 2s, 4s, 8s, max 30s
        val delaySec = min(30, 1 shl (min(reconnectAttempts, 5) - 1))
        val delayMillis = delaySec * 1000L

        Log.i(TAG, "Scheduling reconnect attempt #$reconnectAttempts in ${delaySec}s")
        handler.postDelayed({
            if (!isIntentionalClose) {
                connect()
            }
        }, delayMillis)
    }

    companion object {
        private const val TAG = "KlyraWebSocketClient"

        @Volatile
        private var instance: WebSocketClient? = null

        fun getInstance(context: Context): WebSocketClient {
            return instance ?: synchronized(this) {
                instance ?: WebSocketClient(context.applicationContext).also { instance = it }
            }
        }
    }
}
