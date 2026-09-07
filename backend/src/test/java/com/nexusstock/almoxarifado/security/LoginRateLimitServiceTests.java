package com.nexusstock.almoxarifado.security;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class LoginRateLimitServiceTests {

    @Test
    void blocksUsernameAfterConfiguredNumberOfFailures() {
        LoginRateLimitService service = new LoginRateLimitService(60_000, 2, 20, 100);

        assertThat(service.isBlocked("192.0.2.10", "ADMIN")).isFalse();

        service.registerFailure("192.0.2.10", "ADMIN");
        service.registerFailure("192.0.2.10", "admin");

        assertThat(service.isBlocked("192.0.2.11", " admin ")).isTrue();
    }

    @Test
    void blocksIpEvenWhenDifferentUsernamesAreUsed() {
        LoginRateLimitService service = new LoginRateLimitService(60_000, 20, 3, 100);

        service.registerFailure("192.0.2.20", "user-a");
        service.registerFailure("192.0.2.20", "user-b");
        service.registerFailure("192.0.2.20", "user-c");

        assertThat(service.isBlocked("192.0.2.20", "user-d")).isTrue();
        assertThat(service.isBlocked("192.0.2.21", "user-d")).isFalse();
    }

    @Test
    void successfulLoginClearsOnlyUsernameFailures() {
        LoginRateLimitService service = new LoginRateLimitService(60_000, 2, 20, 100);

        service.registerFailure("192.0.2.30", "admin");
        service.registerFailure("192.0.2.30", "admin");
        assertThat(service.isBlocked("192.0.2.31", "admin")).isTrue();

        service.registerSuccess("ADMIN");

        assertThat(service.isBlocked("192.0.2.31", "admin")).isFalse();
    }
}
