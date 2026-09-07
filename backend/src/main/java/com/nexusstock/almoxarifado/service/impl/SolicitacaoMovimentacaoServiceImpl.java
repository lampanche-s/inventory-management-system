package com.nexusstock.almoxarifado.service.impl;

import com.nexusstock.almoxarifado.dto.request.DecisaoSolicitacaoMovimentacaoRequestDTO;
import com.nexusstock.almoxarifado.dto.request.SolicitacaoMovimentacaoLoteItemRequestDTO;
import com.nexusstock.almoxarifado.dto.request.SolicitacaoMovimentacaoLoteRequestDTO;
import com.nexusstock.almoxarifado.dto.request.SolicitacaoMovimentacaoRequestDTO;
import com.nexusstock.almoxarifado.dto.response.PagedResponseDTO;
import com.nexusstock.almoxarifado.dto.response.SolicitacaoMovimentacaoLoteResponseDTO;
import com.nexusstock.almoxarifado.dto.response.SolicitacaoMovimentacaoResponseDTO;
import com.nexusstock.almoxarifado.entity.Item;
import com.nexusstock.almoxarifado.entity.MovimentacaoEstoque;
import com.nexusstock.almoxarifado.entity.SolicitacaoMovimentacao;
import com.nexusstock.almoxarifado.entity.Usuario;
import com.nexusstock.almoxarifado.enums.MotivoMovimentacao;
import com.nexusstock.almoxarifado.enums.StatusSolicitacaoMovimentacao;
import com.nexusstock.almoxarifado.enums.TipoMovimentacao;
import com.nexusstock.almoxarifado.exception.BusinessException;
import com.nexusstock.almoxarifado.exception.EstoqueInsuficienteException;
import com.nexusstock.almoxarifado.exception.ResourceNotFoundException;
import com.nexusstock.almoxarifado.repository.ItemRepository;
import com.nexusstock.almoxarifado.repository.MovimentacaoEstoqueRepository;
import com.nexusstock.almoxarifado.repository.SolicitacaoMovimentacaoRepository;
import com.nexusstock.almoxarifado.repository.UsuarioRepository;
import com.nexusstock.almoxarifado.service.EstoqueValorHistoricoService;
import com.nexusstock.almoxarifado.service.SolicitacaoMovimentacaoService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class SolicitacaoMovimentacaoServiceImpl implements SolicitacaoMovimentacaoService {

    private static final int LIMITE_ITENS_POR_PEDIDO = 10;
    private static final DateTimeFormatter CODIGO_PEDIDO_DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyyMMddHHmmss");

    private final SolicitacaoMovimentacaoRepository solicitacaoRepository;
    private final ItemRepository itemRepository;
    private final UsuarioRepository usuarioRepository;
    private final MovimentacaoEstoqueRepository movimentacaoRepository;
    private final EstoqueValorHistoricoService estoqueValorHistoricoService;

    @Override
    @Transactional
    public SolicitacaoMovimentacaoResponseDTO criar(SolicitacaoMovimentacaoRequestDTO request) {
        validarMotivo(request.getTipo(), request.getMotivo());

        Usuario solicitante = buscarUsuarioAutenticado();

        Item item = itemRepository.findById(request.getItemId())
                .orElseThrow(() -> new ResourceNotFoundException("Item not found."));

        if (!Boolean.TRUE.equals(item.getAtivo())) {
            throw new BusinessException("An inactive item cannot receive requests.");
        }

        SolicitacaoMovimentacao solicitacao = new SolicitacaoMovimentacao();
        solicitacao.setItem(item);
        solicitacao.setSolicitante(solicitante);
        solicitacao.setTipo(request.getTipo());
        solicitacao.setQuantidade(request.getQuantidade());
        solicitacao.setMotivo(request.getMotivo());
        solicitacao.setObservacao(normalizarTextoOpcional(request.getObservacao()));
        solicitacao.setCodigoPedido(gerarCodigoPedido());
        solicitacao.setOrdemNoPedido(1);
        solicitacao.setStatus(StatusSolicitacaoMovimentacao.PENDENTE);
        solicitacao.setDataSolicitacao(LocalDateTime.now());

        return toResponse(solicitacaoRepository.save(solicitacao));
    }

    @Override
    @Transactional
    public SolicitacaoMovimentacaoLoteResponseDTO criarEmLote(SolicitacaoMovimentacaoLoteRequestDTO request) {
        validarItensDoPedido(request.getItens());
        validarMotivo(request.getTipo(), request.getMotivo());

        Usuario solicitante = buscarUsuarioAutenticado();
        LocalDateTime dataSolicitacao = LocalDateTime.now();
        String codigoPedido = gerarCodigoPedido();
        String observacao = normalizarTextoOpcional(request.getObservacao());

        List<SolicitacaoMovimentacao> solicitacoes = new ArrayList<>();

        int ordem = 1;
        for (SolicitacaoMovimentacaoLoteItemRequestDTO itemRequest : request.getItens()) {
            Item item = itemRepository.findById(itemRequest.getItemId())
                    .orElseThrow(() -> new ResourceNotFoundException("Item not found."));

            if (!Boolean.TRUE.equals(item.getAtivo())) {
                throw new BusinessException("An inactive item cannot receive requests: " + item.getNome() + ".");
            }

            SolicitacaoMovimentacao solicitacao = new SolicitacaoMovimentacao();
            solicitacao.setItem(item);
            solicitacao.setSolicitante(solicitante);
            solicitacao.setTipo(request.getTipo());
            solicitacao.setQuantidade(itemRequest.getQuantidade());
            solicitacao.setMotivo(request.getMotivo());
            solicitacao.setObservacao(observacao);
            solicitacao.setCodigoPedido(codigoPedido);
            solicitacao.setOrdemNoPedido(ordem);
            solicitacao.setStatus(StatusSolicitacaoMovimentacao.PENDENTE);
            solicitacao.setDataSolicitacao(dataSolicitacao);

            solicitacoes.add(solicitacao);
            ordem++;
        }

        List<SolicitacaoMovimentacaoResponseDTO> solicitacoesSalvas = solicitacaoRepository.saveAll(solicitacoes)
                .stream()
                .map(this::toResponse)
                .toList();

        return SolicitacaoMovimentacaoLoteResponseDTO.builder()
                .codigoPedido(codigoPedido)
                .totalItens(solicitacoesSalvas.size())
                .solicitacoes(solicitacoesSalvas)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public PagedResponseDTO<SolicitacaoMovimentacaoResponseDTO> listar(
            String search,
            StatusSolicitacaoMovimentacao status,
            TipoMovimentacao tipo,
            Long solicitanteId,
            LocalDate data,
            int page,
            int size,
            String sort
    ) {
        Pageable pageable = PageRequest.of(page, limitarSize(size), criarSort(sort));
        String searchNormalizado = normalizarSearch(search);

        LocalDateTime dataInicio = data == null ? null : data.atStartOfDay();
        LocalDateTime dataFimExclusivo = data == null ? null : data.plusDays(1).atStartOfDay();

        Page<SolicitacaoMovimentacao> solicitacoes;

        if (data == null) {
            solicitacoes = solicitacaoRepository.buscarComFiltros(
                    searchNormalizado,
                    status,
                    tipo,
                    solicitanteId,
                    pageable
            );
        } else {
            solicitacoes = solicitacaoRepository.buscarComFiltrosPorPeriodo(
                    searchNormalizado,
                    status,
                    tipo,
                    solicitanteId,
                    dataInicio,
                    dataFimExclusivo,
                    pageable
            );
        }

        return PagedResponseDTO.<SolicitacaoMovimentacaoResponseDTO>builder()
                .content(solicitacoes.getContent().stream().map(this::toResponse).toList())
                .page(solicitacoes.getNumber())
                .size(solicitacoes.getSize())
                .totalElements(solicitacoes.getTotalElements())
                .totalPages(solicitacoes.getTotalPages())
                .first(solicitacoes.isFirst())
                .last(solicitacoes.isLast())
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public PagedResponseDTO<SolicitacaoMovimentacaoResponseDTO> listarMinhas(
            String search,
            StatusSolicitacaoMovimentacao status,
            TipoMovimentacao tipo,
            LocalDate data,
            int page,
            int size,
            String sort
    ) {
        Usuario usuario = buscarUsuarioAutenticado();

        return listar(search, status, tipo, usuario.getId(), data, page, size, sort);
    }

    @Override
    @Transactional
    public SolicitacaoMovimentacaoResponseDTO cancelar(Long id) {
        SolicitacaoMovimentacao solicitacao = buscarPendente(id);
        Usuario solicitante = buscarUsuarioAutenticado();

        if (
                solicitacao.getSolicitante() == null
                        || solicitacao.getSolicitante().getId() == null
                        || !solicitacao.getSolicitante().getId().equals(solicitante.getId())
        ) {
            throw new BusinessException("Only the requester can cancel their own request.");
        }

        solicitacao.setStatus(StatusSolicitacaoMovimentacao.CANCELADA);
        solicitacao.setDataDecisao(LocalDateTime.now());

        return toResponse(solicitacaoRepository.save(solicitacao));
    }

    @Override
    @Transactional(readOnly = true)
    public List<SolicitacaoMovimentacaoResponseDTO> listarPendentes(Integer limit) {
        int limiteFinal = limit == null ? 10 : Math.max(1, Math.min(limit, 50));

        return solicitacaoRepository.findByStatusOrderByDataSolicitacaoDesc(
                        StatusSolicitacaoMovimentacao.PENDENTE,
                        PageRequest.of(0, limiteFinal)
                )
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public Long contarPendentes() {
        return solicitacaoRepository.countByStatus(StatusSolicitacaoMovimentacao.PENDENTE);
    }

    @Override
    @Transactional
    public SolicitacaoMovimentacaoResponseDTO aprovar(Long id, DecisaoSolicitacaoMovimentacaoRequestDTO request) {
        SolicitacaoMovimentacao solicitacao = buscarPendente(id);
        Usuario aprovador = buscarUsuarioAutenticado();

        Item item = itemRepository.buscarPorIdComLock(solicitacao.getItem().getId())
                .orElseThrow(() -> new ResourceNotFoundException("Item not found."));

        if (!Boolean.TRUE.equals(item.getAtivo())) {
            throw new BusinessException("An inactive item cannot have requests approved.");
        }

        BigDecimal quantidade = solicitacao.getQuantidade();
        BigDecimal saldoAnterior = item.getQuantidadeAtual();
        BigDecimal saldoPosterior;

        if (solicitacao.getTipo() == TipoMovimentacao.ENTRADA) {
            saldoPosterior = saldoAnterior.add(quantidade);
        } else {
            if (quantidade.compareTo(saldoAnterior) > 0) {
                throw new EstoqueInsuficienteException("Insufficient stock to approve this request.");
            }

            saldoPosterior = saldoAnterior.subtract(quantidade);
        }

        item.setQuantidadeAtual(saldoPosterior);
        itemRepository.save(item);

        MovimentacaoEstoque movimentacao = new MovimentacaoEstoque();
        movimentacao.setItem(item);
        movimentacao.setUsuario(aprovador);
        movimentacao.setTipo(solicitacao.getTipo());
        movimentacao.setQuantidade(quantidade);
        movimentacao.setMotivo(solicitacao.getMotivo());
        movimentacao.setObservacao(montarObservacaoAprovacao(solicitacao));
        movimentacao.setDataHora(LocalDateTime.now());
        movimentacao.setSaldoAnterior(saldoAnterior);
        movimentacao.setSaldoPosterior(saldoPosterior);

        MovimentacaoEstoque movimentacaoSalva = movimentacaoRepository.save(movimentacao);

        solicitacao.setStatus(StatusSolicitacaoMovimentacao.APROVADA);
        solicitacao.setAprovador(aprovador);
        solicitacao.setMovimentacaoGerada(movimentacaoSalva);
        solicitacao.setJustificativaDecisao(normalizarTextoOpcional(request == null ? null : request.getJustificativa()));
        solicitacao.setDataDecisao(LocalDateTime.now());

        SolicitacaoMovimentacaoResponseDTO response = toResponse(solicitacaoRepository.save(solicitacao));
        estoqueValorHistoricoService.registrarSnapshot("SOLICITACAO_APROVADA");

        return response;
    }

    @Override
    @Transactional
    public SolicitacaoMovimentacaoResponseDTO rejeitar(Long id, DecisaoSolicitacaoMovimentacaoRequestDTO request) {
        SolicitacaoMovimentacao solicitacao = buscarPendente(id);
        Usuario aprovador = buscarUsuarioAutenticado();

        solicitacao.setStatus(StatusSolicitacaoMovimentacao.REJEITADA);
        solicitacao.setAprovador(aprovador);
        solicitacao.setJustificativaDecisao(normalizarTextoOpcional(request == null ? null : request.getJustificativa()));
        solicitacao.setDataDecisao(LocalDateTime.now());

        return toResponse(solicitacaoRepository.save(solicitacao));
    }

    private SolicitacaoMovimentacao buscarPendente(Long id) {
        SolicitacaoMovimentacao solicitacao = solicitacaoRepository.buscarPorIdComLock(id)
                .orElseThrow(() -> new ResourceNotFoundException("Request not found."));

        if (solicitacao.getStatus() != StatusSolicitacaoMovimentacao.PENDENTE) {
            throw new BusinessException("This request has already been reviewed.");
        }

        return solicitacao;
    }

    private void validarItensDoPedido(List<SolicitacaoMovimentacaoLoteItemRequestDTO> itens) {
        if (itens == null || itens.isEmpty()) {
            throw new BusinessException("Add at least one item to the request.");
        }

        if (itens.size() > LIMITE_ITENS_POR_PEDIDO) {
            throw new BusinessException("A request may contain at most 10 items.");
        }

        Set<Long> itemIds = new HashSet<>();

        for (SolicitacaoMovimentacaoLoteItemRequestDTO item : itens) {
            if (item.getItemId() == null) {
                throw new BusinessException("Every requested item must have an identifier.");
            }

            if (!itemIds.add(item.getItemId())) {
                throw new BusinessException("The same item cannot appear more than once in a request.");
            }
        }
    }

    private void validarMotivo(TipoMovimentacao tipo, MotivoMovimentacao motivo) {
        if (motivo == MotivoMovimentacao.CADASTRO_INICIAL) {
            throw new BusinessException("The CADASTRO_INICIAL reason cannot be used in requests.");
        }

        if (motivo == MotivoMovimentacao.PERDA_AVARIA && tipo != TipoMovimentacao.SAIDA) {
            throw new BusinessException("Loss / damage can only be used in outbound requests.");
        }
    }

    private Usuario buscarUsuarioAutenticado() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        if (authentication == null || authentication.getName() == null) {
            throw new BadCredentialsException("Authenticated user not found.");
        }

        String usuarioLogin = authentication.getName();

        return usuarioRepository.findByUsuario(usuarioLogin)
                .orElseThrow(() -> new BadCredentialsException("Authenticated user not found."));
    }

    private String montarObservacaoAprovacao(SolicitacaoMovimentacao solicitacao) {
        String base = "Movement generated from request #" + solicitacao.getId()
                + " by " + solicitacao.getSolicitante().getNome() + ".";

        if (normalizarTextoOpcional(solicitacao.getCodigoPedido()) != null) {
            base += " Request: " + solicitacao.getCodigoPedido();

            if (solicitacao.getOrdemNoPedido() != null) {
                base += " / item " + solicitacao.getOrdemNoPedido() + ".";
            }
        }

        String observacao = normalizarTextoOpcional(solicitacao.getObservacao());

        if (observacao == null) {
            return base;
        }

        return base + " Requester note: " + observacao;
    }

    private SolicitacaoMovimentacaoResponseDTO toResponse(SolicitacaoMovimentacao solicitacao) {
        SolicitacaoMovimentacaoResponseDTO response = new SolicitacaoMovimentacaoResponseDTO();

        response.setId(solicitacao.getId());

        if (solicitacao.getItem() != null) {
            response.setItemId(solicitacao.getItem().getId());
            response.setItemNome(solicitacao.getItem().getNome());
            response.setItemSku(solicitacao.getItem().getSku());
        }

        if (solicitacao.getSolicitante() != null) {
            response.setSolicitanteId(solicitacao.getSolicitante().getId());
            response.setSolicitanteNome(solicitacao.getSolicitante().getNome());
            response.setSolicitanteUsuario(solicitacao.getSolicitante().getUsuario());
        }

        if (solicitacao.getAprovador() != null) {
            response.setAprovadorId(solicitacao.getAprovador().getId());
            response.setAprovadorNome(solicitacao.getAprovador().getNome());
            response.setAprovadorUsuario(solicitacao.getAprovador().getUsuario());
        }

        if (solicitacao.getMovimentacaoGerada() != null) {
            response.setMovimentacaoId(solicitacao.getMovimentacaoGerada().getId());
        }

        response.setTipo(solicitacao.getTipo());
        response.setTipoLabel(solicitacao.getTipo() == null ? null : solicitacao.getTipo().getLabel());
        response.setQuantidade(solicitacao.getQuantidade());
        response.setMotivo(solicitacao.getMotivo());
        response.setMotivoLabel(solicitacao.getMotivo() == null ? null : solicitacao.getMotivo().getLabel());
        response.setObservacao(solicitacao.getObservacao());
        response.setCodigoPedido(solicitacao.getCodigoPedido());
        response.setOrdemNoPedido(solicitacao.getOrdemNoPedido());
        response.setStatus(solicitacao.getStatus());
        response.setStatusLabel(solicitacao.getStatus() == null ? null : solicitacao.getStatus().getLabel());
        response.setJustificativaDecisao(solicitacao.getJustificativaDecisao());
        response.setDataSolicitacao(solicitacao.getDataSolicitacao());
        response.setDataDecisao(solicitacao.getDataDecisao());

        return response;
    }

    private int limitarSize(int size) {
        if (size > 100) {
            return 100;
        }

        return Math.max(size, 1);
    }

    private Sort criarSort(String sort) {
        if (sort == null || sort.isBlank()) {
            return Sort.by(Sort.Direction.DESC, "dataSolicitacao");
        }

        String[] partes = sort.split(",");

        String campo = partes[0].trim();
        String direcao = partes.length > 1 ? partes[1].trim() : "desc";

        if (!campoPermitidoParaOrdenacao(campo)) {
            campo = "dataSolicitacao";
        }

        Sort.Direction direction = "asc".equalsIgnoreCase(direcao)
                ? Sort.Direction.ASC
                : Sort.Direction.DESC;

        return Sort.by(direction, campo);
    }

    private boolean campoPermitidoParaOrdenacao(String campo) {
        return campo.equals("dataSolicitacao")
                || campo.equals("dataDecisao")
                || campo.equals("status")
                || campo.equals("tipo")
                || campo.equals("quantidade")
                || campo.equals("createdAt");
    }

    private String normalizarSearch(String search) {
        if (search == null || search.trim().isBlank()) {
            return "";
        }

        return search.trim();
    }

    private String normalizarTextoOpcional(String texto) {
        if (texto == null || texto.trim().isBlank()) {
            return null;
        }

        return texto.trim();
    }

    private String gerarCodigoPedido() {
        String data = LocalDateTime.now().format(CODIGO_PEDIDO_DATE_FORMATTER);
        String sufixo = UUID.randomUUID().toString().substring(0, 8).toUpperCase();

        return "PED-" + data + "-" + sufixo;
    }
}
