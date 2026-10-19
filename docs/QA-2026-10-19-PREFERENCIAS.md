# QA — preferências e comunicação, 19/10/2026

## Preferências e resultado integrado

Referência visual: Figma `BaDXlWpxbIoY4azOaQnXgv`, bloco `1:68237`. Preservados relógio, três paletas e quatro seletores. Não foram adicionados campo de país ou botão de salvar.

Os seletores carregam `GET /api/v1/client/profile/preferences` e `GET /api/v1/preferences/catalog`. Cada escolha salva pelo `PATCH /api/v1/client/profile/preferences`, usando autenticação, idempotência e refresh da instância `clientApi`. As opções fixas do store não alimentam mais os seletores. Abrir a tela não executa escrita.

Os seletores ficam desabilitados durante a escrita. Falhas preservam os valores confirmados e exibem erro; uma escrita aceita sem confirmação posterior informa a incerteza. Respostas que chegam após sair da tela não alteram o novo componente.

O Cláudio recebia moedas/idioma/fuso válidos, mas `countryId: null` nas preferências. O status informava `preferencesCompleted: false` e `countryDefined: false`. Seu endereço residencial principal já tinha país BR e um identificador válido.

Ao salvar uma escolha, o front reaproveita esse identificador somente se o país das preferências estiver ausente e existir exatamente um endereço residencial principal com país. Não deduz país por moeda, idioma, endereço comercial ou lista ambígua. País já salvo é preservado. Se o dado também não existir no cadastro, será necessário o fluxo de cadastro desenhado no Figma ou uma correção na origem; não foi criado um seletor adicional em Preferências.

Teste pela tela local: idioma do Cláudio alterado e deixado em `pt-BR`; persistência conferida após recarregar. A API confirmou:

- `preferencesCompleted: true` e `countryDefined: true`;
- feature `DashboardHome` disponível, sem bloqueio;
- Home e contratos HTTP 200;
- Home com investimento BRL 261.500,00, saldo investível BRL 25.000,00, Banking BRL 25.000,00 e contrato Beta Growth Spec.

O status geral ainda aponta `PhoneVerificationRequired`, sem impedir a Home nesta resposta. O contrato encerrado continuar no investimento é a pendência financeira já encaminhada ao backend; o front não subtrai valores retornados.

Relógio e paletas mantêm a persistência local existente. O catálogo HTTP oferece `Light`, `Dark`, `System`, diferentes das três paletas do Figma. Ao salvar os seletores, o front preserva o `theme` do servidor, sem inventar um mapeamento. Sincronização das paletas/relógio entre dispositivos exige contrato correspondente.

## Comunicação

Referências: página `10:26031` e Home `10:26023`. Removidos posts demonstrativos das listagens principal e lateral, incluindo o preview da Home. Abas seguem o desenho, sem contadores fictícios; filtros de exemplo não aparecem. Ícones locais do Figma preservam os tamanhos de 56 px na página e 48 px no preview.

O Swagger consultado não oferece endpoint de publicações. Esta alteração homologa o estado visual sem publicações disponíveis no front, não a integração de leitura/publicação no servidor. Nenhuma negativa de API foi convertida em lista vazia.

## Verificação

- Testes de preferências: leitura sem escrita, persistência, metadados, país registrado/ausente/ambíguo, concorrência, erro, confirmação e descarte de respostas após desmontagem.
- Comando: `node --experimental-vm-modules --test tests/preferences.test.mjs tests/session-isolation.test.mjs tests/public-auth.test.mjs tests/onboarding-block.test.mjs tests/wallet-presentation.test.mjs`.
- Resultado: 23 testes aprovados; `npm run build` concluído; checagem de espaços aprovada nos arquivos deste lote. Alterações anteriores de outros arquivos foram preservadas.
- Revisão de Preferências em desktop e largura 390 px: seletores empilhados no celular e card dentro da coluna. Comunicação revisada na página e na Home.
- Lint global ainda bloqueado pela configuração legada incompatível com ESLint 9; arquivos deste lote avaliados com regras essenciais compatíveis do plugin Vue, sem erro.

Os demais itens da triagem de 17/10 não estão aprovados por esta entrega.
