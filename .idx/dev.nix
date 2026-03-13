
{ pkgs, ... }:

{
  # The `channel` lets you set the Nixpkgs channel you want to use.
  channel = "stable-24.05"; # or "unstable"

  # The `packages` attribute lets you install packages into your workspace.
  packages = [
    pkgs.nodejs_20
    pkgs.firebase-tools
    # Added for backend unit and integration testing
    pkgs.nodePackages.mocha
    pkgs.nodePackages.chai
  ];

  # The `env` attribute lets you set environment variables in your workspace.
  env = {};

  # The `idx` attribute lets you configure your workspace.
  idx = {
    # The `extensions` attribute lets you install VS Code extensions.
    extensions = [
      "dbaeumer.vscode-eslint"
      "esbenp.prettier-vscode"
    ];

    # The `workspace` attribute lets you configure workspace lifecycle hooks.
    workspace = {
      # The `onCreate` hook runs when a workspace is first created.
      onCreate = {
        # The `npm-install` command installs the dependencies for the functions and the app.
        npm-install = "npm --prefix functions install && npm --prefix storytime-app install";
      };
      # The `onStart` hook runs every time the workspace is (re)started.
      onStart = {};
    };

    # The `previews` attribute lets you configure web previews.
    previews = {
      enable = true;
      previews = {
        # The `web` preview runs the Next.js development server.
        web = {
          command = ["npm" "run" "dev" "--prefix" "storytime-app" "--" "-p" "$PORT"];
          manager = "web";
        };
      };
    };
  };
}
