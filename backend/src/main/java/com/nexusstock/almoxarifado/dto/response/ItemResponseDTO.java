package com.nexusstock.almoxarifado.dto.response;

import com.nexusstock.almoxarifado.enums.StatusEstoque;
import com.nexusstock.almoxarifado.enums.UnidadeMedida;
import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@Builder
public class ItemResponseDTO {

    private Long id;
    private String nome;
    private String sku;

    private String categoria;
    private String categoriaLabel;

    private UnidadeMedida unidade;
    private String unidadeLabel;

    private Long fornecedorId;
    private String fornecedorNome;

    private String corredor;
    private String prateleira;
    private String localizacao;
    private String localizacaoFormatada;

    private BigDecimal quantidadeAtual;
    private BigDecimal estoqueMinimo;
    private BigDecimal precoMedio;
    private BigDecimal valorEmEstoque;

    private LocalDate dataValidade;
    private Integer diasAvisoValidade;
    private Boolean possuiValidade;
    private Boolean validadeEmAlerta;
    private Boolean validadeVencida;
    private Long diasParaVencer;

    private StatusEstoque statusEstoque;
    private String statusEstoqueLabel;
    private Boolean abaixoDoMinimo;

    private String imagemUrl;
    private Boolean ativo;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}