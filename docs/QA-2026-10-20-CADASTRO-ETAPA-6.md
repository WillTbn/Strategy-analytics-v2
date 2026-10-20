# Cadastro — Etapa 6: Contatos de confiança

20/10/2026. Figma BaDXlWpxbIoY4azOaQnXgv, nó 9:25883. Rota publicada: /cadastro/etapa-6.

## Tela e reutilização

Somente Nome completo do contato e Telefone do contato em linha, Adicionar outro contato, Não possuo contato de confiança e Voltar/Continuar. Orientação, progresso 6/7, card 760 px e gradientes do desenho. Nenhum parentesco, e-mail, remoção ou seletor de país.

Reutilizados RegistrationShell, RegistrationDocumentField (primitiva neutra por props, com LabelField/inputWhite), logo/máscara e seta locais. Asset plus do Figma baixado com 16 × 16. Campo compartilhado aceita rótulo acessível por contato e tipo/inputmode tel; os demais tipos mantêm comportamento. Nomes visíveis permanecem os do desenho, com índice somente no rótulo acessível das linhas adicionais.

## Validação executada

- 98 testes aprovados, incluindo sete novos cenários: campos, vazio/ausência, registros incompletos, ausência reversível, adição, telefone internacional e isolamento do rascunho. Rota verificada para DEV true/false.
- Lint, build e diff do lote aprovados.
- Nome/telefone exigidos em registros iniciados; formulário sem contato exige entrada ou ausência explícita. Erros independentes e foco no primeiro campo afetado.
- Adicionar exige completar os registros anteriores. Não acrescenta repetidamente linhas vazias; linha adicional totalmente vazia não bloqueia, evitando remoção fora do Figma.
- Ausência desabilita todos os campos e a adição, ignora validações dos rascunhos e preserva os dados para desmarcar. Não executa exclusão nem perde a declaração local.
- Telefone aceita caracteres usuais e código internacional, sem impor tamanho, +55, sobrenomes ou unicidade não documentados. Nenhuma normalização silenciosa; regras definitivas aguardam contrato.
- Navegador: vazio, contato sem telefone, segundo contato com campos acessíveis distintos, ausência/desmarcar, dados preservados ao voltar à etapa 5 e retornar. Foram usados somente nomes de teste e números fictícios, sem envio HTTP.
- Desktop e celular 390 × 844 sem overflow horizontal com dois contatos. Assets carregados: logo 152 × 32,773 no slot 152 × 48, plus 16 × 16 e seta 24 × 24. Viewport restaurado ao final.

O rascunho usa apenas memória da página; sem storage, URL, logs ou dados iniciais fictícios. Recarregar limpa o contexto. Continuar mantém a etapa e informa a falta de integração; não simula sucesso/avanço.

## Pendências da API

Serviços de contatos existentes em clientProfileService permanecem preservados. UpsertClientTrustedContactRequest exige relationship e email anulável, mas o Figma tem somente nome/telefone. Não se inventou parentesco ou endpoint. Falta definir ausência declarada/reversão, múltiplos contatos/limites, falha parcial/reenvio, normalização/país do telefone e progresso/retomada até a revisão da etapa 7. Nenhum contato real foi criado, alterado ou removido.

Checklist e pendências consolidados no Admin atualizados. A etapa 7 é a próxima implementação incremental.
