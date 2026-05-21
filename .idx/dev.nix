{pkgs}:

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
  channel = "stable-24.05";
  packages = with pkgs; [
    nodejs_20
    chromium
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
    PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH = "${pkgs.chromium}/bin/chromium";
    LD_LIBRARY_PATH = "${pkgs.lib.makeLibraryPath playwrightLibs}";
  };
  idx.extensions = [
    
  ];
  idx.previews = {
    previews = {
      web = {
        command = [
          "npm"
          "run"
          "dev"
          "--"
          "--port"
          "$PORT"
          "--hostname"
          "0.0.0.0"
        ];
        manager = "web";
      };
    };
  };
}