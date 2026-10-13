# Strategy Analytics — contexto da carteira

O portal atende o cliente que consulta sua carteira e contratos. Este contexto
registra somente a correção de 13/10/2026, sem definir outras áreas do produto.

## Autoridade visual

O pedido é preservar o layout pronto, usando os componentes existentes. A
composição original de `src/system/pages/WalletPage.vue` em `55f8f55^` é a base
recuperável: Carteira Total/gráfico/ações, Investimentos/Saldo Investível/Banking,
Contratos, Comunicação e Empréstimos. A referência Figma é o nó `1828:21088` do
arquivo `GoryG5jPJLw8KM3yFnBEBe`; o conector não conseguiu lê-lo. Fidelidade ao
Figma não foi certificada. `DESIGN.md` continua como está, sem nova identidade.

## Dados e decisões pendentes

Os endpoints fornecem capital contratado por moeda, carteira Free e participações
em contratos. Investimentos recebe contractedCapital; Banking recebe Free.balance
com base no texto original de carteira que recebe depósitos. A equivalência dos
nomes deve ser confirmada com produto/backend. Saldo Investível não tem mapeamento
confirmado. Nenhuma moeda é somada ou convertida em outra sem cotação.

Posição, evolução, variação, distribuição de lucros, conversão para USD e empréstimos
ficam indisponíveis quando faltarem dados. Reservas, extrato, transações e composição
por classe/origem não justificam novas seções nesta Home. Comunicação e publicidade
mantêm o conteúdo legado, sem homologação de integração.

Veja `docs/WALLET-LAYOUT-INTEGRATION.md` para os campos, lacunas e verificações.
