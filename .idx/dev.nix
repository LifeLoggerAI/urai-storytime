{ pkgs, ... }: {
  # Nix channel to use.
  channel = "stable-24.05";

  # Packages to make available in the environment.
  packages = [
    pkgs.nodejs_20
  ];

  # VS Code extensions to install.
  idx.extensions = [
    "dbaeumer.vscode-eslint"
  ];

  # Workspace lifecycle hooks.
  idx.workspace = {
    # Runs when a workspace is first created.
    onCreate = {
      npm-install = "npm install";
    };
  };

  # Web preview configuration.
  idx.previews = {
    enable = true;
    previews = {
      # The web preview for the Next.js app.
      web = {
        command = ["npm" "run" "dev" "--" "--port" "$PORT"];
        manager = "web";
      };
    };
  };
}
