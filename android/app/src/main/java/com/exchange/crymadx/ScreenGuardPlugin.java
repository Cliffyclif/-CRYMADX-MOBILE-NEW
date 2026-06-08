package com.exchange.crymadx;

import android.view.WindowManager;

import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/**
 * ScreenGuard — toggles Android FLAG_SECURE on the host window.
 *
 * When enabled, the OS prevents screenshots AND screen recording of this
 * activity (the capture shows black), and the app's thumbnail in Recents is
 * blanked. The Academy video player enables it on mount and disables it on
 * unmount so the rest of the app (wallet, receipts, referral) can still be
 * screenshotted normally. This is the strongest anti-screen-record layer and
 * the reason self-hosted HLS doesn't need paid hardware DRM on mobile.
 */
@CapacitorPlugin(name = "ScreenGuard")
public class ScreenGuardPlugin extends Plugin {

    @PluginMethod
    public void enable(PluginCall call) {
        getActivity().runOnUiThread(() ->
            getActivity().getWindow().setFlags(
                WindowManager.LayoutParams.FLAG_SECURE,
                WindowManager.LayoutParams.FLAG_SECURE));
        call.resolve();
    }

    @PluginMethod
    public void disable(PluginCall call) {
        getActivity().runOnUiThread(() ->
            getActivity().getWindow().clearFlags(WindowManager.LayoutParams.FLAG_SECURE));
        call.resolve();
    }
}
