{ 
  description = "Development environment for Ionic and Mithril.js with Node.js 22";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixpkgs-unstable";
  };

  outputs = { self, nixpkgs, ... }: let
    systems = [ "x86_64-linux" "aarch64-linux" "x86_64-darwin" "aarch64-darwin" ];
  in
  {
    devShells = builtins.listToAttrs (map (system: {
      name = system;
      value = let
        pkgs = import nixpkgs { inherit system; };
      in pkgs.mkShell {
        buildInputs = [
          pkgs.nodejs-22_x  # Use the correct attribute for Node.js 22
        ];
      };
    }) systems);
  }
}
