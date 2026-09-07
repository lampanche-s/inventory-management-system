package com.nexusstock.almoxarifado.service;

import com.nexusstock.almoxarifado.dto.request.UsuarioCreateRequestDTO;
import com.nexusstock.almoxarifado.dto.request.UsuarioUpdateRequestDTO;
import com.nexusstock.almoxarifado.dto.response.PagedResponseDTO;
import com.nexusstock.almoxarifado.dto.response.UsuarioResponseDTO;
import com.nexusstock.almoxarifado.entity.Usuario;
import com.nexusstock.almoxarifado.enums.RoleName;

public interface UsuarioService {

    PagedResponseDTO<UsuarioResponseDTO> listar(
            String search,
            RoleName perfil,
            Boolean ativo,
            int page,
            int size,
            String sort
    );

    UsuarioResponseDTO buscarPorId(Long id);

    UsuarioResponseDTO criar(UsuarioCreateRequestDTO request);

    UsuarioResponseDTO atualizar(Long id, UsuarioUpdateRequestDTO request);

    void desativar(Long id);

    void reativar(Long id);

    void excluir(Long id);

    void alterarMinhaSenha(String senhaAtual, String novaSenha);

    Usuario buscarEntidadePorId(Long id);

    void registrarHeartbeatAtual();
}