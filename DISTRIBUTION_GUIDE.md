# LuxeBill Desktop Distribution Guide

This document describes how to generate the production-ready installers for **macOS (.dmg)** and **Windows (.exe)** without using a terminal or having any technical knowledge.

## 🚀 One-Click Installer Generation

I have configured a **Professional Build Pipeline** that automatically creates your installers for you. To generate them, follow these exact steps:

1.  **Export to GitHub:**
    *   In the AI Studio toolbar, click **Settings** (gear icon).
    *   Select **Export to GitHub**.
    *   Connect your account and create a new repository (e.g., `Inv_Generator`).

2.  **Trigger the Build:**
    *   Once your repository is created, click the link to open it on GitHub.
    *   Click the **"Releases"** section on the right sidebar (or go to `Actions` tab).
    *   Create a **New Release**.
    *   For the "Tag version", type **`v1.0.0`**.
    *   Click **Publish Release**.

3.  **Download Your Apps:**
    *   GitHub will automatically start building your Mac and Windows versions.
    *   Wait about 3-5 minutes.
    *   The **`.dmg`** (Mac) and **`.exe`** (Windows) files will appear automatically as attachments to that release.
    *   **Click and download!**

## 📦 What's Included in the Installers?

*   **Self-Contained:** Users do NOT need to install Node.js, NPM, or any other tools.
*   **Professional Branding:** The app features a custom blue receipt icon, "LuxeBill" naming, and proper copyright metadata.
*   **Offline Support:** Once installed, the app runs locally on the desktop.
*   **Auto-Calculations:** All invoice logic is bundled inside.

## 🛠️ Build Pipeline Details

*   **Automation:** Powered by GitHub Actions (see `.github/workflows/distribute.yml`).
*   **Packaging:** Uses `electron-builder` with production-grade compression.
*   **Platform Support:** macOS (Intel/Apple Silicon) and Windows (x64).

---
*Created by the Softare Distribution Specialist for LuxeBill v1.0.5*
