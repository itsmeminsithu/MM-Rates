import Foundation

struct AppConfig {
    static let webAppURL: URL = {
        guard
            let value = Bundle.main.object(forInfoDictionaryKey: "MMRatesWebURL") as? String,
            let url = URL(string: value),
            let scheme = url.scheme?.lowercased(),
            ["http", "https"].contains(scheme)
        else {
            preconditionFailure("MMRatesWebURL is missing or invalid in Info.plist")
        }
        return url
    }()

    static let appVersion: String = {
        Bundle.main.object(forInfoDictionaryKey: "CFBundleShortVersionString") as? String ?? "1.4.1"
    }()

    static func isInternal(_ url: URL) -> Bool {
        guard let baseComponents = URLComponents(url: webAppURL, resolvingAgainstBaseURL: false),
              let nextComponents = URLComponents(url: url, resolvingAgainstBaseURL: false)
        else { return false }

        let basePort = baseComponents.port ?? (baseComponents.scheme == "https" ? 443 : 80)
        let nextPort = nextComponents.port ?? (nextComponents.scheme == "https" ? 443 : 80)
        return baseComponents.scheme?.lowercased() == nextComponents.scheme?.lowercased()
            && baseComponents.host?.lowercased() == nextComponents.host?.lowercased()
            && basePort == nextPort
    }
}
