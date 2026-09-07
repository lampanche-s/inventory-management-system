package com.nexusstock.almoxarifado.repository;

import com.nexusstock.almoxarifado.entity.Perfil;
import com.nexusstock.almoxarifado.enums.RoleName;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface PerfilRepository extends JpaRepository<Perfil, Long> {

    Optional<Perfil> findByNome(RoleName nome);

    boolean existsByNome(RoleName nome);
}