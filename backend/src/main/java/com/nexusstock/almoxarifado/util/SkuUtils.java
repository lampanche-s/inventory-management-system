package com.nexusstock.almoxarifado.util;

public final class SkuUtils {

    private SkuUtils() {
    }

    public static String normalizar(String sku) {
        if (sku == null) {
            return null;
        }

        return sku.trim().toUpperCase();
    }
}