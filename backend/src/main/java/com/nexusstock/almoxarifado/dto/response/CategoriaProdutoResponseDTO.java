package com.nexusstock.almoxarifado.dto.response;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class CategoriaProdutoResponseDTO {

    private Long id;
    private String nome;
    private Long quantidadeItens;
    private Boolean ativo;
}