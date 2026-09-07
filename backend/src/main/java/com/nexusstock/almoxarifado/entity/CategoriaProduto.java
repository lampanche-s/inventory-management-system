package com.nexusstock.almoxarifado.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "categorias_produto")
public class CategoriaProduto extends BaseEntity {

    @Column(name = "nome", nullable = false, unique = true, length = 80)
    private String nome;

    @Column(name = "ativo", nullable = false)
    private Boolean ativo = true;
}