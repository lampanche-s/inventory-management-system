package com.nexusstock.almoxarifado.enums;

public enum CategoriaItem {
    ESCRITORIO("Office supplies"),
    LIMPEZA("Cleaning"),
    EPI("Personal protective equipment"),
    INFORMATICA("IT equipment"),
    MANUTENCAO("Maintenance"),
    COPA("Kitchen supplies"),
    EMBALAGEM("Packaging");

    private final String label;

    CategoriaItem(String label) {
        this.label = label;
    }

    public String getLabel() {
        return label;
    }
}
