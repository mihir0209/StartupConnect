# To learn more about how to use Nix to configure your environment
# see: https://idx.dev/docs/customize-idx-env
{pkgs}: {
  # Add your Nix packages here
  # For example,
  # pkgs.myPackage
  # pkgs.myOtherPackage

  # Configure your environment variables
  env = {};

  # It's possible IDX expects the 'services' attribute set to exist,
  # even if empty, if it was part of the original project template.
  services = {};

  # Enter a command that starts your dev server
  start = "npm run dev";

  # Any script that should be run before the dev server starts
  # beforeStart = "echo Starting dev server...";
}
