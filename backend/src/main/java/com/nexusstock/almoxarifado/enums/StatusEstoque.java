package com.nexusstock.almoxarifado.enums;

public enum StatusEstoque {
    ZERADO("Out of stock"),
    ABAIXO_MINIMO("Below minimum"),
    SAUDAVEL("Healthy");

    private final String label;

    StatusEstoque(String label) {
        this.label = label;
    }

    public String getLabel() {
        return label;
    }
}
