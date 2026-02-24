{ pkgs, ... }: {
  # To learn more about how to use Nix to configure your environment
  # see: https://developers.google.com/idx/guides/customize-idx-env

  # Which nixpkgs channel to use.
  channel = "stable-24.05"; # or "unstable"

  # Use https://search.nixos.org/packages to find packages
  packages = [
    # Add nodejs so we can run npm.
    pkgs.nodejs_20
    # Add firebase-tools for the firebase CLI.
    pkgs.nodePackages.firebase-tools
  ];

  # Set up workspace lifecycle hooks.
  idx.workspace = {
    # Run commands when the workspace is first created.
    onCreate = {
      # Install npm dependencies in the functions directory.
      npm-install = "cd functions && npm install";
    };
    # Run commands every time the workspace is (re)started.
    onStart = {
      # Start the Firebase Functions emulator.
      start-emulator = "cd functions && npm run serve";
    };
  };

  # Configure a web preview for your application.
  idx.previews = {
    enable = true;
    previews = {
      # Preview for the Firebase emulator UI
      emulator-ui = {
        command = ["echo", "Firebase emulator running on http://localhost:4000"];
        manager = "web";
        port = 4000;
      };
      # Preview for the functions endpoint
      functions = {
        command = ["echo", "Functions emulator running on http://localhost:5001"];
        manager = "web";
        port = 5001;
      };
    };
  };
}
