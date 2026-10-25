import SwiftUI
import UIKit
import WebKit

struct WebAppView: UIViewRepresentable {
    @Binding var isOffline: Bool
    let reloadToken: UUID

    func makeCoordinator() -> Coordinator {
        Coordinator(parent: self)
    }

    func makeUIView(context: Context) -> WKWebView {
        let userContent = WKUserContentController()
        userContent.add(context.coordinator, name: "nativeShare")
        userContent.addUserScript(WKUserScript(
            source: Self.nativeBridgeScript,
            injectionTime: .atDocumentStart,
            forMainFrameOnly: true
        ))

        let configuration = WKWebViewConfiguration()
        configuration.userContentController = userContent
        configuration.websiteDataStore = .default()
        configuration.defaultWebpagePreferences.allowsContentJavaScript = true
        configuration.applicationNameForUserAgent = "MMRatesiOS/\(AppConfig.appVersion)"

        let webView = WKWebView(frame: .zero, configuration: configuration)
        webView.navigationDelegate = context.coordinator
        webView.uiDelegate = context.coordinator
        webView.allowsBackForwardNavigationGestures = true
        webView.scrollView.contentInsetAdjustmentBehavior = .never
        webView.scrollView.keyboardDismissMode = .interactive
        webView.isOpaque = false
        webView.backgroundColor = UIColor(red: 248 / 255, green: 246 / 255, blue: 239 / 255, alpha: 1)

        let refresh = UIRefreshControl()
        refresh.tintColor = UIColor(red: 11 / 255, green: 117 / 255, blue: 89 / 255, alpha: 1)
        refresh.addTarget(context.coordinator, action: #selector(Coordinator.refresh(_:)), for: .valueChanged)
        webView.scrollView.refreshControl = refresh

        context.coordinator.webView = webView
        context.coordinator.lastReloadToken = reloadToken
        webView.load(URLRequest(url: AppConfig.webAppURL, cachePolicy: .reloadRevalidatingCacheData, timeoutInterval: 30))
        return webView
    }

    func updateUIView(_ webView: WKWebView, context: Context) {
        context.coordinator.parent = self
        if context.coordinator.lastReloadToken != reloadToken {
            context.coordinator.lastReloadToken = reloadToken
            webView.load(URLRequest(url: AppConfig.webAppURL, cachePolicy: .reloadIgnoringLocalCacheData, timeoutInterval: 30))
        }
    }

    static func dismantleUIView(_ webView: WKWebView, coordinator: Coordinator) {
        webView.stopLoading()
        webView.navigationDelegate = nil
        webView.uiDelegate = nil
        webView.configuration.userContentController.removeScriptMessageHandler(forName: "nativeShare")
    }

    private static let nativeBridgeScript = """
    window.__MM_RATES_NATIVE__ = { platform: 'ios', version: '\(AppConfig.appVersion)' };
    window.MMRatesNative = {
      platform: 'ios',
      version: '\(AppConfig.appVersion)',
      share: function(title, text, url) {
        window.webkit.messageHandlers.nativeShare.postMessage({title: title || 'MM Rates', text: text || '', url: url || location.href});
      }
    };
    window.dispatchEvent(new CustomEvent('mmratesnative', { detail: window.__MM_RATES_NATIVE__ }));
    """

    final class Coordinator: NSObject, WKNavigationDelegate, WKUIDelegate, WKScriptMessageHandler {
        var parent: WebAppView
        weak var webView: WKWebView?
        var lastReloadToken: UUID?

        init(parent: WebAppView) {
            self.parent = parent
        }

        @objc func refresh(_ sender: UIRefreshControl) {
            webView?.reload()
        }

        func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
            webView.scrollView.refreshControl?.endRefreshing()
            parent.isOffline = false
        }

        func webView(_ webView: WKWebView, didFail navigation: WKNavigation!, withError error: Error) {
            handleFailure(webView)
        }

        func webView(_ webView: WKWebView, didFailProvisionalNavigation navigation: WKNavigation!, withError error: Error) {
            handleFailure(webView)
        }

        private func handleFailure(_ webView: WKWebView) {
            webView.scrollView.refreshControl?.endRefreshing()
            parent.isOffline = true
        }

        func webView(
            _ webView: WKWebView,
            decidePolicyFor navigationAction: WKNavigationAction,
            decisionHandler: @escaping (WKNavigationActionPolicy) -> Void
        ) {
            guard let url = navigationAction.request.url else {
                decisionHandler(.cancel)
                return
            }

            if AppConfig.isInternal(url) || url.scheme == "about" {
                decisionHandler(.allow)
                return
            }

            let scheme = url.scheme?.lowercased() ?? ""
            if ["http", "https", "mailto", "tel", "sms"].contains(scheme) {
                UIApplication.shared.open(url)
            }
            decisionHandler(.cancel)
        }

        func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
            guard message.name == "nativeShare" else { return }
            let body = message.body as? [String: Any]
            let text = body?["text"] as? String ?? "Myanmar exchange rates, gold and crypto"
            let urlString = body?["url"] as? String ?? AppConfig.webAppURL.absoluteString
            var items: [Any] = [text]
            if let url = URL(string: urlString) { items.append(url) }

            let controller = UIActivityViewController(activityItems: items, applicationActivities: nil)
            if let popover = controller.popoverPresentationController,
               let view = webView {
                popover.sourceView = view
                popover.sourceRect = CGRect(x: view.bounds.midX, y: view.bounds.midY, width: 1, height: 1)
            }
            topViewController()?.present(controller, animated: true)
        }

        private func topViewController(base: UIViewController? = nil) -> UIViewController? {
            let root = base ?? UIApplication.shared.connectedScenes
                .compactMap { $0 as? UIWindowScene }
                .flatMap(\.windows)
                .first(where: \.isKeyWindow)?.rootViewController
            if let navigation = root as? UINavigationController { return topViewController(base: navigation.visibleViewController) }
            if let tab = root as? UITabBarController { return topViewController(base: tab.selectedViewController) }
            if let presented = root?.presentedViewController { return topViewController(base: presented) }
            return root
        }
    }
}
