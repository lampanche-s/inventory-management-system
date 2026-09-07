package com.nexusstock.almoxarifado.dto.mapper;

import com.nexusstock.almoxarifado.dto.response.FornecedorResponseDTO;
import com.nexusstock.almoxarifado.dto.response.FornecedorResumoResponseDTO;
import com.nexusstock.almoxarifado.dto.response.PrincipalItemFornecedorResponseDTO;
import com.nexusstock.almoxarifado.entity.Fornecedor;

import java.math.BigDecimal;
import java.util.List;

public final class FornecedorMapper {

    private FornecedorMapper() {
    }

    public static FornecedorResponseDTO toResponse(Fornecedor fornecedor) {
        return FornecedorResponseDTO.builder()
                .id(fornecedor.getId())
                .nome(fornecedor.getNome())
                .cnpj(fornecedor.getCnpj())
                .contato(fornecedor.getContato())
                .telefone(fornecedor.getTelefone())
                .email(fornecedor.getEmail())
                .cidade(fornecedor.getCidade())
                .cep(fornecedor.getCep())
                .logradouro(fornecedor.getLogradouro())
                .bairro(fornecedor.getBairro())
                .uf(fornecedor.getUf())
                .complemento(fornecedor.getComplemento())
                .score(fornecedor.getScore())
                .ativo(fornecedor.getAtivo())
                .createdAt(fornecedor.getCreatedAt())
                .updatedAt(fornecedor.getUpdatedAt())
                .build();
    }

    public static FornecedorResumoResponseDTO toResumo(
            Fornecedor fornecedor,
            Long quantidadeItens,
            BigDecimal valorTotalEstoque,
            List<PrincipalItemFornecedorResponseDTO> principaisItens
    ) {
        return FornecedorResumoResponseDTO.builder()
                .id(fornecedor.getId())
                .nome(fornecedor.getNome())
                .cnpj(fornecedor.getCnpj())
                .contato(fornecedor.getContato())
                .telefone(fornecedor.getTelefone())
                .email(fornecedor.getEmail())
                .cidade(fornecedor.getCidade())
                .cep(fornecedor.getCep())
                .score(fornecedor.getScore())
                .quantidadeItens(quantidadeItens)
                .valorTotalEstoque(valorTotalEstoque)
                .principaisItens(principaisItens)
                .ativo(fornecedor.getAtivo())
                .build();
    }
}