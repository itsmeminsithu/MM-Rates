# MM Rates currently uses only Android framework APIs.
# Keep the JavaScript bridge methods if minification is enabled later.
-keepclassmembers class org.minsithu.mmrates.MainActivity$NativeBridge {
    @android.webkit.JavascriptInterface <methods>;
}
