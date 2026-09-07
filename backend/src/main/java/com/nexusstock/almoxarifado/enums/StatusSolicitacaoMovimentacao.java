package com.nexusstock.almoxarifado.enums;

public enum StatusSolicitacaoMovimentacao {
    PENDENTE("Pending"),
    APROVADA("Approved"),
    REJEITADA("Rejected"),
    CANCELADA("Cancelled");

    private final String label;

    StatusSolicitacaoMovimentacao(String label) {
        this.label = label;
    }

    public String getLabel() {
        return label;
    }
}
