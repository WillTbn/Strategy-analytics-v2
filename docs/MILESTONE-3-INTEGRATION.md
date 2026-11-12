# Marco 3 — implementação frontend

## Revisão de 12/11 — navegação dos contratos

[Checklist e evidências](https://github.com/Statregy-Analytics/strategy-control/blob/main/docs/QA-2026-11-12-CONTRATOS-NAVEGACAO.md). Corrigidos abertura duplicada, respostas de anexo após trocar contrato/sair, erro residual e consulta com ID de outra rota. Campos, ações e layout preservados; 14 testes específicos e 359 testes totais passaram, com lint/build. Falhas são de front, sem nova demanda de API; bloqueios de valores/documentos do reteste anterior permanecem separados.

## Reteste de 12/11 — perfil e contratos

[Checklist vigente e bloqueios reproduzidos](https://github.com/Statregy-Analytics/strategy-control/blob/main/docs/QA-2026-11-12-RETESTE-PERFIL-CONTRATOS.md). A renda atual persistiu no salvamento/recarga e foi restaurada; nível oficial já existe e concorda entre summary/onboarding/cards. Cabeçalho documental corrigido no front para consumir levelProgress. Não reencaminhar “nível unificado ausente”, renda antiga ou baseAmount ausente. Permanecem contrato encerrado do Cláudio no investido, métricas individuais indisponíveis, versão documental vigente, contagem elegível a esclarecer e campos/tipos/escritas sem contrato discriminados na matriz. Celular não confirmado e documento fiscal ausente são pré-condições da massa.

## Integração de 12/11 — Comunicados e ID Strategy

Checklist e evidências em [Comunicados e transferências](QA-2026-11-12-COMUNICADOS-TRANSFERENCIAS.md). Runtime ef1b6e5 publicado; pipeline 43238570009 aprovada com 342 testes. Homologação no Chromium: 26 verificações com Éric, 26 com Cláudio e três estados controlados de carteira, distinguindo API real de respostas controladas. Transferência real segue em 409 withdrawal_password_not_set ao usar a senha de login; Comunicados positivo aguarda conta nível 2. Período funciona no front; dados de autor/capa/versão/anexos e separação dos grupos do Figma ainda precisam de contrato. Esta rodada não homologa as demais entregas do backend.

> Revisão complementar QA 121–130: reenvio por lado, versão vigente, PIX protegido, dimensões dos níveis, selects/estados de patrimônio e retomada de aba corrigidos. [Matriz e evidências](QA-2026-11-04-PERFIL-DOCUMENTACAO-121-130.md). Regras oficiais de nível e campos/tipos não suportados continuam sem aprovação integrada; não devolver como checklist todo verde.


Atualizado em 13/10/2026. Admin: http://localhost:8080. Portal: http://localhost:9010.
As duas portas são as origens autorizadas pelo CORS do backend.

## Reteste vigente — 04/11 — itens 121–130

Matriz de telas, ações, estados e integração em [Perfil e Documentação 121–130](QA-2026-11-04-PERFIL-DOCUMENTACAO-121-130.md). Inclui tema Aurora, grupos documentais, edição branca na linha e anexos patrimoniais. Níveis, catálogo novo, suítes e compatibilidade do POST com os formulários reduzidos continuam discriminados como contratos pendentes. Runtime portal 988d7fc / pipeline 41930363128 e Admin 82bd3ec / pipeline 41930348144 publicados com sucesso; 318 e 200 testes versionados, respectivamente. Documentação, tema e estados vazios/arquivo retomado conferidos em homologação. Não representa homologação integral do Marco 3.

## Entregue no código

- Admin: contratos com listagem e edição lateral, rascunhos, participantes, status, documentos, ativos elegíveis e histórico. Finalização condicionada aos dados necessários.
- Admin: depósitos, saques e operações de contrato; detalhe com ações permitidas pelo servidor, versão esperada, histórico e ledger.
- Admin: carteira por cliente, composição, exportação do extrato; consulta, edição dos campos comuns, documentos e arquivamento de patrimônio existente.
- Portal: carteira no layout original, com saldos por moeda e resumo de contratos. Tabelas extras de movimentações, extrato e composição retiradas da Home em 13/10 a pedido do usuário. Contratos e documentos liberados mantêm a integração. Veja [encaixe dos dados no layout](WALLET-LAYOUT-INTEGRATION.md).
- Portal: formulário de saque com validação e confirmação, bloqueado quando não existe o identificador de moeda exigido pela API.
- Recursos independentes, recuperação de erro, proteção contra respostas antigas e idempotência preservada nas tentativas de escrita.

## Histórico de lacunas de contrato HTTP — 12/10/2026

**Esta tabela registra a rodada de 12/10; não encaminhar como pendência atual. As revisões datadas no início deste documento prevalecem.**

Não foram inventados valores para campos sem vocabulário publicado no OpenAPI. O usuário informou não possuir documentação complementar.

| Lacuna                                                         | Impacto delimitado                                                                                                     |
| -------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| Carteiras do cliente não retornam currencyId; saque exige UUID | Envio de saque indisponível até obter identificador válido                                                             |
| ContractTermRequest.unit não enumera valores aceitos           | Rascunhos novos podem ser salvos sem prazo; seleção usa somente unidade de contrato existente; finalização exige prazo |
| destinationType de transferência não enumera valores aceitos   | Transferência entre carteiras indisponível                                                                             |
| Tipos e situações de patrimônio não enumerados                 | Criação de novos bens pendente; edição mantém classificação existente                                                  |
| Catálogo de preferências fornece ISO, não UUID de moeda        | Admin obtém UUID de carteiras/contrato existentes; cliente sem moedas conhecidas não permite escolhê-las               |

Posição, resultado e evolução NotAvailable são apresentados como indisponíveis, nunca convertidos em saldo zero.
Fonte de referência no repositório strategy-control: docs/Api/milestone-3-swagger.json, snapshot do endpoint /openapi/v1.json.

## Verificações históricas — outubro de 2026

- Builds Admin e Portal: aprovados.
- Lint Admin: aprovado.
- Lint Portal completo: impedido pela configuração legada do repositório, sem eslint.config compatível com ESLint 9. Lint direcionado aos seis componentes Vue alterados: aprovado com configuração temporária baseada em flat/essential.
- Nove testes automatizados aprovados: payloads por operação, valores inválidos, participantes, idempotência e respostas fora de ordem.
- git diff --check: aprovado nos dois projetos.
- Revisão visual desktop/mobile com componentes reais e fixtures explicitamente identificadas; arquivos temporários de revisão removidos antes da entrega.
- Integração real na porta 9010: Home, carteira Livre BRL de R$ 50.000,00, depósito REQ-2026-D578DE0D, composição 100% Liquidez e extrato com saldo após lançamento confirmados em 10/10/2026.
- Não houve criação, aprovação ou execução de movimentação financeira real durante esta validação.

A homologação administrativa integrada foi executada em 10/10 e 12/10: rascunho criado/editado, depósito de R$ 1,00 criado e cancelado, observação gravada, patrimônio regravado sem alteração de valores, carteira/ledger/histórico/CSV conferidos. Veja docs/MILESTONE-3-MANUAL-TEST-CHECKLIST.md no repositório strategy-control para o resultado de cada cenário e as pendências. Aprovação/execução de novas movimentações e demais escritas não exercitadas não estão homologadas.

## Reteste 30/10/2026 — item 120

- Removida a variante compacta do relógio no Perfil resumido/completo, substituindo o trecho do item 110.
- Conferido 179×51, dia, separador e segundos, sem GMT, em Home, Perfil resumido e Perfil completo.
- Conferidos os três temas; preferência original Cinza e preto restaurada. Em 390 px, relógio inteiro, sem overflow interno.
- Lint, build e 308 testes aprovados. A verificação de diff dos arquivos alterados de código passou; whitespace preexistente em PRODUCT.md e neste documento foi preservado.
- Alteração local, sem commit/publicação nesta rodada.

## Item 101 — características adicionais do imóvel — 01/11/2026

- Implementado seletor com as oito opções sugeridas pelo backend e Personalizada, somente para imóvel, nos dois projetos.
- Nome e valor obrigatórios, limites de 80/120 caracteres e máximo de cinco itens. Mensagens dos cinco códigos 400 traduzidas.
- POST/PATCH usam realEstate.characteristics; PATCH envia lista completa, preserva ordem e envia [] ao remover todas.
- Perfil da Área do Cliente usa /client/profile/assets. Este editor não depende de nova versão do Data Intake.
- Validação integrada em homologação: Admin gravou opção padrão e portal a leu; portal gravou personalizada e Admin a leu; portal removeu toda a lista. Dados fictícios do teste removidos.
- Verificação visual dos dois editores e bloqueio de campos vazios/limite de cinco no Admin. Lint e build passaram em ambos; Admin 208 testes e portal 311 testes passaram. Diff de src/tests sem erros de whitespace.
- Alterações locais, ainda não publicadas nesta rodada.
