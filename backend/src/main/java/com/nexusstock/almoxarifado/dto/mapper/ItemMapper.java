package com.nexusstock.almoxarifado.dto.mapper;

import com.nexusstock.almoxarifado.dto.response.ItemResponseDTO;
import com.nexusstock.almoxarifado.dto.response.ItemResumoResponseDTO;
import com.nexusstock.almoxarifado.entity.Item;
import com.nexusstock.almoxarifado.enums.StatusEstoque;
import com.nexusstock.almoxarifado.service.EstoqueCalculoService;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;

public final class ItemMapper {

    private ItemMapper() {
    }

    public static ItemResponseDTO toResponse(Item item, EstoqueCalculoService estoqueCalculoService) {
        StatusEstoque status = estoqueCalculoService.calcularStatus(
                item.getQuantidadeAtual(),
                item.getEstoqueMinimo()
        );

        BigDecimal valorEmEstoque = estoqueCalculoService.calcularValorEmEstoque(
                item.getQuantidadeAtual(),
                item.getPrecoMedio()
        );

        LocalDate hoje = LocalDate.now();
        LocalDate dataValidade = item.getDataValidade();
        Integer diasAviso = item.getDiasAvisoValidade() == null ? 30 : item.getDiasAvisoValidade();

        Boolean possuiValidade = dataValidade != null;
        Long diasParaVencer = possuiValidade ? ChronoUnit.DAYS.between(hoje, dataValidade) : null;
        Boolean validadeVencida = possuiValidade && diasParaVencer < 0;
        Boolean validadeEmAlerta = possuiValidade && !validadeVencida && diasParaVencer <= diasAviso;

        return ItemResponseDTO.builder()
                .id(item.getId())
                .nome(item.getNome())
                .sku(item.getSku())
                .categoria(item.getCategoria())
                .categoriaLabel(item.getCategoria())
                .unidade(item.getUnidade())
                .unidadeLabel(item.getUnidade().getLabel())
                .fornecedorId(item.getFornecedor().getId())
                .fornecedorNome(item.getFornecedor().getNome())
                .corredor(item.getCorredor())
                .prateleira(item.getPrateleira())
                .localizacao(limparLocalizacaoResposta(item.getLocalizacao()))
                .localizacaoFormatada(formatarLocalizacao(item))
                .quantidadeAtual(item.getQuantidadeAtual())
                .estoqueMinimo(item.getEstoqueMinimo())
                .precoMedio(item.getPrecoMedio())
                .valorEmEstoque(valorEmEstoque)
                .dataValidade(dataValidade)
                .diasAvisoValidade(diasAviso)
                .possuiValidade(possuiValidade)
                .validadeEmAlerta(validadeEmAlerta)
                .validadeVencida(validadeVencida)
                .diasParaVencer(diasParaVencer)
                .statusEstoque(status)
                .statusEstoqueLabel(status.getLabel())
                .abaixoDoMinimo(status == StatusEstoque.ABAIXO_MINIMO || status == StatusEstoque.ZERADO)
                .imagemUrl(item.getImagemUrl())
                .ativo(item.getAtivo())
                .createdAt(item.getCreatedAt())
                .updatedAt(item.getUpdatedAt())
                .build();
    }


    public static ItemResponseDTO toSolicitanteResponse(Item item) {
        return ItemResponseDTO.builder()
                .id(item.getId())
                .nome(item.getNome())
                .sku(item.getSku())
                .unidade(item.getUnidade())
                .unidadeLabel(item.getUnidade().getLabel())
                .ativo(item.getAtivo())
                .createdAt(item.getCreatedAt())
                .updatedAt(item.getUpdatedAt())
                .build();
    }

    public static ItemResumoResponseDTO toResumo(Item item, EstoqueCalculoService estoqueCalculoService) {
        StatusEstoque status = estoqueCalculoService.calcularStatus(
                item.getQuantidadeAtual(),
                item.getEstoqueMinimo()
        );

        return ItemResumoResponseDTO.builder()
                .id(item.getId())
                .nome(item.getNome())
                .sku(item.getSku())
                .quantidadeAtual(item.getQuantidadeAtual())
                .estoqueMinimo(item.getEstoqueMinimo())
                .statusEstoque(status)
                .statusEstoqueLabel(status.getLabel())
                .fornecedorNome(item.getFornecedor().getNome())
                .localizacaoFormatada(formatarLocalizacao(item))
                .build();
    }

    private static String formatarLocalizacao(Item item) {
        String localizacao = limparLocalizacaoResposta(item.getLocalizacao());

        if (localizacao != null && !localizacao.isBlank()) {
            return localizacao;
        }

        String corredor = limparLocalizacaoResposta(item.getCorredor());
        String prateleira = limparLocalizacaoResposta(item.getPrateleira());

        if ((corredor == null || corredor.isBlank()) && (prateleira == null || prateleira.isBlank())) {
            return "Location not specified";
        }

        return "Aisle " + corredor + " - Shelf " + prateleira;
    }

    private static String limparLocalizacaoResposta(String valor) {
        if (valor == null) {
            return null;
        }

        String texto = valor.trim();

        if (texto.isBlank()) {
            return null;
        }

        String normalizado = texto
                .toLowerCase()
                .replace("–", "-")
                .replace("—", "-")
                .replaceAll("\\s+", " ")
                .trim();

        String compacto = normalizado.replace(" ", "");

        if (
                normalizado.equals("-") ||
                normalizado.equals("--") ||
                normalizado.equals("corredor - - prateleira -") ||
                normalizado.equals("corredor - prateleira -") ||
                compacto.equals("corredor--prateleira-") ||
                compacto.equals("corredor-prateleira-") ||
                compacto.equals("corredor-prateleira")
        ) {
            return null;
        }

        return texto;
    }
}
