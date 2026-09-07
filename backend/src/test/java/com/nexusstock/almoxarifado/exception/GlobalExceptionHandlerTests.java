package com.nexusstock.almoxarifado.exception;

import com.nexusstock.almoxarifado.dto.response.ErrorResponseDTO;
import org.junit.jupiter.api.Test;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.mock.web.MockHttpServletRequest;

import static org.assertj.core.api.Assertions.assertThat;

class GlobalExceptionHandlerTests {

    private final GlobalExceptionHandler handler = new GlobalExceptionHandler();

    @Test
    void respondeConflictQuandoRecursoContinuaEmUso() {
        MockHttpServletRequest request = new MockHttpServletRequest("DELETE", "/api/v1/categorias/5");

        ResponseEntity<ErrorResponseDTO> response = handler.handleResourceInUseException(
                new ResourceInUseException("Category is linked."),
                request
        );

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().getMessage()).isEqualTo("Category is linked.");
        assertThat(response.getBody().getPath()).isEqualTo("/api/v1/categorias/5");
    }

    @Test
    void respondeConflictParaViolacaoReferencialConcorrente() {
        MockHttpServletRequest request = new MockHttpServletRequest("DELETE", "/api/v1/fornecedores/2");

        ResponseEntity<ErrorResponseDTO> response = handler.handleDataIntegrityViolationException(
                new DataIntegrityViolationException("foreign key violation"),
                request
        );

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().getMessage())
                .isEqualTo("The operation conflicts with existing or linked data.");
    }
}
