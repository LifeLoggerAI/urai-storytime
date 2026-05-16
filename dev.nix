{ pkgs, ... }:

let
  playwrightLibs = with pkgs; [
    glib
    nss
    nspr
    atk
    at-spi2-atk
    at-spi2-core
    cups
    libdrm
    dbus
    expat
    xorg.libxcb
    xorg.libX11
    xorg.libXcomposite
    xorg.libXdamage
    xorg.libXext
    xorg.libXfixes
    xorg.libXrandr
    xorg.libXi
    xorg.libXtst
    xorg.libxshmfence
    libxkbcommon
    mesa
    pango
    cairo
    alsa-lib
    fontconfig
    freetype
    gtk3
    gdk-pixbuf
    stdenv.cc.cc.lib
  ];
in
{
  packages = with pkgs; [
    nodejs_20
    git
    glib
    nss
    nspr
    atk
    at-spi2-atk
    at-spi2-core
    cups
    libdrm
    dbus
    expat
    xorg.libxcb
    xorg.libX11
    xorg.libXcomposite
    xorg.libXdamage
    xorg.libXext
    xorg.libXfixes
    xorg.libXrandr
    xorg.libXi
    xorg.libXtst
    xorg.libxshmfence
    libxkbcommon
    mesa
    pango
    cairo
    alsa-lib
    fontconfig
    freetype
    gtk3
    gdk-pixbuf
  ];

  env = {
    PLAYWRIGHT_BROWSERS_PATH = "$HOME/.cache/ms-playwright";
    LD_LIBRARY_PATH = "${pkgs.lib.makeLibraryPath playwrightLibs}";
  };
}
