package com.klyra.mdm.command

import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.io.BufferedReader
import java.io.File
import java.io.InputStreamReader
import java.util.concurrent.TimeUnit

class ShellExecutor(private val workingDir: File? = null) {

    suspend fun execute(command: String): ShellResult = withContext(Dispatchers.IO) {
        try {
            val processBuilder = ProcessBuilder("sh", "-c", command)
            if (workingDir != null && workingDir.isDirectory) {
                processBuilder.directory(workingDir)
            }
            val process = processBuilder.start()

            val stdoutBuilder = StringBuilder()
            val stderrBuilder = StringBuilder()

            val readerThread = Thread {
                BufferedReader(InputStreamReader(process.inputStream)).use { reader ->
                    var line: String?
                    while (reader.readLine().also { line = it } != null) {
                        stdoutBuilder.append(line).append("\n")
                    }
                }
            }

            val errorThread = Thread {
                BufferedReader(InputStreamReader(process.errorStream)).use { reader ->
                    var line: String?
                    while (reader.readLine().also { line = it } != null) {
                        stderrBuilder.append(line).append("\n")
                    }
                }
            }

            readerThread.start()
            errorThread.start()

            val finished = process.waitFor(30, TimeUnit.SECONDS)
            if (!finished) {
                process.destroyForcibly()
                return@withContext ShellResult(
                    exitCode = -1,
                    output = stdoutBuilder.toString(),
                    error = "Command timed out after 30 seconds"
                )
            }

            readerThread.join(1000)
            errorThread.join(1000)

            ShellResult(
                exitCode = process.exitValue(),
                output = stdoutBuilder.toString().trimEnd(),
                error = stderrBuilder.toString().trimEnd()
            )
        } catch (e: Exception) {
            ShellResult(
                exitCode = -1,
                output = "",
                error = e.message ?: "Unknown execution error"
            )
        }
    }

    data class ShellResult(
        val exitCode: Int,
        val output: String,
        val error: String
    ) {
        val isSuccess: Boolean get() = exitCode == 0
    }
}
