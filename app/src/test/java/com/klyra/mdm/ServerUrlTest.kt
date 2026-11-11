package com.klyra.mdm

import com.klyra.mdm.command.ShellExecutor
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class ServerUrlTest {

    private fun normalizeHttp(url: String): String {
        val trimmed = url.trim().trimEnd('/')
        return when {
            trimmed.startsWith("ws://") -> "http://" + trimmed.removePrefix("ws://")
            trimmed.startsWith("wss://") -> "https://" + trimmed.removePrefix("wss://")
            !trimmed.startsWith("http://") && !trimmed.startsWith("https://") -> "http://$trimmed"
            else -> trimmed
        }
    }

    private fun normalizeWs(url: String): String {
        val trimmed = url.trim().trimEnd('/')
        return when {
            trimmed.startsWith("http://") -> "ws://" + trimmed.removePrefix("http://")
            trimmed.startsWith("https://") -> "wss://" + trimmed.removePrefix("https://")
            !trimmed.startsWith("ws://") && !trimmed.startsWith("wss://") -> "ws://$trimmed"
            else -> trimmed
        }
    }

    @Test
    fun normalizeHttp_convertsWsToHttp() {
        assertEquals("http://10.0.2.2:3000", normalizeHttp("ws://10.0.2.2:3000"))
        assertEquals("http://10.0.2.2:3000", normalizeHttp("ws://10.0.2.2:3000/"))
    }

    @Test
    fun normalizeHttp_convertsWssToHttps() {
        assertEquals("https://mdm.example.com", normalizeHttp("wss://mdm.example.com"))
    }

    @Test
    fun normalizeHttp_handlesRawHost() {
        assertEquals("http://192.168.1.100:3000", normalizeHttp("192.168.1.100:3000"))
    }

    @Test
    fun normalizeWs_convertsHttpToWs() {
        assertEquals("ws://10.0.2.2:3000", normalizeWs("http://10.0.2.2:3000"))
        assertEquals("ws://10.0.2.2:3000", normalizeWs("http://10.0.2.2:3000/"))
    }

    @Test
    fun normalizeWs_convertsHttpsToWss() {
        assertEquals("wss://mdm.example.com", normalizeWs("https://mdm.example.com"))
    }

    @Test
    fun shellResult_verifiesSuccessFlag() {
        val success = ShellExecutor.ShellResult(exitCode = 0, output = "ok", error = "")
        val failure = ShellExecutor.ShellResult(exitCode = 1, output = "", error = "Permission denied")

        assertTrue(success.isSuccess)
        assertFalse(failure.isSuccess)
    }
}
