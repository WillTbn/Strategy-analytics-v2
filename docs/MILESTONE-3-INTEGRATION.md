# Marco 3 — implementação frontend

Atualizado em 13/10/2026. Admin: http://localhost:8080. Portal: http://localhost:9010.
As duas portas são as origens autorizadas pelo CORS do backend.

## Entregue no código

- Admin: contratos com listagem e edição lateral, rascunhos, participantes, status, documentos, ativos elegíveis e histórico. Finalização condicionada aos dados necessários.
- Admin: depósitos, saques e operações de contrato; detalhe com ações permitidas pelo servidor, versão esperada, histórico e ledger.
- Admin: carteira por cliente, composição, exportação do extrato; consulta, edição dos campos comuns, documentos e arquivamento de patrimônio existente.
- Portal: carteira no layout original, com saldos por moeda e resumo de contratos. Tabelas extras de movimentações, extrato e composição retiradas da Home em 13/10 a pedido do usuário. Contratos e documentos liberados mantêm a integração. Veja [encaixe dos dados no layout](WALLET-LAYOUT-INTEGRATION.md).
- Portal: formulário de saque com validação e confirmação, bloqueado quando não existe o identificador de moeda exigido pela API.
- Recursos independentes, recuperação de erro, proteção contra respostas antigas e idempotência preservada nas tentativas de escrita.

## Pendências de contrato HTTP

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

## Verificações

- Builds Admin e Portal: aprovados.
- Lint Admin: aprovado.
- Lint Portal completo: impedido pela configuração legada do repositório, sem eslint.config compatível com ESLint 9. Lint direcionado aos seis componentes Vue alterados: aprovado com configuração temporária baseada em flat/essential.
- Nove testes automatizados aprovados: payloads por operação, valores inválidos, participantes, idempotência e respostas fora de ordem.
- git diff --check: aprovado nos dois projetos.
- Revisão visual desktop/mobile com componentes reais e fixtures explicitamente identificadas; arquivos temporários de revisão removidos antes da entrega.
- Integração real na porta 9010: Home, carteira Livre BRL de R$ 50.000,00, depósito REQ-2026-D578DE0D, composição 100% Liquidez e extrato com saldo após lançamento confirmados em 10/10/2026.
- Não houve criação, aprovação ou execução de movimentação financeira real durante esta validação.

A homologação administrativa integrada foi executada em 10/10 e 12/10: rascunho criado/editado, depósito de R$ 1,00 criado e cancelado, observação gravada, patrimônio regravado sem alteração de valores, carteira/ledger/histórico/CSV conferidos. Veja docs/MILESTONE-3-MANUAL-TEST-CHECKLIST.md no repositório strategy-control para o resultado de cada cenário e as pendências. Aprovação/execução de novas movimentações e demais escritas não exercitadas não estão homologadas.
