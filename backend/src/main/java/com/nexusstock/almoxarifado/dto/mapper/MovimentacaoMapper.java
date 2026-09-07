package com.nexusstock.almoxarifado.dto.mapper;

import com.nexusstock.almoxarifado.dto.response.MovimentacaoResponseDTO;
import com.nexusstock.almoxarifado.entity.MovimentacaoEstoque;

public final class MovimentacaoMapper {

    private MovimentacaoMapper() {
    }

    public static MovimentacaoResponseDTO toResponse(MovimentacaoEstoque movimentacao) {
        return MovimentacaoResponseDTO.builder()
                .id(movimentacao.getId())
                .itemId(movimentacao.getItem().getId())
                .itemNome(movimentacao.getItem().getNome())
                .itemSku(movimentacao.getItem().getSku())
                .tipo(movimentacao.getTipo())
                .tipoLabel(movimentacao.getTipo().getLabel())
                .quantidade(movimentacao.getQuantidade())
                .motivo(movimentacao.getMotivo())
                .motivoLabel(movimentacao.getMotivo().getLabel())
                .observacao(movimentacao.getObservacao())
                .usuarioId(movimentacao.getUsuario().getId())
                .usuarioNome(movimentacao.getUsuario().getNome())
                .dataHora(movimentacao.getDataHora())
                .saldoAnterior(movimentacao.getSaldoAnterior())
                .saldoPosterior(movimentacao.getSaldoPosterior())
                .build();
    }
}