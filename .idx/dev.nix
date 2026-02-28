{ pkgs, ... }: {
  # Use the stable channel for reproducibility.
  channel = "stable-24.05";

  # Install Node.js 20 and Firebase Tools.
  packages = [
    pkgs.nodejs_20
    pkgs.firebase-tools
  ];

  # Recommended VS Code extensions for a Next.js and Firebase project.
  idx = {
    extensions = [
      "dbaeumer.vscode-eslint",
      "esbenp.prettier-vscode",
      "firebase.firebase-vscode"
    ];

    # Workspace lifecycle hooks.
    workspace = {
      # Install npm dependencies when the workspace is first created.
      onCreate = {
        # Install dependencies for the Next.js app
        root-npm-install = "npm install";
        # Install dependencies for Firebase Functions
        functions-npm-install = "npm --prefix functions install";
      };

      # Runs every time the workspace is (re)started.
      onStart = {
        # Start the Firebase emulators in the background.
        # The '&' is important to prevent blocking.
        emulators = "firebase emulators:start &";
      };
    };

    # Configure web previews for your application and emulators.
    previews = {
      enable = true;
      previews = {
        # Preview for the Next.js web application
        web = {
          command = ["npm" "run" "dev" "--" "-p" "$PORT"];
          manager = "web";
        };
        # Preview for the Firebase Emulator UI
        emulator-ui = {
          command = ["echo" "Emulator UI at http://localhost:4000"];
          manager = "web";
          port = 4000;
        };
      };
    };
  };
}
