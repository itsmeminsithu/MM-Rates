plugins {
    id("com.android.application")
}

val debugWebUrl = providers.gradleProperty("MM_RATES_DEBUG_URL")
    .orElse("http://10.0.2.2:3000")
val releaseWebUrl = providers.gradleProperty("MM_RATES_RELEASE_URL")
    .orElse("https://mmrates.minsithu.org")

android {
    namespace = "org.minsithu.mmrates"
    compileSdk = 36

    defaultConfig {
        applicationId = "org.minsithu.mmrates"
        minSdk = 26
        targetSdk = 36
        versionCode = 141
        versionName = "1.4.1"

        testInstrumentationRunner = "android.app.Instrumentation"
    }

    buildFeatures {
        buildConfig = true
    }

    buildTypes {
        debug {
            buildConfigField("String", "WEB_APP_URL", "\"${debugWebUrl.get()}\"")
            applicationIdSuffix = ".debug"
            versionNameSuffix = "-debug"
        }
        release {
            buildConfigField("String", "WEB_APP_URL", "\"${releaseWebUrl.get()}\"")
            isMinifyEnabled = false
            proguardFiles(getDefaultProguardFile("proguard-android-optimize.txt"), "proguard-rules.pro")
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    packaging {
        resources.excludes += setOf("META-INF/DEPENDENCIES", "META-INF/LICENSE*", "META-INF/NOTICE*")
    }
}

dependencies {
    testImplementation("junit:junit:4.13.2")
}
