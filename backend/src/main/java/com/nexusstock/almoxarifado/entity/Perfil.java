package com.nexusstock.almoxarifado.entity;

import com.nexusstock.almoxarifado.enums.RoleName;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "perfis")
public class Perfil extends BaseEntity {

    @Enumerated(EnumType.STRING)
    @Column(name = "nome", nullable = false, unique = true, length = 50)
    private RoleName nome;

    @Column(name = "descricao", nullable = false, length = 150)
    private String descricao;

    @Column(name = "ativo", nullable = false)
    private Boolean ativo = true;

    public Perfil(RoleName nome, String descricao) {
        this.nome = nome;
        this.descricao = descricao;
        this.ativo = true;
    }
}