# Proguard rules for Klyra MDM
-keepattributes Signature
-keepattributes *Annotation*

# Gson
-keepattributes Signature
-keep class com.klyra.mdm.data.** { *; }
-keep class com.klyra.mdm.command.** { *; }

# OkHttp
-dontwarn okhttp3.**
-dontwarn okio.**
-keep class okhttp3.** { *; }

# Kotlin Coroutines
-keepnames class kotlinx.coroutines.internal.MainDispatcherFactory {}
-keepnames class kotlinx.coroutines.CoroutineExceptionHandler {}
