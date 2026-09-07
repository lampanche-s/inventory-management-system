package com.nexusstock.almoxarifado.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "fornecedores")
public class Fornecedor extends BaseEntity {

    @Column(name = "nome", nullable = false, length = 150)
    private String nome;

    @Column(name = "cnpj", unique = true, length = 20)
    private String cnpj;

    @Column(name = "contato", length = 120)
    private String contato;

    @Column(name = "telefone", length = 30)
    private String telefone;

    @Column(name = "email", length = 150)
    private String email;

    @Column(name = "cidade", length = 100)
    private String cidade;
    @Column(name = "cep", length = 20)
    private String cep;

    @Column(name = "logradouro", length = 180)
    private String logradouro;

    @Column(name = "bairro", length = 120)
    private String bairro;

    @Column(name = "uf", length = 2)
    private String uf;

    @Column(name = "complemento", length = 180)
    private String complemento;

    @Column(name = "score", precision = 5, scale = 2)
    private BigDecimal score;

    @Column(name = "ativo", nullable = false)
    private Boolean ativo = true;
}