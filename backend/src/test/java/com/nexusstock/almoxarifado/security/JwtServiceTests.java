package com.nexusstock.almoxarifado.security;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThatThrownBy;

class JwtServiceTests {

    @Test
    void rejectsJwtSecretShorterThanThirtyTwoBytes() {
        assertThatThrownBy(() -> new JwtService("short-secret", 28_800_000L))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("32 bytes");
    }

    @Test
    void rejectsNonPositiveExpiration() {
        assertThatThrownBy(() -> new JwtService(
                "test-only-jwt-secret-with-at-least-thirty-two-bytes",
                0L
        ))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("greater than zero");
    }
}
