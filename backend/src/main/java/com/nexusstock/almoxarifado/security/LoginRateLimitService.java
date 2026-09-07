package com.nexusstock.almoxarifado.security;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.LinkedHashMap;
import java.util.Locale;
import java.util.Map;

@Service
public class LoginRateLimitService {

    private final long windowMs;
    private final int maxAttemptsPerUser;
    private final int maxAttemptsPerIp;
    private final Map<String, AttemptWindow> attemptsByUser;
    private final Map<String, AttemptWindow> attemptsByIp;

    public LoginRateLimitService(
            @Value("${app.security.login-rate-limit.window-ms:900000}") long windowMs,
            @Value("${app.security.login-rate-limit.max-attempts-per-user:10}") int maxAttemptsPerUser,
            @Value("${app.security.login-rate-limit.max-attempts-per-ip:30}") int maxAttemptsPerIp,
            @Value("${app.security.login-rate-limit.max-tracked-keys:10000}") int maxTrackedKeys
    ) {
        this.windowMs = Math.max(windowMs, 1000L);
        this.maxAttemptsPerUser = Math.max(maxAttemptsPerUser, 1);
        this.maxAttemptsPerIp = Math.max(maxAttemptsPerIp, 1);
        this.attemptsByUser = boundedMap(Math.max(maxTrackedKeys, 100));
        this.attemptsByIp = boundedMap(Math.max(maxTrackedKeys, 100));
    }

    public synchronized boolean isBlocked(String ipAddress, String username) {
        long now = System.currentTimeMillis();

        return isBlocked(attemptsByIp, normalizeIp(ipAddress), maxAttemptsPerIp, now)
                || isBlocked(attemptsByUser, normalizeUsername(username), maxAttemptsPerUser, now);
    }

    public synchronized void registerFailure(String ipAddress, String username) {
        long now = System.currentTimeMillis();

        registerFailure(attemptsByIp, normalizeIp(ipAddress), now);
        registerFailure(attemptsByUser, normalizeUsername(username), now);
    }

    public synchronized void registerSuccess(String username) {
        attemptsByUser.remove(normalizeUsername(username));
    }

    private boolean isBlocked(
            Map<String, AttemptWindow> attempts,
            String key,
            int maximumAttempts,
            long now
    ) {
        AttemptWindow attemptWindow = attempts.get(key);

        if (attemptWindow == null) {
            return false;
        }

        if (now - attemptWindow.startedAt() >= windowMs) {
            attempts.remove(key);
            return false;
        }

        return attemptWindow.failures() >= maximumAttempts;
    }

    private void registerFailure(Map<String, AttemptWindow> attempts, String key, long now) {
        AttemptWindow current = attempts.get(key);

        if (current == null || now - current.startedAt() >= windowMs) {
            attempts.put(key, new AttemptWindow(now, 1));
            return;
        }

        attempts.put(key, new AttemptWindow(current.startedAt(), current.failures() + 1));
    }

    private String normalizeUsername(String username) {
        if (username == null || username.isBlank()) {
            return "<empty>";
        }

        return username.trim().toLowerCase(Locale.ROOT);
    }

    private String normalizeIp(String ipAddress) {
        if (ipAddress == null || ipAddress.isBlank()) {
            return "<unknown>";
        }

        return ipAddress.trim();
    }

    private static <K, V> Map<K, V> boundedMap(int maximumSize) {
        return new LinkedHashMap<>(maximumSize + 1, 0.75f, true) {
            @Override
            protected boolean removeEldestEntry(Map.Entry<K, V> eldest) {
                return size() > maximumSize;
            }
        };
    }

    private record AttemptWindow(long startedAt, int failures) {
    }
}
