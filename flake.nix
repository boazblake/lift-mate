{
  description = "LiftMate iOS Dev Shell (Ionic + Capacitor)";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-24.05";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { self, nixpkgs, flake-utils }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = import nixpkgs {
          inherit system;
          config.allowUnfree = true;
        };

        # macOS frameworks needed for iOS native build
        # darwinFrameworks = pkgs.lib.optionals pkgs.stdenv.isDarwin (
        #   with pkgs.darwin.apple_sdk.frameworks; [
        #     CoreFoundation
        #     CoreGraphics
        #     AVFoundation
        #     WebKit
        #     UserNotifications
        #   ]
        # );

        # Tools needed only on macOS
        darwinTools = pkgs.lib.optionals pkgs.stdenv.isDarwin [
          pkgs.ruby_3_1
          pkgs.bundler
          pkgs.cocoapods
          pkgs.libiconv
        ];

      in {
        devShells.default = pkgs.mkShellNoCC {
          buildInputs = [
            pkgs.nodejs_22
            pkgs.typescript
            pkgs.mkcert
          ] 
          # ++ darwinFrameworks
          ++ darwinTools;

          shellHook = ''
            export NODE_ENV=development
            export CC=/usr/bin/clang
            export CXX=/usr/bin/clang++
            export DEVELOPER_DIR="$(xcode-select -p)"
            export SDKROOT=$(xcrun --sdk iphoneos --show-sdk-path)
            export PATH=$(echo "$PATH" | tr ':' '\n' | grep -v '/nix/store/.*/clang' | tr '\n' ':')

            echo "Using Clang: $(clang --version | head -n 1)"

            export CAPACITOR_ANDROID_STUDIO_PATH="$ANDROID_HOME/studio/bin/studio"

            echo "NOTE: This shell expects Apple Clang."
            if ! clang --version 2>/dev/null | grep -q "Apple clang"; then
              echo "WARNING: Not using Apple clang. Run this with: nix develop --impure"
            fi

            if [ ! -d "node_modules" ]; then
              echo "Installing npm dependencies..."
              npm install
            fi

            if [ ! -f ".cert/cert.pem" ]; then
              echo "Generating local SSL certs..."
              node --runmake:certs
            fi

            echo "Dev shell ready. Common commands:"
            echo "  node --run startweb      # Run web dev build"
            echo "  node --run startios   # Build and run iOS"
          '';
        };
      }
    );
}
