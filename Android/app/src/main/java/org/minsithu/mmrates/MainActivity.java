package org.minsithu.mmrates;

import android.annotation.SuppressLint;
import android.app.Activity;
import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.graphics.Color;
import android.graphics.drawable.GradientDrawable;
import android.net.ConnectivityManager;
import android.net.Network;
import android.net.NetworkCapabilities;
import android.net.Uri;
import android.os.Bundle;
import android.provider.Settings;
import android.view.Gravity;
import android.view.MotionEvent;
import android.view.View;
import android.view.ViewGroup;
import android.webkit.JavascriptInterface;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Button;
import android.widget.FrameLayout;
import android.widget.LinearLayout;
import android.widget.TextView;
import android.widget.Toast;

import java.util.Locale;

public final class MainActivity extends Activity {
    private static final float REFRESH_THRESHOLD_DP = 96f;

    private WebView webView;
    private LinearLayout offlinePanel;
    private TextView pullIndicator;
    private float pullStartY;
    private boolean trackingPull;
    private boolean refreshArmed;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        configureSystemBars();
        setContentView(buildContent());
        configureWebView();
        webView.loadUrl(BuildConfig.WEB_APP_URL);
    }

    private void configureSystemBars() {
        getWindow().setStatusBarColor(Color.rgb(248, 246, 239));
        getWindow().setNavigationBarColor(Color.rgb(248, 246, 239));
        getWindow().getDecorView().setSystemUiVisibility(View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR);
    }

    private View buildContent() {
        FrameLayout root = new FrameLayout(this);
        root.setBackgroundColor(Color.rgb(248, 246, 239));

        webView = new WebView(this);
        root.addView(webView, new FrameLayout.LayoutParams(
            ViewGroup.LayoutParams.MATCH_PARENT,
            ViewGroup.LayoutParams.MATCH_PARENT
        ));

        pullIndicator = new TextView(this);
        pullIndicator.setText(R.string.pull_to_refresh);
        pullIndicator.setTextColor(Color.WHITE);
        pullIndicator.setTextSize(13);
        pullIndicator.setGravity(Gravity.CENTER);
        pullIndicator.setAlpha(0f);
        pullIndicator.setPadding(dp(18), dp(8), dp(18), dp(8));
        GradientDrawable indicatorBackground = new GradientDrawable();
        indicatorBackground.setColor(Color.rgb(11, 117, 89));
        indicatorBackground.setCornerRadius(dp(18));
        pullIndicator.setBackground(indicatorBackground);
        FrameLayout.LayoutParams indicatorParams = new FrameLayout.LayoutParams(
            ViewGroup.LayoutParams.WRAP_CONTENT,
            ViewGroup.LayoutParams.WRAP_CONTENT,
            Gravity.TOP | Gravity.CENTER_HORIZONTAL
        );
        indicatorParams.topMargin = dp(12);
        root.addView(pullIndicator, indicatorParams);

        offlinePanel = createOfflinePanel();
        FrameLayout.LayoutParams offlineParams = new FrameLayout.LayoutParams(
            ViewGroup.LayoutParams.MATCH_PARENT,
            ViewGroup.LayoutParams.WRAP_CONTENT,
            Gravity.CENTER
        );
        offlineParams.leftMargin = dp(20);
        offlineParams.rightMargin = dp(20);
        offlinePanel.setVisibility(View.GONE);
        root.addView(offlinePanel, offlineParams);

        return root;
    }

    private LinearLayout createOfflinePanel() {
        LinearLayout panel = new LinearLayout(this);
        panel.setOrientation(LinearLayout.VERTICAL);
        panel.setGravity(Gravity.CENTER_HORIZONTAL);
        panel.setPadding(dp(24), dp(24), dp(24), dp(24));
        panel.setBackgroundResource(R.drawable.offline_panel);
        panel.setElevation(dp(8));

        TextView title = new TextView(this);
        title.setText(R.string.offline_title);
        title.setTextSize(21);
        title.setTextColor(Color.rgb(22, 32, 29));
        title.setGravity(Gravity.CENTER);
        title.setTypeface(title.getTypeface(), android.graphics.Typeface.BOLD);
        panel.addView(title, matchWrap(dp(0), dp(8)));

        TextView message = new TextView(this);
        message.setText(R.string.offline_message);
        message.setTextSize(14);
        message.setTextColor(Color.rgb(92, 105, 99));
        message.setGravity(Gravity.CENTER);
        panel.addView(message, matchWrap(dp(0), dp(18)));

        Button retry = new Button(this);
        retry.setText(R.string.retry);
        retry.setAllCaps(false);
        retry.setTextColor(Color.WHITE);
        retry.setBackgroundTintList(android.content.res.ColorStateList.valueOf(Color.rgb(11, 117, 89)));
        retry.setOnClickListener(view -> reload());
        panel.addView(retry, new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, dp(48)));
        return panel;
    }

    private LinearLayout.LayoutParams matchWrap(int top, int bottom) {
        LinearLayout.LayoutParams params = new LinearLayout.LayoutParams(
            ViewGroup.LayoutParams.MATCH_PARENT,
            ViewGroup.LayoutParams.WRAP_CONTENT
        );
        params.topMargin = top;
        params.bottomMargin = bottom;
        return params;
    }

    @SuppressLint({"SetJavaScriptEnabled", "ClickableViewAccessibility"})
    private void configureWebView() {
        WebView.setWebContentsDebuggingEnabled(BuildConfig.DEBUG);
        webView.setBackgroundColor(Color.rgb(248, 246, 239));
        webView.getSettings().setJavaScriptEnabled(true);
        webView.getSettings().setDomStorageEnabled(true);
        webView.getSettings().setDatabaseEnabled(true);
        webView.getSettings().setAllowFileAccess(false);
        webView.getSettings().setAllowContentAccess(false);
        webView.getSettings().setMediaPlaybackRequiresUserGesture(true);
        webView.getSettings().setUserAgentString(
            webView.getSettings().getUserAgentString() + " MMRatesAndroid/" + BuildConfig.VERSION_NAME
        );
        webView.addJavascriptInterface(new NativeBridge(), "MMRatesNative");
        webView.setWebChromeClient(new WebChromeClient());
        webView.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                return handleNavigation(request.getUrl());
            }

            @Override
            public void onPageFinished(WebView view, String url) {
                offlinePanel.setVisibility(View.GONE);
                injectNativeMetadata();
            }

            @Override
            public void onReceivedError(WebView view, WebResourceRequest request, WebResourceError error) {
                if (request.isForMainFrame()) showOffline();
            }

        });
        webView.setOnTouchListener(this::handlePullGesture);
    }

    private boolean handleNavigation(Uri uri) {
        String scheme = uri.getScheme() == null ? "" : uri.getScheme().toLowerCase(Locale.ROOT);
        if (TrustedUrl.isInternal(BuildConfig.WEB_APP_URL, uri.toString())) return false;
        if (scheme.equals("mailto") || scheme.equals("tel") || scheme.equals("sms")) {
            openExternal(uri);
            return true;
        }
        if (scheme.equals("http") || scheme.equals("https")) {
            openExternal(uri);
            return true;
        }
        return true;
    }

    private boolean handlePullGesture(View ignored, MotionEvent event) {
        switch (event.getActionMasked()) {
            case MotionEvent.ACTION_DOWN:
                trackingPull = webView.getScrollY() <= 0;
                pullStartY = event.getRawY();
                refreshArmed = false;
                break;
            case MotionEvent.ACTION_MOVE:
                if (!trackingPull || webView.getScrollY() > 0) break;
                float distance = Math.max(0f, event.getRawY() - pullStartY);
                if (distance > dp(10)) {
                    refreshArmed = distance >= dp(REFRESH_THRESHOLD_DP);
                    pullIndicator.setText(refreshArmed ? R.string.release_to_refresh : R.string.pull_to_refresh);
                    pullIndicator.setAlpha(Math.min(1f, distance / dp(48)));
                    pullIndicator.setTranslationY(Math.min(dp(72), distance * 0.35f));
                }
                break;
            case MotionEvent.ACTION_UP:
            case MotionEvent.ACTION_CANCEL:
                if (trackingPull && refreshArmed) reload();
                trackingPull = false;
                refreshArmed = false;
                pullIndicator.animate().alpha(0f).translationY(0f).setDuration(180).start();
                break;
            default:
                break;
        }
        return false;
    }

    private void reload() {
        offlinePanel.setVisibility(View.GONE);
        webView.reload();
    }

    private void showOffline() {
        offlinePanel.setVisibility(View.VISIBLE);
    }

    private void injectNativeMetadata() {
        String script = "window.__MM_RATES_NATIVE__={platform:'android',version:'" + BuildConfig.VERSION_NAME + "'};" +
            "window.dispatchEvent(new CustomEvent('mmratesnative',{detail:window.__MM_RATES_NATIVE__}));";
        webView.evaluateJavascript(script, null);
    }

    private void openExternal(Uri uri) {
        try {
            startActivity(new Intent(Intent.ACTION_VIEW, uri));
        } catch (ActivityNotFoundException error) {
            Toast.makeText(this, "No app can open this link", Toast.LENGTH_SHORT).show();
        }
    }

    private boolean hasNetwork() {
        ConnectivityManager manager = getSystemService(ConnectivityManager.class);
        if (manager == null) return false;
        Network network = manager.getActiveNetwork();
        NetworkCapabilities capabilities = manager.getNetworkCapabilities(network);
        return capabilities != null && capabilities.hasCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET);
    }

    @Override
    public void onBackPressed() {
        if (webView.canGoBack()) webView.goBack();
        else super.onBackPressed();
    }

    @Override
    protected void onResume() {
        super.onResume();
        if (!hasNetwork() && webView.getUrl() == null) showOffline();
    }

    @Override
    protected void onDestroy() {
        if (webView != null) {
            webView.removeJavascriptInterface("MMRatesNative");
            webView.stopLoading();
            webView.setWebChromeClient(null);
            webView.setWebViewClient(null);
            webView.destroy();
        }
        super.onDestroy();
    }

    private int dp(float value) {
        return Math.round(value * getResources().getDisplayMetrics().density);
    }

    public final class NativeBridge {
        @JavascriptInterface
        public String platform() {
            return "android";
        }

        @JavascriptInterface
        public String version() {
            return BuildConfig.VERSION_NAME;
        }

        @JavascriptInterface
        public void share(String title, String text, String url) {
            runOnUiThread(() -> {
                Intent send = new Intent(Intent.ACTION_SEND);
                send.setType("text/plain");
                send.putExtra(Intent.EXTRA_SUBJECT, title);
                send.putExtra(Intent.EXTRA_TEXT, (text == null ? "" : text) + "\n" + (url == null ? "" : url));
                startActivity(Intent.createChooser(send, title));
            });
        }

        @JavascriptInterface
        public void openAppSettings() {
            runOnUiThread(() -> {
                Intent intent = new Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS);
                intent.setData(Uri.parse("package:" + getPackageName()));
                startActivity(intent);
            });
        }
    }
}
