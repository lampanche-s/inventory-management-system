package com.nexusstock.almoxarifado.dto.request;

import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;

class RequestDtoValidationTests {

    private final Validator validator = Validation.buildDefaultValidatorFactory().getValidator();

    @Test
    void rejeitaQuantidadeComMaisDeTresCasasDecimais() {
        MovimentacaoRequestDTO movimentacao = new MovimentacaoRequestDTO();
        movimentacao.setQuantidade(new BigDecimal("1.0001"));

        SolicitacaoMovimentacaoRequestDTO solicitacao = new SolicitacaoMovimentacaoRequestDTO();
        solicitacao.setQuantidade(new BigDecimal("1.0001"));

        SolicitacaoMovimentacaoLoteItemRequestDTO itemDoLote = new SolicitacaoMovimentacaoLoteItemRequestDTO();
        itemDoLote.setQuantidade(new BigDecimal("1.0001"));

        assertThat(propriedadesInvalidas(movimentacao)).contains("quantidade");
        assertThat(propriedadesInvalidas(solicitacao)).contains("quantidade");
        assertThat(propriedadesInvalidas(itemDoLote)).contains("quantidade");
    }

    @Test
    void rejeitaValoresDeItemQueNaoCabemNasColunasNumericas() {
        ItemCreateRequestDTO item = new ItemCreateRequestDTO();
        item.setCategoria("   ");
        item.setQuantidadeInicial(new BigDecimal("1234567890123.000"));
        item.setEstoqueMinimo(new BigDecimal("1.0001"));
        item.setPrecoMedio(new BigDecimal("1.001"));

        assertThat(propriedadesInvalidas(item))
                .contains("categoria", "quantidadeInicial", "estoqueMinimo", "precoMedio");
    }

    @Test
    void rejeitaCategoriaLongaEPrecisaoInvalidaNaAtualizacao() {
        ItemUpdateRequestDTO item = new ItemUpdateRequestDTO();
        item.setCategoria("C".repeat(81));
        item.setEstoqueMinimo(new BigDecimal("1234567890123.000"));
        item.setPrecoMedio(new BigDecimal("12345678901234.00"));

        assertThat(propriedadesInvalidas(item))
                .contains("categoria", "estoqueMinimo", "precoMedio");
    }

    @Test
    void mantemMinimoDeSeisCaracteresSemFalsoLimiteSuperiorPorCaracteres() {
        UsuarioCreateRequestDTO criacao = new UsuarioCreateRequestDTO();
        criacao.setSenha("12345");

        UsuarioUpdateRequestDTO atualizacao = new UsuarioUpdateRequestDTO();
        atualizacao.setSenha("12345");

        AlterarMinhaSenhaRequestDTO alteracao = new AlterarMinhaSenhaRequestDTO();
        alteracao.setNovaSenha("12345");

        assertThat(propriedadesInvalidas(criacao)).contains("senha");
        assertThat(propriedadesInvalidas(atualizacao)).contains("senha");
        assertThat(propriedadesInvalidas(alteracao)).contains("novaSenha");

        criacao.setSenha("a".repeat(81));
        atualizacao.setSenha("a".repeat(81));
        alteracao.setNovaSenha("a".repeat(81));

        assertThat(propriedadesInvalidas(criacao)).doesNotContain("senha");
        assertThat(propriedadesInvalidas(atualizacao)).doesNotContain("senha");
        assertThat(propriedadesInvalidas(alteracao)).doesNotContain("novaSenha");
    }

    @Test
    void aceitaFornecedorComSomenteNome() {
        FornecedorRequestDTO fornecedor = new FornecedorRequestDTO();
        fornecedor.setNome("Local maintenance company");

        assertThat(propriedadesInvalidas(fornecedor)).isEmpty();
    }

    @Test
    void rejeitaScoreComPrecisaoMaiorQueADoBanco() {
        FornecedorRequestDTO fornecedor = new FornecedorRequestDTO();
        fornecedor.setScore(new BigDecimal("99.999"));

        assertThat(propriedadesInvalidas(fornecedor)).contains("score");
    }

    private Set<String> propriedadesInvalidas(Object objeto) {
        return validator.validate(objeto).stream()
                .map(ConstraintViolation::getPropertyPath)
                .map(Object::toString)
                .collect(java.util.stream.Collectors.toSet());
    }
}
