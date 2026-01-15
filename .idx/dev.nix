# Project IDX Configuration
# This file configures the development environment for Firebase Studio (Project IDX)
# Learn more: https://developers.google.com/idx/guides/customize-idx-env

{ pkgs, ... }: {
  # Which nixpkgs channel to use
  channel = "stable-24.05";

  # Packages to install in the environment
  packages = [
    pkgs.nodejs_22
    pkgs.nodePackages.npm
    # Build tools for native modules
    pkgs.gcc
    pkgs.gnumake
    pkgs.python3
  ];

  # IDE extensions to install
  idx = {
    # Extensions to install in IDX
    extensions = [
      "dbaeumer.vscode-eslint"
      "esbenp.prettier-vscode"
      "bradlc.vscode-tailwindcss"
      "formulahendry.auto-rename-tag"
      "PKief.material-icon-theme"
    ];

    # Web previews configuration
    previews = {
      enable = true;
      previews = {
        web = {
          # Full clean install and rebuild native modules for Linux
          command = [
            "bash" "-c" 
            "rm -rf node_modules .next package-lock.json && npm install && npm run dev -- --port $PORT --hostname 0.0.0.0"
          ];
          manager = "web";
        };
      };
    };

    # Workspace lifecycle hooks
    workspace = {
      # Runs when the workspace is first created
      onCreate = {
        # Full clean install for Linux environment
        install-deps = "rm -rf node_modules .next package-lock.json && npm install";
      };

      # Runs every time the workspace is started (background tasks)
      onStart = {
        # Empty - dev server is handled by preview
      };
    };
  };
}
