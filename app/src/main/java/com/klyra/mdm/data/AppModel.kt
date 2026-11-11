package com.klyra.mdm.data

data class CatalogApp(
    val id: String = "",
    val packageName: String = "",
    val appName: String = "",
    val icon: String = "",
    val category: String = "",
    val description: String = "",
    val apkUrl: String = ""
)

data class InstalledAppItem(
    val packageName: String,
    val appName: String,
    val isEnabled: Boolean
)
