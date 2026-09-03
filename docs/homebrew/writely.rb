cask "writely" do
  version "1.1.0"
  sha256 "REPLACE_WITH_SHA256_OF_DMG"

  url "https://github.com/BalaBenna/Writely/releases/download/v#{version}/Writely_#{version}_universal.dmg",
      verified: "github.com/BalaBenna/Writely/"
  name "Writely"
  desc "Open-Source Local-AI Grammarly Alternative (<50ms, 100% Offline)"
  homepage "https://github.com/BalaBenna/Writely"

  app "Writely.app"

  zap trash: [
    "~/Library/Application Support/Writely",
    "~/.writely",
    "~/Library/Preferences/ai.writely.desktop.plist",
  ]
end
