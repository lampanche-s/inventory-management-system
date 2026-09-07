package com.nexusstock.almoxarifado.repository;

import com.nexusstock.almoxarifado.entity.Fornecedor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface FornecedorRepository extends JpaRepository<Fornecedor, Long> {

    List<Fornecedor> findByAtivoTrueOrderByNomeAsc();

    Optional<Fornecedor> findByNomeIgnoreCase(String nome);

    @Query("""
            SELECT COUNT(f)
            FROM Fornecedor f
            WHERE REPLACE(REPLACE(REPLACE(REPLACE(COALESCE(f.cnpj, ''), '.', ''), '/', ''), '-', ''), ' ', '') = :documento
            """)
    long countByDocumentoNormalizado(@Param("documento") String documento);

    @Query("""
            SELECT COUNT(f)
            FROM Fornecedor f
            WHERE f.id <> :id
              AND REPLACE(REPLACE(REPLACE(REPLACE(COALESCE(f.cnpj, ''), '.', ''), '/', ''), '-', ''), ' ', '') = :documento
            """)
    long countByDocumentoNormalizadoAndIdNot(
            @Param("documento") String documento,
            @Param("id") Long id
    );

    @Query("""
            SELECT f
            FROM Fornecedor f
            WHERE (:ativo IS NULL OR f.ativo = :ativo)
              AND (
                    :search IS NULL
                    OR :search = ''
                    OR LOWER(f.nome) LIKE LOWER(CONCAT('%', :search, '%'))
                    OR LOWER(COALESCE(f.cnpj, '')) LIKE LOWER(CONCAT('%', :search, '%'))
                    OR (
                        :documentSearch <> ''
                        AND REPLACE(REPLACE(REPLACE(REPLACE(COALESCE(f.cnpj, ''), '.', ''), '/', ''), '-', ''), ' ', '')
                            LIKE CONCAT('%', :documentSearch, '%')
                    )
                    OR LOWER(COALESCE(f.contato, '')) LIKE LOWER(CONCAT('%', :search, '%'))
                    OR LOWER(COALESCE(f.telefone, '')) LIKE LOWER(CONCAT('%', :search, '%'))
                    OR LOWER(COALESCE(f.email, '')) LIKE LOWER(CONCAT('%', :search, '%'))
                    OR LOWER(COALESCE(f.cidade, '')) LIKE LOWER(CONCAT('%', :search, '%'))
                    OR LOWER(COALESCE(f.cep, '')) LIKE LOWER(CONCAT('%', :search, '%'))
                    OR LOWER(COALESCE(f.uf, '')) LIKE LOWER(CONCAT('%', :search, '%'))
                  )
            """)
    Page<Fornecedor> buscarComFiltros(
            @Param("search") String search,
            @Param("documentSearch") String documentSearch,
            @Param("ativo") Boolean ativo,
            Pageable pageable
    );
}
