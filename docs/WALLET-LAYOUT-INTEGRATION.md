# Carteira — preservação do layout (13/10/2026)

A página `/system/dashboard` volta à composição existente antes de `55f8f55`:
Carteira Total com gráfico e ações, três saldos, resumo expansível de contratos,
Comunicação e Empréstimos. Os componentes, superfícies e ordem originais são
reutilizados. Não foram acrescentadas seções para acomodar endpoints.

A referência Figma informada é o arquivo `GoryG5jPJLw8KM3yFnBEBe`, nó
`1828:21088`. A leitura pelo conector falhou e a captura expirou; portanto,
a comparação desta correção é com o código anterior, não uma certificação
visual contra o Figma.

## Dados e limites do encaixe

| Espaço existente | Origem / regra |
| --- | --- |
| Carteira Total | `summaries.currentPosition`, somente quando Available. Não soma saldo disponível com capital contratado nem patrimônio declarado. |
| Investimentos | `summaries.contractedCapital` por moeda; representa capital alocado, não rentabilidade ou posição atual. |
| Banking | `client/wallets`, tipo Free, campo balance, por moeda. Encaixe baseado no texto original de Banking (carteira que recebe depósitos). Validar essa equivalência com o backend/produto. Não confundir balance com available quando houver reserva. |
| Saldo Investível | Sem equivalência confirmada nos dados disponíveis. Mantém o espaço, com traço e explicação. |
| Resumo de contratos | Nome e `myParticipation.allocatedAmount`, com a moeda do próprio contrato. Não usa capital total do contrato como saldo do cliente. |
| Conversão para dólar | Não fornecida. Um saldo próprio em USD é identificado como tal; não representa conversão do saldo em BRL. |
| Evolução | Gráfico original recebe pontos quando Available. Estado NotAvailable não gera série simulada. |
| Empréstimos | Mantém os quatro espaços originais, sem os números demonstrativos. Não há integração confirmada para alimentá-los. |

Os valores de posição, variação percentual, próxima distribuição e sua data
não são inferidos. Zero só aparece quando efetivamente retornado pela API.
Depósito/transferência conservam os botões, com aviso de indisponibilidade;
os modais antigos não podem simular operação concluída ou apresentar PIX fictício.
O saque mantém a integração existente, limitada pela falta de currencyId.

## Dados disponíveis sem espaço nesta Home

Movimentações recentes/detalhadas, ledger, extrato, saldo reservado separado,
composição por classe/origem e histórico da operação não ganharam novas tabelas
ou seções. Precisam de definição de produto/layout antes de exposição nesta Home.
A barra original é de distribuição entre carteiras; a composição por classe/origem
não pode ser usada nela como se fosse a mesma classificação.

## Validação

- Ambiente da Área do Cliente mantido em localhost:9010; Admin em localhost:8080.
- Login e leitura real do cliente de teste: Banking R$ 50.000,00; capital contratado
  BRL zero e USD 250.000,00; participações USD 200.000,00 e USD 50.000,00.
- Ocultação de valores alcança saldos e participações; expansão de contrato
  preserva a ação de acesso ao detalhe.
- Teste de mapeamento cobre moedas distintas, zero, NotAvailable e saldo com reserva.
- Build aprovado; lint direcionado aprovado. `npm run lint` completo segue
  impedido pela configuração ESLint 9 ausente, problema anterior à correção.
- Nenhuma movimentação financeira foi criada nesta correção.

Comunicação e publicidade são componentes preexistentes, ainda com conteúdo
demonstrativo; não foram homologados como conteúdo vindo do backend.
As páginas de listagem/detalhe de contratos e saque não foram redesenhadas nesta
correção da carteira. Seus dados e integrações anteriores foram preservados.

## Atualização do encaixe — 15/10/2026

A devolutiva do backend esclareceu os campos. Esta atualização substitui o
mapeamento provisório de Banking e Saldo Investível registrado acima:

- Banking: Free.available, com reservas já descontadas; não usar Free.balance.
- Saldo Investível: summaries.availableBalance (Livre + Aplicada disponíveis),
  somente quando Available e mantendo cada moeda separada.
- Investimentos: mantém contractedCapital. Carteira Total mantém currentPosition.
  Não foi aprovada troca de rótulo nem soma substituta enquanto o motor não existe.
- Posição, resultado, evolução e rendimentos dependem do Marco 4. Conversão e
  empréstimos continuam sem dados oficiais. Não há números simulados.
- A API passou a entregar currencyId. O formulário de saque existente o utiliza
  e restringe a origem a Free. Nenhum saque foi solicitado nesta rodada.

Reteste real: Éric retorna Home 200, disponível BRL 47.500,00, capital BRL 0,00 e
USD 250.000,00. Cláudio lista documentos (200), carteira BRL 25.000,00 com
currencyId, mas a Home responde PreferencesRequired. Cadastro não foi alterado.

O layout existente foi preservado. Nenhum dado adicional da API criou card,
seção, aba ou ação. O conector Figma falhou novamente, sem certificação visual
contra o arquivo; alterações se limitam ao encaixe dos valores e regras existentes.
