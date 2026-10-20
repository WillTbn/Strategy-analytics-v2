# Cadastro — Etapa 4: Documento e endereço

20/10/2026. Figma BaDXlWpxbIoY4azOaQnXgv: Brasil 6:25690 e variações 37:27142, 37:27262, 37:27382, 37:27502, 37:27622, 37:27742 e 37:27862.

## Entrega para homologação

Rota /cadastro/etapa-4 (Brasil), com variações /br, /us-ca, /south-america, /jp, /cn, /europe, /africa e /au. O parâmetro escolhe o frame de conferência; não é countryId nem residência de cliente autenticado. Não há seletor extra. O frame EUA/Canadá mostra EUA; os regionais usam Argentina, Portugal e África do Sul, sem inventar variantes ou estender regras a países não desenhados.

RegistrationShell, LabelField, inputWhite, Quasar e os assets existentes foram reutilizados. Extraídas primitivas de campo e seleção de arquivo. Chevron 18 × 18, upload baixado do Figma 28 × 28, seta 24 × 24 e logo/máscara existentes nos tamanhos originais. Gradientes próprios de cada frame; card 760 px, duas colunas desktop e uma no celular.

As opções de tipo são chaves de apresentação, sem tradução presumida para IDs HTTP. Passaporte usa número, país emissor, expedição e validade conforme o texto do desenho, com um arquivo da página de dados. Os campos/arquivos de cada tipo ficam separados em memória. Brasil tem Filiação 1/2 e ausência reversível; não se assume mãe/pai pela ordem.

## Validação executada

- 85 testes aprovados (oito novos cenários): campos por variação, passaporte, três formatos de calendário, coerência de datas, dados inativos, chaves inválidas, seleção de arquivo e isolamento dos rascunhos.
- Lint, build e git diff do lote aprovados. Etapa 4 incluída no build publicado.
- Conferidas as oito telas no desktop e Brasil/Japão em 390 × 844 sem overflow horizontal. Assets locais presentes e dimensões renderizadas conferidas; bandeiras usam a fonte local existente.
- Ausência de filiação desabilita entrada e permite recuperar o nome ao desmarcar. Calendário inválido mostra erro e foca o campo. Datas não são convertidas silenciosamente entre formatos.
- Testada seleção pelo diálogo com arquivo fictício não vazio e arquivo vazio: vazio recusado, seleção válida identificada como local/ainda não enviada. Troca para passaporte não reaproveita o arquivo da frente; voltar para identificação restaura sua seleção. Nenhum arquivo foi enviado ao servidor.
- Voltar abre etapa 3. Retorno pelo histórico preserva rascunho e File em memória; recarregar a página limpa o contexto. Sem armazenamento, URL, logs ou leitura de conteúdo dos arquivos.
- Consulta postal indisponível tem aviso ao sair do campo, preservando entrada manual. Não foi adicionado serviço terceiro. Tipos/limites de arquivo aceitam regras externas; não se impôs um limite genérico do upload legado.

## Pendências

Sessão, país real/agrupamentos, regiões/países emissores, número fiscal, filiação/ausência, endereço separado, consulta postal Brasil/Japão, tipo/ID/metadados, obrigatórios/formatos/limites/MIME e progresso/retomada. Os serviços existentes de tipos, data-definition e uploadClientDocument permanecem disponíveis para integração quando o mapeamento do onboarding estiver confirmado. O upload multipart aceita um file; falta definir o vínculo frente/verso/reenvio sem duplicação.

Continuar mostra que dados e arquivos permanecem nesta etapa, sem simular gravação/avanço. Não foi usado o DocumentUpload legado, que simula upload e adiciona ações fora do desenho. Cadastro e perfil integrados anteriores preservados. Checklist e pendências consolidados no Admin. Próxima implementação incremental: etapa 5.
