package com.nexusstock.almoxarifado.service.impl;

import com.nexusstock.almoxarifado.dto.mapper.UsuarioMapper;
import com.nexusstock.almoxarifado.dto.request.UsuarioCreateRequestDTO;
import com.nexusstock.almoxarifado.dto.request.UsuarioUpdateRequestDTO;
import com.nexusstock.almoxarifado.dto.response.PagedResponseDTO;
import com.nexusstock.almoxarifado.dto.response.UsuarioResponseDTO;
import com.nexusstock.almoxarifado.entity.Perfil;
import com.nexusstock.almoxarifado.entity.Usuario;
import com.nexusstock.almoxarifado.enums.RoleName;
import com.nexusstock.almoxarifado.exception.BusinessException;
import com.nexusstock.almoxarifado.exception.DuplicateResourceException;
import com.nexusstock.almoxarifado.exception.ResourceNotFoundException;
import com.nexusstock.almoxarifado.repository.PerfilRepository;
import com.nexusstock.almoxarifado.repository.UsuarioRepository;
import com.nexusstock.almoxarifado.security.SecurityUser;
import com.nexusstock.almoxarifado.service.UsuarioService;
import com.nexusstock.almoxarifado.util.PasswordPolicy;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class UsuarioServiceImpl implements UsuarioService {

    private static final String USUARIO_NAO_ENCONTRADO = "User not found.";
    private static final String USUARIO_AUTENTICADO_NAO_IDENTIFICADO = "Authenticated user could not be identified.";
    private static final String NOME_OBRIGATORIO = "The name is required.";

    private final UsuarioRepository usuarioRepository;
    private final PerfilRepository perfilRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public void registrarHeartbeatAtual() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        if (authentication == null || !authentication.isAuthenticated()) {
            return;
        }

        String identificador = authentication.getName();

        if (identificador == null || identificador.isBlank()) {
            return;
        }

        Usuario usuario = usuarioRepository.findByUsuarioIgnoreCase(identificador)
                .orElseGet(() -> usuarioRepository.findByEmail(identificador).orElse(null));

        if (usuario == null) {
            return;
        }

        usuario.setLastSeenAt(LocalDateTime.now());
        usuarioRepository.save(usuario);
    }

    @Override
    @Transactional(readOnly = true)
    public PagedResponseDTO<UsuarioResponseDTO> listar(
            String search,
            RoleName perfil,
            Boolean ativo,
            int page,
            int size,
            String sort
    ) {
        RoleName perfilAtual = obterPerfilUsuarioLogado();
        boolean incluirUltimoAcesso = podeVerUltimoAcesso(perfilAtual);
        List<RoleName> perfisPermitidos = obterPerfisVisiveis(perfilAtual);
        Pageable pageable = criarPageable(page, size, sort);

        if (perfil != null && !perfisPermitidos.contains(perfil)) {
            Page<Usuario> vazio = Page.empty(pageable);
            return montarRespostaPaginada(vazio, incluirUltimoAcesso);
        }

        Page<Usuario> usuarios = usuarioRepository.buscarComFiltros(
                normalizarBusca(search),
                perfil,
                ativo,
                perfisPermitidos,
                pageable
        );

        return montarRespostaPaginada(usuarios, incluirUltimoAcesso);
    }

    @Override
    @Transactional(readOnly = true)
    public UsuarioResponseDTO buscarPorId(Long id) {
        Usuario usuario = buscarEntidadePorId(id);
        RoleName perfilAtual = obterPerfilUsuarioLogado();

        if (!podeVisualizarUsuario(perfilAtual, usuario)) {
            throw new ResourceNotFoundException(USUARIO_NAO_ENCONTRADO);
        }

        return UsuarioMapper.toResponse(usuario, podeVerUltimoAcesso(perfilAtual));
    }

    @Override
    @Transactional
    public UsuarioResponseDTO criar(UsuarioCreateRequestDTO request) {
        RoleName perfilAtual = obterPerfilUsuarioLogado();
        RoleName perfilSolicitado = request.getPerfil();

        validarPerfilGerenciavel(perfilAtual, perfilSolicitado);

        String usuarioLogin = normalizarUsuario(request.getUsuario());
        String email = normalizarEmailOpcional(request.getEmail());

        if (usuarioRepository.existsByUsuario(usuarioLogin)) {
            throw new DuplicateResourceException("A user with this username already exists.");
        }

        if (email != null && usuarioRepository.existsByEmail(email)) {
            throw new DuplicateResourceException("A user with this email address already exists.");
        }

        Perfil perfil = buscarPerfilAtivo(perfilSolicitado);

        Usuario usuario = new Usuario();
        usuario.setNome(normalizarTextoObrigatorio(request.getNome(), NOME_OBRIGATORIO));
        usuario.setUsuario(usuarioLogin);
        usuario.setEmail(email);
        validarSenhaCompativelComBcrypt(request.getSenha());
        usuario.setSenhaHash(passwordEncoder.encode(request.getSenha()));
        usuario.setPerfil(perfil);
        usuario.setAtivo(true);

        return UsuarioMapper.toResponse(usuarioRepository.save(usuario), podeVerUltimoAcesso(perfilAtual));
    }

    @Override
    @Transactional
    public UsuarioResponseDTO atualizar(Long id, UsuarioUpdateRequestDTO request) {
        Usuario usuario = buscarEntidadePorId(id);

        RoleName perfilAtual = obterPerfilUsuarioLogado();
        RoleName perfilAlvoAtual = usuario.getPerfil().getNome();
        RoleName perfilSolicitado = request.getPerfil();

        if (!podeGerenciarUsuario(perfilAtual, perfilAlvoAtual)) {
            throw new ResourceNotFoundException(USUARIO_NAO_ENCONTRADO);
        }

        validarPerfilGerenciavel(perfilAtual, perfilSolicitado);

        String usuarioLogin = normalizarUsuario(request.getUsuario());
        String email = normalizarEmailOpcional(request.getEmail());

        if (usuarioRepository.existsByUsuarioAndIdNot(usuarioLogin, id)) {
            throw new DuplicateResourceException("Another user is already using this username.");
        }

        if (email != null && usuarioRepository.existsByEmailAndIdNot(email, id)) {
            throw new DuplicateResourceException("Another user is already using this email address.");
        }

        Perfil perfil = buscarPerfilAtivo(perfilSolicitado);

        usuario.setNome(normalizarTextoObrigatorio(request.getNome(), NOME_OBRIGATORIO));
        usuario.setUsuario(usuarioLogin);
        usuario.setEmail(email);
        usuario.setPerfil(perfil);
        usuario.setAtivo(Boolean.TRUE.equals(request.getAtivo()));

        if (request.getSenha() != null && !request.getSenha().isBlank()) {
            validarSenhaCompativelComBcrypt(request.getSenha());
            usuario.setSenhaHash(passwordEncoder.encode(request.getSenha()));
        }

        return UsuarioMapper.toResponse(usuarioRepository.save(usuario), podeVerUltimoAcesso(perfilAtual));
    }

    @Override
    @Transactional
    public void desativar(Long id) {
        Usuario usuario = buscarEntidadePorId(id);

        RoleName perfilAtual = obterPerfilUsuarioLogado();
        RoleName perfilAlvo = usuario.getPerfil().getNome();

        if (!podeGerenciarUsuario(perfilAtual, perfilAlvo)) {
            throw new ResourceNotFoundException(USUARIO_NAO_ENCONTRADO);
        }

        usuario.setAtivo(false);
        usuarioRepository.save(usuario);
    }

    @Override
    @Transactional
    public void reativar(Long id) {
        Usuario usuario = buscarEntidadePorId(id);

        RoleName perfilAtual = obterPerfilUsuarioLogado();
        RoleName perfilAlvo = usuario.getPerfil().getNome();

        if (!podeGerenciarUsuario(perfilAtual, perfilAlvo)) {
            throw new ResourceNotFoundException(USUARIO_NAO_ENCONTRADO);
        }

        usuario.setAtivo(true);
        usuarioRepository.save(usuario);
    }

    @Override
    @Transactional
    public void excluir(Long id) {
        Usuario usuario = buscarEntidadePorId(id);

        RoleName perfilAtual = obterPerfilUsuarioLogado();
        RoleName perfilAlvo = usuario.getPerfil().getNome();

        if (perfilAlvo == RoleName.SUPER_ADMINISTRADOR) {
            throw new BusinessException("The system's primary user cannot be deleted.");
        }

        if (!podeGerenciarUsuario(perfilAtual, perfilAlvo)) {
            throw new ResourceNotFoundException(USUARIO_NAO_ENCONTRADO);
        }

        String sufixo = id + "_" + UUID.randomUUID().toString().replace("-", "").substring(0, 12);

        usuario.setAtivo(false);
        usuario.setExcluido(true);
        usuario.setDeletedAt(LocalDateTime.now());
        usuario.setNome("Deleted user #" + id);
        usuario.setUsuario("deleted_user_" + sufixo);
        usuario.setEmail(null);
        usuario.setSenhaHash(passwordEncoder.encode(UUID.randomUUID().toString()));

        usuarioRepository.save(usuario);
    }

    private Usuario buscarUsuarioLogado() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        if (authentication == null || !(authentication.getPrincipal() instanceof SecurityUser securityUser)) {
            throw new AccessDeniedException(USUARIO_AUTENTICADO_NAO_IDENTIFICADO);
        }

        return securityUser.getUsuario();
    }

    @Override
    @Transactional
    public void alterarMinhaSenha(String senhaAtual, String novaSenha) {
        Usuario usuario = buscarUsuarioLogado();

        if (senhaAtual == null || senhaAtual.isBlank()) {
            throw new BusinessException("The current password is required.");
        }

        if (novaSenha == null || novaSenha.isBlank()) {
            throw new BusinessException("The new password is required.");
        }

        if (novaSenha.length() < 6) {
            throw new BusinessException("The new password must contain at least 6 characters.");
        }

        validarSenhaCompativelComBcrypt(novaSenha);

        if (!passwordEncoder.matches(senhaAtual, usuario.getSenhaHash())) {
            throw new BusinessException("The current password is incorrect.");
        }

        if (passwordEncoder.matches(novaSenha, usuario.getSenhaHash())) {
            throw new BusinessException("The new password must differ from the current password.");
        }

        usuario.setSenhaHash(passwordEncoder.encode(novaSenha));
        usuarioRepository.save(usuario);
    }

    private void validarSenhaCompativelComBcrypt(String senha) {
        if (PasswordPolicy.exceedsBcryptLimit(senha)) {
            throw new BusinessException("The password must not exceed 72 bytes in UTF-8.");
        }
    }

    @Override
    @Transactional(readOnly = true)
    public Usuario buscarEntidadePorId(Long id) {
        Usuario usuario = usuarioRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(USUARIO_NAO_ENCONTRADO));

        if (Boolean.TRUE.equals(usuario.getExcluido())) {
            throw new ResourceNotFoundException(USUARIO_NAO_ENCONTRADO);
        }

        return usuario;
    }

    private Perfil buscarPerfilAtivo(RoleName roleName) {
        Perfil perfil = perfilRepository.findByNome(roleName)
                .orElseThrow(() -> new ResourceNotFoundException("Role not found."));

        if (!Boolean.TRUE.equals(perfil.getAtivo())) {
            throw new BusinessException("Inactive role.");
        }

        return perfil;
    }

    private RoleName obterPerfilUsuarioLogado() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        if (authentication == null || !(authentication.getPrincipal() instanceof SecurityUser securityUser)) {
            throw new AccessDeniedException(USUARIO_AUTENTICADO_NAO_IDENTIFICADO);
        }

        return securityUser.getUsuario().getPerfil().getNome();
    }

    private boolean podeVisualizarUsuario(RoleName perfilAtual, Usuario usuarioAlvo) {
        if (usuarioAlvo == null || usuarioAlvo.getPerfil() == null) {
            return false;
        }

        RoleName perfilAlvo = usuarioAlvo.getPerfil().getNome();

        if (perfilAlvo == RoleName.SUPER_ADMINISTRADOR) {
            return false;
        }

        return podeGerenciarUsuario(perfilAtual, perfilAlvo);
    }

    private boolean podeGerenciarUsuario(RoleName perfilAtual, RoleName perfilAlvo) {
        if (perfilAlvo == RoleName.SUPER_ADMINISTRADOR) {
            return false;
        }

        if (perfilAtual == RoleName.SUPER_ADMINISTRADOR) {
            return perfilAlvo == RoleName.ADMINISTRADOR || perfilAlvo == RoleName.USUARIO || perfilAlvo == RoleName.SOLICITANTE;
        }

        if (perfilAtual == RoleName.ADMINISTRADOR) {
            return perfilAlvo == RoleName.USUARIO || perfilAlvo == RoleName.SOLICITANTE;
        }

        if (perfilAtual == RoleName.USUARIO) {
            return perfilAlvo == RoleName.SOLICITANTE;
        }

        return false;
    }

    private void validarPerfilGerenciavel(RoleName perfilAtual, RoleName perfilSolicitado) {
        if (!podeGerenciarUsuario(perfilAtual, perfilSolicitado)) {
            throw new AccessDeniedException("You do not have permission to manage this type of user.");
        }
    }

    private List<RoleName> obterPerfisVisiveis(RoleName perfilAtual) {
        if (perfilAtual == RoleName.SUPER_ADMINISTRADOR) {
            return List.of(RoleName.ADMINISTRADOR, RoleName.USUARIO, RoleName.SOLICITANTE);
        }

        if (perfilAtual == RoleName.ADMINISTRADOR) {
            return List.of(RoleName.USUARIO, RoleName.SOLICITANTE);
        }

        if (perfilAtual == RoleName.USUARIO) {
            return List.of(RoleName.SOLICITANTE);
        }

        return List.of();
    }

    private boolean podeVerUltimoAcesso(RoleName perfilAtual) {
        return perfilAtual == RoleName.SUPER_ADMINISTRADOR;
    }

    private PagedResponseDTO<UsuarioResponseDTO> montarRespostaPaginada(Page<Usuario> page, boolean incluirUltimoAcesso) {
        return PagedResponseDTO.<UsuarioResponseDTO>builder()
                .content(page.getContent().stream().map(usuario -> UsuarioMapper.toResponse(usuario, incluirUltimoAcesso)).toList())
                .page(page.getNumber())
                .size(page.getSize())
                .totalElements(page.getTotalElements())
                .totalPages(page.getTotalPages())
                .first(page.isFirst())
                .last(page.isLast())
                .build();
    }

    private Pageable criarPageable(int page, int size, String sort) {
        int paginaSegura = Math.max(page, 0);
        int tamanhoSeguro = Math.max(1, Math.min(size, 100));

        String propriedade = "nome";
        Sort.Direction direcao = Sort.Direction.ASC;

        if (sort != null && !sort.isBlank()) {
            String[] partes = sort.split(",");

            if (partes.length > 0 && isCampoOrdenacaoPermitido(partes[0].trim())) {
                propriedade = partes[0].trim();
            }

            if (partes.length > 1 && "desc".equalsIgnoreCase(partes[1].trim())) {
                direcao = Sort.Direction.DESC;
            }
        }

        return PageRequest.of(paginaSegura, tamanhoSeguro, Sort.by(direcao, propriedade));
    }

    private boolean isCampoOrdenacaoPermitido(String campo) {
        return List.of("nome", "usuario", "email", "ativo", "createdAt", "updatedAt", "lastSeenAt").contains(campo);
    }

    private String normalizarBusca(String search) {
        if (search == null || search.isBlank()) {
            return null;
        }

        return search.trim();
    }

    private String normalizarUsuario(String usuario) {
        String normalizado = normalizarTextoObrigatorio(usuario, "The username is required.")
                .toLowerCase();

        if (!normalizado.matches("^[a-z0-9._-]{3,80}$")) {
            throw new BusinessException("The username may only contain letters, numbers, periods, hyphens, or underscores.");
        }

        return normalizado;
    }

    private String normalizarEmailOpcional(String email) {
        if (email == null || email.isBlank()) {
            return null;
        }

        String normalizado = email.trim().toLowerCase();

        if (!normalizado.contains("@")) {
            throw new BusinessException("Enter a valid email address.");
        }

        return normalizado;
    }

    private String normalizarTextoObrigatorio(String valor, String mensagemErro) {
        if (valor == null || valor.isBlank()) {
            throw new BusinessException(mensagemErro);
        }

        return valor.trim();
    }
}
