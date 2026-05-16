{ pkgs, ... }:

{
  packages = with pkgs; [
    nodejs_20
    git
    glib
    nss
    nspr
    atk
    at-spi2-atk
    cups
    libdrm
    dbus
    xorg.libxcb
    xorg.libX11
    xorg.libXcomposite
    xorg.libXdamage
    xorg.libXext
    xorg.libXfixes
    xorg.libXrandr
    libxkbcommon
    mesa
    pango
    cairo
    alsa-lib
  ];

  env = {
    PLAYWRIGHT_BROWSERS_PATH = "$HOME/.cache/ms-playwright";
  };
}
