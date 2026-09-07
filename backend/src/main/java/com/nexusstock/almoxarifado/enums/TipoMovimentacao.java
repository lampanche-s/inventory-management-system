package com.nexusstock.almoxarifado.enums;

public enum TipoMovimentacao {
    ENTRADA("Inbound"),
    SAIDA("Outbound");

    private final String label;

    TipoMovimentacao(String label) {
        this.label = label;
    }

    public String getLabel() {
        return label;
    }
}
