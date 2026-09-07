package com.nexusstock.almoxarifado.dto.response;

import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Builder
public class FornecedorResponseDTO {

    private Long id;
    private String nome;
    private String cnpj;
    private String contato;
    private String telefone;
    private String email;
    private String cidade;
    private String cep;
    private String logradouro;
    private String bairro;
    private String uf;
    private String complemento;
    private BigDecimal score;
    private Boolean ativo;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}