{ pkgs, ... }: {
  # The channel determines which package versions are available.
  channel = "stable-23.11"; # or "unstable"

  # A list of packages to install.
  packages = [
    pkgs.firebase-tools
    pkgs.nodejs_20
  ];

  # A set of environment variables to define.
  env = {
    FIREBASE_EMULATOR_HUB = "localhost:4400";
  };

  # Workspace lifecycle hooks.
  idx = {
    # VS Code extensions to install.
    extensions = [
      "dbaeumer.vscode-eslint"
      "googlecloudtools.cloudcode"
    ];

    # Workspace lifecycle hooks.
    workspace = {
      # Runs when a workspace is first created.
      onCreate = {
        "npm-install" = "npm --prefix functions install";
      };
      # Runs every time the workspace is (re)started.
      onStart = {
        "start-emulator" = "firebase emulators:start";
      };
    };

    # Configure a web preview for your application.
    previews = {
      # Preview for the Firebase emulator UI
      "emulator-ui" = {
        command = [ "echo" "Firebase emulator running on http://localhost:4000" ];
        manager = "web";
        port = 4000;
      };
      # Preview for the functions endpoint
      functions = {
        command = [ "echo" "Functions emulator running on http://localhost:5001" ];
        manager = "web";
        port = 5001;
      };
      # Preview for the hosting endpoint
      hosting = {
        command = [ "echo" "Hosting emulator running on http://localhost:5000" ];
        manager = "web";
        port = 5000;
      };
    };
  };
}