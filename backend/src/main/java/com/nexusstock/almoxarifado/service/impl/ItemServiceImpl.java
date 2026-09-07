package com.nexusstock.almoxarifado.service.impl;

import com.nexusstock.almoxarifado.dto.mapper.ItemMapper;
import com.nexusstock.almoxarifado.dto.request.ItemCreateRequestDTO;
import com.nexusstock.almoxarifado.dto.request.ItemUpdateRequestDTO;
import com.nexusstock.almoxarifado.dto.response.ItemResponseDTO;
import com.nexusstock.almoxarifado.dto.response.PagedResponseDTO;
import com.nexusstock.almoxarifado.entity.CategoriaProduto;
import com.nexusstock.almoxarifado.entity.Fornecedor;
import com.nexusstock.almoxarifado.entity.Item;
import com.nexusstock.almoxarifado.entity.MovimentacaoEstoque;
import com.nexusstock.almoxarifado.entity.Usuario;
import com.nexusstock.almoxarifado.enums.MotivoMovimentacao;
import com.nexusstock.almoxarifado.enums.StatusEstoque;
import com.nexusstock.almoxarifado.enums.TipoMovimentacao;
import com.nexusstock.almoxarifado.exception.BusinessException;
import com.nexusstock.almoxarifado.exception.DuplicateResourceException;
import com.nexusstock.almoxarifado.exception.ResourceNotFoundException;
import com.nexusstock.almoxarifado.repository.CategoriaProdutoRepository;
import com.nexusstock.almoxarifado.repository.ItemRepository;
import com.nexusstock.almoxarifado.repository.MovimentacaoEstoqueRepository;
import com.nexusstock.almoxarifado.repository.UsuarioRepository;
import com.nexusstock.almoxarifado.service.EstoqueCalculoService;
import com.nexusstock.almoxarifado.service.EstoqueValorHistoricoService;
import com.nexusstock.almoxarifado.service.FornecedorService;
import com.nexusstock.almoxarifado.service.ItemService;
import com.nexusstock.almoxarifado.util.SkuUtils;
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
import java.text.Normalizer;
import java.time.LocalDateTime;
import java.util.Locale;

@Service
@RequiredArgsConstructor
public class ItemServiceImpl implements ItemService {

    private final ItemRepository itemRepository;
    private final CategoriaProdutoRepository categoriaProdutoRepository;
    private final FornecedorService fornecedorService;
    private final EstoqueCalculoService estoqueCalculoService;
    private final MovimentacaoEstoqueRepository movimentacaoRepository;
    private final UsuarioRepository usuarioRepository;
    private final EstoqueValorHistoricoService estoqueValorHistoricoService;

