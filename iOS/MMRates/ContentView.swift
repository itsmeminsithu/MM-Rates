import SwiftUI

struct ContentView: View {
    @State private var isOffline = false
    @State private var reloadToken = UUID()

    var body: some View {
        ZStack {
            Color(red: 248 / 255, green: 246 / 255, blue: 239 / 255)
                .ignoresSafeArea()

            WebAppView(isOffline: $isOffline, reloadToken: reloadToken)
                .ignoresSafeArea(.container, edges: .bottom)

            if isOffline {
                OfflineCard {
                    isOffline = false
                    reloadToken = UUID()
                }
                .transition(.opacity.combined(with: .scale(scale: 0.96)))
            }
        }
        .animation(.easeOut(duration: 0.2), value: isOffline)
    }
}

private struct OfflineCard: View {
    let retry: () -> Void

    var body: some View {
        VStack(spacing: 14) {
            Image(systemName: "wifi.slash")
                .font(.system(size: 30, weight: .semibold))
                .foregroundStyle(Color(red: 11 / 255, green: 117 / 255, blue: 89 / 255))

            Text("MM Rates is offline")
                .font(.title3.weight(.bold))

            Text("Check the web server or your internet connection, then try again.")
                .multilineTextAlignment(.center)
                .font(.subheadline)
                .foregroundStyle(.secondary)

            Button("Retry", action: retry)
                .buttonStyle(.borderedProminent)
                .tint(Color(red: 11 / 255, green: 117 / 255, blue: 89 / 255))
                .controlSize(.large)
                .frame(maxWidth: .infinity)
        }
        .padding(24)
        .frame(maxWidth: 340)
        .background(.regularMaterial, in: RoundedRectangle(cornerRadius: 24, style: .continuous))
        .overlay {
            RoundedRectangle(cornerRadius: 24, style: .continuous)
                .stroke(Color.primary.opacity(0.08))
        }
        .shadow(color: .black.opacity(0.12), radius: 28, y: 12)
        .padding(24)
    }
}
