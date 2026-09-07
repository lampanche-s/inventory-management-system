package com.nexusstock.almoxarifado.enums;

public enum MotivoMovimentacao {
    REPOSICAO_ESTOQUE("Stock replenishment"),
    USO_INTERNO("Internal use"),
    TRANSFERENCIA_SETOR("Department transfer"),
    AJUSTE_INVENTARIO("Inventory adjustment"),
    DEVOLUCAO("Return"),
    PERDA_AVARIA("Loss / damage"),
    CADASTRO_INICIAL("Initial stock");

    private final String label;

    MotivoMovimentacao(String label) {
        this.label = label;
    }

    public String getLabel() {
        return label;
    }
}