    @Override
    @Transactional(readOnly = true)
    public PagedResponseDTO<ItemResponseDTO> listar(
            String search,
            String categoria,
            StatusEstoque status,
            Boolean ativo,
            int page,
            int size,
            String sort
    ) {
        boolean respostaRestritaParaSolicitante = usuarioAtualEhSolicitante();
        String categoriaAplicada = respostaRestritaParaSolicitante ? null : categoria;
        StatusEstoque statusAplicado = respostaRestritaParaSolicitante ? null : status;
        String sortAplicado = respostaRestritaParaSolicitante ? "nome,asc" : sort;

        Pageable pageable = PageRequest.of(page, limitarSize(size), criarSort(sortAplicado));

        String searchNormalizado = normalizarSearch(search);

        Page<Item> itens = respostaRestritaParaSolicitante
                ? itemRepository.buscarPorNomeParaSolicitante(searchNormalizado, ativo, pageable)
                : itemRepository.buscarComFiltros(
                        searchNormalizado,
                        categoriaAplicada,
                        statusAplicado != null ? statusAplicado.name() : null,
                        ativo,
                        pageable
                );

        return PagedResponseDTO.<ItemResponseDTO>builder()
                .content(itens.getContent()
                        .stream()
                        .map(this::toResponseParaUsuarioAtual)
                        .toList())
                .page(itens.getNumber())
                .size(itens.getSize())
                .totalElements(itens.getTotalElements())
                .totalPages(itens.getTotalPages())
                .first(itens.isFirst())
                .last(itens.isLast())
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public ItemResponseDTO buscarPorId(Long id) {
        Item item = buscarEntidadePorId(id);
        return toResponseParaUsuarioAtual(item);
    }

    @Override
    @Transactional(readOnly = true)
    public ItemResponseDTO buscarPorSku(String sku) {
        String skuNormalizado = SkuUtils.normalizar(sku);

        Item item = itemRepository.findBySku(skuNormalizado)
                .orElseThrow(() -> new ResourceNotFoundException("Item not found."));

        return toResponseParaUsuarioAtual(item);
    }

    @Override
    @Transactional
    public ItemResponseDTO criar(ItemCreateRequestDTO request) {
        String skuNormalizado = normalizarOuGerarSkuUnico(request.getSku(), request.getNome());

        if (itemRepository.existsBySku(skuNormalizado)) {
            throw new DuplicateResourceException("An item with this SKU already exists.");
        }

        Usuario usuario = buscarUsuarioAutenticado();

        Fornecedor fornecedor = fornecedorService.buscarEntidadePorId(request.getFornecedorId());

        if (!Boolean.TRUE.equals(fornecedor.getAtivo())) {
            throw new BusinessException("An inactive supplier cannot be linked to an item.");
        }

        Item item = new Item();
        item.setNome(request.getNome().trim());
        item.setSku(skuNormalizado);
        item.setCategoria(normalizarCategoria(request.getCategoria()));
        item.setUnidade(request.getUnidade());
        item.setFornecedor(fornecedor);
        String localizacaoNormalizada = normalizarLocalizacaoItem(request.getLocalizacao(), request.getCorredor(), request.getPrateleira());
        item.setLocalizacao(localizacaoNormalizada);
        item.setCorredor(normalizarCampoLegadoLocalizacao(request.getCorredor()));
        item.setPrateleira(normalizarCampoLegadoLocalizacao(request.getPrateleira()));
        item.setQuantidadeAtual(request.getQuantidadeInicial());
        item.setEstoqueMinimo(request.getEstoqueMinimo());
        item.setPrecoMedio(request.getPrecoMedio());
        item.setDataValidade(request.getDataValidade());
        item.setDiasAvisoValidade(normalizarDiasAvisoValidade(request.getDiasAvisoValidade()));
        item.setImagemUrl(normalizarTextoOpcional(request.getImagemUrl()));
        item.setAtivo(true);

        Item itemSalvo = itemRepository.save(item);

        if (request.getQuantidadeInicial().compareTo(BigDecimal.ZERO) > 0) {
            registrarMovimentacaoCadastroInicial(itemSalvo, usuario, request.getQuantidadeInicial());
        }

        estoqueValorHistoricoService.registrarSnapshot("ITEM_CADASTRADO");

        return ItemMapper.toResponse(itemSalvo, estoqueCalculoService);
    }

    @Override
    @Transactional
    public ItemResponseDTO atualizar(Long id, ItemUpdateRequestDTO request) {
        Item item = buscarEntidadePorId(id);

        Fornecedor fornecedor = fornecedorService.buscarEntidadePorId(request.getFornecedorId());

        if (!Boolean.TRUE.equals(fornecedor.getAtivo())) {
            throw new BusinessException("An inactive supplier cannot be linked to an item.");
        }

        item.setNome(request.getNome().trim());
        item.setCategoria(normalizarCategoria(request.getCategoria()));
        item.setUnidade(request.getUnidade());
        item.setFornecedor(fornecedor);
        String localizacaoNormalizada = normalizarLocalizacaoItem(request.getLocalizacao(), request.getCorredor(), request.getPrateleira());
        item.setLocalizacao(localizacaoNormalizada);
        item.setCorredor(normalizarCampoLegadoLocalizacao(request.getCorredor()));
        item.setPrateleira(normalizarCampoLegadoLocalizacao(request.getPrateleira()));
        item.setEstoqueMinimo(request.getEstoqueMinimo());
        item.setPrecoMedio(request.getPrecoMedio());
        item.setDataValidade(request.getDataValidade());
        item.setDiasAvisoValidade(normalizarDiasAvisoValidade(request.getDiasAvisoValidade()));
        item.setImagemUrl(normalizarTextoOpcional(request.getImagemUrl()));

        Item itemAtualizado = itemRepository.save(item);

        return ItemMapper.toResponse(itemAtualizado, estoqueCalculoService);
    }

    @Override
    @Transactional
    public void desativar(Long id) {
        Item item = buscarEntidadePorId(id);

        if (!Boolean.TRUE.equals(item.getAtivo())) {
            return;
        }

        item.setAtivo(false);
        itemRepository.save(item);
        estoqueValorHistoricoService.registrarSnapshot("ITEM_DESATIVADO");
    }

    @Override
    @Transactional
    public void reativar(Long id) {
        Item item = buscarEntidadePorId(id);

        if (Boolean.TRUE.equals(item.getAtivo())) {
            return;
        }

        item.setAtivo(true);
        itemRepository.save(item);
        estoqueValorHistoricoService.registrarSnapshot("ITEM_REATIVADO");
    }
    @Override
    @Transactional
    public void excluir(Long id) {
        desativar(id);
    }


    @Override
    @Transactional(readOnly = true)
    public Item buscarEntidadePorId(Long id) {
        return itemRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Item not found."));
    }
    private String normalizarLocalizacaoItem(String localizacao, String corredor, String prateleira) {
        if (localizacao != null && !localizacao.isBlank()) {
            return localizacao.trim();
        }

        if (corredor != null && !corredor.isBlank() && prateleira != null && !prateleira.isBlank()) {
            return "Aisle " + corredor.trim() + " - Shelf " + prateleira.trim();
        }

        throw new BusinessException("The item location is required.");
    }

    private String normalizarCampoLegadoLocalizacao(String valor) {
        if (valor == null || valor.isBlank()) {
            return "-";
        }

        return valor.trim();
    }
    private String normalizarOuGerarSkuUnico(String skuInformado, String nomeItem) {
        if (skuInformado != null && !skuInformado.isBlank()) {
            return SkuUtils.normalizar(skuInformado);
        }

        String base = gerarBaseSkuAutomatico(nomeItem);
        String candidato = base;
        int contador = 1;

        while (itemRepository.existsBySku(candidato)) {
            contador++;
            candidato = base + "-" + String.format("%03d", contador);
        }

        return candidato;
    }

    private String gerarBaseSkuAutomatico(String nomeItem) {
        String texto = nomeItem == null ? "" : nomeItem.trim();

        if (texto.isBlank()) {
            texto = "ITEM";
        }

        texto = Normalizer.normalize(texto, Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "")
                .toUpperCase(Locale.ROOT)
                .replaceAll("[^A-Z0-9]+", "-")
                .replaceAll("^-+", "")
                .replaceAll("-+$", "");

        if (texto.isBlank()) {
            texto = "ITEM";
        }

        if (texto.length() > 36) {
            texto = texto.substring(0, 36).replaceAll("-+$", "");
        }

        return "ITEM-" + texto;
    }


    private void registrarMovimentacaoCadastroInicial(
            Item item,
            Usuario usuario,
            BigDecimal quantidadeInicial
    ) {
        MovimentacaoEstoque movimentacao = new MovimentacaoEstoque();
        movimentacao.setItem(item);
        movimentacao.setUsuario(usuario);
        movimentacao.setTipo(TipoMovimentacao.ENTRADA);
        movimentacao.setQuantidade(quantidadeInicial);
        movimentacao.setMotivo(MotivoMovimentacao.CADASTRO_INICIAL);
        movimentacao.setObservacao("Automatic movement generated from the item's initial stock.");
        movimentacao.setDataHora(LocalDateTime.now());
        movimentacao.setSaldoAnterior(BigDecimal.ZERO);
        movimentacao.setSaldoPosterior(quantidadeInicial);

        movimentacaoRepository.save(movimentacao);
    }

    private ItemResponseDTO toResponseParaUsuarioAtual(Item item) {
        if (usuarioAtualEhSolicitante()) {
            return ItemMapper.toSolicitanteResponse(item);
        }

        return ItemMapper.toResponse(item, estoqueCalculoService);
    }

    private boolean usuarioAtualEhSolicitante() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        if (authentication == null || authentication.getAuthorities() == null) {
            return false;
        }

        return authentication.getAuthorities().stream()
                .anyMatch(authority -> "ROLE_SOLICITANTE".equals(authority.getAuthority()));
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

    private int limitarSize(int size) {
        if (size > 100) {
            return 100;
        }

        return Math.max(size, 1);
    }

    private Sort criarSort(String sort) {
        if (sort == null || sort.isBlank()) {
            return Sort.by(Sort.Direction.ASC, "nome");
        }

        String[] partes = sort.split(",");

        String campo = partes[0].trim();
        String direcao = partes.length > 1 ? partes[1].trim() : "asc";

        if (!campoPermitidoParaOrdenacao(campo)) {
            campo = "nome";
        }

        Sort.Direction direction = "desc".equalsIgnoreCase(direcao)
                ? Sort.Direction.DESC
                : Sort.Direction.ASC;

        return Sort.by(direction, campo);
    }

    private boolean campoPermitidoParaOrdenacao(String campo) {
        return campo.equals("nome")
                || campo.equals("sku")
                || campo.equals("categoria")
                || campo.equals("quantidadeAtual")
                || campo.equals("estoqueMinimo")
                || campo.equals("precoMedio")
                || campo.equals("createdAt")
                || campo.equals("updatedAt");
    }

    private String normalizarSearch(String search) {
        if (search == null || search.trim().isBlank()) {
            return null;
        }

        return search.trim();
    }

    private String normalizarCategoria(String categoria) {
        if (categoria == null || categoria.trim().isBlank()) {
            throw new BusinessException("The item category is required.");
        }

        CategoriaProduto categoriaEncontrada = categoriaProdutoRepository
                .findByNomeIgnoreCase(categoria.trim())
                .orElseThrow(() -> new BusinessException("The selected category does not exist."));

        if (!Boolean.TRUE.equals(categoriaEncontrada.getAtivo())) {
            throw new BusinessException("An inactive category cannot be linked to an item.");
        }

        return categoriaEncontrada.getNome();
    }



    private Integer normalizarDiasAvisoValidade(Integer diasAvisoValidade) {
        if (diasAvisoValidade == null) {
            return 30;
        }

        if (diasAvisoValidade < 0) {
            throw new BusinessException("The expiration warning period cannot be negative.");
        }

        return diasAvisoValidade;
    }

    private String normalizarTextoOpcional(String texto) {
        if (texto == null || texto.trim().isBlank()) {
            return null;
        }

        return texto.trim();
    }
}
