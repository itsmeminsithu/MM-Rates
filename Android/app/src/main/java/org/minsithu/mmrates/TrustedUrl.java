package org.minsithu.mmrates;

import java.net.URI;
import java.util.Locale;

final class TrustedUrl {
    private TrustedUrl() {}

    static boolean isInternal(String configuredUrl, String candidate) {
        try {
            URI base = URI.create(configuredUrl);
            URI next = URI.create(candidate);
            String scheme = next.getScheme() == null ? "" : next.getScheme().toLowerCase(Locale.ROOT);
            if (!(scheme.equals("http") || scheme.equals("https"))) return false;
            return equalsIgnoreCase(base.getHost(), next.getHost()) && effectivePort(base) == effectivePort(next);
        } catch (RuntimeException ignored) {
            return false;
        }
    }

    private static int effectivePort(URI uri) {
        if (uri.getPort() != -1) return uri.getPort();
        return "https".equalsIgnoreCase(uri.getScheme()) ? 443 : 80;
    }

    private static boolean equalsIgnoreCase(String first, String second) {
        return first != null && second != null && first.equalsIgnoreCase(second);
    }
}
