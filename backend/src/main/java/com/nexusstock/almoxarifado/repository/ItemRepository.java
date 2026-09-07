package com.nexusstock.almoxarifado.repository;

import com.nexusstock.almoxarifado.entity.Item;
import jakarta.persistence.LockModeType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

public interface ItemRepository extends JpaRepository<Item, Long> {

    Optional<Item> findBySku(String sku);

    boolean existsBySku(String sku);

    long countByAtivoTrue();

    long countByFornecedorIdAndAtivoTrue(Long fornecedorId);

    @Query("""
            SELECT COALESCE(SUM(i.quantidadeAtual * i.precoMedio), 0)
            FROM Item i
            WHERE i.ativo = true
            """)
    BigDecimal calcularValorTotalEstoque();

    @Query("""
            SELECT COALESCE(SUM(i.quantidadeAtual * i.precoMedio), 0)
            FROM Item i
            WHERE i.ativo = true
              AND i.fornecedor.id = :fornecedorId
            """)
    BigDecimal calcularValorTotalEstoquePorFornecedor(@Param("fornecedorId") Long fornecedorId);

    @Query("""
            SELECT COUNT(i)
            FROM Item i
            WHERE i.ativo = true
              AND i.quantidadeAtual > 0
              AND i.quantidadeAtual < i.estoqueMinimo
            """)
    long contarItensAbaixoDoMinimo();

    @Query("""
            SELECT COUNT(i)
            FROM Item i
            WHERE i.ativo = true
              AND i.quantidadeAtual <= 0
            """)
    long contarItensZerados();

    @Query("""
            SELECT i
            FROM Item i
            JOIN FETCH i.fornecedor f
            WHERE i.ativo = true
              AND (i.quantidadeAtual <= 0 OR i.quantidadeAtual < i.estoqueMinimo)
            ORDER BY i.quantidadeAtual ASC, i.nome ASC
            """)
    List<Item> buscarEstoqueCritico();

    @Query("""
            SELECT i
            FROM Item i
            JOIN FETCH i.fornecedor f
            WHERE i.ativo = true
            ORDER BY (i.quantidadeAtual * i.precoMedio) DESC
            """)
    List<Item> buscarItensAtivosOrdenadosPorValor();

    @Query("""
            SELECT i
            FROM Item i
            JOIN FETCH i.fornecedor f
            WHERE i.ativo = true
              AND f.id = :fornecedorId
            ORDER BY (i.quantidadeAtual * i.precoMedio) DESC
            """)
    List<Item> buscarPrincipaisItensPorFornecedor(@Param("fornecedorId") Long fornecedorId);

    @Query("""
            SELECT i
            FROM Item i
            JOIN i.fornecedor f
            WHERE (:ativo IS NULL OR i.ativo = :ativo)
              AND (:categoria IS NULL OR i.categoria = :categoria)
              AND (
                    :search IS NULL
                    OR :search = ''
                    OR LOWER(i.nome) LIKE LOWER(CONCAT('%', :search, '%'))
                    OR LOWER(i.sku) LIKE LOWER(CONCAT('%', :search, '%'))
                    OR LOWER(f.nome) LIKE LOWER(CONCAT('%', :search, '%'))
              )
              AND (
                    :status IS NULL
                    OR (:status = 'ZERADO' AND i.quantidadeAtual <= 0)
                    OR (:status = 'ABAIXO_MINIMO' AND i.quantidadeAtual > 0 AND i.quantidadeAtual < i.estoqueMinimo)
                    OR (:status = 'SAUDAVEL' AND i.quantidadeAtual >= i.estoqueMinimo)
              )
            """)
    Page<Item> buscarComFiltros(
            @Param("search") String search,
            @Param("categoria") String categoria,
            @Param("status") String status,
            @Param("ativo") Boolean ativo,
            Pageable pageable
    );

    @Query("""
            SELECT i
            FROM Item i
            WHERE (:ativo IS NULL OR i.ativo = :ativo)
              AND (
                    :search IS NULL
                    OR :search = ''
                    OR LOWER(i.nome) LIKE LOWER(CONCAT('%', :search, '%'))
              )
            """)
    Page<Item> buscarPorNomeParaSolicitante(
            @Param("search") String search,
            @Param("ativo") Boolean ativo,
            Pageable pageable
    );

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT i FROM Item i WHERE i.id = :id")
    Optional<Item> buscarPorIdComLock(@Param("id") Long id);

    long countByFornecedorId(Long fornecedorId);
    long countByCategoriaAndAtivoTrue(String categoria);
    long countByCategoriaIgnoreCase(String categoria);

    List<Item> findByCategoriaAndAtivoTrueOrderByNomeAsc(String categoria);

    @org.springframework.data.jpa.repository.Modifying
    @org.springframework.data.jpa.repository.Query("UPDATE Item i SET i.categoria = :novaCategoria WHERE i.categoria = :categoriaAntiga")
    int atualizarCategoriaDosItens(
            @org.springframework.data.repository.query.Param("categoriaAntiga") String categoriaAntiga,
            @org.springframework.data.repository.query.Param("novaCategoria") String novaCategoria
    );

    List<Item> findByFornecedorId(Long fornecedorId);
}
