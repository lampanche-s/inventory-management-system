package com.nexusstock.almoxarifado.service.impl;

import com.nexusstock.almoxarifado.dto.mapper.FornecedorMapper;
import com.nexusstock.almoxarifado.dto.mapper.ItemMapper;
import com.nexusstock.almoxarifado.dto.request.FornecedorRequestDTO;
import com.nexusstock.almoxarifado.dto.response.FornecedorResponseDTO;
import com.nexusstock.almoxarifado.dto.response.FornecedorResumoResponseDTO;
import com.nexusstock.almoxarifado.dto.response.ItemResponseDTO;
import com.nexusstock.almoxarifado.dto.response.PagedResponseDTO;
import com.nexusstock.almoxarifado.dto.response.PrincipalItemFornecedorResponseDTO;
import com.nexusstock.almoxarifado.entity.Fornecedor;
import com.nexusstock.almoxarifado.entity.Item;
import com.nexusstock.almoxarifado.exception.BusinessException;
import com.nexusstock.almoxarifado.exception.ResourceNotFoundException;
import com.nexusstock.almoxarifado.repository.FornecedorRepository;
import com.nexusstock.almoxarifado.repository.ItemRepository;
import com.nexusstock.almoxarifado.service.EstoqueCalculoService;
import com.nexusstock.almoxarifado.service.FornecedorService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Service
@RequiredArgsConstructor
public class FornecedorServiceImpl implements FornecedorService {

    private static final String FORNECEDOR_NEUTRO_ATUAL = "Not specified";
    private static final String FORNECEDOR_NEUTRO_ORIGINAL = "Sem fornecedor";

    private final FornecedorRepository fornecedorRepository;
    private final ItemRepository itemRepository;
    private final EstoqueCalculoService estoqueCalculoService;

    @Override
    @Transactional(readOnly = true)
    public List<FornecedorResponseDTO> listar() {
        return fornecedorRepository.findByAtivoTrueOrderByNomeAsc()
                .stream()
                .map(FornecedorMapper::toResponse)
                .toList();
    }


    @Override
    @Transactional(readOnly = true)
    public PagedResponseDTO<FornecedorResponseDTO> listar(
            String search,
            Boolean ativo,
            int page,
            int size,
            String sort
    ) {
        Pageable pageable = criarPageable(page, size, sort);

        Page<Fornecedor> fornecedores = fornecedorRepository.buscarComFiltros(
                normalizarBusca(search),
                normalizarBuscaDocumento(search),
                ativo,
                pageable
        );

        return montarRespostaPaginada(fornecedores);
    }
    @Override
    @Transactional(readOnly = true)
    public FornecedorResponseDTO buscarPorId(Long id) {
        Fornecedor fornecedor = buscarEntidadePorId(id);
        return FornecedorMapper.toResponse(fornecedor);
    }

    @Override
    @Transactional(readOnly = true)
    public List<FornecedorResumoResponseDTO> listarResumo() {
        return listarResumo(null, true, 20);
    }

    @Override
    @Transactional(readOnly = true)
    public List<FornecedorResumoResponseDTO> listarResumo(String search, Boolean ativo, int limit) {
        int limiteSeguro = Math.max(1, Math.min(limit, 100));

        Page<Fornecedor> fornecedores = fornecedorRepository.buscarComFiltros(
                normalizarBusca(search),
                normalizarBuscaDocumento(search),
                ativo,
                PageRequest.of(0, limiteSeguro, Sort.by(Sort.Direction.ASC, "nome"))
        );

        return fornecedores.getContent()
                .stream()
                .map(this::montarResumoFornecedor)
                .toList();
    }

    @Override
    @Transactional
    public FornecedorResponseDTO criar(FornecedorRequestDTO request) {
        String documento = normalizarDocumento(request.getCnpj());

        if (documento != null && fornecedorRepository.countByDocumentoNormalizado(documento) > 0) {
            throw new BusinessException("A supplier with this CPF/CNPJ already exists.");
        }

        Fornecedor fornecedor = new Fornecedor();
        preencherFornecedor(fornecedor, request, documento);
        fornecedor.setAtivo(!Boolean.FALSE.equals(request.getAtivo()));

        Fornecedor salvo = fornecedorRepository.save(fornecedor);

        return FornecedorMapper.toResponse(salvo);
    }

