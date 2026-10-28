package com.tanisha.fintrack;

import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.util.Log;
import android.view.View;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    private static final String TAG = "URxpenz";

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // If the webview layout failed to inflate, BridgeActivity loaded R.layout.no_webview
        View updateWebviewBtn = findViewById(R.id.btn_update_webview);
        View updateChromeBtn = findViewById(R.id.btn_update_chrome);
        View retryBtn = findViewById(R.id.btn_retry);

        if (updateWebviewBtn != null) {
            updateWebviewBtn.setOnClickListener(v -> openPlayStore("com.google.android.webview"));
        }

        if (updateChromeBtn != null) {
            updateChromeBtn.setOnClickListener(v -> openPlayStore("com.android.chrome"));
        }

        if (retryBtn != null) {
            retryBtn.setOnClickListener(v -> recreate());
        }
    }

    private void openPlayStore(String packageName) {
        try {
            Intent intent = new Intent(Intent.ACTION_VIEW, Uri.parse("market://details?id=" + packageName));
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            startActivity(intent);
        } catch (ActivityNotFoundException e) {
            try {
                Intent webIntent = new Intent(Intent.ACTION_VIEW, Uri.parse("https://play.google.com/store/apps/details?id=" + packageName));
                webIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                startActivity(webIntent);
            } catch (Exception ex) {
                Log.e(TAG, "Unable to open Play Store", ex);
            }
        }
    }
}
