import path from "path";
import fs from "fs";

export const downloadApk = (req, res) => {
    try {
        // Absolute path to APK
        const apkPath = "/var/www/html/mannat.apk";

        // Check if file exists
        if (!fs.existsSync(apkPath)) {
            return res.status(404).json({ message: "APK not found" });
        }

        // Set headers to trigger download
        res.setHeader("Content-Disposition", 'attachment; filename="mannat.apk"');
        res.setHeader("Content-Type", "application/vnd.android.package-archive");

        // Send the file
        res.sendFile(apkPath, (err) => {
            if (err) {
                console.error("Error sending APK:", err);
                res.status(500).json({ message: "Failed to download APK" });
            }
        });
    } catch (err) {
        console.error("Download error:", err);
        res.status(500).json({ message: "Server error" });
    }
};