    @Override
    @Transactional
    public FornecedorResponseDTO atualizar(Long id, FornecedorRequestDTO request) {
        Fornecedor fornecedor = buscarEntidadePorId(id);
        String documento = normalizarDocumento(request.getCnpj());

        if (documento != null && fornecedorRepository.countByDocumentoNormalizadoAndIdNot(documento, id) > 0) {
            throw new BusinessException("Another supplier with this CPF/CNPJ already exists.");
        }

        if (Boolean.FALSE.equals(request.getAtivo()) && ehFornecedorNeutro(fornecedor)) {
            throw new BusinessException("The system's default supplier cannot be deactivated.");
        }

        preencherFornecedor(fornecedor, request, documento);

        if (request.getAtivo() != null) {
            fornecedor.setAtivo(request.getAtivo());
        }

        Fornecedor atualizado = fornecedorRepository.save(fornecedor);

        return FornecedorMapper.toResponse(atualizado);
    }

    @Override
    @Transactional
    public void excluirDefinitivamente(Long id) {
        Fornecedor fornecedor = buscarEntidadePorId(id);

        if (ehFornecedorNeutro(fornecedor)) {
            throw new BusinessException("The system's default supplier cannot be deleted.");
        }

        Fornecedor fornecedorPadrao = obterFornecedorPadraoSemFornecedor();

        List<Item> itensVinculados = itemRepository.findByFornecedorId(id);

        for (Item item : itensVinculados) {
            item.setFornecedor(fornecedorPadrao);
        }

        itemRepository.saveAll(itensVinculados);

        fornecedorRepository.delete(fornecedor);
    }

    @Override
    @Transactional(readOnly = true)
    public Fornecedor buscarEntidadePorId(Long id) {
        return fornecedorRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Supplier not found."));
    }


    @Override
    @Transactional
    public ItemResponseDTO desvincularItem(Long fornecedorId, Long itemId) {
        Fornecedor fornecedor = buscarEntidadePorId(fornecedorId);

        Item item = itemRepository.findById(itemId)
                .orElseThrow(() -> new ResourceNotFoundException("Item not found."));

        if (item.getFornecedor() == null || !item.getFornecedor().getId().equals(fornecedor.getId())) {
            throw new BusinessException("This item is not linked to this supplier.");
        }

        Fornecedor fornecedorPadrao = obterFornecedorPadraoSemFornecedor();

        item.setFornecedor(fornecedorPadrao);

        Item atualizado = itemRepository.save(item);

        return ItemMapper.toResponse(atualizado, estoqueCalculoService);
    }

    private Fornecedor obterFornecedorPadraoSemFornecedor() {
        return fornecedorRepository.findByNomeIgnoreCase(FORNECEDOR_NEUTRO_ATUAL)
                .or(() -> fornecedorRepository.findByNomeIgnoreCase(FORNECEDOR_NEUTRO_ORIGINAL))
                .orElseGet(() -> {
                    Fornecedor fornecedor = new Fornecedor();

                    fornecedor.setNome(FORNECEDOR_NEUTRO_ATUAL);
                    fornecedor.setCnpj(null);
                    fornecedor.setContato("System");
                    fornecedor.setTelefone(null);
                    fornecedor.setEmail(null);
                    fornecedor.setCidade(null);
                    fornecedor.setCep(null);
                    fornecedor.setLogradouro(null);
                    fornecedor.setBairro(null);
                    fornecedor.setUf(null);
                    fornecedor.setComplemento(null);
                    fornecedor.setScore(BigDecimal.ZERO);
                    fornecedor.setAtivo(true);

                    return fornecedorRepository.save(fornecedor);
                });
    }

    private boolean ehFornecedorNeutro(Fornecedor fornecedor) {
        if (fornecedor == null || fornecedor.getNome() == null) {
            return false;
        }

        return FORNECEDOR_NEUTRO_ATUAL.equalsIgnoreCase(fornecedor.getNome())
                || FORNECEDOR_NEUTRO_ORIGINAL.equalsIgnoreCase(fornecedor.getNome());
    }

