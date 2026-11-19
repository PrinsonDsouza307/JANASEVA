package com.janaseva.mobile;

import android.Manifest;
import android.app.Activity;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.Bundle;
import android.webkit.*;
import android.widget.Toast;
import java.util.ArrayList;

/** Hosted-origin client: same pages, Firebase project, auth and rules as the website. */
public class MainActivity extends Activity {
    private WebView web;
    private ValueCallback<Uri[]> files;
    private PermissionRequest media;
    private GeolocationPermissions.Callback location;
    private String locationOrigin;
    private final Uri site = Uri.parse(BuildConfig.SITE_URL);

    private boolean trusted(Uri uri) {
        if (BuildConfig.DEBUG && "http".equals(uri.getScheme())) {
            boolean isLocal = "10.0.2.2".equals(uri.getHost()) || "localhost".equals(uri.getHost()) || "127.0.0.1".equals(uri.getHost());
            return isLocal && site.getHost().equals(uri.getHost()) && site.getPort() == uri.getPort();
        }
        return "https".equals(uri.getScheme()) && site.getHost().equals(uri.getHost())
            && site.getPort() == uri.getPort();
    }
    private void external(Uri uri) {
        if (!"https".equals(uri.getScheme()) && !"mailto".equals(uri.getScheme()) && !"tel".equals(uri.getScheme())) return;
        try { startActivity(new Intent(Intent.ACTION_VIEW, uri)); }
        catch (Exception e) { Toast.makeText(this, "No app available to open this link", Toast.LENGTH_SHORT).show(); }
    }
    @Override public void onCreate(Bundle state) {
        super.onCreate(state);
        web = new WebView(this); setContentView(web);
        WebSettings settings = web.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setAllowFileAccess(false);
        settings.setAllowContentAccess(true);
        settings.setAllowFileAccessFromFileURLs(false);
        settings.setAllowUniversalAccessFromFileURLs(false);
        settings.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        settings.setSafeBrowsingEnabled(true);
        settings.setUserAgentString(settings.getUserAgentString() + " JANASEVA-Android/" + BuildConfig.VERSION_NAME);
        web.addJavascriptInterface(new JanasevaNativeBridge(this), "JanasevaNative");
        WebView.setWebContentsDebuggingEnabled(BuildConfig.DEBUG);
        CookieManager.getInstance().setAcceptThirdPartyCookies(web, false);
        web.setWebViewClient(new WebViewClient() {
            @Override public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                if (!request.isForMainFrame()) return !trusted(request.getUrl());
                if (trusted(request.getUrl())) return false;
                external(request.getUrl()); return true;
            }
            @Override public void onReceivedError(WebView view, WebResourceRequest req, WebResourceError error) {
                if (req.isForMainFrame()) Toast.makeText(MainActivity.this,
                    "Page unavailable. Reconnect and reopen; saved submissions remain on this device.", Toast.LENGTH_LONG).show();
            }
        });
        web.setWebChromeClient(new WebChromeClient() {
            @Override public boolean onShowFileChooser(WebView view, ValueCallback<Uri[]> callback, FileChooserParams params) {
                if (files != null) files.onReceiveValue(null);
                files = callback;
                Intent pick = new Intent(Intent.ACTION_OPEN_DOCUMENT);
                pick.addCategory(Intent.CATEGORY_OPENABLE); pick.setType("*/*");
                pick.putExtra(Intent.EXTRA_MIME_TYPES, new String[]{"image/*", "application/pdf"});
                pick.putExtra(Intent.EXTRA_ALLOW_MULTIPLE, params.getMode() == FileChooserParams.MODE_OPEN_MULTIPLE);
                try { startActivityForResult(pick, 10); }
                catch (Exception e) { files.onReceiveValue(null); files = null; }
                return true;
            }
            @Override public void onPermissionRequest(PermissionRequest request) {
                if (!trusted(request.getOrigin())) { request.deny(); return; }
                if (media != null) media.deny();
                media = request;
                ArrayList<String> needed = new ArrayList<>();
                for (String resource : request.getResources()) {
                    if (PermissionRequest.RESOURCE_VIDEO_CAPTURE.equals(resource)) needed.add(Manifest.permission.CAMERA);
                    else if (PermissionRequest.RESOURCE_AUDIO_CAPTURE.equals(resource)) needed.add(Manifest.permission.RECORD_AUDIO);
                    else { request.deny(); media = null; return; }
                }
                if (needed.isEmpty()) { request.deny(); media = null; return; }
                requestPermissions(needed.toArray(new String[0]), 11);
            }
            @Override public void onPermissionRequestCanceled(PermissionRequest request) { if (media == request) media = null; }
            @Override public void onGeolocationPermissionsShowPrompt(String origin, GeolocationPermissions.Callback callback) {
                if (!trusted(Uri.parse(origin))) { callback.invoke(origin, false, false); return; }
                if (location != null) location.invoke(locationOrigin, false, false);
                location = callback; locationOrigin = origin;
                requestPermissions(new String[]{Manifest.permission.ACCESS_FINE_LOCATION, Manifest.permission.ACCESS_COARSE_LOCATION}, 12);
            }
        });
        web.setDownloadListener((url, agent, disposition, mime, length) -> external(Uri.parse(url)));
        if (state == null || web.restoreState(state) == null) web.loadUrl(BuildConfig.SITE_URL);
    }
    @Override public void onRequestPermissionsResult(int code, String[] permissions, int[] results) {
        super.onRequestPermissionsResult(code, permissions, results);
        if (code == 11 && media != null) {
            boolean allowed = results.length > 0;
            for (int result : results) allowed &= result == PackageManager.PERMISSION_GRANTED;
            if (allowed && trusted(media.getOrigin())) media.grant(media.getResources()); else media.deny();
            media = null;
        }
        if (code == 12 && location != null) {
            boolean allowed = checkSelfPermission(Manifest.permission.ACCESS_COARSE_LOCATION) == PackageManager.PERMISSION_GRANTED;
            location.invoke(locationOrigin, allowed, false); location = null;
        }
    }
    @Override protected void onActivityResult(int code, int result, Intent data) {
        super.onActivityResult(code, result, data);
        if (code == 10 && files != null) {
            ArrayList<Uri> selected = new ArrayList<>();
            if (result == RESULT_OK && data != null) {
                if (data.getClipData() != null) {
                    for (int i=0; i<data.getClipData().getItemCount(); i++) selected.add(data.getClipData().getItemAt(i).getUri());
                } else if (data.getData() != null) selected.add(data.getData());
            }
            selected.removeIf(uri -> !"content".equals(uri.getScheme()));
            files.onReceiveValue(selected.isEmpty() ? null : selected.toArray(new Uri[0])); files = null;
        }
    }
    @Override protected void onSaveInstanceState(Bundle state) { super.onSaveInstanceState(state); web.saveState(state); }
    @Override public void onBackPressed() { if (web.canGoBack()) web.goBack(); else super.onBackPressed(); }
    @Override protected void onDestroy() {
        if (files != null) files.onReceiveValue(null);
        if (media != null) media.deny();
        if (location != null) location.invoke(locationOrigin, false, false);
        web.destroy(); super.onDestroy();
    }

    /** Two-way JavaScript interface enabling web client synchronization with Android host. */
    public static class JanasevaNativeBridge {
        private final Activity activity;

        public JanasevaNativeBridge(Activity activity) {
            this.activity = activity;
        }

        @JavascriptInterface
        public boolean isNativeApp() {
            return true;
        }

        @JavascriptInterface
        public String getAppVersion() {
            return BuildConfig.VERSION_NAME;
        }

        @JavascriptInterface
        public int getVersionCode() {
            return BuildConfig.VERSION_CODE;
        }

        @JavascriptInterface
        public String getPlatform() {
            return "Android";
        }

        @JavascriptInterface
        public void showToast(String message) {
            if (message != null && !message.isEmpty()) {
                activity.runOnUiThread(() -> Toast.makeText(activity, message, Toast.LENGTH_SHORT).show());
            }
        }
    }
}
