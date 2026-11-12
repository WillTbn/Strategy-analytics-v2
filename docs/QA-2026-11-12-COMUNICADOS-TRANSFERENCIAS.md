# Integração de Comunicados e transferência por ID Strategy — 12/11/2026

## Resultado e escopo

Integração na Área do Cliente, reutilizando a Home, Comunicação, detalhe e modal de transferência. Referências Figma BaDXlWpxbIoY4azOaQnXgv: 1:64153 (lista), 1:64591 (detalhe) e 209:27935 (outro cliente). Sem novos campos ou ações; dados ausentes não são preenchidos com exemplos do desenho.

## Checklist de implementação e testes

- [x] Consultar comunicados pela API, com paginação, categoria e somente não lidos; apresentar loading, erro, bloqueio de acesso, vazio e retry.
- [x] Reutilizar lista/card, abas e prévias existentes da Home. Contador de não lidos vem de unreadCount.
- [x] Abrir detalhe por ID real, sem JSON fake. Renderizar título, resumo, texto, código e publicação; texto não executa HTML recebido.
- [x] Registrar leitura somente depois de carregar o detalhe; leitura já registrada não é reenviada. Falha no recibo preserva o conteúdo e permite retry.
- [x] Impedir resposta de outra sessão/tela de atualizar a consulta ou iniciar recibo de leitura.
- [x] Seletor Minhas carteiras / Outro cliente; consulta automática do ID e nome abreviado retornado. Alterar ID invalida o nome anterior imediatamente.
- [x] Carteiras Free/Applied e moeda identificadas pela API, sem destino em contrato, sem customerId no payload do cliente.
- [x] Validar destinatário, moeda, saldo disponível, valor positivo/duas casas e senha. Resumo e prazo variam por origem/destino.
- [x] Escrita com autenticação e idempotência existentes. Um clique duplo envia uma requisição; retry de resposta ambígua conserva a chave; sucesso encerra a intenção. Senha não fica em storage, logs nem chave de cache.
- [x] Tratar códigos de destinatário inexistente, própria conta e senha obrigatória/incorreta/não configurada; não anunciar sucesso após 409.
- [x] Testes de serviço e componente: respostas fora de ordem, fechamento, falha de leitura, troca de sessão, clique duplo e limpeza da senha.
- [x] Consulta real de destinatário: Éric → Cláudio e Client → Cláudio = 200, nome abreviado; ID desconhecido = 404 transaction.recipient_not_found; próprio ID do Cláudio = 400 transaction.same_client.
- [x] Teste real de transferência: Éric → Cláudio, BRL 1 fictício, senha de login válida. API recusou com 409 transaction.withdrawal_password_not_set. Nenhuma transferência concluída nesse teste; não foi cadastrada outra senha para contornar a regra aprovada.
- [x] Comunicado fictício criado e publicado pela API administrativa, direcionado somente à conta Client; registro mantido para reteste posterior. Listar, detalhar e registrar leitura pela API do cliente retornaram 403 DocumentLevelInsufficient nas três contas de teste.
- [ ] Sucesso integrado de transferência: bloqueado pela confirmação de senha da API, conforme tabela abaixo.
- [ ] Sucesso integrado de listagem/detalhe/recibo de Comunicado: falta conta de teste no nível 2. Todos os 14 cards consultados retornaram nível 0; Éric e Cláudio estão sem celular confirmado.
- [ ] Comparação visual executada no navegador local e em homologação: pendente. A automação Windows encerrou por não conseguir confirmar a URL ativa; não foi tentado contornar esse bloqueio.
- [ ] Publicação e verificação da versão em homologação: em andamento; registrar commit e execução antes de marcar.

Verificações de código: npm run lint e npm run build aprovados; 340 testes aprovados (15 novos). git diff --check das alterações desta entrega aprovado; PRODUCT.md possui whitespace anterior fora do escopo. Detector mecânico apontou apenas cores/tamanhos que constam explicitamente no modal Figma (azul #2cb7ff e rótulos 13/8 px). Não substitui a revisão visual pendente.

## Pendências reais da API

| Item | Evidência e ação necessária |
| --- | --- |
| Senha de confirmação | Regra confirmada pelo Jorge: usar a própria senha de login e auditar a confirmação. POST /client/transactions/transfers com essa senha válida retorna 409 transaction.withdrawal_password_not_set na conta do Éric. Alinhar a validação do servidor; o front preserva o campo do Figma e trata a recusa. |
| Categorias e grupos de Comunicação | API aceita Institutional, Operational, Financial, Regulatory e Other. O desenho separa Comunicados S.A, Insights Relevantes e Relatórios Econômicos. Falta contrato/mapeamento aprovado para separar esses três tipos. O front não transforma Financial em relatório nem Institutional em insight; os dois grupos sem contrato ficam indisponíveis. O filtro já existente usa as categorias reais. |
| Metadados e filtros de publicação | ClientAnnouncementResponse não fornece imagem/capa, autor/perfil do autor, versão, índice ou anexos do desenho. GET /client/announcements não aceita autor nem período. Campos de filtro correspondentes permanecem desabilitados, e metadados ausentes não são inventados. Confirmar quais dados do Figma a API entregará. |

## Massa de homologação e verificações ainda pendentes

O 403 de Comunicados das contas abaixo é uma condição de acesso reproduzida, não um defeito comprovado do servidor. É necessário disponibilizar/confirmar uma conta no nível 2 (e-mail e celular confirmados + documentos conforme regra oficial) para validar leitura bem-sucedida. Não foram enviados SMS nem alterados níveis artificialmente.

Os testes automatizados usam respostas controladas para sucesso, vazio, falha e concorrência. Eles não substituem o teste integrado impedido pelo nível ou pela senha, nem a revisão visual no navegador. As outras entregas do backend (Admin, empréstimos, auditoria, PTAX e correção de depósito) não estão homologadas por esta rodada.
