{pkgs}: {
  channel = "stable-23.11";
  packages = [
    pkgs.nodejs_20
    pkgs.nodePackages.pnpm
    pkgs.git
  ];
  # Configure your environment with Nix.
  # We recommend starting with the Nix classics first,
  # then move onto other Nix ecosystem tools.
  env = {};
  # This is a list of scripts that will be run when the workspace starts.
  # The key of the attribute indicates the name of the script.
  # Note: These scripts are not automatically restarted if they exit.
  # For that, we recommend using a process manager like PM2.
  # services.firebase.emulators = {
  #   detect = true;
  # };
}
