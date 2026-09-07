package com.nexusstock.almoxarifado.dto.request;

import com.nexusstock.almoxarifado.enums.MotivoMovimentacao;
import com.nexusstock.almoxarifado.enums.TipoMovimentacao;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class SolicitacaoMovimentacaoLoteRequestDTO {

    @NotEmpty(message = "Add at least one item.")
    @Size(max = 10, message = "A request may contain at most 10 items.")
    private List<@Valid SolicitacaoMovimentacaoLoteItemRequestDTO> itens;

    @NotNull(message = "The type is required.")
    private TipoMovimentacao tipo;

    @NotNull(message = "The reason is required.")
    private MotivoMovimentacao motivo;

    @Size(max = 500, message = "The note must not exceed 500 characters.")
    private String observacao;
}