    private void preencherFornecedor(Fornecedor fornecedor, FornecedorRequestDTO request, String documento) {
        fornecedor.setNome(request.getNome().trim());
        fornecedor.setCnpj(documento);
        fornecedor.setContato(normalizarTextoOpcional(request.getContato()));
        fornecedor.setTelefone(normalizarTextoOpcional(request.getTelefone()));
        fornecedor.setEmail(normalizarTextoOpcional(request.getEmail()));
        fornecedor.setCidade(normalizarTextoOpcional(request.getCidade()));
        fornecedor.setCep(normalizarTextoOpcional(request.getCep()));
        fornecedor.setLogradouro(normalizarTextoOpcional(request.getLogradouro()));
        fornecedor.setBairro(normalizarTextoOpcional(request.getBairro()));
        fornecedor.setUf(normalizarUfFornecedor(request.getUf()));
        fornecedor.setComplemento(normalizarTextoOpcional(request.getComplemento()));
        fornecedor.setScore(request.getScore() == null ? BigDecimal.ZERO : request.getScore());
    }
    private String normalizarDocumento(String documento) {
        String valor = normalizarTextoOpcional(documento);

        if (valor == null) {
            return null;
        }

        if (!valor.matches("[0-9./\\- ]+")) {
            throw new BusinessException("The CPF/CNPJ must contain only digits and standard punctuation.");
        }

        String somenteDigitos = valor.replaceAll("\\D", "");

        if (somenteDigitos.length() != 11 && somenteDigitos.length() != 14) {
            throw new BusinessException("The CPF/CNPJ must contain exactly 11 or 14 digits.");
        }

        return somenteDigitos;
    }

    private String normalizarUfFornecedor(String uf) {
        String valor = normalizarTextoOpcional(uf);

        if (valor == null) {
            return null;
        }

        return valor.toUpperCase();
    }

    private String normalizarTextoOpcional(String texto) {
        if (texto == null || texto.isBlank()) {
            return null;
        }

        return texto.trim();
    }


    private PagedResponseDTO<FornecedorResponseDTO> montarRespostaPaginada(Page<Fornecedor> page) {
        return PagedResponseDTO.<FornecedorResponseDTO>builder()
                .content(page.getContent().stream().map(FornecedorMapper::toResponse).toList())
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
        return List.of("nome", "cnpj", "contato", "email", "cidade", "uf", "score", "ativo", "createdAt", "updatedAt").contains(campo);
    }

    private String normalizarBusca(String search) {
        if (search == null || search.isBlank()) {
            return "";
        }

        return search.trim();
    }

    private String normalizarBuscaDocumento(String search) {
        if (search == null || search.isBlank()) {
            return "";
        }

        String valor = search.trim();

        if (!valor.matches("[0-9./\\- ]+")) {
            return "";
        }

        String somenteDigitos = valor.replaceAll("\\D", "");
        return somenteDigitos;
    }

    private FornecedorResumoResponseDTO montarResumoFornecedor(Fornecedor fornecedor) {
        Long quantidadeItens = itemRepository.countByFornecedorIdAndAtivoTrue(fornecedor.getId());

        BigDecimal valorTotalEstoque = itemRepository.calcularValorTotalEstoquePorFornecedor(fornecedor.getId());

        List<PrincipalItemFornecedorResponseDTO> principaisItens = itemRepository
                .buscarPrincipaisItensPorFornecedor(fornecedor.getId())
                .stream()
                .limit(5)
                .map(this::toPrincipalItemFornecedor)
                .toList();

        return FornecedorMapper.toResumo(
                fornecedor,
                quantidadeItens,
                valorTotalEstoque,
                principaisItens
        );
    }

    private PrincipalItemFornecedorResponseDTO toPrincipalItemFornecedor(Item item) {
        BigDecimal valorEmEstoque = estoqueCalculoService.calcularValorEmEstoque(
                item.getQuantidadeAtual(),
                item.getPrecoMedio()
        );

        return PrincipalItemFornecedorResponseDTO.builder()
                .id(item.getId())
                .nome(item.getNome())
                .sku(item.getSku())
                .quantidadeAtual(item.getQuantidadeAtual())
                .valorEmEstoque(valorEmEstoque)
                .build();
    }
}
