package org.minsithu.mmrates;

import org.junit.Test;
import static org.junit.Assert.*;

public class TrustedUrlTest {
    @Test public void allowsConfiguredOrigin() {
        assertTrue(TrustedUrl.isInternal("https://mmrates.minsithu.org", "https://mmrates.minsithu.org/privacy.html"));
    }

    @Test public void rejectsLookalikeHost() {
        assertFalse(TrustedUrl.isInternal("https://mmrates.minsithu.org", "https://mmrates.minsithu.org.evil.example"));
    }

    @Test public void respectsPort() {
        assertFalse(TrustedUrl.isInternal("http://10.0.2.2:3000", "http://10.0.2.2:4000"));
    }
}
