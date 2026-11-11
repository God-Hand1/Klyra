package com.klyra.mdm.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Info
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.SnackbarHost
import androidx.compose.material3.SnackbarHostState
import androidx.compose.material3.Tab
import androidx.compose.material3.TabRow
import androidx.compose.material3.TabRowDefaults
import androidx.compose.material3.TabRowDefaults.tabIndicatorOffset
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateListOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.google.gson.Gson
import com.google.gson.reflect.TypeToken
import com.klyra.mdm.admin.DevicePolicyManager
import com.klyra.mdm.command.AppInstaller
import com.klyra.mdm.command.AppUninstaller
import com.klyra.mdm.data.CatalogApp
import com.klyra.mdm.data.DeviceStateReporter
import com.klyra.mdm.data.InstalledAppItem
import com.klyra.mdm.data.ServerConfig
import com.klyra.mdm.service.WebSocketClient
import com.klyra.mdm.ui.components.CatalogAppCard
import com.klyra.mdm.ui.components.ConnectionBadge
import com.klyra.mdm.ui.components.InstalledAppCard
import com.klyra.mdm.ui.theme.KlyraPrimary
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import okhttp3.OkHttpClient
import okhttp3.Request
import java.util.UUID

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun HomeScreen(
    onNavigateToDeviceInfo: () -> Unit,
    onNavigateToSettings: () -> Unit
) {
    val context = LocalContext.current
    val config = remember { ServerConfig(context) }
    val dpm = remember { DevicePolicyManager(context) }
    val appInstaller = remember { AppInstaller(context) }
    val appUninstaller = remember { AppUninstaller(context) }
    val reporter = remember { DeviceStateReporter(context) }
    val wsClient = remember { WebSocketClient.getInstance(context) }

    val isConnected by wsClient.isConnected.collectAsState()
    val scope = rememberCoroutineScope()
    val snackbarHostState = remember { SnackbarHostState() }

    var selectedTab by remember { mutableIntStateOf(0) }
    val catalogApps = remember { mutableStateListOf<CatalogApp>() }
    val installedApps = remember { mutableStateListOf<InstalledAppItem>() }
    var isLoadingCatalog by remember { mutableStateOf(false) }
    var installingPackage by remember { mutableStateOf<String?>(null) }

    fun refreshInstalledList() {
        installedApps.clear()
        val pkgs = config.getInstalledPackages()
        val names = config.getInstalledAppNames()
        for (pkg in pkgs) {
            val isEnabled = !dpm.isAppHidden(pkg)
            installedApps.add(
                InstalledAppItem(
                    packageName = pkg,
                    appName = names[pkg] ?: pkg,
                    isEnabled = isEnabled
                )
            )
        }
    }

    suspend fun fetchCatalog() {
        val serverUrl = config.getServerUrl()
        if (serverUrl.isBlank()) return
        isLoadingCatalog = true
        withContext(Dispatchers.IO) {
            try {
                val httpUrl = config.getHttpBaseUrl()
                val client = OkHttpClient()
                val request = Request.Builder().url("$httpUrl/api/apps").build()
                client.newCall(request).execute().use { response ->
                    if (response.isSuccessful) {
                        val body = response.body?.string() ?: ""
                        val type = object : TypeToken<List<CatalogApp>>() {}.type
                        val list: List<CatalogApp> = Gson().fromJson(body, type) ?: emptyList()
                        withContext(Dispatchers.Main) {
                            catalogApps.clear()
                            catalogApps.addAll(list)
                        }
                    }
                }
            } catch (e: Exception) {
                withContext(Dispatchers.Main) {
                    snackbarHostState.showSnackbar("Failed to fetch catalog: ${e.message}")
                }
            } finally {
                withContext(Dispatchers.Main) {
                    isLoadingCatalog = false
                }
            }
        }
    }

    LaunchedEffect(Unit) {
        refreshInstalledList()
        fetchCatalog()
    }

    Scaffold(
        snackbarHost = { SnackbarHost(snackbarHostState) },
        topBar = {
            TopAppBar(
                title = {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(10.dp)
                    ) {
                        Text(
                            text = "Klyra MDM",
                            style = MaterialTheme.typography.titleLarge,
                            fontWeight = FontWeight.Bold,
                            color = MaterialTheme.colorScheme.onBackground
                        )
                        ConnectionBadge(isConnected = isConnected)
                    }
                },
                actions = {
                    IconButton(onClick = {
                        scope.launch {
                            refreshInstalledList()
                            fetchCatalog()
                        }
                    }) {
                        Icon(
                            Icons.Default.Refresh,
                            contentDescription = "Refresh",
                            tint = MaterialTheme.colorScheme.onBackground
                        )
                    }
                    IconButton(onClick = onNavigateToDeviceInfo) {
                        Icon(
                            Icons.Default.Info,
                            contentDescription = "Device Info",
                            tint = MaterialTheme.colorScheme.onBackground
                        )
                    }
                    IconButton(onClick = onNavigateToSettings) {
                        Icon(
                            Icons.Default.Settings,
                            contentDescription = "Settings",
                            tint = MaterialTheme.colorScheme.onBackground
                        )
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = MaterialTheme.colorScheme.background
                )
            )
        }
    ) { paddingValues ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
        ) {
            // Tabs: Available Apps (Catalog) & Installed Apps
            TabRow(
                selectedTabIndex = selectedTab,
                containerColor = MaterialTheme.colorScheme.background,
                contentColor = KlyraPrimary,
                indicator = { tabPositions ->
                    TabRowDefaults.SecondaryIndicator(
                        Modifier.tabIndicatorOffset(tabPositions[selectedTab]),
                        color = KlyraPrimary
                    )
                }
            ) {
                Tab(
                    selected = selectedTab == 0,
                    onClick = { selectedTab = 0 },
                    text = {
                        Text(
                            "Available (${catalogApps.size})",
                            fontWeight = if (selectedTab == 0) FontWeight.Bold else FontWeight.Normal
                        )
                    }
                )
                Tab(
                    selected = selectedTab == 1,
                    onClick = {
                        selectedTab = 1
                        refreshInstalledList()
                    },
                    text = {
                        Text(
                            "Installed (${installedApps.size})",
                            fontWeight = if (selectedTab == 1) FontWeight.Bold else FontWeight.Normal
                        )
                    }
                )
            }

            if (selectedTab == 0) {
                // Available Apps section
                if (isLoadingCatalog && catalogApps.isEmpty()) {
                    Box(
                        modifier = Modifier.fillMaxSize(),
                        contentAlignment = Alignment.Center
                    ) {
                        CircularProgressIndicator(color = KlyraPrimary)
                    }
                } else if (catalogApps.isEmpty()) {
                    Box(
                        modifier = Modifier
                            .fillMaxSize()
                            .padding(24.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(
                            "No apps available from server. Check server connection in Settings.",
                            style = MaterialTheme.typography.bodyMedium,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                } else {
                    LazyVerticalGrid(
                        columns = GridCells.Adaptive(minSize = 280.dp),
                        contentPadding = PaddingValues(16.dp),
                        verticalArrangement = Arrangement.spacedBy(12.dp),
                        horizontalArrangement = Arrangement.spacedBy(12.dp),
                        modifier = Modifier.fillMaxSize()
                    ) {
                        items(catalogApps, key = { it.packageName }) { app ->
                            val isInstalled = installedApps.any { it.packageName == app.packageName }
                            val isInstalling = installingPackage == app.packageName

                            CatalogAppCard(
                                app = app,
                                isInstalled = isInstalled,
                                isInstalling = isInstalling,
                                onInstallClick = { targetApp ->
                                    installingPackage = targetApp.packageName
                                    scope.launch {
                                        val cmdId = UUID.randomUUID().toString()
                                        val res = appInstaller.installApp(
                                            cmdId,
                                            targetApp.packageName,
                                            targetApp.appName,
                                            targetApp.apkUrl
                                        )
                                        installingPackage = null
                                        res.onFailure {
                                            snackbarHostState.showSnackbar("Install error: ${it.message}")
                                        }
                                        refreshInstalledList()
                                    }
                                }
                            )
                        }
                    }
                }
            } else {
                // Installed Apps section
                if (installedApps.isEmpty()) {
                    Box(
                        modifier = Modifier
                            .fillMaxSize()
                            .padding(24.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(
                            "No apps installed via Klyra MDM yet.",
                            style = MaterialTheme.typography.bodyMedium,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                } else {
                    LazyColumn(
                        contentPadding = PaddingValues(16.dp),
                        verticalArrangement = Arrangement.spacedBy(10.dp),
                        modifier = Modifier.fillMaxSize()
                    ) {
                        items(installedApps, key = { it.packageName }) { app ->
                            InstalledAppCard(
                                app = app,
                                onToggleEnable = { pkg, enable ->
                                    if (enable) {
                                        dpm.enableApp(pkg)
                                    } else {
                                        dpm.disableApp(pkg)
                                    }
                                    refreshInstalledList()
                                    wsClient.send(reporter.buildStatusReport())
                                },
                                onUninstall = { pkg ->
                                    appUninstaller.uninstallApp(pkg)
                                    refreshInstalledList()
                                    wsClient.send(reporter.buildStatusReport())
                                }
                            )
                        }
                    }
                }
            }
        }
    }
}
