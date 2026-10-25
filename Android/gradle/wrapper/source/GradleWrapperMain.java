package org.gradle.wrapper;

// Source for the small self-contained launcher in ../gradle-wrapper.jar.
// It downloads the official distribution declared in gradle-wrapper.properties,
// extracts it under ~/.gradle/wrapper/dists/mm-rates, and launches Gradle.
// Rebuild from the Android folder with:
// javac -d /tmp/mmrates-wrapper source/GradleWrapperMain.java
// jar --create --file ../gradle-wrapper.jar -C /tmp/mmrates-wrapper .

import java.io.*;
import java.net.*;
import java.nio.file.*;
import java.nio.file.attribute.PosixFilePermission;
import java.security.MessageDigest;
import java.util.*;
import java.util.zip.ZipEntry;
import java.util.zip.ZipInputStream;

public final class GradleWrapperMain {
    public static void main(String[] args) throws Exception {
        Path appHome = Paths.get(System.getProperty("user.dir")).toAbsolutePath();
        Path propsPath = appHome.resolve("gradle/wrapper/gradle-wrapper.properties");
        Properties props = new Properties();
        try (InputStream in = Files.newInputStream(propsPath)) { props.load(in); }
        String rawUrl = require(props.getProperty("distributionUrl"), "distributionUrl").replace("\\:", ":");
        String expectedSha256 = require(props.getProperty("distributionSha256Sum"), "distributionSha256Sum");
        URI uri = URI.create(rawUrl);
        String fileName = Paths.get(uri.getPath()).getFileName().toString();
        String key = sha256(rawUrl).substring(0, 16);
        Path cache = Paths.get(System.getProperty("user.home"), ".gradle", "wrapper", "dists", "mm-rates", key);
        Path zip = cache.resolve(fileName);
        Path marker = cache.resolve(".ready");
        Files.createDirectories(cache);
        if (!Files.exists(marker)) {
            if (!Files.exists(zip) || Files.size(zip) == 0) download(uri.toURL(), zip);
            verifySha256(zip, expectedSha256);
            unzip(zip, cache);
            Files.writeString(marker, "ok\n");
        }
        Path gradleHome;
        try (var stream = Files.list(cache)) {
            gradleHome = stream.filter(Files::isDirectory)
                .filter(path -> path.getFileName().toString().startsWith("gradle-"))
                .findFirst().orElseThrow(() -> new IOException("Gradle distribution directory not found in " + cache));
        }
        boolean windows = System.getProperty("os.name").toLowerCase(Locale.ROOT).contains("win");
        Path executable = gradleHome.resolve(windows ? "bin/gradle.bat" : "bin/gradle");
        if (!windows) makeExecutable(executable);
        List<String> command = new ArrayList<>();
        command.add(executable.toString());
        command.addAll(Arrays.asList(args));
        int code = new ProcessBuilder(command).directory(appHome.toFile()).inheritIO().start().waitFor();
        System.exit(code);
    }

    private static String require(String value, String key) {
        if (value == null || value.isBlank()) throw new IllegalArgumentException("Missing " + key);
        return value.trim();
    }

    private static void download(URL url, Path target) throws IOException {
        System.out.println("Downloading " + url);
        Path temp = target.resolveSibling(target.getFileName() + ".part");
        URLConnection connection = url.openConnection();
        connection.setConnectTimeout(20_000);
        connection.setReadTimeout(120_000);
        connection.setRequestProperty("User-Agent", "MM-Rates-Gradle-Wrapper/1.0");
        long total = connection.getContentLengthLong();
        try (InputStream in = connection.getInputStream(); OutputStream out = Files.newOutputStream(temp)) {
            byte[] buffer = new byte[64 * 1024];
            long read = 0;
            int n;
            int last = -1;
            while ((n = in.read(buffer)) >= 0) {
                out.write(buffer, 0, n);
                read += n;
                if (total > 0) {
                    int percent = (int) (read * 100 / total);
                    if (percent >= last + 10) { System.out.println("  " + percent + "%"); last = percent; }
                }
            }
        }
        Files.move(temp, target, StandardCopyOption.REPLACE_EXISTING, StandardCopyOption.ATOMIC_MOVE);
    }

    private static void unzip(Path zip, Path output) throws IOException {
        System.out.println("Extracting " + zip.getFileName());
        try (ZipInputStream in = new ZipInputStream(Files.newInputStream(zip))) {
            ZipEntry entry;
            while ((entry = in.getNextEntry()) != null) {
                Path destination = output.resolve(entry.getName()).normalize();
                if (!destination.startsWith(output)) throw new IOException("Unsafe ZIP entry: " + entry.getName());
                if (entry.isDirectory()) Files.createDirectories(destination);
                else {
                    Files.createDirectories(destination.getParent());
                    Files.copy(in, destination, StandardCopyOption.REPLACE_EXISTING);
                }
            }
        }
    }

    private static void makeExecutable(Path path) {
        try {
            Set<PosixFilePermission> permissions = Files.getPosixFilePermissions(path);
            permissions.add(PosixFilePermission.OWNER_EXECUTE);
            permissions.add(PosixFilePermission.GROUP_EXECUTE);
            permissions.add(PosixFilePermission.OTHERS_EXECUTE);
            Files.setPosixFilePermissions(path, permissions);
        } catch (Exception ignored) { path.toFile().setExecutable(true, false); }
    }

    private static void verifySha256(Path file, String expected) throws Exception {
        MessageDigest digest = MessageDigest.getInstance("SHA-256");
        try (InputStream in = Files.newInputStream(file)) {
            byte[] buffer = new byte[64 * 1024];
            int n;
            while ((n = in.read(buffer)) >= 0) digest.update(buffer, 0, n);
        }
        String actual = hex(digest.digest());
        if (!actual.equalsIgnoreCase(expected)) {
            Files.deleteIfExists(file);
            throw new SecurityException("Gradle distribution checksum mismatch. Expected " + expected + " but got " + actual);
        }
    }

    private static String sha256(String input) throws Exception {
        return hex(MessageDigest.getInstance("SHA-256").digest(input.getBytes(java.nio.charset.StandardCharsets.UTF_8)));
    }

    private static String hex(byte[] bytes) {
        StringBuilder result = new StringBuilder();
        for (byte value : bytes) result.append(String.format("%02x", value));
        return result.toString();
    }
}
