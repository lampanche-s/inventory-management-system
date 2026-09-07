package com.nexusstock.almoxarifado.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "usuarios")
public class Usuario extends BaseEntity {

    @Column(name = "nome", nullable = false, length = 150)
    private String nome;

    @Column(name = "usuario", nullable = false, unique = true, length = 80)
    private String usuario;

    @Column(name = "email", unique = true, length = 150)
    private String email;

    @Column(name = "senha_hash", nullable = false, length = 255)
    private String senhaHash;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "perfil_id", nullable = false)
    private Perfil perfil;

    @Column(name = "ativo", nullable = false)
    private Boolean ativo = true;
    @Column(name = "last_seen_at")
    private LocalDateTime lastSeenAt;

    @Column(name = "excluido", nullable = false)
    private Boolean excluido = false;

    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;
}