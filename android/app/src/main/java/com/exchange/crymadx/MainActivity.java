package com.exchange.crymadx;

import android.Manifest;
import android.content.pm.PackageManager;
import android.os.Bundle;
import android.webkit.PermissionRequest;

import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;

import com.getcapacitor.Bridge;
import com.getcapacitor.BridgeActivity;
import com.getcapacitor.BridgeWebChromeClient;

public class MainActivity extends BridgeActivity {

    @Override
    public void onCreate(Bundle savedInstanceState) {
        // Register local plugins before the bridge boots so JS can call them.
        registerPlugin(ScreenGuardPlugin.class);

        super.onCreate(savedInstanceState);

        // Ask for camera + mic up front so the in-app WebView KYC iframe
        // (AlchemyPay identity verification) can capture a document photo and a
        // selfie video. Declared in AndroidManifest.xml.
        String[] perms = { Manifest.permission.CAMERA, Manifest.permission.RECORD_AUDIO };
        boolean needsRequest = false;
        for (String p : perms) {
            if (ContextCompat.checkSelfPermission(this, p) != PackageManager.PERMISSION_GRANTED) {
                needsRequest = true;
                break;
            }
        }
        if (needsRequest) {
            ActivityCompat.requestPermissions(this, perms, 1001);
        }

        // The Android WebView denies getUserMedia (camera/mic) requests from web
        // content — including iframes — unless onPermissionRequest grants them.
        // Extend Capacitor's chrome client so all other bridge behaviour is kept.
        final Bridge bridge = this.getBridge();
        bridge.getWebView().setWebChromeClient(new BridgeWebChromeClient(bridge) {
            @Override
            public void onPermissionRequest(final PermissionRequest request) {
                runOnUiThread(() -> request.grant(request.getResources()));
            }
        });
    }
}
