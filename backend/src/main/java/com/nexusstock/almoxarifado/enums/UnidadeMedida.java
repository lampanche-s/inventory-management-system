package com.nexusstock.almoxarifado.enums;

public enum UnidadeMedida {
    UNIDADE("Unit"),
    CAIXA("Box"),
    PACOTE("Pack"),
    PAR("Pair"),
    LITRO("Litre"),
    QUILO("Kilogram");

    private final String label;

    UnidadeMedida(String label) {
        this.label = label;
    }

    public String getLabel() {
        return label;
    }
}
