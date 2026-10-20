# Cadastro — Etapa 1 local, 20/10/2026

Figma: BaDXlWpxbIoY4azOaQnXgv, 4:25513. Checklist principal: strategy-control/docs/CHECKLIST-CADASTRO-SETE-ETAPAS.md.

Primeiro incremento do front: RegistrationShell reutilizável (logo, card, título e progresso) e RegistrationAccountStep com os campos/ações exatos do desenho. Nome/e-mail, uma residência, senha mínima de oito caracteres, confirmação exata e aceite explícito são validados localmente; indicação é opcional. Não foram inventadas regras de complexidade, idade, nomes ou valores HTTP. A seleção começa vazia para não presumir o país do cliente.

A prévia fica em http://localhost:9010/dev/cadastro/etapa-1 e só é registrada quando process.env.DEV está ativo. A ação Criar conta confirma apenas a validação local, identificada fora da composição do produto. Não faz POST, não envia aceite e não avança para uma confirmação fictícia. As ações legais apenas avisam na área de prévia que texto/versão ainda estão pendentes. O componente emite eventos para integração futura, sem expor credenciais no evento de validação.

O /register atual continua preservado. Nenhum progresso do novo fluxo é gravado em storage/cookies/URL; senha e confirmação são limpas ao sair. A senha só existe no estado efêmero do formulário. Países/grupos são chaves locais, nunca IDs supostos da API.

## Verificação

- Desktop e 390 × 844, sem transbordamento horizontal; card com 760 px de largura e aproximadamente 1060 px de altura no estado inicial do desktop.
- Vazio bloqueado com erros por campo. Seleção única de residência conferida inclusive pelo teclado; confirmação divergente e aceite ausente bloqueiam validação.
- Dados de teste completos validaram localmente, mantendo a URL/etapa e a indicação de integração pendente. Não foram criados cadastro ou consentimento reais.
- Logo/máscara/seta locais existentes preservam os tamanhos 152 × 32,7729, 152 × 32,7728 e 24 × 24 px. Noto Color Emoji local (Google Fonts, licença OFL incluída) cobre somente os caracteres do desenho para evitar bandeiras virando letras no Windows. Não há fonte remota em runtime.
- 59 testes, lint e build aprovados. Cinco novos testes cobrem os obrigatórios, residência, senha/confirmação, aceite, dados sem mutação/exposição e isolamento da rota de desenvolvimento.

## Pendências

Etapa 1 integrada depende de país real, documentos legais versionados e gravação do aceite. Etapas 2–7 ainda não foram implementadas no novo desenho. A próxima rodada começa pela Etapa 2, reutilizando a confirmação pública existente e sem assumir uma sessão/retomada não fornecida pelo backend.
