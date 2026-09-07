package com.nexusstock.almoxarifado.entity;

import com.nexusstock.almoxarifado.enums.UnidadeMedida;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.Version;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "itens")
public class Item extends BaseEntity {

    @Column(name = "nome", nullable = false, length = 150)
    private String nome;

    @Column(name = "sku", nullable = false, unique = true, length = 80)
    private String sku;
    @Column(name = "categoria", nullable = false, length = 80)
    private String categoria;

    @Enumerated(EnumType.STRING)
    @Column(name = "unidade", nullable = false, length = 50)
    private UnidadeMedida unidade;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "fornecedor_id", nullable = false)
    private Fornecedor fornecedor;

    @Column(name = "corredor", nullable = false, length = 50)
    private String corredor;

    @Column(name = "prateleira", nullable = false, length = 50)
    private String prateleira;
    @Column(name = "localizacao", length = 255)
    private String localizacao;

    @Column(name = "quantidade_atual", nullable = false, precision = 15, scale = 3)
    private BigDecimal quantidadeAtual = BigDecimal.ZERO;

    @Column(name = "estoque_minimo", nullable = false, precision = 15, scale = 3)
    private BigDecimal estoqueMinimo = BigDecimal.ZERO;

    @Column(name = "preco_medio", nullable = false, precision = 15, scale = 2)
    private BigDecimal precoMedio = BigDecimal.ZERO;

    @Column(name = "data_validade")
    private LocalDate dataValidade;

    @Column(name = "dias_aviso_validade")
    private Integer diasAvisoValidade = 30;

    @Column(name = "imagem_url", length = 500)
    private String imagemUrl;

    @Column(name = "ativo", nullable = false)
    private Boolean ativo = true;

    @Version
    @Column(name = "version", nullable = false)
    private Long version;
}