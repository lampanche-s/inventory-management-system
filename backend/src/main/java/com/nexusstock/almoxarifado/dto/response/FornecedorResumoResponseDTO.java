package com.nexusstock.almoxarifado.dto.response;

import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.util.List;

@Getter
@Builder
public class FornecedorResumoResponseDTO {

    private Long id;
    private String nome;
    private String cnpj;
    private String contato;
    private String telefone;
    private String email;
    private String cidade;
    private String cep;
    private BigDecimal score;
    private Long quantidadeItens;
    private BigDecimal valorTotalEstoque;
    private List<PrincipalItemFornecedorResponseDTO> principaisItens;
    private Boolean ativo;
}