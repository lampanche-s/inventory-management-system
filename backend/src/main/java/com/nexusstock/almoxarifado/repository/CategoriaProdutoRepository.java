package com.nexusstock.almoxarifado.repository;

import com.nexusstock.almoxarifado.entity.CategoriaProduto;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CategoriaProdutoRepository extends JpaRepository<CategoriaProduto, Long> {

    List<CategoriaProduto> findByAtivoTrueOrderByNomeAsc();

    Optional<CategoriaProduto> findByNomeIgnoreCase(String nome);

    boolean existsByNomeIgnoreCase(String nome);
}