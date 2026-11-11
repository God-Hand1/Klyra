package com.klyra.mdm

import com.google.gson.Gson
import com.klyra.mdm.data.CatalogApp
import com.klyra.mdm.data.InstalledAppItem
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test

class AppModelTest {

    private val gson = Gson()

    @Test
    fun catalogApp_serializesAndDeserializesCorrectly() {
        val app = CatalogApp(
            id = "app-1",
            packageName = "com.test.app",
            appName = "Test App",
            icon = "https://example.com/icon.png",
            category = "Utilities",
            description = "A useful test application",
            apkUrl = "https://example.com/app.apk"
        )

        val json = gson.toJson(app)
        val deserialized = gson.fromJson(json, CatalogApp::class.java)

        assertEquals("app-1", deserialized.id)
        assertEquals("com.test.app", deserialized.packageName)
        assertEquals("Test App", deserialized.appName)
        assertEquals("Utilities", deserialized.category)
        assertEquals("https://example.com/app.apk", deserialized.apkUrl)
    }

    @Test
    fun installedAppItem_maintainsProperties() {
        val item = InstalledAppItem(
            packageName = "com.example.managed",
            appName = "Managed App",
            isEnabled = true
        )

        assertEquals("com.example.managed", item.packageName)
        assertEquals("Managed App", item.appName)
        assertTrue(item.isEnabled)
    }

    @Test
    fun appNamesSerialization_handlesJsonAndLegacyCsv() {
        val appNamesType = object : com.google.gson.reflect.TypeToken<Map<String, String>>() {}.type

        // Test 1: JSON serialization handles commas and special characters in app names
        val map = mapOf(
            "com.music.player" to "BitChord, Music Player",
            "com.test.app" to "Doctor's Portal"
        )
        val json = gson.toJson(map)
        val deserialized: Map<String, String> = gson.fromJson(json, appNamesType)
        assertEquals("BitChord, Music Player", deserialized["com.music.player"])
        assertEquals("Doctor's Portal", deserialized["com.test.app"])

        // Test 2: Legacy fallback parser handles old "pkg1=name1,pkg2=name2" format
        val legacyRaw = "com.music.bitchord=BitChord,com.example.test=TestApp"
        val legacyParsed = mutableMapOf<String, String>()
        legacyRaw.split(",").forEach { entry ->
            val parts = entry.split("=", limit = 2)
            if (parts.size == 2) legacyParsed[parts[0]] = parts[1]
        }
        assertEquals("BitChord", legacyParsed["com.music.bitchord"])
        assertEquals("TestApp", legacyParsed["com.example.test"])
    }
}
