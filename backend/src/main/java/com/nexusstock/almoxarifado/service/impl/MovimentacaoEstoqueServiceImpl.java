package com.nexusstock.almoxarifado.service.impl;

import com.nexusstock.almoxarifado.dto.mapper.MovimentacaoMapper;
import com.nexusstock.almoxarifado.dto.request.MovimentacaoRequestDTO;
import com.nexusstock.almoxarifado.dto.response.MovimentacaoResponseDTO;
import com.nexusstock.almoxarifado.dto.response.PagedResponseDTO;
import com.nexusstock.almoxarifado.entity.Item;
import com.nexusstock.almoxarifado.entity.MovimentacaoEstoque;
import com.nexusstock.almoxarifado.entity.Usuario;
import com.nexusstock.almoxarifado.enums.MotivoMovimentacao;
import com.nexusstock.almoxarifado.enums.TipoMovimentacao;
import com.nexusstock.almoxarifado.exception.BusinessException;
import com.nexusstock.almoxarifado.exception.EstoqueInsuficienteException;
import com.nexusstock.almoxarifado.exception.ResourceNotFoundException;
import com.nexusstock.almoxarifado.repository.ItemRepository;
import com.nexusstock.almoxarifado.repository.MovimentacaoEstoqueRepository;
import com.nexusstock.almoxarifado.repository.UsuarioRepository;
import com.nexusstock.almoxarifado.service.MovimentacaoEstoqueService;
import com.nexusstock.almoxarifado.service.EstoqueValorHistoricoService;
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
import java.time.LocalTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class MovimentacaoEstoqueServiceImpl implements MovimentacaoEstoqueService {

    private final MovimentacaoEstoqueRepository movimentacaoRepository;
    private final ItemRepository itemRepository;
    private final UsuarioRepository usuarioRepository;
    private final EstoqueValorHistoricoService estoqueValorHistoricoService;

    @Override
    @Transactional
    public MovimentacaoResponseDTO registrar(MovimentacaoRequestDTO request) {
        validarMotivo(request.getTipo(), request.getMotivo());

        Usuario usuario = buscarUsuarioAutenticado();

        Item item = itemRepository.buscarPorIdComLock(request.getItemId())
                .orElseThrow(() -> new ResourceNotFoundException("Item not found."));

        if (!Boolean.TRUE.equals(item.getAtivo())) {
            throw new BusinessException("An inactive item cannot receive inventory movements.");
        }

        BigDecimal quantidade = request.getQuantidade();
        BigDecimal saldoAnterior = item.getQuantidadeAtual();
        BigDecimal saldoPosterior;

        if (request.getTipo() == TipoMovimentacao.ENTRADA) {
            saldoPosterior = saldoAnterior.add(quantidade);
        } else {
            if (quantidade.compareTo(saldoAnterior) > 0) {
                throw new EstoqueInsuficienteException("Insufficient stock for this outbound movement.");
            }

            saldoPosterior = saldoAnterior.subtract(quantidade);
        }

        item.setQuantidadeAtual(saldoPosterior);
        itemRepository.save(item);

        MovimentacaoEstoque movimentacao = new MovimentacaoEstoque();
        movimentacao.setItem(item);
        movimentacao.setUsuario(usuario);
        movimentacao.setTipo(request.getTipo());
        movimentacao.setQuantidade(quantidade);
        movimentacao.setMotivo(request.getMotivo());
        movimentacao.setObservacao(normalizarTextoOpcional(request.getObservacao()));
        movimentacao.setDataHora(LocalDateTime.now());
        movimentacao.setSaldoAnterior(saldoAnterior);
        movimentacao.setSaldoPosterior(saldoPosterior);

        MovimentacaoEstoque movimentacaoSalva = movimentacaoRepository.save(movimentacao);
        estoqueValorHistoricoService.registrarSnapshot("MOVIMENTACAO_" + request.getTipo().name());

        return MovimentacaoMapper.toResponse(movimentacaoSalva);
    }

    @Override
    @Transactional(readOnly = true)
    public PagedResponseDTO<MovimentacaoResponseDTO> listar(
            String search,
            LocalDate data,
            LocalDate dataInicio,
            LocalDate dataFim,
            Long usuarioId,
            TipoMovimentacao tipo,
            Long itemId,
            int page,
            int size,
            String sort
    ) {
        LocalDateTime inicio = definirInicio(data, dataInicio);
        LocalDateTime fim = definirFim(data, dataFim);

        Pageable pageable = PageRequest.of(page, limitarSize(size), criarSort(sort));

        Page<MovimentacaoEstoque> movimentacoes = movimentacaoRepository.buscarComFiltros(
                normalizarSearch(search),
                tipo,
                usuarioId,
                itemId,
                inicio,
                fim,
                pageable
        );

        return PagedResponseDTO.<MovimentacaoResponseDTO>builder()
                .content(movimentacoes.getContent()
                        .stream()
                        .map(MovimentacaoMapper::toResponse)
                        .toList())
                .page(movimentacoes.getNumber())
                .size(movimentacoes.getSize())
                .totalElements(movimentacoes.getTotalElements())
                .totalPages(movimentacoes.getTotalPages())
                .first(movimentacoes.isFirst())
                .last(movimentacoes.isLast())
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public List<MovimentacaoResponseDTO> listarRecentes(Integer limit) {
        int limiteFinal = limit == null ? 10 : Math.max(1, Math.min(limit, 50));

        return movimentacaoRepository.findAllByOrderByDataHoraDesc(PageRequest.of(0, limiteFinal))
                .stream()
                .map(MovimentacaoMapper::toResponse)
                .toList();
    }

    private void validarMotivo(TipoMovimentacao tipo, MotivoMovimentacao motivo) {
        if (motivo == MotivoMovimentacao.CADASTRO_INICIAL) {
            throw new BusinessException("The CADASTRO_INICIAL reason cannot be selected manually.");
        }

        if (motivo == MotivoMovimentacao.PERDA_AVARIA && tipo != TipoMovimentacao.SAIDA) {
            throw new BusinessException("Loss / damage can only be used for outbound movements.");
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

    private LocalDateTime definirInicio(LocalDate data, LocalDate dataInicio) {
        if (data != null) {
            return data.atStartOfDay();
        }

        if (dataInicio != null) {
            return dataInicio.atStartOfDay();
        }

        return LocalDate.of(1900, 1, 1).atStartOfDay();
    }

    private LocalDateTime definirFim(LocalDate data, LocalDate dataFim) {
        if (data != null) {
            return data.atTime(LocalTime.MAX);
        }

        if (dataFim != null) {
            return dataFim.atTime(LocalTime.MAX);
        }

        return LocalDate.of(9999, 12, 31).atTime(LocalTime.MAX);
    }

    private int limitarSize(int size) {
        if (size > 100) {
            return 100;
        }

        return Math.max(size, 1);
    }

    private Sort criarSort(String sort) {
        if (sort == null || sort.isBlank()) {
            return Sort.by(Sort.Direction.DESC, "dataHora");
        }

        String[] partes = sort.split(",");

        String campo = partes[0].trim();
        String direcao = partes.length > 1 ? partes[1].trim() : "desc";

        if (!campoPermitidoParaOrdenacao(campo)) {
            campo = "dataHora";
        }

        Sort.Direction direction = "asc".equalsIgnoreCase(direcao)
                ? Sort.Direction.ASC
                : Sort.Direction.DESC;

        return Sort.by(direction, campo);
    }

    private boolean campoPermitidoParaOrdenacao(String campo) {
        return campo.equals("dataHora")
                || campo.equals("tipo")
                || campo.equals("quantidade")
                || campo.equals("motivo")
                || campo.equals("createdAt");
    }

    private String normalizarSearch(String search) {
        if (search == null || search.trim().isBlank()) {
            return null;
        }

        return search.trim();
    }

    private String normalizarTextoOpcional(String texto) {
        if (texto == null || texto.trim().isBlank()) {
            return null;
        }

        return texto.trim();
    }
}
