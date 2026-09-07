package com.nexusstock.almoxarifado.util;

import java.nio.charset.StandardCharsets;

public final class PasswordPolicy {

    public static final int BCRYPT_MAX_BYTES = 72;

    private PasswordPolicy() {
    }

    public static int utf8Length(String password) {
        return password == null ? 0 : password.getBytes(StandardCharsets.UTF_8).length;
    }

    public static boolean exceedsBcryptLimit(String password) {
        return password != null && utf8Length(password) > BCRYPT_MAX_BYTES;
    }
}
