package com.nexusstock.almoxarifado.util;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class PasswordPolicyTests {

    @Test
    void medeOLimiteDoBcryptEmBytesUtf8() {
        String setentaEDoisBytesAscii = "a".repeat(72);
        String setentaETresBytesAscii = "a".repeat(73);
        String setentaEDoisBytesComUnicode = "a".repeat(68) + "😀";
        String setentaETresBytesComUnicode = "a".repeat(69) + "😀";

        assertThat(PasswordPolicy.utf8Length(setentaEDoisBytesAscii)).isEqualTo(72);
        assertThat(PasswordPolicy.exceedsBcryptLimit(setentaEDoisBytesAscii)).isFalse();
        assertThat(PasswordPolicy.exceedsBcryptLimit(setentaETresBytesAscii)).isTrue();

        assertThat(PasswordPolicy.utf8Length(setentaEDoisBytesComUnicode)).isEqualTo(72);
        assertThat(PasswordPolicy.exceedsBcryptLimit(setentaEDoisBytesComUnicode)).isFalse();
        assertThat(PasswordPolicy.utf8Length(setentaETresBytesComUnicode)).isEqualTo(73);
        assertThat(PasswordPolicy.exceedsBcryptLimit(setentaETresBytesComUnicode)).isTrue();
    }
}
