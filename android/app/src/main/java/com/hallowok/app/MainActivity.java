package com.hallowok.app;

import android.content.Context;
import android.graphics.Color;
import android.os.Build;
import android.os.Bundle;
import android.os.VibrationEffect;
import android.os.Vibrator;
import android.os.VibratorManager;
import android.view.View;
import android.view.Window;
import android.webkit.JavascriptInterface;
import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.core.view.WindowInsetsControllerCompat;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    private static final int LIGHT_BG = Color.parseColor("#fafafa");
    private static final int DARK_BG = Color.parseColor("#09090b");

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        View contentView = findViewById(android.R.id.content);
        if (contentView != null) {
            contentView.setBackgroundColor(LIGHT_BG);
            ViewCompat.setOnApplyWindowInsetsListener(contentView, (v, insets) -> {
                Insets navAndCutout = insets.getInsets(
                    WindowInsetsCompat.Type.navigationBars() | WindowInsetsCompat.Type.displayCutout()
                );
                Insets statusBars = insets.getInsets(
                    WindowInsetsCompat.Type.statusBars() | WindowInsetsCompat.Type.displayCutout()
                );
                Insets ime = insets.getInsets(WindowInsetsCompat.Type.ime());

                int bottom = Math.max(navAndCutout.bottom, ime.bottom);

                // Keep top padding 0 so StatusBar overlay + CSS .pt-safe-top works seamlessly.
                // Pad left/right/bottom so 3-button nav bar, gesture bar, and keyboard never overlap the app.
                v.setPadding(navAndCutout.left, 0, navAndCutout.right, bottom);

                return new WindowInsetsCompat.Builder(insets)
                    .setInsets(
                        WindowInsetsCompat.Type.systemBars() | WindowInsetsCompat.Type.displayCutout(),
                        Insets.of(0, statusBars.top, 0, 0)
                    )
                    .setInsets(
                        WindowInsetsCompat.Type.ime(),
                        Insets.of(0, 0, 0, 0)
                    )
                    .build();
            });
            ViewCompat.requestApplyInsets(contentView);
        }

        if (bridge != null && bridge.getWebView() != null) {
            bridge.getWebView().addJavascriptInterface(new NativeSystemUI(), "HalloWokNative");
        }
    }

    private void applySystemBarAppearance(boolean isDark) {
        int bgColor = isDark ? DARK_BG : LIGHT_BG;
        Window window = getWindow();
        View decorView = window.getDecorView();
        decorView.setBackgroundColor(bgColor);

        View contentView = findViewById(android.R.id.content);
        if (contentView != null) {
            contentView.setBackgroundColor(bgColor);
        }

        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.VANILLA_ICE_CREAM) {
            setLegacyNavBarColor(window, bgColor);
        }

        WindowInsetsControllerCompat controller = WindowCompat.getInsetsController(window, decorView);
        controller.setAppearanceLightNavigationBars(!isDark);
        controller.setAppearanceLightStatusBars(!isDark);
    }

    @SuppressWarnings("deprecation")
    private void setLegacyNavBarColor(Window window, int color) {
        window.setNavigationBarColor(color);
    }

    @SuppressWarnings("deprecation")
    private void triggerVibration(int durationMs) {
        try {
            Vibrator vibrator;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                VibratorManager manager = (VibratorManager) getSystemService(Context.VIBRATOR_MANAGER_SERVICE);
                vibrator = manager != null ? manager.getDefaultVibrator() : null;
            } else {
                vibrator = (Vibrator) getSystemService(Context.VIBRATOR_SERVICE);
            }

            if (vibrator == null || !vibrator.hasVibrator()) return;

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                vibrator.vibrate(VibrationEffect.createOneShot(durationMs, VibrationEffect.DEFAULT_AMPLITUDE));
            } else {
                vibrator.vibrate(durationMs);
            }
        } catch (Exception ignored) {
        }
    }

    private class NativeSystemUI {
        @JavascriptInterface
        public void setDarkMode(boolean isDark) {
            runOnUiThread(() -> applySystemBarAppearance(isDark));
        }

        @JavascriptInterface
        public void vibrate(int durationMs) {
            triggerVibration(Math.max(10, Math.min(durationMs, 200)));
        }
    }
}
