package com.nexusstock.almoxarifado.dto.mapper;

import com.nexusstock.almoxarifado.dto.response.UsuarioResponseDTO;
import com.nexusstock.almoxarifado.entity.Usuario;
import com.nexusstock.almoxarifado.enums.RoleName;

import java.util.List;

public final class UsuarioMapper {

    private UsuarioMapper() {
    }

    public static UsuarioResponseDTO toResponse(Usuario usuario) {
        return toResponse(usuario, false);
    }

    public static UsuarioResponseDTO toResponse(Usuario usuario, boolean incluirUltimoAcesso) {
        RoleName perfil = usuario.getPerfil().getNome();

        return UsuarioResponseDTO.builder()
                .id(usuario.getId())
                .nome(usuario.getNome())
                .usuario(usuario.getUsuario())
                .email(usuario.getEmail())
                .perfil(perfil)
                .perfilLabel(toPerfilLabel(perfil))
                .frontendRole(toFrontendRole(perfil))
                .frontendRoleLabel(toFrontendRoleLabel(perfil))
                .ativo(usuario.getAtivo())
                .permissoes(toPermissoes(perfil))
                .createdAt(usuario.getCreatedAt())
                .updatedAt(usuario.getUpdatedAt())
                .lastSeenAt(incluirUltimoAcesso ? usuario.getLastSeenAt() : null)
                .build();
    }

    private static String toPerfilLabel(RoleName perfil) {
        return switch (perfil) {
            case SUPER_ADMINISTRADOR, ADMINISTRADOR -> "Administrator";
            case USUARIO -> "Employee";
            case SOLICITANTE -> "Requester";
        };
    }

    private static String toFrontendRole(RoleName perfil) {
        return switch (perfil) {
            case SUPER_ADMINISTRADOR -> "SUPER_ADMIN";
            case ADMINISTRADOR -> "ADMIN";
            case USUARIO -> "FUNCIONARIO";
            case SOLICITANTE -> "SOLICITANTE";
        };
    }

    private static String toFrontendRoleLabel(RoleName perfil) {
        return switch (perfil) {
            case SUPER_ADMINISTRADOR, ADMINISTRADOR -> "Administrator";
            case USUARIO -> "Employee";
            case SOLICITANTE -> "Requester";
        };
    }

    private static List<String> toPermissoes(RoleName perfil) {
        return switch (perfil) {
            case SUPER_ADMINISTRADOR -> List.of(
                    "DASHBOARD_VISUALIZAR",
                    "ITEM_VISUALIZAR",
                    "ITEM_CRIAR",
                    "ITEM_EDITAR",
                    "ITEM_DESATIVAR",
                    "MOVIMENTACAO_VISUALIZAR",
                    "MOVIMENTACAO_CRIAR",
                    "SOLICITACAO_VISUALIZAR",
                    "SOLICITACAO_APROVAR",
                    "SOLICITACAO_REJEITAR",
                    "FORNECEDOR_VISUALIZAR",
                    "RELATORIO_VISUALIZAR",
                    "USUARIO_VISUALIZAR",
                    "USUARIO_CRIAR",
                    "USUARIO_EDITAR",
                    "USUARIO_DESATIVAR",
                    "USUARIO_GERENCIAR_ADMINISTRADOR",
                    "CONFIGURACAO_VISUALIZAR",
                    "CONFIGURACAO_RESETAR_SISTEMA",
                    "CONTATO_VISUALIZAR"
            );

            case ADMINISTRADOR -> List.of(
                    "DASHBOARD_VISUALIZAR",
                    "ITEM_VISUALIZAR",
                    "ITEM_CRIAR",
                    "ITEM_EDITAR",
                    "ITEM_DESATIVAR",
                    "MOVIMENTACAO_VISUALIZAR",
                    "MOVIMENTACAO_CRIAR",
                    "SOLICITACAO_VISUALIZAR",
                    "SOLICITACAO_APROVAR",
                    "SOLICITACAO_REJEITAR",
                    "FORNECEDOR_VISUALIZAR",
                    "RELATORIO_VISUALIZAR",
                    "USUARIO_VISUALIZAR",
                    "USUARIO_CRIAR",
                    "USUARIO_EDITAR",
                    "USUARIO_DESATIVAR",
                    "CONFIGURACAO_VISUALIZAR",
                    "CONTATO_VISUALIZAR"
            );

            case USUARIO -> List.of(
                    "DASHBOARD_VISUALIZAR",
                    "ITEM_VISUALIZAR",
                    "MOVIMENTACAO_VISUALIZAR",
                    "MOVIMENTACAO_CRIAR",
                    "SOLICITACAO_VISUALIZAR",
                    "SOLICITACAO_APROVAR",
                    "SOLICITACAO_REJEITAR",
                    "FORNECEDOR_VISUALIZAR",
                    "CONTATO_VISUALIZAR"
            );

            case SOLICITANTE -> List.of(
                    "SOLICITACAO_CRIAR",
                    "SOLICITACAO_MINHAS_VISUALIZAR",
                    "CONTATO_VISUALIZAR"
            );

        };
    }
}
