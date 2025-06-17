{
  description = "A Nix flake for boazblake/lift-mate: Cross-platform AI pose estimation app (Ionic, Capacitor, MithrilJS)";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-24.05";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { self, nixpkgs, flake-utils }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = import nixpkgs { inherit system; };
        node = pkgs.nodejs_22;
        # Only include these on Darwin (macOS) for iOS/Capacitor native builds
        darwinFrameworks = pkgs.lib.optionals pkgs.stdenv.isDarwin (with pkgs.darwin.apple_sdk.frameworks; [
          CoreFoundation
          Foundation
          CoreGraphics
          AVFoundation
        ]);
        darwinExtra = pkgs.lib.optionals pkgs.stdenv.isDarwin [
          pkgs.cocoapods
          pkgs.libiconv
          pkgs.llvmPackages.libclang
        ];
      in
      {
        # Minimal derivation: use devShell for local dev!
        devShells.default = pkgs.mkShell {
          buildInputs = [
            node
            pkgs.typescript
            pkgs.mkcert
          ] ++ darwinFrameworks ++ darwinExtra;

          shellHook = ''
            export NODE_ENV=development
            echo "Welcome to the lift-mate dev shell! (Node, CocoaPods, iOS frameworks ready)"
          '';
        };
      }
    );
}
