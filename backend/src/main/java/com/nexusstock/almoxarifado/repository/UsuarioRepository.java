package com.nexusstock.almoxarifado.repository;

import com.nexusstock.almoxarifado.entity.Usuario;
import com.nexusstock.almoxarifado.enums.RoleName;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface UsuarioRepository extends JpaRepository<Usuario, Long> {

    Optional<Usuario> findByUsuario(String usuario);

    Optional<Usuario> findByUsuarioIgnoreCase(String usuario);

    Optional<Usuario> findByEmail(String email);

    boolean existsByUsuario(String usuario);

    boolean existsByUsuarioAndIdNot(String usuario, Long id);

    boolean existsByEmail(String email);

    boolean existsByEmailAndIdNot(String email, Long id);

    @Query("SELECT u FROM Usuario u WHERE u.ativo = true AND u.excluido = false")
    List<Usuario> findByAtivoTrue();

    @Query("""
            SELECT u
            FROM Usuario u
            JOIN u.perfil p
            WHERE u.excluido = false
              AND p.nome IN :perfisPermitidos
              AND (:perfil IS NULL OR p.nome = :perfil)
              AND (:ativo IS NULL OR u.ativo = :ativo)
              AND (
                    :search IS NULL
                    OR :search = ''
                    OR LOWER(u.nome) LIKE LOWER(CONCAT('%', :search, '%'))
                    OR LOWER(u.usuario) LIKE LOWER(CONCAT('%', :search, '%'))
                    OR LOWER(COALESCE(u.email, '')) LIKE LOWER(CONCAT('%', :search, '%'))
                  )
            """)
    Page<Usuario> buscarComFiltros(
            @Param("search") String search,
            @Param("perfil") RoleName perfil,
            @Param("ativo") Boolean ativo,
            @Param("perfisPermitidos") Collection<RoleName> perfisPermitidos,
            Pageable pageable
    );
}