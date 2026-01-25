"use client";

import { usePWA } from "./pwa-provider";
import { X, Download, Share, Plus } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

export function InstallBanner() {
  const {
    showInstallBanner,
    isIOS,
    isInstalled,
    isStandalone,
    triggerInstall,
    dismissInstallBanner,
  } = usePWA();

  const [showIOSInstructions, setShowIOSInstructions] = useState(false);

  // Don't show if already installed or in standalone mode
  if (isInstalled || isStandalone || !showInstallBanner) {
    return null;
  }

  // iOS instructions modal
  if (isIOS && showIOSInstructions) {
    return (
      <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
        <div 
          className="w-full max-w-md rounded-2xl bg-neutral-900 border border-neutral-800 shadow-xl animate-in slide-in-from-bottom duration-300"
          style={{ margin: '16px', padding: '24px' }}
        >
          <div className="flex items-center justify-between" style={{ marginBottom: '24px' }}>
            <h3 className="text-lg font-semibold text-white">
              Install Klyro
            </h3>
            <button
              className="h-8 w-8 p-0 flex items-center justify-center rounded-lg hover:bg-neutral-800 transition-colors"
              onClick={() => setShowIOSInstructions(false)}
            >
              <X className="h-4 w-4 text-neutral-400" />
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div className="flex items-center" style={{ gap: '16px' }}>
              <div 
                className="flex-shrink-0 rounded-full bg-blue-500/15 flex items-center justify-center text-sm font-medium text-blue-500"
                style={{ width: '36px', height: '36px' }}
              >
                1
              </div>
              <div className="flex-1">
                <p className="text-sm text-white" style={{ lineHeight: '1.6' }}>
                  Tap the{" "}
                  <Share className="inline h-4 w-4 text-blue-500 mx-1" /> Share
                  button in Safari&apos;s toolbar
                </p>
              </div>
            </div>

            <div className="flex items-center" style={{ gap: '16px' }}>
              <div 
                className="flex-shrink-0 rounded-full bg-blue-500/15 flex items-center justify-center text-sm font-medium text-blue-500"
                style={{ width: '36px', height: '36px' }}
              >
                2
              </div>
              <div className="flex-1">
                <p className="text-sm text-white" style={{ lineHeight: '1.6' }}>
                  Scroll down and tap{" "}
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-neutral-800 rounded text-xs font-medium">
                    <Plus className="h-3 w-3" /> Add to Home Screen
                  </span>
                </p>
              </div>
            </div>

            <div className="flex items-center" style={{ gap: '16px' }}>
              <div 
                className="flex-shrink-0 rounded-full bg-blue-500/15 flex items-center justify-center text-sm font-medium text-blue-500"
                style={{ width: '36px', height: '36px' }}
              >
                3
              </div>
              <div className="flex-1">
                <p className="text-sm text-white" style={{ lineHeight: '1.6' }}>
                  Tap <span className="font-medium">Add</span> to install the
                  app
                </p>
              </div>
            </div>
          </div>

          <div style={{ marginTop: '24px' }}>
            <button
              className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-400 hover:to-indigo-500 text-white font-medium rounded-xl transition-all duration-200 shadow-lg shadow-blue-500/20"
              style={{ padding: '14px 16px' }}
              onClick={() => {
                setShowIOSInstructions(false);
                dismissInstallBanner();
              }}
            >
              Got it
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-1/2 sm:right-auto sm:-translate-x-1/2 z-50 animate-in slide-in-from-bottom duration-300">
      <div className="installBanner flex items-center gap-3 rounded-2xl bg-neutral-900/95 border border-neutral-700/50 shadow-2xl shadow-black/50 px-4 py-3 sm:px-5 sm:py-4 backdrop-blur-md">
        {/* App Icon */}
        <div className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center overflow-hidden shadow-lg">
          <Image
            src="/icons/icon-96x96.svg"
            alt="Klyro"
            width={30}
            height={30}
          />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white">
            Install Klyro
          </p>
          <p className="text-xs text-neutral-400">
            {isIOS
              ? 'Tap Share → "Add to Home Screen"'
              : "Add to home screen for quick access"}
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 sm:gap-1.5 flex-shrink-0">
          {isIOS ? (
            <button
              className="installBtn h-8 px-3 sm:px-3.5 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-400 hover:to-indigo-500 text-white text-sm font-medium rounded-lg transition-all duration-200 flex items-center gap-1.5 shadow-md shadow-blue-500/20"
              onClick={() => setShowIOSInstructions(true)}
            >
              <Share className="h-3.5 w-3.5" />
              <span className="hidden xs:inline">Install</span>
            </button>
          ) : (
            <button
              className="installBtn h-8 px-3 sm:px-3.5 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-400 hover:to-indigo-500 text-white text-sm font-medium rounded-lg transition-all duration-200 flex items-center gap-1.5 shadow-md shadow-blue-500/20"
              onClick={triggerInstall}
            >
              <Download className="h-3.5 w-3.5" />
              Install
            </button>
          )}

          <button
            className="h-8 w-8 flex items-center justify-center rounded-lg text-neutral-500 hover:text-white hover:bg-neutral-800 transition-all duration-200"
            onClick={dismissInstallBanner}
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Dismiss</span>
          </button>
        </div>
      </div>
    </div>
  );
}
